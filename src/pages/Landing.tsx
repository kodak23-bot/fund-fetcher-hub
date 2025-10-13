import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, DollarSign, Lock, TrendingUp, AlertCircle } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-background" />
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Shield className="h-4 w-4" />
              Professional Recovery Services
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl">
              Recovery Authority
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Professional cryptocurrency fund tracing and recovery services. Track your lost funds and 
              initiate secure withdrawals to your wallet.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="xl" variant="hero">
                <Link to="/auth">Get Started</Link>
              </Button>
              <Button asChild size="xl" variant="outline">
                <Link to="/auth">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-card py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">How It Works</h2>
            <p className="text-muted-foreground">
              Track your recovered funds and withdraw securely
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl bg-gradient-to-br from-card to-muted/20 p-8 shadow-md transition-shadow hover:shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-card-foreground">Track Your Funds</h3>
              <p className="text-muted-foreground">
                Monitor the total amount traced and funds freed for withdrawal in real-time
              </p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-card to-muted/20 p-8 shadow-md transition-shadow hover:shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                <DollarSign className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-card-foreground">Request Withdrawal</h3>
              <p className="text-muted-foreground">
                Submit withdrawal requests with your wallet address and preferred network
              </p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-card to-muted/20 p-8 shadow-md transition-shadow hover:shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-card-foreground">Secure Processing</h3>
              <p className="text-muted-foreground">
                All withdrawals are verified and processed securely to your designated wallet
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer Section */}
      <section className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl rounded-xl bg-card p-8 shadow-lg">
            <div className="mb-4 flex items-start gap-4">
              <AlertCircle className="mt-1 h-6 w-6 flex-shrink-0 text-destructive" />
              <div>
                <h3 className="mb-2 text-lg font-semibold text-card-foreground">Legal Disclaimer</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Recovery Authority is a private recovery service and is NOT affiliated with, endorsed by, 
                  or connected to any government agency, law enforcement organization, or regulatory body.
                </p>
                <p className="mb-4 text-sm text-muted-foreground">
                  We are an independent entity providing cryptocurrency fund tracing and recovery assistance. 
                  Our services do not constitute legal advice, and we recommend consulting with appropriate 
                  legal counsel for your specific situation.
                </p>
                <p className="text-sm text-muted-foreground">
                  By using our services, you acknowledge that fund recovery success cannot be guaranteed 
                  and that processing times may vary based on multiple factors including blockchain network 
                  conditions and case complexity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Recovery Authority. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
