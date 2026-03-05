import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Send, User, Bot, ArrowLeft, MessageSquare, Phone, Paperclip, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/lib/store";

type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
};

// Mock Knowledge Base Responses (for when PDF is uploaded)
const mockKB: Record<string, string> = {
  "glass": "Based on the policy document you uploaded, yes, you have the SEF 13H Limited Glass endorsement on your 2018 Honda Civic. This means you do NOT have coverage for routine rock chips or cracks to your windshield, but you are covered if the glass breaks due to fire or theft.",
  "rental": "I checked your document. You have SEF 20 (Loss of Use) coverage with a limit of $1,500 total, and a maximum of $50 per day for a rental vehicle.",
  "non-owned": "According to your policy, you DO have SEF 27 coverage. This means if you rent a car on vacation in Canada or the US, your current physical damage coverage extends to the rental car.",
  "deductible": "Looking at your uploaded policy, your Collision deductible is $500, and your Comprehensive deductible is $250.",
  "default": "Based on the document provided, I can't find specific information regarding that question. I recommend speaking directly with an agent to get a precise answer. Would you like me to connect you?"
};

export default function InquiryChat() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { addClaim } = useAppStore(); 
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "bot",
      content: "Hello! I'm your Personal Policy Assistant. Please upload your insurance policy PDF using the paperclip icon below, and you can ask me any question you want. I will ONLY use the document you provide to answer your questions."
    }
  ]);
  
  const [inputValue, setInputValue] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      
      // Mock the bot reading the policy PDF
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "bot",
        content: `I see you've uploaded your policy document: "${file.name}". I'm analyzing the details now... I can now answer specific questions about your coverages, limits, and deductibles based on this document.`
      }]);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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

    // Standard RAG simulation (Only answers based on PDF if uploaded)
    setTimeout(() => {
      let response = "Based on the document provided, I don't see sufficient information regarding that question. I recommend speaking directly with an agent to get a precise answer. Would you like me to connect you?";
      
      if (!uploadedFile) {
        response = "Please upload your policy PDF first so I can analyze it and answer your questions based on your specific coverage.";
      } else {
        if (text.includes("glass") || text.includes("13h")) response = mockKB.glass;
        else if (text.includes("rental") || text.includes("20") || text.includes("car")) response = mockKB.rental;
        else if (text.includes("non-owned") || text.includes("27") || text.includes("borrow")) response = mockKB["non-owned"];
        else if (text.includes("deductible")) response = mockKB.deductible;
      }

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
        <div className="max-w-3xl mx-auto flex flex-col gap-3">
          {uploadedFile && (
            <div className="flex items-center gap-2 bg-muted w-fit px-3 py-1.5 rounded-md text-sm border border-border">
              <FileText className="h-4 w-4 text-accent" />
              <span className="truncate max-w-[200px] font-medium text-foreground">{uploadedFile.name}</span>
              <button onClick={removeFile} className="text-muted-foreground hover:text-foreground ml-1">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="flex gap-3 items-end">
            <Button
              variant="outline"
              size="icon"
              className="flex-shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-5 w-5 text-muted-foreground" />
            </Button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".pdf"
              onChange={handleFileUpload}
            />
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={uploadedFile ? "Ask about your document..." : "Ask about your policy..."}
              className="flex-1 bg-muted/50 border-transparent focus-visible:ring-accent shadow-inner"
            />
            <Button 
              onClick={handleSend} 
              size="icon"
              className="bg-accent hover:bg-accent/90 shadow-md transition-transform active:scale-95 flex-shrink-0"
              disabled={!inputValue.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}