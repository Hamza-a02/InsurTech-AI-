import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function FAQ() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center gap-3 p-4 border-b border-border bg-card sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-primary" />
          <h1 className="font-semibold text-lg">Frequently Asked Questions</h1>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-6 md:p-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-3 tracking-tight">Alberta Insurance FAQs</h2>
          <p className="text-muted-foreground">
            Find answers to common questions about claims, weather damage, and coverage specifics in Alberta.
          </p>
        </div>

        <div className="space-y-8">
          {/* Mandatory & Claims Process */}
          <section>
            <h3 className="text-xl font-semibold mb-4 text-primary flex items-center gap-2">
              🚗 Mandatory & Claims Process (The New System)
            </h3>
            <Accordion type="single" collapsible className="w-full bg-card rounded-lg border border-border px-4 shadow-sm">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left font-medium">
                  "I wasn't at fault, why is my own insurance company handling the claim?"
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  <p className="mb-2"><strong className="text-foreground">The Answer:</strong> Since January 2022, Alberta uses DCPD. It means you deal with your own insurer for repairs to your vehicle and its contents when someone else is at fault. It's faster and prevents you from having to "chase" the other person's insurance.</p>
                  <p className="text-sm bg-muted/50 p-2 rounded-md italic">Note: This only applies if the other driver is also insured in Alberta.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left font-medium">
                  "If I make a DCPD claim (Not-At-Fault), will my rates go up?"
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">The Answer:</strong> No. Not-at-fault claims processed under DCPD do not affect your premium or your driving record.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          {/* Weather & Natural Disasters */}
          <section>
            <h3 className="text-xl font-semibold mb-4 text-primary flex items-center gap-2">
              ⛈️ Weather & Natural Disasters (Hail & Snow)
            </h3>
            <Accordion type="single" collapsible className="w-full bg-card rounded-lg border border-border px-4 shadow-sm">
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left font-medium">
                  "Does my insurance cover hail damage?"
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  <p className="mb-2"><strong className="text-foreground">The Answer:</strong> Only if you have Comprehensive or All Perils coverage. Basic liability (the legal minimum) does not cover hail.</p>
                  <p className="text-sm bg-muted/50 p-2 rounded-md"><strong className="text-foreground">Impact:</strong> Hail is an "Act of God" and generally won't increase your premium. However, in 2025/2026, Alberta has implemented a 2.5% "disaster rate rider" on many policies to account for the massive increase in provincial storm costs.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left font-medium">
                  "I slid on ice and hit a tree. Is that covered?"
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  <p className="mb-2"><strong className="text-foreground">The Answer:</strong> This falls under Collision coverage.</p>
                  <p className="text-sm bg-muted/50 p-2 rounded-md"><strong className="text-foreground">The Catch:</strong> In Alberta, sliding on ice is almost always considered an At-Fault accident. Insurers expect you to drive for the conditions (slow down, winter tires). This will likely increase your premiums unless you have "Accident Forgiveness."</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger className="text-left font-medium">
                  "My engine froze/block heater failed. Can I claim this?"
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">The Answer:</strong> No. Frozen engines or mechanical failures due to extreme cold are considered maintenance issues, not an "accidental peril."
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          {/* Glass & Theft */}
          <section>
            <h3 className="text-xl font-semibold mb-4 text-primary flex items-center gap-2">
              💎 Glass & Theft
            </h3>
            <Accordion type="single" collapsible className="w-full bg-card rounded-lg border border-border px-4 shadow-sm">
              <AccordionItem value="item-6">
                <AccordionTrigger className="text-left font-medium">
                  "What does 'Limited Glass' (SEF 13D/13H) actually mean?"
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  <p className="mb-2"><strong className="text-foreground">The Answer:</strong> Because of Alberta's gravel roads, many drivers opt for this endorsement to lower their premium. It means your windshield is not covered for rock chips or cracks, but your side and back windows usually still are.</p>
                  <p className="text-sm bg-muted/50 p-2 rounded-md"><strong className="text-foreground">The Trade-off:</strong> If you have this, you pay for your own windshields out of pocket.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-7">
                <AccordionTrigger className="text-left font-medium">
                  "My car was stolen while I was 'warming it up' in the driveway. Am I covered?"
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">The Answer:</strong> Yes, if you have Comprehensive coverage. However, your insurer may flag this as "negligence" if the keys were in the ignition and the doors were unlocked, which could complicate future renewals.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
        </div>
      </main>
    </div>
  );
}