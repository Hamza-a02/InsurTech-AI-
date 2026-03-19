import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  ShieldCheck, ArrowLeft, AlertTriangle, CheckCircle2, 
  Clock, FileText, User, Calendar, Search, Bot, MessageSquare, Send, Edit2, X, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Claim>>({});
  
  // Chat state
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'bot', content: string}[]>([
    { role: 'bot', content: 'I am the context-aware assistant for this claim. You can ask me questions about the information collected here.' }
  ]);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleOpenClaim = (claim: Claim) => {
    setSelectedClaim(claim);
    setIsEditing(false);
    setEditData({
      policyholderName: claim.policyholderName,
      policyId: claim.policyId,
      incidentDate: claim.incidentDate,
      claimType: claim.claimType,
      description: claim.description
    });
    setChatHistory([
      { role: 'bot', content: 'I am the context-aware assistant for this claim. You can ask me questions about the information collected here.' }
    ]);
  };

  const handleSaveEdit = () => {
    // In a real app, this would dispatch an update to the store/backend
    if (selectedClaim) {
      const updatedClaim = { ...selectedClaim, ...editData };
      setSelectedClaim(updatedClaim as Claim);
      // We would also update the main store here, but for this mock we just update local state
    }
    setIsEditing(false);
  };

  const handleChatSend = () => {
    if (!chatMessage.trim() || !selectedClaim) return;
    
    const userMsg = chatMessage;
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatMessage("");
    
    // Mock AI logic based on the specific claim
    setTimeout(() => {
      let botResponse = "";
      const query = userMsg.toLowerCase();
      const claimText = JSON.stringify(selectedClaim).toLowerCase();
      
      // Simple mock logic: if the query words appear in the claim data, synthesize an answer.
      // Otherwise, give the required fallback prompt.
      const queryWords = query.replace(/[?.,]/g, '').split(' ').filter(w => w.length > 3);
      const hasMatch = queryWords.some(word => claimText.includes(word));
      
      if (query.includes('name') || query.includes('who')) {
        botResponse = `The policyholder is ${selectedClaim.policyholderName}.`;
      } else if (query.includes('when') || query.includes('date')) {
        botResponse = `The incident was reported on ${selectedClaim.incidentDate}.`;
      } else if (query.includes('what') || query.includes('happen')) {
        botResponse = `According to the description: "${selectedClaim.description.substring(0, 100)}..."`;
      } else if (hasMatch) {
        botResponse = `Based on the claim record, I can confirm that information is present in the file. Is there specific detail you need?`;
      } else {
        botResponse = "Not enough info in the current claim draft. Please call the client to get more info.";
      }
      
      setChatHistory(prev => [...prev, { role: 'bot', content: botResponse }]);
    }, 600);
  };

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
                  onClick={() => handleOpenClaim(claim)}
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

            <div className="p-6 pt-0 flex flex-col lg:flex-row gap-6">
              {/* Left Column: Claim Details */}
              <div className="flex-1 space-y-6">
                {/* AI Summary Section */}
                <div className="bg-muted/50 rounded-lg p-5 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-primary flex items-center gap-2">
                      <Bot className="h-4 w-4" /> AI Generated Summary
                    </h4>
                    {!isEditing && selectedClaim.status !== "Verified" && (
                      <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8 gap-1">
                        <Edit2 className="h-3 w-3" /> Edit
                      </Button>
                    )}
                  </div>
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

                {/* Raw Data Form */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Policyholder Name</label>
                    <Input 
                      value={isEditing ? editData.policyholderName : selectedClaim.policyholderName} 
                      readOnly={!isEditing} 
                      onChange={(e) => setEditData({...editData, policyholderName: e.target.value})}
                      className={isEditing ? "bg-background border-primary" : "bg-card"} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Policy ID</label>
                    <Input 
                      value={isEditing ? editData.policyId : selectedClaim.policyId} 
                      readOnly={!isEditing} 
                      onChange={(e) => setEditData({...editData, policyId: e.target.value})}
                      className={isEditing ? "bg-background border-primary" : "bg-card"} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type of Claim</label>
                    <Input 
                      value={isEditing ? editData.claimType : selectedClaim.claimType} 
                      readOnly={!isEditing} 
                      onChange={(e) => setEditData({...editData, claimType: e.target.value})}
                      className={isEditing ? "bg-background border-primary" : "bg-card"} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Incident Date/Time</label>
                    <Input 
                      value={isEditing ? editData.incidentDate : selectedClaim.incidentDate} 
                      readOnly={!isEditing} 
                      onChange={(e) => setEditData({...editData, incidentDate: e.target.value})}
                      className={isEditing ? "bg-background border-primary" : "bg-card"} 
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
                    {isEditing ? (
                      <Textarea 
                        value={editData.description} 
                        onChange={(e) => setEditData({...editData, description: e.target.value})}
                        className="bg-background border-primary min-h-[80px]"
                      />
                    ) : (
                      <div className="text-sm p-3 bg-card border rounded-md min-h-[80px]">
                        "{selectedClaim.description}"
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveEdit}>
                      <Save className="h-4 w-4 mr-1" /> Save Changes
                    </Button>
                  </div>
                )}

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

              {/* Right Column: Mini Chatbot */}
              <div className="lg:w-80 flex flex-col border rounded-lg overflow-hidden bg-card h-[500px]">
                <div className="bg-primary/10 p-3 border-b flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Claim Assistant</h4>
                    <p className="text-[10px] text-muted-foreground">Ask about this specific claim</p>
                  </div>
                </div>
                
                <div 
                  ref={chatScrollRef}
                  className="flex-1 overflow-y-auto p-3 space-y-4 bg-muted/20 text-sm"
                >
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`px-3 py-2 rounded-lg max-w-[85%] ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground rounded-tr-none' 
                          : 'bg-card border shadow-sm rounded-tl-none'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-3 bg-card border-t">
                  <div className="flex gap-2">
                    <Input 
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                      placeholder="Ask a question..."
                      className="h-8 text-sm bg-muted/50"
                    />
                    <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleChatSend}>
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
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