import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import { storage } from "./storage";
import { insertClaimSchema, updateClaimSchema } from "@shared/schema";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

async function generateClaimSummary(description: string, claimType: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      messages: [
        {
          role: "system",
          content: `You are an Alberta insurance claims AI. Given a claim description, produce a JSON array of 3-4 concise bullet-point strings summarizing the key facts of the claim. 
Flag potential legal involvement with "FLAG: ..." if the claimant mentions lawyers, lawsuits, legal action, hospitals, or serious injuries.
Return ONLY a JSON array like: ["Point 1", "Point 2", "FLAG: Potential legal involvement noted."]`,
        },
        {
          role: "user",
          content: `Claim Type: ${claimType}\nDescription: ${description}`,
        },
      ],
      max_completion_tokens: 512,
    });
    const content = response.choices[0]?.message?.content || "[]";
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [`${claimType} claim submitted for review.`, `Description: ${description.substring(0, 80)}...`];
  }
}

async function validateFnolDescription(description: string): Promise<{ sufficient: boolean; followUp?: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      messages: [
        {
          role: "system",
          content: `You are an Alberta insurance FNOL intake specialist. Evaluate whether a claimant's incident description contains enough detail to begin a claim.

A sufficient description must include ALL of the following:
1. WHO was involved (e.g., other driver, pedestrian, parked car, animal — not just "I")
2. WHAT happened (specific type of incident: rear-end collision, side-swipe, hit parked car, etc.)
3. WHERE it happened (e.g., specific road, intersection, parking lot, city)
4. WHEN it happened (approximate date and/or time)

Return JSON only in this exact format:
- If sufficient: {"sufficient": true}
- If insufficient: {"sufficient": false, "followUp": "<a single, conversational follow-up question asking only for the specific missing information>"}

Be strict. Vague phrases like "I got hit", "there was an accident", or "someone hit my car" are NOT sufficient — they're missing most details. Do not move forward until all four elements are present.`,
        },
        {
          role: "user",
          content: description,
        },
      ],
      max_completion_tokens: 200,
    });
    const content = response.choices[0]?.message?.content || '{"sufficient": false, "followUp": "Could you provide more details about the incident — who was involved, what exactly happened, where it occurred, and when?"}';
    return JSON.parse(content);
  } catch {
    return { sufficient: true }; // fail open so the flow isn't blocked by API errors
  }
}

async function generateAdjusterAnswer(question: string, claim: Record<string, unknown>): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      messages: [
        {
          role: "system",
          content: `You are a claims assistant for Alberta insurance adjusters. Answer questions by following this strict priority order:

STEP 1 — Claim data first:
Answer using only the claim data below. Be concise and professional.

STEP 2 — Alberta or Canadian law (only if the claim data does not address the topic):
If the claim data is silent but a specific Alberta or Canadian law applies, cite that law by its full official name and explain how it applies to the adjuster's situation. Relevant laws include (but are not limited to):
- Insurance Act (Alberta), RSA 2000, c I-3 — governing insurance contracts, claim obligations, limitation periods
- Traffic Safety Act (Alberta), RSA 2000, c T-6 — accident reporting thresholds, police involvement requirements
- Limitations Act (Alberta), RSA 2000, c L-12 — 2-year limitation period for filing an insurance claim
- Alberta Standard Automobile Policy (SPF No. 1) — statutory policy terms applicable to all Alberta auto policies
- Statutory Conditions under the Alberta Insurance Act — mandatory obligations of both insurer and insured
- Automobile Insurance Rate Board (AIRB) Regulations — claim impact on premiums, DCPD rules
- Criminal Code of Canada, RSC 1985, c C-46 — fraud, impaired driving, criminal liability affecting claim validity
- Personal Information Protection Act (Alberta) PIPA, SA 2003, c P-6.5 — data handling requirements in claim processing
When citing a law, state its full name and explain what it means for the adjuster handling this specific claim.

STEP 3 — Refer to contact (only if neither the claim data nor any applicable law can answer):
Respond with: "Not enough info in the current claim draft. Please call the client or consult your senior adjuster to get more info."

Claim Data:
${JSON.stringify(claim, null, 2)}`,
        },
        { role: "user", content: question },
      ],
      max_completion_tokens: 512,
    });
    return response.choices[0]?.message?.content || "Not enough info in the current claim draft. Please call the client or consult your senior adjuster to get more info.";
  } catch {
    return "Not enough info in the current claim draft. Please call the client or consult your senior adjuster to get more info.";
  }
}

