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
  "glass": "SEF 13H is the 'Limited Glass' endorsement. In Alberta, because of all the gravel on the roads, many drivers choose to limit their glass coverage to save on premiums. It means your windshield is covered for specified perils like theft or fire, but not for routine rock chips.",
  "rental": "SEF 20 is 'Loss of Use' coverage. Simply put, if your car is in the shop after a covered accident, this pays for a rental car so you can still get around.",
  "non-owned": "SEF 27 covers damage to non-owned autos. Basically, if you rent a vehicle on vacation or borrow a friend's car, this endorsement extends your physical damage coverage to that borrowed vehicle so you don't need to buy the rental company's insurance.",
  "comp_vs_coll": "Think of it this way:\n\n**Collision** covers you when your car hits something (like another car or a guardrail).\n\n**Comprehensive** covers 'everything else' that happens out of your control—like hail, theft, fire, vandalism, or hitting an animal on the highway.",
  "default": "I can help translate insurance jargon into plain English. Try asking me about common Alberta endorsements (like SEF 13H, SEF 20, SEF 27) or the difference between coverages like Comprehensive and Collision."
};

export default function InquiryChat() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { addClaim } = useAppStore(); // Using this to simulate flagging high priority sessions
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "bot",
      content: "Hello! I'm your Alberta Policy Expert. I'm here to help translate insurance jargon into plain English. Feel free to ask me about specific endorsements like SEF 13H, SEF 20, or the difference between coverages like Comprehensive and Collision."
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
      
      if (text.includes("glass") || text.includes("13h")) response = mockKB.glass;
      else if (text.includes("rental") || text.includes("20")) response = mockKB.rental;
      else if (text.includes("non-owned") || text.includes("27") || text.includes("borrow")) response = mockKB["non-owned"];
      else if (text.includes("comprehensive") || text.includes("collision") || text.includes("difference")) response = mockKB.comp_vs_coll;

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