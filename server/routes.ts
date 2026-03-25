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
    const content = response.choices[0]?.message?.content ?? "[]";
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
    const content = response.choices[0]?.message?.content ?? '{"sufficient": false, "followUp": "Could you provide more details about the incident — who was involved, what exactly happened, where it occurred, and when?"}';
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
          content: `You are a claims assistant for Alberta insurance adjusters. You have access ONLY to the following claim data. Answer questions strictly based on this data.
If the answer is not in the claim data, respond exactly with: "Not enough info in the current claim draft. Please call the client to get more info."
Keep answers concise and professional.

Claim Data:
${JSON.stringify(claim, null, 2)}`,
        },
        { role: "user", content: question },
      ],
      max_completion_tokens: 256,
    });
    return response.choices[0]?.message?.content ?? "Not enough info in the current claim draft. Please call the client to get more info.";
  } catch {
    return "Not enough info in the current claim draft. Please call the client to get more info.";
  }
}

async function generatePolicyAnswer(question: string, policyText: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      messages: [
        {
          role: "system",
          content: `You are an Alberta insurance policy assistant. You ONLY answer questions based on the uploaded policy document text provided. 
If the policy text does not contain the answer, respond: "Based on the document provided, I can't find specific information about that. I recommend speaking directly with an agent to get a precise answer. Would you like me to connect you?"
Keep answers concise and helpful. Quote relevant policy language when available.`,
        },
        {
          role: "user",
          content: `Policy Document:\n${policyText}\n\nQuestion: ${question}`,
        },
      ],
      max_completion_tokens: 512,
    });
    return response.choices[0]?.message?.content ?? "Based on the document provided, I can't find specific information about that. I recommend speaking directly with an agent.";
  } catch {
    return "Based on the document provided, I can't find specific information about that. I recommend speaking directly with an agent.";
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

      const claim = await storage.createClaim({
        ...rest,
        description,
        claimType,
        priority,
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