async function generatePolicyAnswer(question: string, policyText: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      messages: [
        {
          role: "system",
          content: `You are an Alberta insurance policy assistant for Desjardins/Certas, helping policyholder Nathan Greenwood (policy PX-7293-AT). You must follow this three-step priority order strictly — do not skip steps and do not mix steps in a single answer.

STEP 1 — Check the policy document:
If the question is answered by the policy document provided, answer using only that document. Quote or paraphrase the relevant policy language directly. Label your source clearly (e.g., "According to your policy...").

STEP 2 — Check Alberta and Canadian law (ONLY if the policy document does not address the topic):
If the policy is silent or does not directly answer the question, look to applicable Alberta or Canadian legislation and explain how it applies to Nathan's situation. You MUST cite the law by its full official name. Applicable laws include (but are not limited to):
- Insurance Act (Alberta), RSA 2000, c I-3 — governs all insurance contracts in Alberta, including claim obligations and policy interpretation
- Traffic Safety Act (Alberta), RSA 2000, c T-6 — accident reporting obligations, road use, and driver duties
- Limitations Act (Alberta), RSA 2000, c L-12 — 2-year limitation period for making an insurance claim
- Alberta Standard Automobile Policy (SPF No. 1) — mandatory standard auto policy approved by Alberta's Superintendent of Insurance
- Automobile Insurance Rate Board (AIRB) Regulations — premium rate rules, DCPD, and coverage requirements
- Statutory Conditions under the Alberta Insurance Act — mandatory obligations binding on both insurer and insured in every Alberta policy
- Personal Information Protection Act (Alberta) (PIPA), SA 2003, c P-6.5 — governs use of personal data in claim processing
- Criminal Code of Canada, RSC 1985, c C-46 — fraud, impaired driving, and criminal acts affecting claim validity
When citing a law, state its full name and explain in plain language what it means for Nathan's specific situation.

STEP 3 — Refer to an adjuster (ONLY if neither the policy nor any applicable law can answer the question):
If the question genuinely cannot be answered by the policy document or by Alberta/Canadian law, respond with exactly: "This question goes beyond what your policy document and standard Alberta legislation cover. I'd recommend speaking with one of our adjusters who can review your specific situation — you can reach your agent Michael Dolan at 403-887-2100 or visit the office to request an adjuster review."

IMPORTANT RULES:
- Never answer from general knowledge alone — always ground answers in the policy document or a named law.
- Never speculate or invent policy terms, coverage amounts, or legal obligations.
- Always try Step 2 before going to Step 3. Most Alberta insurance questions ARE covered by legislation.
- Keep responses concise and in plain language suitable for a policyholder.`,
        },
        {
          role: "user",
          content: `Policy Document:\n${policyText}\n\nQuestion: ${question}`,
        },
      ],
      max_completion_tokens: 600,
    });
    const raw = response.choices[0]?.message?.content;
    console.log("[inquiry] OpenAI finish_reason:", response.choices[0]?.finish_reason, "| content length:", raw?.length ?? "null");
    return raw || "This question goes beyond what your policy document and standard Alberta legislation cover. I'd recommend speaking with one of our adjusters — you can reach your agent Michael Dolan at 403-887-2100.";
  } catch (err) {
    console.error("[inquiry] OpenAI error:", err);
    return "This question goes beyond what your policy document and standard Alberta legislation cover. I'd recommend speaking with one of our adjusters — you can reach your agent Michael Dolan at 403-887-2100.";
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // POST /api/claims/validate-fnol — check if FNOL description has enough detail
  app.post("/api/claims/validate-fnol", async (req: Request, res: Response) => {
    try {
      const { description } = req.body;
      if (!description) return res.status(400).json({ message: "description is required" });
      const result = await validateFnolDescription(description);
      res.json(result);
    } catch (err) {
      console.error("POST /api/claims/validate-fnol error:", err);
      res.status(500).json({ message: "Validation failed" });
    }
  });

  // GET /api/claims — list all claims
  app.get("/api/claims", async (_req: Request, res: Response) => {
    try {
      const allClaims = await storage.getClaims();
      res.json(allClaims);
    } catch (err) {
      console.error("GET /api/claims error:", err);
      res.status(500).json({ message: "Failed to fetch claims" });
    }
  });

  // GET /api/claims/:id — single claim
  app.get("/api/claims/:id", async (req: Request, res: Response) => {
    try {
      const claim = await storage.getClaimById(req.params.id);
      if (!claim) return res.status(404).json({ message: "Claim not found" });
      res.json(claim);
    } catch (err) {
      console.error("GET /api/claims/:id error:", err);
      res.status(500).json({ message: "Failed to fetch claim" });
    }
  });

  // POST /api/claims — create a new claim (called by Claims chatbot)
  app.post("/api/claims", async (req: Request, res: Response) => {
    try {
      const bodySchema = z.object({
        policyholderName: z.string(),
        policyId: z.string(),
        incidentDate: z.string(),
        claimType: z.string(),
        description: z.string(),
        priority: z.enum(["Normal", "High"]).default("Normal"),
      });
      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request", errors: parsed.error.issues });
      }
      const { priority, description, claimType, ...rest } = parsed.data;

      // Generate AI summary
      const summary = await generateClaimSummary(description, claimType);

      // If the AI flagged anything (injury, legal, etc.) escalate to High priority regardless of what the client sent
      const hasFlag = summary.some((item) => item.startsWith("FLAG:"));
      const finalPriority: "Normal" | "High" = hasFlag ? "High" : priority;

      const claim = await storage.createClaim({
        ...rest,
        description,
        claimType,
        priority: finalPriority,
        summary,
      });
      res.status(201).json(claim);
    } catch (err) {
      console.error("POST /api/claims error:", err);
      res.status(500).json({ message: "Failed to create claim" });
    }
  });

  // PATCH /api/claims/:id — update claim fields (adjuster edits)
  app.patch("/api/claims/:id", async (req: Request, res: Response) => {
    try {
      const parsed = updateClaimSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request", errors: parsed.error.issues });
      }
      const updated = await storage.updateClaim(req.params.id, parsed.data);
      if (!updated) return res.status(404).json({ message: "Claim not found" });
      res.json(updated);
    } catch (err) {
      console.error("PATCH /api/claims/:id error:", err);
      res.status(500).json({ message: "Failed to update claim" });
    }
  });

  // POST /api/claims/:id/verify — mark as verified by adjuster
  app.post("/api/claims/:id/verify", async (req: Request, res: Response) => {
    try {
      const { adjusterName } = req.body;
      if (!adjusterName) return res.status(400).json({ message: "adjusterName is required" });
      const updated = await storage.verifyClaim(req.params.id, adjusterName);
      if (!updated) return res.status(404).json({ message: "Claim not found" });
      res.json(updated);
    } catch (err) {
      console.error("POST /api/claims/:id/verify error:", err);
      res.status(500).json({ message: "Failed to verify claim" });
    }
  });

  // POST /api/claims/:id/chat — adjuster mini-chatbot (claim-aware)
  app.post("/api/claims/:id/chat", async (req: Request, res: Response) => {
    try {
      const { question } = req.body;
      if (!question) return res.status(400).json({ message: "question is required" });
      const claim = await storage.getClaimById(req.params.id);
      if (!claim) return res.status(404).json({ message: "Claim not found" });
      const answer = await generateAdjusterAnswer(question, claim as Record<string, unknown>);
      res.json({ answer });
    } catch (err) {
      console.error("POST /api/claims/:id/chat error:", err);
      res.status(500).json({ message: "Failed to get chat answer" });
    }
  });

  // POST /api/inquiry/chat — policy inquiry chatbot (PDF text as context)
  app.post("/api/inquiry/chat", async (req: Request, res: Response) => {
    try {
      const { question, policyText } = req.body;
      if (!question) return res.status(400).json({ message: "question is required" });
      if (!policyText) {
        return res.json({ answer: "Please upload your policy PDF first so I can analyze it and answer your questions based on your specific coverage." });
      }
      const answer = await generatePolicyAnswer(question, policyText);
      res.json({ answer });
    } catch (err) {
      console.error("POST /api/inquiry/chat error:", err);
      res.status(500).json({ message: "Failed to get answer" });
    }
  });

  // POST /api/inquiry/escalate — flag high-priority inquiry session
  app.post("/api/inquiry/escalate", async (req: Request, res: Response) => {
    try {
      const { message: userMessage } = req.body;
      const claim = await storage.createClaim({
        policyholderName: "Unknown User (Inquiry Session)",
        policyId: "N/A",
        incidentDate: new Date().toLocaleDateString(),
        claimType: "Inquiry Escalation",
        description: `User expressed intent requiring legal/complaint attention: "${userMessage}"`,
        priority: "High",
        summary: [
          "High-priority keywords detected in Inquiry chat.",
          "Possible legal action or formal complaint mentioned.",
          `User message: "${userMessage?.substring(0, 80)}..."`,
        ],
      });
      res.status(201).json(claim);
    } catch (err) {
      console.error("POST /api/inquiry/escalate error:", err);
      res.status(500).json({ message: "Failed to escalate" });
    }
  });

  return httpServer;
}
