import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Send, User, Bot, ArrowLeft, MessageSquare, Phone,
  ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertTriangle, Car, FileText, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
};

const POLICY_CONTEXT = `
DESJARDINS AUTO INSURANCE POLICY — Z6023FK0
Insured: Afshan Aamir & Hamza Aamir, 66 Royal Highland Rd NW, Calgary AB T3G 4Y4
Policy Period: 2025-11-28 to 2026-11-28
Insurer: Certas Home and Auto Insurance Company (Desjardins)
Agent: Anita Ip Insurance And Financial Services Limited, 587-353-7500, anita.ip@desjardins.com
Annual Premium: $7,717.00 | Monthly Payment: $643.09 via pre-authorized debit
Claims Line: 1-855-209-9549

VEHICLE 1: 2023 Ford Escape PHEV 4D 2X4
VIN: 1FMCU0E11PUB28765 | Purchased: 2023-12, New
Registered Owner: Afshan Aamir & Hamza Aamir
Lienholder: Ford Credit of Canada, Edmonton AB
Annual KM: 20,000 | Business KM: 10,000
Parking: Private garage
Discounts: 10% Hybrid Vehicle, 10% Multi-Vehicle, 25% Occasional Driver, 5% Winter Tires
Vehicle Premium: $4,214

VEHICLE 1 COVERAGE:
- Section A Third Party Liability: $1,000,000 limit (BI premium $1,863 + Occ $90; PD included)
- Section B Accident Benefits: As per policy (premium $287 + Occ $42)
- Section A.1 DCPD (Direct Compensation for Property Damage): $0 deductible (premium $410 + Occ $70)
- Section C - Collision: $1,000 deductible (premium $589 + Occ $96)
- Section C - Comprehensive: $1,000 deductible (premium $328)
- Section C - All Perils: Included (combines Collision + Comprehensive)
- Section C - Specified Perils: Included
- CAE #1 Endorsement: 5-Year New Vehicle Protection (premium $326 + Occ $41)
- Trouble-Free Option: Applicable
- AB-S.E.F. 13(D) Limitation of Glass Coverage: GLASS IS EXCLUDED (saves -$8 premium)
- AB-S.E.F. 20 Loss of Use: $1,500 limit — Included
- AB-S.E.F. 35 Emergency Service Expense: Included

VEHICLE 2: 2023 Ford Mustang Mach-E Premium 300A 4D AWD
VIN: 3FMTK3SU5PMA27769 | Purchased: 2023-06, New
Registered Owner: Afshan Aamir
Lienholder: The Bank of Nova Scotia, Toronto ON
Annual KM: 25,000
Parking: Private garage
Discounts: 10% Electric Vehicle, 10% Multi-Vehicle, 25% Occasional Driver, 5% Winter Tires
Vehicle Premium: $3,473
NOTE: Higher deductibles apply due to make/model.

VEHICLE 2 COVERAGE:
- Section A Third Party Liability: $1,000,000 limit (BI premium $884 + Occ $110; PD included)
- Section B Accident Benefits: As per policy (premium $374 + Occ $64)
- Section A.1 DCPD: $0 deductible (premium $191 + Occ $80)
- Section C - Collision: $1,000 deductible (premium $422 + Occ $130)
- Section C - Comprehensive: $1,000 deductible (premium $600)
- Section C - All Perils: Included
- Section C - Specified Perils: Included
- CAE #1 Endorsement: 5-Year New Vehicle Protection (premium $478 + Occ $84)
- Trouble-Free Option: Applicable
- AB-S.E.F. 13(D) Limitation of Glass Coverage: GLASS IS EXCLUDED (saves -$15 premium)
- AB-S.E.F. 20 Loss of Use: $1,500 limit — Included
- AB-S.E.F. 35 Emergency Service Expense: Included
- AB-S.E.F. 39(A) At-Fault Accident Waiver: DECLINED — NOT INCLUDED

POLICY-WIDE ENDORSEMENTS:
- AB-S.E.F. 27 Legal Liability for Non-Owned Automobile: $100,000 limit; Collision deductible $250, Comprehensive deductible $100 (Included)
- AB-S.E.F. 44 Family Protection Endorsement: $1,000,000 (premium $30)

DRIVERS:
- Afshan Aamir (DOB 1976-12-30, F, Married): Licensed 2004-12. Vehicle 1: Secondary, Vehicle 2: Principal
- Muhammad Aamir (DOB 1967-03-01, M, Married): Licensed 1991-07. Vehicle 1: Principal, Vehicle 2: Secondary. Has 1 minor conviction in past 3 years.
- Hamza Aamir (DOB 2002-10-02, M, Single): Licensed 2023-07. Has Driver Training Certificate (DTC). Vehicle 1: Occasional, Vehicle 2: Occasional
- Mohammad Osaid Aamir (DOB 2000-07-02, M, Single): Licensed 2023-07. Vehicle 1: Secondary, Vehicle 2: Secondary. Has 1 minor conviction.

CHARGEABLE CLAIMS: 2021-10-06 Collision; 2019-12-08 Accident Benefits + Collision; 2016-11-18 Collision

GOOD DRIVER RATE CAP NOTE:
- Vehicle 1: Does NOT qualify for the good driver rate cap (exemption applies — premium increase may exceed 7.5% cap)
- Vehicle 2: Qualifies as good driver; premium increase capped at 7.5%

GLASS COVERAGE NOTE: Both vehicles have AB-S.E.F. 13(D) — glass damage is explicitly EXCLUDED from both vehicles. You cannot make a glass claim (windshield chips, cracks, breakage).
`;

