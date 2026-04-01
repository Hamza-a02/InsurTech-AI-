import { Link } from "wouter";
import { ShieldAlert, MessageSquare, ShieldCheck, ArrowRight, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border flex items-center justify-between bg-card sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-primary tracking-tight">InsurTech Assistant</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/faq">
            <Button variant="ghost" size="sm" className="font-medium" data-testid="link-faq">
              FAQ
            </Button>
          </Link>
          <Link href="/claim-history">
            <Button variant="ghost" size="sm" className="font-medium gap-1.5" data-testid="link-claim-history">
              <ClipboardList className="h-4 w-4" />
              Claim History
            </Button>
          </Link>
          <Link href="/admin">
            <Button variant="outline" size="sm" className="font-medium">
              Adjuster Login
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12 flex flex-col items-center justify-center gap-12">
        <div className="text-center space-y-4 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            How can we help you today?
          </h1>
          <p className="text-lg text-muted-foreground">
            Get instant support for filing a claim or understanding your policy details using our AI-powered assistants.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* File a Claim Card */}
          <Link href="/claim">
            <Card className="h-full cursor-pointer hover:shadow-lg transition-all duration-300 border-border hover:border-primary/50 group bg-card">
              <CardContent className="p-8 flex flex-col h-full gap-6">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <ShieldAlert className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">I need to file a claim</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Start a new claim process immediately. Our assistant will guide you through collecting all necessary information.
                  </p>
                </div>
                <div className="mt-auto pt-4 flex items-center text-primary font-medium">
                  Start Claim Process
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Policy Question Card */}
          <Link href="/inquiry">
            <Card className="h-full cursor-pointer hover:shadow-lg transition-all duration-300 border-border hover:border-accent/50 group bg-card">
              <CardContent className="p-8 flex flex-col h-full gap-6">
                <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <MessageSquare className="h-7 w-7 text-accent" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">I have a policy question</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Upload your insurance policy PDF and ask any question you want. Our AI will analyze your specific document to provide answers.
                  </p>
                </div>
                <div className="mt-auto pt-4 flex items-center text-accent font-medium">
                  Upload Policy & Ask
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border mt-auto bg-card">
        <p>© 2026 InsurTech Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}