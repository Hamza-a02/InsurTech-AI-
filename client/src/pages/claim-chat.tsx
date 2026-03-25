import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Send, User, Bot, ArrowLeft, ShieldAlert, Phone } from "lucide-react";
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

type ClaimStep = "FIVE_WS" | "ALBERTA_RULES" | "ESSENTIAL_INFO" | "CONFIRMATION";

export default function ClaimChat() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "bot",
      content:
        "Hello, I'm the Alberta Insurance Claims Specialist. I'm here to help you document an incident for your insurer.\n\nTo get started, please describe what happened. Make sure to cover:\n• Who was involved\n• What happened\n• Where it happened\n• When it happened",
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [currentStep, setCurrentStep] = useState<ClaimStep>("FIVE_WS");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [fnolDescription, setFnolDescription] = useState("");
  const [claimData, setClaimData] = useState({
    policyholderName: "Pending User Info",
    policyId: "Pending Policy ID",
    incidentDate: "",
    claimType: "Auto (Alberta)",
    description: "",
  });

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

  const createClaimMutation = useMutation({
    mutationFn: async (data: {
      policyholderName: string;
      policyId: string;
      incidentDate: string;
      claimType: string;
      description: string;
      priority: "Normal" | "High";
    }) => {
      const res = await apiRequest("POST", "/api/claims", data);
      return res.json();
    },
  });

  const validateFnolMutation = useMutation({
    mutationFn: async (description: string) => {
      const res = await apiRequest("POST", "/api/claims/validate-fnol", { description });
      return res.json() as Promise<{ sufficient: boolean; followUp?: string }>;
    },
  });

  const handleSend = () => {
    if (!inputValue.trim() || isBotTyping || validateFnolMutation.isPending || createClaimMutation.isPending) return;

    const userContent = inputValue;
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: userContent },
    ]);
    setInputValue("");

    if (currentStep === "FIVE_WS") {
      const accumulatedDesc = fnolDescription
        ? `${fnolDescription} ${userContent}`
        : userContent;
      setFnolDescription(accumulatedDesc);
      setIsBotTyping(true);

      validateFnolMutation.mutate(accumulatedDesc, {
        onSuccess: (result) => {
          setIsBotTyping(false);
          if (result.sufficient) {
            const updatedData = {
              ...claimData,
              description: accumulatedDesc,
              incidentDate: new Date().toLocaleDateString(),
            };
            setClaimData(updatedData);
            setCurrentStep("ALBERTA_RULES");
            addBotMessage(
              "Thank you — that's enough to start your report.\n\nA couple of Alberta-specific things to confirm:\n\n• Did the total damage exceed $5,000? If so, you are required to obtain a police sticker.\n• Under Alberta's Direct Compensation for Property Damage (DCPD) program, you deal directly with your own insurer for vehicle damage, even if you were not at fault.\n\nDid you obtain a police sticker, or was the damage minor?"
            );
          } else {
            addBotMessage(
              result.followUp ??
                "Could you add a bit more detail? Please make sure to mention who was involved, what happened, where it occurred, and when."
            );
          }
        },
        onError: () => {
          setIsBotTyping(false);
          const updatedData = {
            ...claimData,
            description: accumulatedDesc,
            incidentDate: new Date().toLocaleDateString(),
          };
          setClaimData(updatedData);
          setCurrentStep("ALBERTA_RULES");
          addBotMessage(
            "Thank you. A couple of Alberta-specific reminders before we continue:\n\n• If total damage exceeded $5,000, you must obtain a police sticker.\n• Under DCPD, you deal with your own insurer even if you were not at fault.\n\nDid you get a police sticker, or is the damage minor?"
          );
        },
      });
      return;
    }

    setIsBotTyping(true);
    setTimeout(() => {
      processStep(currentStep, userContent);
      setIsBotTyping(false);
    }, 800);
  };

  const processStep = (step: ClaimStep, input: string) => {
    switch (step) {
      case "ALBERTA_RULES":
        addBotMessage(
          "Understood. Before I submit your report, please make sure you have the following:\n\n1. Photos of the scene and any dashcam footage.\n2. Contact information for any witnesses.\n3. The other driver's insurance details (Section A — Third Party Liability).\n\nHave you collected this information? Feel free to add anything else relevant before I submit."
        );
        setCurrentStep("ESSENTIAL_INFO");
        break;

      case "ESSENTIAL_INFO": {
        setCurrentStep("CONFIRMATION");

        const fullText = (claimData.description + " " + input).toLowerCase();
        const isHighPriority = /lawyer|legal|sue|suing|injury|hospital|lawsuit|bodily/.test(fullText);

        const finalData = {
          ...claimData,
          priority: isHighPriority ? ("High" as const) : ("Normal" as const),
        };

        createClaimMutation.mutate(finalData, {
          onSuccess: () => {
            addBotMessage(
              "Thank you. Your report has been submitted for adjuster review. Here's a summary:\n\n" +
                `• Type: Auto Claim (Alberta Jurisdiction)\n` +
                `• Date Reported: ${finalData.incidentDate}\n` +
                `• Description: ${finalData.description.substring(0, 100)}...\n\n` +
                (isHighPriority
                  ? "⚠️ Your case has been flagged as HIGH PRIORITY due to potential injury or legal involvement. An adjuster will be in touch urgently.\n\n"
                  : "") +
                "An adjuster will contact you soon to finalize the details. Is there anything else you need?"
            );
          },
          onError: () => {
            addBotMessage(
              "Your information has been noted. There was an issue saving to our system — please call us directly to complete the report."
            );
          },
        });
        break;
      }

      case "CONFIRMATION":
        addBotMessage(
          "Your session has been recorded. If you need immediate help, use the 'Request Human' button above."
        );
        break;

      default:
        break;
    }
  };

  const handleRequestHuman = () => {
    toast({
      title: "Adjuster Notified",
      description: "An adjuster will join the chat shortly. Please stand by.",
    });
  };

  const isDisabled =
    currentStep === "CONFIRMATION" ||
    isBotTyping ||
    validateFnolMutation.isPending ||
    createClaimMutation.isPending;

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b border-border bg-card shadow-sm z-10 flex-shrink-0">
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
        <Button
          variant="destructive"
          size="sm"
          onClick={handleRequestHuman}
          data-testid="button-request-human"
          className="gap-2 font-medium"
        >
          <Phone className="h-4 w-4" />
          <span className="hidden sm:inline">Request Human</span>
        </Button>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/30 min-h-0"
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

          {isDisabled && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-4 justify-start">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
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

      <div className="p-4 border-t border-border bg-card flex-shrink-0">
        <div className="max-w-3xl mx-auto flex gap-3">
          <Input
            data-testid="input-claim-message"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isDisabled && handleSend()}
            placeholder={
              currentStep === "CONFIRMATION"
                ? "Claim submitted."
                : "Type your message..."
            }
            className="flex-1 bg-muted/50 border-transparent focus-visible:ring-primary shadow-inner"
            disabled={isDisabled}
          />
          <Button
            data-testid="button-send-claim"
            onClick={handleSend}
            size="icon"
            className="bg-primary hover:bg-primary/90 shadow-md transition-transform active:scale-95"
            disabled={isDisabled || !inputValue.trim()}
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
