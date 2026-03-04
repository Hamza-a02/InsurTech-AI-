import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Send, User, Bot, ArrowLeft, MessageSquare, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/lib/store";

type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
};

// Mock Knowledge Base Responses
const mockKB: Record<string, string> = {
  "deductible": "Your standard auto policy deductible is $500 for collision and $250 for comprehensive coverage. For home insurance, your deductible is 1% of the dwelling coverage ($3,500).",
  "rental": "Yes, your policy includes rental reimbursement coverage up to $30/day for a maximum of 30 days while your vehicle is being repaired for a covered loss.",
  "process": "The typical claims process involves: 1) Initial report (FNOL), 2) Adjuster assignment and review within 24 hours, 3) Damage inspection/estimate, 4) Repair authorization, and 5) Final payment. The whole process usually takes 7-14 days.",
  "default": "I can help answer questions about your policy coverages, deductibles, or explain the claims process. What specifically would you like to know?"
};

export default function InquiryChat() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { addClaim } = useAppStore(); // Using this to simulate flagging high priority sessions
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "bot",
      content: "Hello! I'm the Inquiry Specialist. I can answer questions about your policy coverage, deductibles, and general insurance terms. How can I help you today?"
    }
  ]);
  
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

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
    
    // Process sentiment/keywords
    const text = userMessage.content.toLowerCase();
    
    if (text.includes("lawyer") || text.includes("legal") || text.includes("complaint") || text.includes("sue")) {
      // Create a dummy high-priority record to show in dashboard
      addClaim({
        policyholderName: "Unknown User (Inquiry Session)",
        policyId: "N/A",
        incidentDate: new Date().toLocaleDateString(),
        claimType: "Inquiry Escalation",
        description: `User expressed intent requiring legal/complaint attention: "${userMessage.content}"`,
        priority: "High",
        summary: ["High-priority keywords detected in Inquiry chat.", "Possible legal action or formal complaint mentioned."]
      });
      
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: "bot",
          content: "I understand your frustration. Given the nature of your concern, I've automatically flagged this session for priority review by a senior adjuster. Would you like me to connect you with them immediately?"
        }]);
      }, 1000);
      return;
    }

    // Standard RAG simulation
    setTimeout(() => {
      let response = mockKB.default;
      
      if (text.includes("deductible")) response = mockKB.deductible;
      else if (text.includes("rental") || text.includes("car")) response = mockKB.rental;
      else if (text.includes("process") || text.includes("how long")) response = mockKB.process;

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "bot",
        content: response
      }]);
    }, 800);
  };

  const handleRequestHuman = () => {
    toast({
      title: "Human Requested",
      description: "An agent will join the chat shortly.",
    });
    
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "bot",
        content: "[SYSTEM]: Support Agent 'David R.' has joined the chat."
      }]);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b border-border bg-card shadow-sm z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground leading-tight">Inquiry Specialist</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                RAG Knowledge Base Connected
              </p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleRequestHuman} className="gap-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground">
          <Phone className="h-4 w-4" />
          <span className="hidden sm:inline">Talk to Agent</span>
        </Button>
      </header>

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
                <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              
              <div 
                className={`px-5 py-3.5 rounded-2xl max-w-[85%] sm:max-w-[75%] shadow-sm ${
                  msg.role === "user" 
                    ? "bg-accent text-accent-foreground rounded-tr-sm" 
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

      <div className="p-4 border-t border-border bg-card">
        <div className="max-w-3xl mx-auto flex gap-3">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about your policy..."
            className="flex-1 bg-muted/50 border-transparent focus-visible:ring-accent shadow-inner"
          />
          <Button 
            onClick={handleSend} 
            size="icon"
            className="bg-accent hover:bg-accent/90 shadow-md transition-transform active:scale-95"
            disabled={!inputValue.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}