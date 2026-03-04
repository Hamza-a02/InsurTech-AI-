import { useState } from "react";
import { useLocation } from "wouter";
import { 
  ShieldCheck, ArrowLeft, AlertTriangle, CheckCircle2, 
  Clock, FileText, User, Calendar, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAppStore, Claim } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { claims, verifyClaim } = useAppStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  
  // Hardcoded for demo purposes
  const adjusterName = "Alex Sterling";

  const filteredClaims = claims.filter(claim => 
    claim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    claim.policyholderName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingClaimsCount = claims.filter(c => c.status === "Draft").length;
  const highPriorityCount = claims.filter(c => c.priority === "High" && c.status === "Draft").length;

  const handleVerify = () => {
    if (selectedClaim) {
      verifyClaim(selectedClaim.id, adjusterName);
      setSelectedClaim(null);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={() => setLocation("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            <span className="text-lg font-bold tracking-tight">Adjuster Dashboard</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium opacity-90 hidden sm:inline">Logged in as {adjusterName}</span>
          <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center font-bold">
            AS
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Verification Queue</p>
                <h3 className="text-3xl font-bold">{pendingClaimsCount}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card className={`border-border shadow-sm ${highPriorityCount > 0 ? 'border-destructive/50 bg-destructive/5' : ''}`}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${highPriorityCount > 0 ? 'bg-destructive text-white' : 'bg-orange-100 text-orange-700'}`}>
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">High Priority</p>
                <h3 className={`text-3xl font-bold ${highPriorityCount > 0 ? 'text-destructive' : ''}`}>{highPriorityCount}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Verified Today</p>
                <h3 className="text-3xl font-bold">{claims.filter(c => c.status === "Verified").length}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Queue List */}
        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
            <div>
              <CardTitle>Draft Claims Queue</CardTitle>
              <CardDescription>Claims collected by AI pending human verification</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ID or Name..."
                className="pl-9 bg-muted/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <div className="divide-y divide-border">
            {filteredClaims.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No claims found matching your criteria.
              </div>
            ) : (
              filteredClaims.map((claim) => (
                <div 
                  key={claim.id} 
                  className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors cursor-pointer ${
                    claim.priority === "High" && claim.status === "Draft" ? "bg-destructive/5 hover:bg-destructive/10" : ""
                  }`}
                  onClick={() => setSelectedClaim(claim)}
                >
                  <div className="flex gap-4 items-center">
                    <div className="flex-shrink-0">
                      {claim.status === "Verified" ? (
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                      ) : claim.priority === "High" ? (
                        <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <FileText className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{claim.id}</span>
                        {claim.priority === "High" && (
                          <Badge variant="destructive" className="text-[10px] h-5">High Priority</Badge>
                        )}
                        <Badge variant={claim.status === "Verified" ? "secondary" : "outline"} className="text-[10px] h-5 bg-card">
                          {claim.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-3">
                        <span className="flex items-center gap-1"><User className="h-3 w-3"/> {claim.policyholderName}</span>
                        <span className="hidden sm:flex items-center gap-1"><Calendar className="h-3 w-3"/> {new Date(claim.date).toLocaleDateString()}</span>
                        <span className="hidden md:inline text-xs bg-muted px-1.5 rounded text-muted-foreground">Collected by: {claim.collectedBy}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button variant={claim.status === "Verified" ? "outline" : "default"} size="sm" className="w-full sm:w-auto">
                    {claim.status === "Verified" ? "View Record" : "Review & Verify"}
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </main>

      {/* Verification Modal */}
      <Dialog open={!!selectedClaim} onOpenChange={(open) => !open && setSelectedClaim(null)}>
        {selectedClaim && (
          <DialogContent className="max-w-2xl bg-card border-border p-0 overflow-hidden">
            <div className={`h-2 w-full ${selectedClaim.status === "Verified" ? "bg-green-500" : selectedClaim.priority === "High" ? "bg-destructive" : "bg-primary"}`} />
            
            <DialogHeader className="p-6 pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <DialogTitle className="text-2xl flex items-center gap-2">
                    {selectedClaim.id}
                    {selectedClaim.status === "Verified" && <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">Verified</Badge>}
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    Date Submitted: {new Date(selectedClaim.date).toLocaleString()}
                  </DialogDescription>
                </div>
                {selectedClaim.priority === "High" && (
                  <Badge variant="destructive" className="animate-pulse">HIGH PRIORITY</Badge>
                )}
              </div>
            </DialogHeader>

            <div className="p-6 pt-0 space-y-6">
              {/* AI Summary Section - Core Feature for Adjuster UI */}
              <div className="bg-muted/50 rounded-lg p-5 border border-border">
                <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                  <Bot className="h-4 w-4" /> AI Generated Summary
                </h4>
                <ul className="space-y-2">
                  {selectedClaim.summary.map((point, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="text-primary mt-0.5">•</span>
                      <span className={point.includes("FLAG") ? "text-destructive font-medium" : "text-foreground"}>
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Raw Data Form (Editable in a real app, disabled for mock) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Policyholder Name</label>
                  <Input value={selectedClaim.policyholderName} readOnly className="bg-card" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Policy ID</label>
                  <Input value={selectedClaim.policyId} readOnly className="bg-card" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type of Claim</label>
                  <Input value={selectedClaim.claimType} readOnly className="bg-card" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Incident Date/Time</label>
                  <Input value={selectedClaim.incidentDate} readOnly className="bg-card" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Raw User Description</label>
                  <div className="text-sm p-3 bg-card border rounded-md min-h-[80px]">
                    "{selectedClaim.description}"
                  </div>
                </div>
              </div>

              {/* Audit Trail */}
              <div className="text-xs text-muted-foreground flex items-center justify-between border-t pt-4">
                <span className="flex items-center gap-1">
                  <Bot className="h-3 w-3"/> Collected by: {selectedClaim.collectedBy}
                </span>
                {selectedClaim.status === "Verified" && (
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <CheckCircle2 className="h-3 w-3"/> Verified by: {selectedClaim.verifiedBy}
                  </span>
                )}
              </div>
            </div>

            {selectedClaim.status !== "Verified" && (
              <DialogFooter className="p-4 bg-muted/30 border-t sm:justify-between flex-row">
                <Button variant="ghost" onClick={() => setSelectedClaim(null)}>Cancel</Button>
                <Button onClick={handleVerify} className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Verify & Submit
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}