const vehicles = [
  {
    id: 1,
    year: "2023",
    make: "Ford Escape",
    model: "PHEV 4D 2X4",
    vin: "1FMCU0E11PUB28765",
    premium: "$4,214/yr",
    covered: [
      "Third Party Liability — $1,000,000",
      "Accident Benefits (Section B)",
      "Direct Compensation for Property Damage (DCPD) — $0 deductible",
      "Collision — $1,000 deductible",
      "Comprehensive — $1,000 deductible",
      "All Perils & Specified Perils",
      "5-Year New Vehicle Protection (CAE #1)",
      "Trouble-Free Option",
      "Loss of Use (SEF 20) — up to $1,500",
      "Emergency Service Expense (SEF 35)",
      "Non-Owned Auto Liability (SEF 27) — $100,000",
      "Family Protection (SEF 44) — $1,000,000",
      "Hybrid Vehicle discount (10%)",
      "Winter Tires discount (5%)",
    ],
    notCovered: [
      "Glass damage — explicitly excluded (SEF 13D applies)",
      "Windshield chips, cracks, or breakage",
      "At-Fault Accident Waiver (not applicable to this vehicle)",
    ],
    greyFlags: [
      "Hamza listed as Occasional driver — claims where he is at fault may trigger surcharge review",
      "Muhammad Aamir has 1 minor conviction — could affect future renewals if another occurs",
      "PHEV charging equipment damage — not explicitly addressed in policy wording",
      "Personal belongings inside the vehicle — not covered under Section C (no all-risk contents coverage)",
      "Rideshare/Uber use — using the vehicle commercially is typically not covered but not explicitly stated",
      "Vehicle 1 does NOT qualify for the Good Driver rate cap — future increases may exceed 7.5%",
      "Towing is reimbursed only if the underlying claim is covered — standalone towing may not be paid",
    ],
  },
  {
    id: 2,
    year: "2023",
    make: "Ford Mustang Mach-E",
    model: "Premium 300A 4D AWD",
    vin: "3FMTK3SU5PMA27769",
    premium: "$3,473/yr",
    covered: [
      "Third Party Liability — $1,000,000",
      "Accident Benefits (Section B)",
      "Direct Compensation for Property Damage (DCPD) — $0 deductible",
      "Collision — $1,000 deductible",
      "Comprehensive — $1,000 deductible",
      "All Perils & Specified Perils",
      "5-Year New Vehicle Protection (CAE #1)",
      "Trouble-Free Option",
      "Loss of Use (SEF 20) — up to $1,500",
      "Emergency Service Expense (SEF 35)",
      "Non-Owned Auto Liability (SEF 27) — $100,000",
      "Family Protection (SEF 44) — $1,000,000",
      "Electric Vehicle discount (10%)",
      "Winter Tires discount (5%)",
    ],
    notCovered: [
      "Glass damage — explicitly excluded (SEF 13D applies)",
      "Windshield chips, cracks, or breakage",
      "At-Fault Accident Waiver (SEF 39A) — you declined this coverage",
    ],
    greyFlags: [
      "Higher deductibles apply due to vehicle make/model — exact amounts, check your Certificate",
      "Hamza listed as Occasional driver — at-fault claim by him not protected by waiver (waiver was declined)",
      "EV battery damage — Comprehensive covers 'other than collision' perils, but battery degradation is excluded",
      "Home EV charger equipment — not covered under auto policy; would need home insurance",
      "At-fault accident waiver was declined — one at-fault claim will affect your rate at renewal",
      "Mohammad Osaid Aamir has 1 minor conviction and is listed Secondary — may impact rating if becomes Principal",
      "Scotiabank lienholder — in a total loss, payout goes jointly to you and the bank",
    ],
  },
];

