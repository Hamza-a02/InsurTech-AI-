import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import { claims, type Claim, type InsertClaim, type UpdateClaim } from "@shared/schema";

export interface IStorage {
  getClaims(): Promise<Claim[]>;
  getClaimById(id: string): Promise<Claim | undefined>;
  createClaim(claim: InsertClaim & { priority?: string; summary?: string[] }): Promise<Claim>;
  updateClaim(id: string, updates: Partial<UpdateClaim>): Promise<Claim | undefined>;
  verifyClaim(id: string, adjusterName: string): Promise<Claim | undefined>;
}

class DatabaseStorage implements IStorage {
  async getClaims(): Promise<Claim[]> {
    return db.select().from(claims).orderBy(desc(claims.date));
  }

  async getClaimById(id: string): Promise<Claim | undefined> {
    const [claim] = await db.select().from(claims).where(eq(claims.id, id));
    return claim;
  }

  async createClaim(claimData: InsertClaim & { priority?: string; summary?: string[] }): Promise<Claim> {
    const [claim] = await db
      .insert(claims)
      .values({
        policyholderName: claimData.policyholderName,
        policyId: claimData.policyId,
        incidentDate: claimData.incidentDate,
        claimType: claimData.claimType,
        description: claimData.description,
        priority: claimData.priority ?? "Normal",
        summary: claimData.summary ?? [],
        status: "Draft",
        collectedBy: "AI Claims Specialist",
      })
      .returning();
    return claim;
  }

  async updateClaim(id: string, updates: Partial<UpdateClaim>): Promise<Claim | undefined> {
    const [updated] = await db
      .update(claims)
      .set(updates)
      .where(eq(claims.id, id))
      .returning();
    return updated;
  }

  async verifyClaim(id: string, adjusterName: string): Promise<Claim | undefined> {
    const [updated] = await db
      .update(claims)
      .set({ status: "Verified", verifiedBy: adjusterName })
      .where(eq(claims.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
