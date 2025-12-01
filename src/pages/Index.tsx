import { Shield, BarChart3, Mail, CalendarDays, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import smartphoneMockup from "@/assets/smartphone-ui-mockup.jpg";
import laptopMockup from "@/assets/laptop-ui-mockup.jpg";

const features = [
  {
    icon: Shield,
    title: "Secure Vault",
    description: "Military-grade encryption protects your passwords, cards, and sensitive documents with biometric authentication.",
  },
  {
    icon: BarChart3,
    title: "Finance Tracker",
    description: "Visualize spending patterns with interactive charts. Categorize transactions and set budgets effortlessly.",
  },
  {
    icon: Mail,
    title: "Unified Email",
    description: "All your inboxes in one place. Smart filters, quick replies, and zero-inbox workflows built in.",
  },
  {
    icon: CalendarDays,
    title: "Smart Schedule",
    description: "Time-blocking calendar with drag-and-drop events. AI suggestions keep your day optimized.",
  },
];

const stats = [
  { value: "2M+", label: "Active Users" },
  { value: "850M", label: "Credentials Secured" },
  { value: "99.99%", label: "Uptime" },
  { value: "Zero", label: "Data Breaches" },
];

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 glass">
        <div className="container mx-auto flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tight">SafeLife</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#desktop" className="hover:text-foreground transition-colors">Desktop</a>
            <a href="#stats" className="hover:text-foreground transition-colors">Security</a>
          </div>
          <Button size="sm" className="rounded-full">
            Get Started <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="gradient-hero pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-muted-foreground mb-6">
                <Lock className="h-3 w-3 text-primary" />
                End-to-end encrypted
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.08] tracking-tight mb-6">
                Keep Your <br />
                <span className="gradient-text">Life Safe</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-md">
                One app to secure passwords, track finances, manage emails, and organize your schedule — beautifully.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="rounded-full text-base px-8 glow-orange">
                  Start Free Trial
                </Button>
                <Button size="lg" variant="outline" className="rounded-full text-base px-8">
                  Watch Demo
                </Button>
              </div>
              <div className="flex items-center gap-6 mt-10 text-sm text-muted-foreground">
                {["No credit card", "14-day trial", "Cancel anytime"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute -inset-8 bg-primary/20 rounded-full blur-3xl" />
                <img
                  src={smartphoneMockup}
                  alt="SafeLife mobile app showing secure vault interface"
                  className="relative w-[320px] md:w-[380px] rounded-3xl shadow-2xl"
                  width={380}
                  height={760}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 md:py-32">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Everything you need, <span className="gradient-text">one ecosystem</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Four powerful tools working in harmony. Secure, private, and designed to simplify your digital life.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="glass rounded-2xl p-6 hover:border-primary/40 transition-colors group"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Desktop Showcase */}
      <section id="desktop" className="py-24 md:py-32 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Seamless on <span className="gradient-text">every screen</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              The full desktop experience — powerful data visualization, multi-pane layouts, and drag-and-drop workflows.
            </p>
          </div>
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute -inset-12 bg-primary/10 rounded-full blur-3xl" />
            <img
              src={laptopMockup}
              alt="SafeLife desktop app on MacBook Pro with email and finance analytics"
              className="relative w-full rounded-xl shadow-2xl"
              width={1920}
              height={1080}
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-24 md:py-32">
        <div className="container mx-auto px-6">
          <div className="glass rounded-3xl p-10 md:p-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-3xl md:text-5xl font-extrabold gradient-text mb-2">{s.value}</div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">
            Ready to secure your <span className="gradient-text">digital life</span>?
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-10">
            Join over 2 million users who trust SafeLife to protect what matters most.
          </p>
          <Button size="lg" className="rounded-full text-base px-10 glow-orange">
            Get Started — It's Free <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">SafeLife</span>
          </div>
          <p>© 2026 SafeLife Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