export default function InquiryChat() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "bot",
      content:
        "Hello Hamza! I have full access to your Desjardins policy (Z6023FK0). You can ask me anything about your coverage — deductibles, what's included, how a claim works, or anything else. I'll answer strictly based on your policy.",
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [activeVehicle, setActiveVehicle] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    mutationFn: async (question: string) => {
      const res = await apiRequest("POST", "/api/inquiry/chat", {
        question,
        policyText: POLICY_CONTEXT,
      });
      return res.json() as Promise<{ answer: string }>;
    },
    onSuccess: (data) => {
      setIsBotTyping(false);
      addBotMessage(data.answer);
    },
    onError: () => {
      setIsBotTyping(false);
      addBotMessage(
        "I'm having trouble connecting right now. Please try again or contact your agent at 587-353-7500."
      );
    },
  });

  const escalateMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/inquiry/escalate", { message });
      return res.json();
    },
  });

  const handleSend = () => {
    if (!inputValue.trim() || isBotTyping || askMutation.isPending) return;

    const userContent = inputValue;
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: userContent },
    ]);
    setInputValue("");

    const lowerText = userContent.toLowerCase();
    if (/lawyer|legal|complaint|sue|suing|lawsuit/.test(lowerText)) {
      escalateMutation.mutate(userContent);
      setIsBotTyping(true);
      setTimeout(() => {
        setIsBotTyping(false);
        addBotMessage(
          "I understand your concern, Hamza. Given the nature of this, I've flagged this session for priority review by a senior adjuster who will reach out shortly. You can also contact your agent Anita Ip directly at 587-353-7500."
        );
      }, 1000);
      return;
    }

    setIsBotTyping(true);
    askMutation.mutate(userContent);
  };

  const handleRequestHuman = () => {
    toast({
      title: "Agent Notified",
      description: "Anita Ip's office has been notified and will contact you shortly at your registered number.",
    });
  };

  const isDisabled = isBotTyping || askMutation.isPending;
  const veh = vehicles[activeVehicle];

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border bg-card shadow-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground leading-tight">Hello, Hamza Aamir</h1>
              <p className="text-xs text-muted-foreground">Policy Z6023FK0 · Desjardins · Active until Nov 28, 2026</p>
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

      {/* Policy Viewer — collapsible */}
      <div className="flex-shrink-0 border-b border-border bg-card">
        <button
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors text-left"
          onClick={() => setPolicyOpen((o) => !o)}
          data-testid="button-view-policy"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">View Your Policy</span>
            <Badge variant="outline" className="text-[10px] h-5">2 Vehicles</Badge>
            <Badge variant="secondary" className="text-[10px] h-5 bg-primary/10 text-primary border-0">$7,717/yr</Badge>
          </div>
          {policyOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {policyOpen && (
          <div className="px-5 pb-5 space-y-4">
            {/* Policy Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <p className="text-muted-foreground font-medium uppercase tracking-wider mb-1">Policy #</p>
                <p className="font-bold text-foreground">Z6023FK0</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <p className="text-muted-foreground font-medium uppercase tracking-wider mb-1">Period</p>
                <p className="font-bold text-foreground">Nov 28/25 – Nov 28/26</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <p className="text-muted-foreground font-medium uppercase tracking-wider mb-1">Monthly</p>
                <p className="font-bold text-foreground">$643.09</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <p className="text-muted-foreground font-medium uppercase tracking-wider mb-1">Agent</p>
                <p className="font-bold text-foreground">Anita Ip · 587-353-7500</p>
              </div>
            </div>

            {/* Vehicle Tabs */}
            <div className="flex gap-2">
              {vehicles.map((v, i) => (
                <button
                  key={v.id}
                  onClick={() => setActiveVehicle(i)}
                  data-testid={`tab-vehicle-${v.id}`}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    activeVehicle === i
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:bg-muted/50"
                  }`}
                >
                  <Car className="h-4 w-4" />
                  {v.make}
                </button>
              ))}
            </div>

            {/* Vehicle Detail */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{veh.year} {veh.make} {veh.model}</h3>
                  <p className="text-xs text-muted-foreground">VIN: {veh.vin} · Annual Premium: {veh.premium}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Covered */}
                <div className="rounded-lg border border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <h4 className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">What's Included</h4>
                  </div>
                  <ul className="space-y-1.5">
                    {veh.covered.map((item, i) => (
                      <li key={i} className="flex gap-1.5 text-xs text-foreground">
                        <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Not Covered */}
                <div className="rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <h4 className="text-xs font-bold text-destructive uppercase tracking-wider">What's Not Included</h4>
                  </div>
                  <ul className="space-y-1.5">
                    {veh.notCovered.map((item, i) => (
                      <li key={i} className="flex gap-1.5 text-xs text-foreground">
                        <span className="text-destructive mt-0.5 flex-shrink-0">✗</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Grey Flags */}
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Grey Flags</h4>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-2 italic">Coverage is unclear or not explicitly stated</p>
                  <ul className="space-y-1.5">
                    {veh.greyFlags.map((item, i) => (
                      <li key={i} className="flex gap-1.5 text-xs text-foreground">
                        <span className="text-amber-500 mt-0.5 flex-shrink-0">⚠</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Area */}
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

      {/* Input */}
      <div className="p-4 border-t border-border bg-card flex-shrink-0">
        <div className="max-w-3xl mx-auto flex gap-3">
          <Input
            data-testid="input-inquiry-message"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isDisabled && handleSend()}
            placeholder="Ask anything about your policy — deductibles, what's covered, claims..."
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
        <p className="text-center text-xs text-muted-foreground mt-3">
          Answers are based on your Desjardins policy Z6023FK0. For binding advice, contact your agent.
        </p>
      </div>
    </div>
  );
}
