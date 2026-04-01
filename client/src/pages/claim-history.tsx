import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ShieldCheck,
  ArrowLeft,
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSearch,
  XCircle,
  Calendar,
  Car,
  Tag,
  Hash,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Claim } from "@shared/schema";

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  Draft: {
    label: "Draft",
    icon: <Clock className="h-3.5 w-3.5" />,
    variant: "secondary",
  },
  "Under Review": {
    label: "Under Review",
    icon: <FileSearch className="h-3.5 w-3.5" />,
    variant: "outline",
  },
  Review: {
    label: "Under Review",
    icon: <FileSearch className="h-3.5 w-3.5" />,
    variant: "outline",
  },
  Verified: {
    label: "Verified",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    variant: "default",
  },
  Approved: {
    label: "Approved",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    variant: "default",
  },
  Denied: {
    label: "Denied",
    icon: <XCircle className="h-3.5 w-3.5" />,
    variant: "destructive",
  },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    variant: "secondary" as const,
  };
  return (
    <Badge
      variant={config.variant}
      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium"
      data-testid={`badge-status-${status.toLowerCase().replace(/\s+/g, "-")}`}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  if (priority !== "High") return null;
  return (
    <span
      className="inline-block h-2 w-2 rounded-full bg-destructive"
      title="High Priority"
      data-testid="dot-high-priority"
    />
  );
}

export default function ClaimHistory() {
  const { data: claims = [], isLoading } = useQuery<Claim[]>({
    queryKey: ["/api/claims"],
  });

  const customerClaims = claims.filter(
    (c) =>
      c.policyId === "Q4817RX9" ||
      c.policyholderName?.toLowerCase().includes("hamza") ||
      c.policyholderName?.toLowerCase().includes("aamir")
  );

  const formatDate = (ts: string | Date) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="px-6 py-4 border-b border-border flex items-center justify-between bg-card sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-primary tracking-tight">InsurTech Assistant</span>
        </div>
        <Link href="/">
          <Button variant="ghost" size="sm" className="font-medium gap-1.5" data-testid="button-back-home">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-6 md:p-10 flex flex-col gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Claim History</h1>
          </div>
          <p className="text-muted-foreground pl-10">
            Policy{" "}
            <span className="font-semibold text-foreground" data-testid="text-policy-number">
              Q4817RX9
            </span>{" "}
            &mdash; Hamza Aamir
          </p>
        </div>

        {isLoading && (
          <div className="flex flex-col gap-4" data-testid="skeleton-claims">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36 rounded-xl bg-card border border-border animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoading && customerClaims.length === 0 && (
          <Card className="border-dashed" data-testid="empty-claims">
            <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground/40" />
              <div>
                <p className="text-lg font-semibold text-foreground">No claims on file</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Claims you file through our assistant will appear here.
                </p>
              </div>
              <Link href="/claim">
                <Button className="mt-2" data-testid="button-file-claim">
                  File a Claim
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {!isLoading && customerClaims.length > 0 && (
          <div className="flex flex-col gap-4" data-testid="list-claims">
            {customerClaims.map((claim) => (
              <Card
                key={claim.id}
                className="border border-border hover:border-primary/40 hover:shadow-md transition-all duration-200 bg-card"
                data-testid={`card-claim-${claim.id}`}
              >
                <CardContent className="p-6 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <PriorityDot priority={claim.priority} />
                      <span
                        className="font-semibold text-foreground text-base"
                        data-testid={`text-claim-id-${claim.id}`}
                      >
                        {claim.id}
                      </span>
                    </div>
                    <StatusBadge status={claim.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Car className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="font-medium text-foreground" data-testid={`text-claim-type-${claim.id}`}>
                        {claim.claimType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Tag className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>Priority:</span>
                      <span
                        className={
                          claim.priority === "High"
                            ? "font-semibold text-destructive"
                            : "text-foreground"
                        }
                        data-testid={`text-claim-priority-${claim.id}`}
                      >
                        {claim.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>Incident:</span>
                      <span className="text-foreground" data-testid={`text-incident-date-${claim.id}`}>
                        {claim.incidentDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Hash className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>Filed:</span>
                      <span className="text-foreground" data-testid={`text-filed-date-${claim.id}`}>
                        {formatDate(claim.date)}
                      </span>
                    </div>
                  </div>

                  <p
                    className="text-sm text-muted-foreground leading-relaxed border-t border-border pt-3 line-clamp-2"
                    data-testid={`text-claim-description-${claim.id}`}
                  >
                    {claim.description}
                  </p>

                  {claim.verifiedBy && (
                    <p className="text-xs text-muted-foreground" data-testid={`text-verified-by-${claim.id}`}>
                      Reviewed by <span className="font-medium text-foreground">{claim.verifiedBy}</span>
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="pt-2">
          <Link href="/claim">
            <Button variant="outline" className="w-full" data-testid="button-new-claim">
              File a New Claim
            </Button>
          </Link>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border mt-auto bg-card">
        <p>© 2026 InsurTech Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
