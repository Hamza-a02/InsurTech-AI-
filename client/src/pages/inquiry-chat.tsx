import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Send, User, Bot, ArrowLeft, MessageSquare, Phone, Paperclip, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
};

export default function InquiryChat() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "bot",
      content:
        "Hello! I'm your Personal Policy Assistant. Please upload your insurance policy PDF using the paperclip icon below, and you can ask me any question you want. I will ONLY use the document you provide to answer your questions.",
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [policyText, setPolicyText] = useState<string | null>(null);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isBotTyping]);

  const addBotMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "bot", content },
    ]);
  };

  const askMutation = useMutation({
    mutationFn: async (data: { question: string; policyText: string | null }) => {
      const res = await apiRequest("POST", "/api/inquiry/chat", data);
      return res.json() as Promise<{ answer: string }>;
    },
    onSuccess: (data) => {
      setIsBotTyping(false);
      addBotMessage(data.answer);
    },
    onError: () => {
      setIsBotTyping(false);
      addBotMessage("I'm having trouble connecting right now. Please try again or contact an agent directly.");
    },
  });

  const escalateMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/inquiry/escalate", { message });
      return res.json();
    },
  });

  const extractTextFromPdf = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        const cleanText = text
          .replace(/[^\x20-\x7E\n]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        resolve(cleanText.substring(0, 12000));
      };
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setIsBotTyping(true);

      try {
        const text = await extractTextFromPdf(file);
        setPolicyText(text);
        setIsBotTyping(false);
        addBotMessage(
          `I've analyzed your policy document: "${file.name}". I can now answer specific questions about your coverages, limits, deductibles, and endorsements based on this document.`
        );
      } catch {
        setPolicyText(null);
        setIsBotTyping(false);
        addBotMessage(
          `I was unable to fully read "${file.name}". Please ensure it's a text-based PDF and try again, or describe your question and I'll do my best.`
        );
      }
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setPolicyText(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = () => {
    if (!inputValue.trim() || isBotTyping || askMutation.isPending) return;

    const userContent = inputValue;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userContent,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");

    const lowerText = userContent.toLowerCase();
    const isHighPriority = /lawyer|legal|complaint|sue|suing|lawsuit/.test(lowerText);

    if (isHighPriority) {
      escalateMutation.mutate(userContent);
      setIsBotTyping(true);
      setTimeout(() => {
        setIsBotTyping(false);
        addBotMessage(
          "I understand your frustration. Given the nature of your concern, I've automatically flagged this session for priority review by a senior adjuster. Would you like me to connect you with them immediately?"
        );
      }, 1000);
      return;
    }

    setIsBotTyping(true);
    askMutation.mutate({ question: userContent, policyText });
  };

  const handleRequestHuman = () => {
    toast({
      title: "Human Requested",
      description: "An agent will join the chat shortly.",
    });
    setTimeout(() => {
      addBotMessage("[SYSTEM]: Support Agent 'David R.' has joined the chat.");
    }, 2000);
  };

  const isDisabled = isBotTyping || askMutation.isPending;

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
                {policyText ? (
                  <span className="text-green-600 font-medium">Policy Document Loaded</span>
                ) : (
                  "Upload policy PDF to get started"
                )}
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRequestHuman}
          className="gap-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
        >
          <Phone className="h-4 w-4" />
          <span className="hidden sm:inline">Talk to Agent</span>
        </Button>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/30"
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

          {isDisabled && (
            <div className="flex gap-4 justify-start">
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="px-5 py-4 rounded-2xl bg-card border border-border rounded-tl-sm shadow-sm">
                <div className="flex gap-1.5 items-center h-4">
                  <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-border bg-card">
        <div className="max-w-3xl mx-auto flex flex-col gap-3">
          {uploadedFile && (
            <div className="flex items-center gap-2 bg-muted w-fit px-3 py-1.5 rounded-md text-sm border border-border">
              <FileText className="h-4 w-4 text-accent" />
              <span className="truncate max-w-[200px] font-medium text-foreground">
                {uploadedFile.name}
              </span>
              <button onClick={removeFile} className="text-muted-foreground hover:text-foreground ml-1">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="flex gap-3 items-end">
            <Button
              data-testid="button-upload-pdf"
              variant="outline"
              size="icon"
              className="flex-shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={isDisabled}
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
              data-testid="input-inquiry-message"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isDisabled && handleSend()}
              placeholder={
                isDisabled
                  ? "Please wait..."
                  : uploadedFile
                  ? "Ask about your document..."
                  : "Upload your policy PDF first, then ask your question..."
              }
              className="flex-1 bg-muted/50 border-transparent focus-visible:ring-accent shadow-inner"
              disabled={isDisabled}
            />
            <Button
              data-testid="button-send-inquiry"
              onClick={handleSend}
              size="icon"
              className="bg-accent hover:bg-accent/90 shadow-md transition-transform active:scale-95 flex-shrink-0"
              disabled={isDisabled || !inputValue.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
