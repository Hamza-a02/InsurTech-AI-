import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Send, User, Bot, ArrowLeft, ShieldAlert, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
};

// FNOL Steps
type ClaimStep = "NAME" | "POLICY_ID" | "INCIDENT_DATE" | "CLAIM_TYPE" | "DESCRIPTION" | "CONFIRMATION";

export default function ClaimChat() {
  const [, setLocation] = useLocation();
  const { addClaim } = useAppStore();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "bot",
      content: "Hello, I'm the AI Claims Specialist. I'm here to help you file a First Notice of Loss (FNOL). To get started, could you please provide your full name?"
    }
  ]);
  
  const [inputValue, setInputValue] = useState("");
  const [currentStep, setCurrentStep] = useState<ClaimStep>("NAME");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Claim data collection
  const [claimData, setClaimData] = useState({
    policyholderName: "",
    policyId: "",
    incidentDate: "",
    claimType: "",
    description: "",
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    
    // Simulate typing delay
    setTimeout(() => {
      processNextStep(userMessage.content);
    }, 800);
  };

  const processNextStep = (input: string) => {
    let nextContent = "";
    const updatedData = { ...claimData };
    
    switch (currentStep) {
      case "NAME":
        updatedData.policyholderName = input;
        nextContent = `Thank you, ${input}. Could you please provide your Policy ID?`;
        setCurrentStep("POLICY_ID");
        break;
      case "POLICY_ID":
        updatedData.policyId = input;
        nextContent = "Got it. When did the incident occur? (Date and approximate time)";
        setCurrentStep("INCIDENT_DATE");
        break;
      case "INCIDENT_DATE":
        updatedData.incidentDate = input;
        nextContent = "What type of claim is this? (e.g., Auto, Home, Life)";
        setCurrentStep("CLAIM_TYPE");
        break;
      case "CLAIM_TYPE":
        updatedData.claimType = input;
        nextContent = "Please provide a detailed description of what happened.";
        setCurrentStep("DESCRIPTION");
        break;
      case "DESCRIPTION":
        updatedData.description = input;
        nextContent = "Thank you. I have collected all the necessary information. Let me summarize:\n\n" +
          `• **Name:** ${updatedData.policyholderName}\n` +
          `• **Policy:** ${updatedData.policyId}\n` +
          `• **Date:** ${updatedData.incidentDate}\n` +
          `• **Type:** ${updatedData.claimType}\n\n` +
          "Your claim has been submitted as a draft for an adjuster to review. An adjuster will contact you soon. Is there anything else you need?";
        setCurrentStep("CONFIRMATION");
        
        // Check for high priority keywords
        const isHighPriority = input.toLowerCase().includes("lawyer") || 
                              input.toLowerCase().includes("legal") || 
                              input.toLowerCase().includes("sue") ||
                              input.toLowerCase().includes("injury") ||
                              input.toLowerCase().includes("hospital");
                              
        // Generate mock summary
        const mockSummary = [
          `${updatedData.claimType} claim reported on ${updatedData.incidentDate}.`,
          `Incident description: ${input.substring(0, 60)}...`,
          isHighPriority ? "FLAG: Potential legal/injury involvement mentioned." : "Standard preliminary processing required."
        ];
        
        // Save to store
        addClaim({
          ...updatedData,
          priority: isHighPriority ? "High" : "Normal",
          summary: mockSummary
        });
        
        break;
      case "CONFIRMATION":
        nextContent = "Your session has been recorded. If you need immediate assistance, please use the 'Request Human' button above.";
        break;
    }
    
    setClaimData(updatedData);
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "bot",
      content: nextContent
    }]);
  };

  const handleRequestHuman = () => {
    toast({
      title: "Human Requested",
      description: "An adjuster has been notified and will join the chat shortly.",
    });
    
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "bot",
        content: "[SYSTEM]: Adjuster 'Sarah Jenkins' has joined the chat."
      }]);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border bg-card shadow-sm z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground leading-tight">Claims Specialist</h1>
              <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                AI Assistant Online
              </p>
            </div>
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={handleRequestHuman} className="gap-2 font-medium">
          <Phone className="h-4 w-4" />
          <span className="hidden sm:inline">Request Human</span>
        </Button>
      </header>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 chat-scroll bg-muted/30"
      >
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "bot" && (
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              
              <div 
                className={`px-5 py-3.5 rounded-2xl max-w-[85%] sm:max-w-[75%] shadow-sm ${
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-tr-sm" 
                    : msg.content.startsWith("[SYSTEM]") 
                      ? "bg-secondary text-secondary-foreground w-full text-center font-medium rounded-xl"
                      : "bg-card text-card-foreground border border-border rounded-tl-sm whitespace-pre-line"
                }`}
              >
                {msg.content}
              </div>

              {msg.role === "user" && (
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-card">
        <div className="max-w-3xl mx-auto flex gap-3">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message..."
            className="flex-1 bg-muted/50 border-transparent focus-visible:ring-primary shadow-inner"
            disabled={currentStep === "CONFIRMATION" && !messages[messages.length - 1].content.includes("[SYSTEM]")}
          />
          <Button 
            onClick={handleSend} 
            size="icon"
            className="bg-primary hover:bg-primary/90 shadow-md transition-transform active:scale-95"
            disabled={currentStep === "CONFIRMATION" && !messages[messages.length - 1].content.includes("[SYSTEM]") || !inputValue.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-3">
          Powered by InsurTech AI. Information collected will be reviewed by a human adjuster.
        </p>
      </div>
    </div>
  );
}