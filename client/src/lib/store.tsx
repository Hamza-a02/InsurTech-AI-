import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Claim = {
  id: string;
  status: "Draft" | "Verified";
  priority: "Normal" | "High";
  collectedBy: string;
  verifiedBy?: string;
  date: string;
  policyholderName: string;
  policyId: string;
  incidentDate: string;
  claimType: string;
  description: string;
  summary: string[];
};

type AppState = {
  claims: Claim[];
  addClaim: (claim: Omit<Claim, "id" | "date" | "status" | "collectedBy">) => void;
  verifyClaim: (id: string, adjusterName: string) => void;
};

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [claims, setClaims] = useState<Claim[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("insurtech_claims");
    if (saved) {
      setClaims(JSON.parse(saved));
    } else {
      // Add some initial mock data
      const initial: Claim[] = [
        {
          id: "CLM-8823",
          status: "Draft",
          priority: "High",
          collectedBy: "AI Claims Specialist",
          date: new Date().toISOString(),
          policyholderName: "John Doe",
          policyId: "POL-12345",
          incidentDate: "2023-10-25 14:30",
          claimType: "Auto",
          description: "Rear-ended at a stoplight. The other driver was distracted. Bumper is completely crushed and I'm feeling some neck pain, might need to see a lawyer if it gets worse.",
          summary: [
            "Rear-end collision at a stoplight.",
            "Vehicle bumper severely damaged.",
            "Potential bodily injury (neck pain) noted."
          ]
        }
      ];
      setClaims(initial);
      localStorage.setItem("insurtech_claims", JSON.stringify(initial));
    }
  }, []);

  const addClaim = (claimData: Omit<Claim, "id" | "date" | "status" | "collectedBy">) => {
    const newClaim: Claim = {
      ...claimData,
      id: `CLM-${Math.floor(Math.random() * 10000)}`,
      date: new Date().toISOString(),
      status: "Draft",
      collectedBy: "AI Claims Specialist",
    };
    const updated = [newClaim, ...claims];
    setClaims(updated);
    localStorage.setItem("insurtech_claims", JSON.stringify(updated));
  };

  const verifyClaim = (id: string, adjusterName: string) => {
    const updated = claims.map(c => 
      c.id === id ? { ...c, status: "Verified" as const, verifiedBy: adjusterName } : c
    );
    setClaims(updated);
    localStorage.setItem("insurtech_claims", JSON.stringify(updated));
  };

  return (
    <AppContext.Provider value={{ claims, addClaim, verifyClaim }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppStore must be used within an AppProvider");
  }
  return context;
}
