import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

const sections = [
  {
    emoji: "🚗",
    title: "Your Coverage & Deductibles",
    items: [
      {
        q: "What deductible will I pay if I'm in a collision?",
        a: (
          <>
            <p className="mb-2"><strong className="text-foreground">Both vehicles have a $1,000 Collision deductible.</strong> This applies to Section C — Collision or Upset coverage. You pay the first $1,000 of the repair bill; Desjardins covers the rest.</p>
            <p className="text-sm bg-muted/50 p-2 rounded-md mb-2">Note: The 2023 Ford Mustang Mach-E has a <strong>higher deductible notice</strong> on file due to its make and model. Confirm the exact amount directly with Anita Ip at 587-353-7500.</p>
            <p className="text-sm bg-muted/50 p-2 rounded-md">Your Comprehensive deductible is also <strong>$1,000</strong> on both vehicles. This applies to non-collision events like hail, fire, theft, or a falling object.</p>
          </>
        ),
      },
      {
        q: "What is DCPD and how does it protect me?",
        a: (
          <>
            <p className="mb-2"><strong className="text-foreground">Both your vehicles carry Direct Compensation for Property Damage (DCPD) with a $0 deductible.</strong> Under Alberta's DCPD system (in place since January 2022), if another driver is at fault, you still deal directly with Desjardins — not their insurer — for your vehicle damage and contents.</p>
            <p className="text-sm bg-muted/50 p-2 rounded-md">Because your deductible is $0 for DCPD, a not-at-fault claim costs you nothing out of pocket, and it will not affect your premium or driving record.</p>
          </>
        ),
      },
      {
        q: "What does my Loss of Use (SEF 20) and Emergency Service (SEF 35) cover?",
        a: (
          <>
            <p className="mb-2"><strong className="text-foreground">Both vehicles include SEF 20 — Loss of Use</strong> up to <strong>$1,500</strong>. If your car is being repaired after a covered claim, Desjardins will reimburse reasonable rental or transportation costs up to that limit.</p>
            <p className="text-sm bg-muted/50 p-2 rounded-md"><strong className="text-foreground">SEF 35 — Emergency Service Expense</strong> is also included on both. This covers emergency towing or roadside assistance costs if the underlying event is a covered claim (e.g., after a collision).</p>
          </>
        ),
      },
      {
        q: "What does Family Protection (SEF 44) mean for me?",
        a: (
          <p>Your policy includes <strong className="text-foreground">SEF 44 — Family Protection</strong> at a <strong>$1,000,000 limit</strong>, applied across both vehicles. If you or a family member are injured by an at-fault driver who is uninsured or underinsured, this endorsement tops up your recovery to the policy limit. It fills the gap when the other driver can't pay.</p>
        ),
      },
    ],
  },
  {
    emoji: "💎",
    title: "Glass Exclusion — SEF 13D",
    items: [
      {
        q: "Glass is excluded from both my vehicles — what exactly does that mean?",
        a: (
          <>
            <p className="mb-2"><strong className="text-foreground">AB-S.E.F. 13(D) — Limitation of Glass Coverage Endorsement is active on both the 2023 Ford Escape PHEV and the 2023 Ford Mustang Mach-E.</strong> This means any damage to glass — windshield chips, cracks, full breaks, side windows, and rear glass — is <strong>not covered</strong> under either vehicle.</p>
            <p className="text-sm bg-muted/50 p-2 rounded-md">In exchange for this exclusion, you receive a small premium discount (-$8 on the Escape, -$15 on the Mustang). All glass repair and replacement costs come out of your own pocket.</p>
          </>
        ),
      },
      {
        q: "Can I get a windshield rock chip filled/repaired under my policy?",
        a: (
          <p><strong className="text-foreground">No.</strong> Because SEF 13D is active on both vehicles, even a small rock chip or crack fill is not covered. This applies to all glass, including the windshield, whether it is a repair or a full replacement. You would pay out of pocket. Many auto glass shops offer affordable chip repair programs independent of insurance.</p>
        ),
      },
      {
        q: "Why was glass excluded — can I add it back?",
        a: (
          <>
            <p className="mb-2">Glass was excluded when the policy was set up, likely to reduce your annual premium. You can request to remove SEF 13D and restore glass coverage at any time by contacting your agent.</p>
            <p className="text-sm bg-muted/50 p-2 rounded-md"><strong className="text-foreground">Contact:</strong> Anita Ip Insurance and Financial Services Ltd., 220-1220 Kensington Rd NW, Calgary AB T2N 3P5 · Tel: 587-353-7500</p>
          </>
        ),
      },
    ],
  },
  {
    emoji: "🧑‍💼",
    title: "Hamza as an Occasional Driver",
    items: [
      {
        q: "Hamza is listed as 'Occasional' — what does that mean for a claim?",
        a: (
          <>
            <p className="mb-2"><strong className="text-foreground">Hamza Aamir (DOB 2002-10-02) is designated as an Occasional driver on both the Ford Escape PHEV and the Ford Mustang Mach-E.</strong> The policy is still valid and fully in force when Hamza drives either vehicle.</p>
            <p className="text-sm bg-muted/50 p-2 rounded-md">However, if Hamza is at fault in a collision, the claim will be processed under his driving record. Because he is a newer driver with a Driver Training Certificate (DTC) on file, an at-fault claim could have a more significant impact on the next renewal than it would for a more experienced driver on the policy.</p>
          </>
        ),
      },
      {
        q: "The Mustang has no At-Fault Accident Waiver — what happens if Hamza has an at-fault collision in it?",
        a: (
          <>
            <p className="mb-2"><strong className="text-foreground">The At-Fault Accident Waiver (AB-S.E.F. 39A) was declined for the 2023 Ford Mustang Mach-E.</strong> This means there is no protection against premium increases after a first at-fault accident on that vehicle. If Hamza — or any other driver — is at fault in a collision involving the Mustang, your rate at renewal may increase.</p>
            <p className="text-sm bg-muted/50 p-2 rounded-md">The Ford Escape PHEV also does not list SEF 39A, so the same applies to that vehicle. You can contact Anita Ip to add the waiver endorsement if you would like protection.</p>
          </>
        ),
      },
      {
        q: "Mohammad Osaid Aamir is listed as Secondary — does his minor conviction affect my policy?",
        a: (
          <p>Mohammad Osaid Aamir (DOB 2000-07-02) is listed as a Secondary driver on both vehicles and has <strong className="text-foreground">1 minor conviction in the past 3 years</strong>. As a Secondary driver, this has limited direct impact on your current term. However, if he is involved in an at-fault claim or accumulates another conviction, it could affect the rating at renewal. The <strong className="text-foreground">Insurance Act (Alberta), RSA 2000, c I-3</strong> requires accurate disclosure of all drivers; failing to update the policy when a driver's status changes can affect a claim's validity.</p>
        ),
      },
    ],
  },
  {
    emoji: "🔋",
    title: "EV & PHEV Specifics",
    items: [
      {
        q: "Is the Mustang Mach-E's EV battery covered under Comprehensive?",
        a: (
          <>
            <p className="mb-2"><strong className="text-foreground">Comprehensive coverage (Section C, Subsection 3) covers the vehicle against loss or damage caused other than by Collision or Upset</strong> — including fire, theft, hail, and flooding. If the battery is damaged in such an event, it would be covered under Comprehensive, subject to the $1,000 deductible.</p>
            <p className="text-sm bg-muted/50 p-2 rounded-md"><strong className="text-foreground">Not covered:</strong> Gradual battery degradation over time is considered wear and tear, not an insured peril. A defective battery not caused by an insured event would also not be covered — that falls under the manufacturer's warranty.</p>
          </>
        ),
      },
      {
        q: "My home EV charger was damaged — is it covered under my auto policy?",
        a: (
          <p><strong className="text-foreground">No.</strong> Your Desjardins auto policy (Z6023FK0) covers the vehicles themselves and their attached equipment. A home EV charging station is considered part of your home and is not covered under this auto policy. You would need to look at your home insurance policy or a separate equipment coverage endorsement for protection on the charger.</p>
        ),
      },
      {
        q: "Does the Ford Escape PHEV's hybrid system get any special coverage?",
        a: (
          <>
            <p className="mb-2">The Ford Escape PHEV receives a <strong className="text-foreground">10% Hybrid Vehicle discount</strong> applied to its premium, reflecting the lower statistical risk profile of hybrid drivers. The hybrid drivetrain is covered under Comprehensive and Collision just like any other component of the vehicle.</p>
            <p className="text-sm bg-muted/50 p-2 rounded-md">The <strong className="text-foreground">5-Year New Vehicle Protection (CAE #1)</strong> endorsement on the Escape also applies, which can protect the vehicle's value if it is written off within five years of its purchase date (December 2023).</p>
          </>
        ),
      },
    ],
  },
  {
    emoji: "🛡️",
    title: "5-Year New Vehicle Protection",
    items: [
      {
        q: "What is the CAE #1 New Vehicle Protection endorsement and do both cars have it?",
        a: (
          <>
            <p className="mb-2"><strong className="text-foreground">Yes — both the Ford Escape PHEV and the Ford Mustang Mach-E carry the CAE #1 Conditionally Approved Endorsement (5-Year New Vehicle Protection).</strong></p>
            <p className="mb-2">This endorsement protects you from depreciation-based loss settlements if the vehicle is written off. Instead of receiving the depreciated market value of a used vehicle, you may be entitled to a settlement closer to the original purchase price or a new replacement — subject to conditions in the endorsement wording.</p>
            <p className="text-sm bg-muted/50 p-2 rounded-md">The protection is calculated from the date of purchase: Escape (December 2023), Mustang (June 2023). The endorsement does not end before your policy expiry date of November 28, 2026.</p>
          </>
        ),
      },
    ],
  },
  {
    emoji: "📈",
    title: "Rate Changes & Good Driver Cap",
    items: [
      {
        q: "Why is the Escape not protected by the Good Driver rate cap?",
        a: (
          <>
            <p className="mb-2"><strong className="text-foreground">The 2023 Ford Escape PHEV falls under an exemption to the Good Driver rate cap.</strong> Your policy notice states: "Your policy falls under an exemption to the rate cap." This means the 7.5% cap that limits increases for qualifying drivers does not apply to the Escape — your increase on this vehicle could exceed 7.5%.</p>
            <p className="text-sm bg-muted/50 p-2 rounded-md">Common exemptions include address changes, adding or removing drivers, coverage changes, and discount changes. The <strong className="text-foreground">Automobile Insurance Rate Board (AIRB)</strong> governs which exemptions are permitted in Alberta. Visit airbfordrivers.ca for the full exemption list.</p>
          </>
        ),
      },
      {
        q: "Why does the Mustang qualify for the Good Driver cap but not the Escape?",
        a: (
          <p>Your policy notice confirms that for the <strong className="text-foreground">2023 Ford Mustang Mach-E, you meet the definition of a good driver</strong> and your premium increase is capped at 7.5% (5% base cap + 2.5% disaster rider for the 2025 term, covering events like the Jasper wildfire and Calgary hailstorm). The Escape is rated differently because of its driver history or a policy-level exemption that applies specifically to that vehicle.</p>
        ),
      },
      {
        q: "What is the 2.5% disaster rider on my policy?",
        a: (
          <>
            <p className="mb-2">For 2025, the Government of Alberta approved a 7.5% good driver rate cap, composed of a <strong className="text-foreground">5% base cap plus a 2.5% rider</strong> related to natural disaster losses — specifically the Jasper wildfire and the Calgary hailstorm of 2024.</p>
            <p className="text-sm bg-muted/50 p-2 rounded-md">This extra 2.5% is a province-wide adjustment applied to all qualifying renewals effective April 12, 2025. It is not specific to your household; it reflects Alberta-wide catastrophe losses that insurers are permitted to recover.</p>
          </>
        ),
      },
    ],
  },
  {
    emoji: "📋",
    title: "Claims, Cancellation & Lienholders",
    items: [
      {
        q: "How do I start a claim on either vehicle?",
        a: (
          <>
            <p className="mb-2"><strong className="text-foreground">Claims line (24/7):</strong> 1-855-209-9549</p>
            <p className="mb-2">You can also file online at <strong className="text-foreground">desjardins.com/agents</strong> or through the Desjardins Insurance Home-Auto mobile app. Your agent can also assist: Anita Ip at 587-353-7500.</p>
            <p className="text-sm bg-muted/50 p-2 rounded-md">At the scene: move your car to safety, call 911 if anyone is injured or if public property was damaged, photograph the damage and gather the other driver's insurance details and witness contact information.</p>
          </>
        ),
      },
      {
        q: "If one of my cars is written off, who gets the payout — me or the bank?",
        a: (
          <>
            <p className="mb-2">Both vehicles have lienholders on file. In the event of a total loss, the settlement is <strong className="text-foreground">payable jointly</strong> to you and the lienholder under the <strong>AB-S.E.F. No. 23(A) Lienholder Endorsement</strong>.</p>
            <ul className="list-disc ml-4 text-sm space-y-1 mb-2">
              <li><strong>Ford Escape PHEV:</strong> Ford Credit of Canada, 17187 114th Ave, Edmonton AB T5S 2N5</li>
              <li><strong>Ford Mustang Mach-E:</strong> The Bank of Nova Scotia (Scotiabank), Scotia Plaza, 44 King Street West, Toronto ON M5H 1H1</li>
            </ul>
            <p className="text-sm bg-muted/50 p-2 rounded-md">If you cancel the policy, Desjardins must give the lienholder 15 days written notice before the cancellation takes effect.</p>
          </>
        ),
      },
      {
        q: "What happens if I cancel my policy before November 28, 2026?",
        a: (
          <p>If you cancel before the policy expiry date, Desjardins will calculate the refund using the <strong className="text-foreground">short-term rate</strong> as stated in your insurance contract. This means you will receive less back than a pro-rated daily amount — the insurer charges more per day for a short-term policy than an annual one. A cancellation fee may also apply. To cancel, sign the Cancellation Request form on page 5 of your Certificate and return it to Anita Ip's office.</p>
        ),
      },
    ],
  },
];

export default function FAQ() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center gap-3 p-4 border-b border-border bg-card sticky top-0 z-10 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-primary" />
          <h1 className="font-semibold text-lg">Policy FAQs</h1>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-6 md:p-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-3xl font-bold tracking-tight">Your Policy Questions, Answered</h2>
          </div>
          <p className="text-muted-foreground mb-3">
            All questions below are based directly on your Desjardins policy.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">Policy Z6023FK0</Badge>
            <Badge variant="outline">2023 Ford Escape PHEV</Badge>
            <Badge variant="outline">2023 Ford Mustang Mach-E</Badge>
            <Badge variant="outline">Active until Nov 28, 2026</Badge>
          </div>
        </div>

        <div className="space-y-8">
          {sections.map((section, si) => (
            <section key={si}>
              <h3 className="text-xl font-semibold mb-4 text-primary flex items-center gap-2">
                {section.emoji} {section.title}
              </h3>
              <Accordion
                type="single"
                collapsible
                className="w-full bg-card rounded-lg border border-border px-4 shadow-sm"
              >
                {section.items.map((item, ii) => (
                  <AccordionItem key={ii} value={`s${si}-i${ii}`}>
                    <AccordionTrigger className="text-left font-medium">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>

        <div className="mt-10 p-5 rounded-xl border border-border bg-card text-sm text-muted-foreground">
          <p className="font-semibold text-foreground mb-2">Still have questions?</p>
          <p>Contact your Desjardins agent directly:</p>
          <p className="mt-1"><strong className="text-foreground">Anita Ip Insurance and Financial Services Ltd.</strong></p>
          <p>220-1220 Kensington Rd NW, Calgary AB T2N 3P5</p>
          <p>Tel: <a href="tel:5873537500" className="text-primary underline">587-353-7500</a> · Fax: 587-353-7501</p>
          <p className="mt-2">Claims (24/7): <a href="tel:18552099549" className="text-primary underline">1-855-209-9549</a></p>
        </div>
      </main>
    </div>
  );
}
