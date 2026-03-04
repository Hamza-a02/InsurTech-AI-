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
type ClaimStep = "FIVE_WS" | "ALBERTA_RULES" | "ESSENTIAL_INFO" | "CONFIRMATION";

export default function ClaimChat() {
  const [, setLocation] = useLocation();
  const { addClaim } = useAppStore();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "bot",
      content: "Hello, I'm the Alberta Insurance Claims Specialist. My goal is to help you document an accident for your insurer.\n\nTo begin, please tell me about the incident using the 5 Ws: Who was involved, What happened, Where did it happen, When did it occur, and Why do you think it happened?"
    }
  ]);
  
  const [inputValue, setInputValue] = useState("");
  const [currentStep, setCurrentStep] = useState<ClaimStep>("FIVE_WS");
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
      case "FIVE_WS":
        updatedData.description = input;
        nextContent = "Thank you. Did the total damage exceed $5,000?\n\nIf so, a quick reminder of Alberta requirements: you MUST get a police sticker.\n\nAlso, under the Direct Compensation for Property Damage (DCPD) program, you will deal with your own insurer for vehicle damage, even if you are not at fault. Did you get a police sticker or is the damage minor?";
        setCurrentStep("ALBERTA_RULES");
        break;
      case "ALBERTA_RULES":
        nextContent = "Understood. Finally, please ensure you have the following essential information to share:\n\n1. Photos of the scene and any dashcam footage.\n2. Contact information for any witnesses.\n3. The 'Section A' (Third Party Liability) details of the other driver involved.\n\nHave you collected all of these details, and is there anything else you'd like to add before I submit your report?";
        setCurrentStep("ESSENTIAL_INFO");
        break;
      case "ESSENTIAL_INFO":
        updatedData.policyholderName = "Pending User Info";
        updatedData.policyId = "Pending Policy ID";
        updatedData.incidentDate = new Date().toLocaleDateString();
        updatedData.claimType = "Auto (Alberta)";
        
        nextContent = "Thank you. I have collected all the necessary information. Let me summarize your report:\n\n" +
          `• **Type:** Auto Claim (Alberta Jurisdiction)\n` +
          `• **Date Reported:** ${updatedData.incidentDate}\n` +
          `• **Initial Description:** ${updatedData.description.substring(0, 50)}...\n\n` +
          "Your claim has been submitted as a draft for an adjuster to review. An adjuster will contact you soon to finalize your details. Is there anything else you need?";
        setCurrentStep("CONFIRMATION");
        
        // Check for high priority keywords
        const isHighPriority = input.toLowerCase().includes("lawyer") || 
                              input.toLowerCase().includes("legal") || 
                              input.toLowerCase().includes("sue") ||
                              input.toLowerCase().includes("injury") ||
                              input.toLowerCase().includes("hospital");
                              
        // Generate mock summary
        const mockSummary = [
          `Auto claim reported under Alberta jurisdiction.`,
          `Initial report: ${updatedData.description.substring(0, 60)}...`,
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