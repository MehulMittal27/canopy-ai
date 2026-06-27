import { useEffect, useRef, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Globe2,
  Search,
  Languages,
  FolderOpen,
  Mail,
  AlertTriangle,
  Sparkles,
  Network,
  FileText,
  Compass,
  HeartHandshake,
  Leaf,
  Stethoscope,
  GraduationCap,
  LifeBuoy,
  TreePine,
  Scale,
  Users,
  Check,
  Inbox,
  Newspaper,
  Bell,
  ShieldAlert,
} from "lucide-react";
import { CanopyLogo } from "@/components/canopy/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Canopy · The intelligent workspace for international NGOs" },
      {
        name: "description",
        content:
          "Canopy is an AI-powered workspace that helps small NGOs monitor local developments, discover funding, translate documents, and stay organized in one place.",
      },
      { property: "og:title", content: "Canopy · Workspace for international NGOs" },
      {
        property: "og:description",
        content:
          "Less searching. More impact. An AI-powered operating workspace built for small and medium-sized NGOs.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] text-foreground antialiased">
      <Nav />
      <main>
        <Hero />
        <DailyBriefing />
        <ProblemSection />
        <ProductOverview />
        <FeatureGrid />
        <DarkSection />
        <HowItWorks />
        <BuiltFor />
        <Mission />
        <Benefits />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

/* --------------------------- Reveal-on-scroll ---------------------------- */

function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: React.ElementType;
}) {
  const ref = useRef<HTMLElement | null>(null);

  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    // @ts-expect-error generic tag
    <Tag
      ref={ref}
      style={{
        transition: "opacity 700ms cubic-bezier(0.2, 0.7, 0.2, 1), transform 700ms cubic-bezier(0.2, 0.7, 0.2, 1)",
        transitionDelay: `${delay}ms`,
        opacity: shown ? 1 : 0,
        transform: shown ? "translate3d(0,0,0)" : "translate3d(0,16px,0)",
        willChange: "opacity, transform",
      }}
      className={className}
    >
      {children}
    </Tag>
  );
}

/* ---------------------------------- NAV ---------------------------------- */

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-[#E5E5E0]/80 bg-[#FAFAF8]/85 backdrop-blur-md shadow-[0_1px_0_rgba(15,23,42,0.03)]"
          : "border-b border-transparent bg-[#FAFAF8]/60 backdrop-blur"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <CanopyLogo size={22} />
          <span className="text-[15px] font-semibold tracking-[0.02em] text-foreground">
            CANOPY
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {["Product", "Features", "Mission", "Contact"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm text-[#4B5563] transition-colors hover:text-foreground"
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden rounded-lg px-3.5 py-2 text-sm font-medium text-foreground hover:bg-black/5 sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            to="/login"
            className="group inline-flex items-center gap-1.5 rounded-lg bg-[#0F766E] px-3.5 py-2 text-sm font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.05)] transition-all hover:bg-[#0c655e] hover:shadow-[0_6px_18px_-8px_rgba(15,118,110,0.55)]"
          >
            Get Started
            <ArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}

/* --------------------------------- HERO ---------------------------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Layered soft teal glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-[640px] bg-[radial-gradient(60%_55%_at_50%_30%,rgba(15,118,110,0.12),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-40 h-[420px] bg-[radial-gradient(45%_40%_at_50%_50%,rgba(15,118,110,0.06),transparent_70%)]"
      />

      <div className="mx-auto max-w-[1200px] px-6 pt-16 pb-12 lg:pt-24 lg:pb-20">
        <div className="mx-auto max-w-3xl text-center canopy-rise">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#E5E5E0] bg-white px-3 py-1 text-xs font-medium text-[#4B5563]">
            <Sparkles size={12} className="text-[#0F766E]" />
            Built for international NGO teams
          </span>
          <h1 className="mt-6 text-balance text-4xl font-semibold tracking-[-0.02em] text-foreground sm:text-5xl lg:text-[64px] lg:leading-[1.05]">
            Less searching.
            <br />
            <span className="text-[#0F766E]">More impact.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-[17px] leading-relaxed text-[#4B5563]">
            Canopy is an AI-powered workspace that helps small NGOs monitor local
            developments, discover funding, translate documents, and stay organized,
            all in one place.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/login"
              className="group inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0F766E] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-12px_rgba(15,118,110,0.55)] transition-all hover:-translate-y-0.5 hover:bg-[#0c655e] hover:shadow-[0_14px_32px_-12px_rgba(15,118,110,0.6)] sm:w-auto"
            >
              Get Started
              <ArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex w-full items-center justify-center rounded-xl border border-[#E5E5E0] bg-white px-5 py-3 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-[#0F766E]/40 hover:text-[#0F766E] hover:shadow-[0_8px_24px_-14px_rgba(15,23,42,0.2)] sm:w-auto"
            >
              View Demo
            </Link>
          </div>
        </div>

        {/* Mockup + floating insight cards */}
        <div className="relative mx-auto mt-16 max-w-[1100px]">
          {/* Soft glow behind */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-10 top-6 -bottom-6 rounded-[28px] bg-[radial-gradient(55%_60%_at_50%_30%,rgba(15,118,110,0.18),transparent_70%)] blur-2xl"
          />
          <div className="canopy-scale-in">
            <DashboardMockup highlight />
          </div>

          {/* Floating insight cards (desktop only) */}
          <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
            <FloatingCard
              className="left-[-28px] top-[14%] float-a"
              icon={<ShieldAlert size={13} />}
              tone="red"
              title="3 urgent updates"
              sub="Needs review today"
            />
            <FloatingCard
              className="right-[-32px] top-[8%] float-b"
              icon={<Search size={13} />}
              tone="teal"
              title="4 funding matches"
              sub="BMZ · EU · UN Women"
            />
            <FloatingCard
              className="left-[-36px] bottom-[18%] float-b"
              icon={<Languages size={13} />}
              tone="teal"
              title="French report translated"
              sub="Ready for review"
            />
            <FloatingCard
              className="right-[-24px] bottom-[10%] float-a"
              icon={<AlertTriangle size={13} />}
              tone="amber"
              title="Burundi risk alert"
              sub="Border area · low"
            />
            <FloatingCard
              className="left-[36%] -top-6 float-b"
              icon={<Mail size={13} />}
              tone="teal"
              title="Today's briefing ready"
              sub="07:00 · 22 items"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function FloatingCard({
  className = "",
  icon,
  title,
  sub,
  tone = "teal",
}: {
  className?: string;
  icon: ReactNode;
  title: string;
  sub: string;
  tone?: "teal" | "red" | "amber";
}) {
  const toneMap = {
    teal: { bg: "bg-[#0F766E]/10", fg: "text-[#0F766E]" },
    red: { bg: "bg-[#DC2626]/10", fg: "text-[#DC2626]" },
    amber: { bg: "bg-[#D97706]/10", fg: "text-[#D97706]" },
  } as const;
  const t = toneMap[tone];
  return (
    <div
      className={`pointer-events-auto absolute flex items-center gap-2.5 rounded-xl border border-[#E5E5E0] bg-white/95 px-3 py-2 shadow-[0_18px_40px_-22px_rgba(15,23,42,0.35)] backdrop-blur-sm ${className}`}
    >
      <span className={`grid h-7 w-7 place-items-center rounded-lg ${t.bg} ${t.fg}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[12px] font-semibold leading-tight text-foreground">{title}</div>
        <div className="text-[10.5px] text-[#6B7280]">{sub}</div>
      </div>
    </div>
  );
}

/* --------------------------- DASHBOARD MOCKUP ---------------------------- */

function DashboardMockup({
  compact = false,
  highlight = false,
}: {
  compact?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="relative">
      <div className="rounded-2xl border border-[#E5E5E0] bg-white p-3 shadow-[0_40px_80px_-40px_rgba(15,23,42,0.35)] ring-1 ring-black/[0.02]">
        {/* faux browser chrome */}
        <div className="flex items-center justify-between border-b border-[#E5E5E0] px-3 pb-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#E5E5E0]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#E5E5E0]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#E5E5E0]" />
          </div>
          <div className="flex items-center gap-2 rounded-md border border-[#E5E5E0] bg-[#FAFAF8] px-2 py-0.5 text-[11px] text-[#9CA3AF]">
            <CanopyLogo size={11} />
            <span>canopy.app / dashboard</span>
            <span className="ml-1 inline-flex h-1.5 w-1.5 rounded-full bg-[#059669]" />
          </div>
          <div className="h-2.5 w-12" />
        </div>

        {/* dashboard body */}
        <div className="bg-[#FAFAF8] p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[13px] font-semibold text-foreground">
                Good morning, Amara
              </div>
              <div className="text-[11px] text-[#6B7280]">
                3 updates need your attention today
              </div>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="rounded-md border border-[#E5E5E0] bg-white px-2 py-1 text-[11px] text-[#4B5563]">
                Burundi Kids
              </span>
              <span className="rounded-md bg-[#0F766E] px-2 py-1 text-[11px] font-medium text-white">
                Today
              </span>
            </div>
          </div>

          <div
            className={`grid gap-3 ${
              compact ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-3"
            }`}
          >
            <MockCard
              pulse={highlight}
              icon={<Globe2 size={14} />}
              title="News Monitor"
              meta="12 new"
              items={[
                { dot: "red", text: "Security alert · Bujumbura district" },
                { dot: "yellow", text: "New education policy announced" },
                { dot: "green", text: "Regional weather outlook stable" },
              ]}
            />
            <MockCard
              icon={<Search size={14} />}
              title="Funding"
              meta="4 matches"
              items={[
                { dot: "red", text: "BMZ grant · 4 days left" },
                { dot: "yellow", text: "EU CSO call · 3 weeks left" },
                { dot: "green", text: "Foundation fund · open" },
              ]}
            />
            <MockCard
              icon={<FolderOpen size={14} />}
              title="Reports & Documents"
              meta="9 files"
              items={[
                { dot: "green", text: "Q3 field report · uploaded" },
                { dot: "green", text: "Partner MoU · signed" },
                { dot: "yellow", text: "Budget review · pending" },
              ]}
            />
            <MockCard
              icon={<Languages size={14} />}
              title="Translator"
              meta="FR → EN"
              items={[
                { dot: "green", text: "Proposal draft · translated" },
                { dot: "green", text: "Local press release · ready" },
                { dot: "yellow", text: "Field interview · in progress" },
              ]}
            />
            <MockCard
              pulse={highlight}
              icon={<Mail size={14} />}
              title="Today's Email"
              meta="07:00"
              items={[
                { dot: "red", text: "3 urgent items" },
                { dot: "yellow", text: "7 relevant updates" },
                { dot: "green", text: "12 background notes" },
              ]}
            />
            <MockCard
              icon={<AlertTriangle size={14} />}
              title="Country Alerts"
              meta="Burundi · DRC"
              items={[
                { dot: "red", text: "Border incident · DRC side" },
                { dot: "yellow", text: "Fuel shortage reported" },
                { dot: "green", text: "Public health stable" },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MockCard({
  icon,
  title,
  meta,
  items,
  pulse = false,
}: {
  icon: ReactNode;
  title: string;
  meta: string;
  items: { dot: "red" | "yellow" | "green"; text: string }[];
  pulse?: boolean;
}) {
  const dotColor = {
    red: "#DC2626",
    yellow: "#D97706",
    green: "#059669",
  } as const;
  return (
    <div
      className={`rounded-xl border border-[#E5E5E0] bg-white p-3.5 transition-colors hover:border-[#0F766E]/30 ${
        pulse ? "pulse-ring" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-foreground">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-[#0F766E]/10 text-[#0F766E]">
            {icon}
          </span>
          {title}
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wide text-[#9CA3AF]">
          {meta}
        </span>
      </div>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-2 text-[11.5px] text-[#4B5563]">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: dotColor[it.dot] }}
            />
            <span className="truncate">{it.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------------- DAILY BRIEFING (was ValueStrip) ----------------- */

function DailyBriefing() {
  return (
    <section className="mx-auto max-w-[1200px] px-6">
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl border border-[#E5E5E0] bg-white shadow-[0_12px_40px_-24px_rgba(15,23,42,0.18)]">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(15,118,110,0.10),transparent)]"
          />
          <div className="grid gap-0 sm:grid-cols-[1fr_1.2fr]">
            {/* Header / message */}
            <div className="border-b border-[#E5E5E0] p-6 sm:border-b-0 sm:border-r sm:p-8">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-[#0F766E]/10 text-[#0F766E]">
                  <Mail size={14} />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0F766E]">
                  Today's Briefing
                </span>
                <span className="ml-auto text-[11px] text-[#9CA3AF]">07:00</span>
              </div>
              <h3 className="mt-4 text-balance text-[20px] font-semibold leading-snug text-foreground sm:text-[22px]">
                Every morning, Canopy tells your team what changed, why it matters, and what to do next.
              </h3>
              <div className="mt-5 flex flex-wrap gap-2">
                <BriefingPill tone="red" label="3 urgent updates" />
                <BriefingPill tone="teal" label="4 funding matches" />
                <BriefingPill tone="slate" label="1 document ready" />
              </div>
            </div>

            {/* AI summary */}
            <div className="p-6 sm:p-8">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">
                AI summary
              </div>
              <ul className="mt-4 space-y-3.5">
                <BriefingLine
                  label="What changed"
                  text="Security alert near a project area."
                />
                <BriefingLine
                  label="Why it matters"
                  text="Partner travel may be affected this week."
                />
                <BriefingLine
                  label="Next step"
                  text="Contact your field coordinator to confirm routes."
                />
              </ul>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function BriefingPill({
  tone,
  label,
}: {
  tone: "red" | "teal" | "slate";
  label: string;
}) {
  const map = {
    red: "bg-[#DC2626]/10 text-[#B91C1C] border-[#DC2626]/20",
    teal: "bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/20",
    slate: "bg-[#FAFAF8] text-[#4B5563] border-[#E5E5E0]",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium ${map[tone]}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{
          background:
            tone === "red" ? "#DC2626" : tone === "teal" ? "#0F766E" : "#9CA3AF",
        }}
      />
      {label}
    </span>
  );
}

function BriefingLine({ label, text }: { label: string; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0F766E]" />
      <div>
        <div className="text-[12px] font-semibold text-foreground">{label}</div>
        <div className="text-[13.5px] leading-relaxed text-[#4B5563]">{text}</div>
      </div>
    </li>
  );
}

/* ----------------------------- PROBLEM ----------------------------------- */

function ProblemSection() {
  const cards = [
    {
      icon: <Globe2 size={18} />,
      title: "Monitor local events",
      text: "Keeping up with country-specific developments across different sources is difficult and time-consuming.",
    },
    {
      icon: <Search size={18} />,
      title: "Find funding",
      text: "Searching dozens of grant websites wastes valuable time and makes it easy to miss deadlines.",
    },
    {
      icon: <Languages size={18} />,
      title: "Translate documents",
      text: "Reports, proposals, and local updates often arrive in different languages and formats.",
    },
    {
      icon: <FolderOpen size={18} />,
      title: "Coordinate information",
      text: "Important updates are scattered across emails, PDFs, websites, and partner conversations.",
    },
  ];
  return (
    <section id="product" className="mx-auto max-w-[1200px] px-6 py-24">
      <Reveal>
        <SectionHeader
          eyebrow="The problem"
          title="NGOs shouldn't spend hours searching for information."
          subtitle="Small teams are expected to monitor breaking news, political developments, funding opportunities, local reports, emails, and multilingual documents, while still running projects that change lives."
        />
      </Reveal>

      <Reveal delay={120}>
        <ScatteredToOrganized />
      </Reveal>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <Reveal key={c.title} delay={i * 90}>
            <div className="group h-full rounded-xl border border-[#E5E5E0] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#0F766E]/30 hover:shadow-[0_10px_28px_-14px_rgba(15,118,110,0.22)]">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#0F766E]/10 text-[#0F766E] transition-colors group-hover:bg-[#0F766E]/15">
                {c.icon}
              </span>
              <h3 className="mt-4 text-[15px] font-semibold text-foreground">{c.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-[#6B7280]">{c.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function ScatteredToOrganized() {
  const before = [
    { label: "News sites", icon: <Newspaper size={12} /> },
    { label: "Grant portals", icon: <Search size={12} /> },
    { label: "Emails", icon: <Mail size={12} /> },
    { label: "PDF reports", icon: <FileText size={12} /> },
    { label: "Local updates", icon: <Globe2 size={12} /> },
    { label: "Partner messages", icon: <Users size={12} /> },
  ];
  const after = [
    "One workspace",
    "Prioritized updates",
    "Suggested next actions",
  ];
  return (
    <div className="mt-14 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr]">
      {/* Before */}
      <div className="rounded-2xl border border-dashed border-[#E5E5E0] bg-white/60 p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">
          Before Canopy
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {before.map((b, i) => (
            <div
              key={b.label}
              className={`flex items-center gap-2 rounded-lg border border-[#E5E5E0] bg-white px-2.5 py-2 text-[12px] text-[#4B5563] shadow-[0_1px_0_rgba(15,23,42,0.02)] ${
                i % 2 === 0 ? "float-a" : "float-b"
              }`}
              style={{ animationDelay: `${i * 0.4}s` }}
            >
              <span className="grid h-5 w-5 place-items-center rounded bg-[#FAFAF8] text-[#6B7280]">
                {b.icon}
              </span>
              <span className="truncate">{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Connector */}
      <div className="flex items-center justify-center">
        <div className="relative hidden h-full w-24 items-center justify-center lg:flex">
          <svg viewBox="0 0 96 200" className="h-full w-full" aria-hidden>
            <defs>
              <linearGradient id="cflow" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#0F766E" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#0F766E" stopOpacity="0.45" />
              </linearGradient>
            </defs>
            {[40, 80, 120, 160].map((y) => (
              <path
                key={y}
                d={`M0 ${y} C 32 ${y}, 64 100, 96 100`}
                stroke="url(#cflow)"
                strokeWidth="1.2"
                fill="none"
              />
            ))}
          </svg>
          <ArrowRight
            className="absolute right-0 top-1/2 -translate-y-1/2 text-[#0F766E]"
            size={18}
          />
        </div>
        <div className="flex w-full items-center gap-2 lg:hidden">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#0F766E]/40" />
          <ArrowRight size={16} className="text-[#0F766E]" />
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#0F766E]/40" />
        </div>
      </div>

      {/* After */}
      <div className="relative overflow-hidden rounded-2xl border border-[#E5E5E0] bg-white p-5 shadow-[0_18px_50px_-28px_rgba(15,118,110,0.35)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_70%_20%,rgba(15,118,110,0.10),transparent_70%)]"
        />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CanopyLogo size={14} />
              <span className="text-[12px] font-semibold text-foreground">
                Canopy workspace
              </span>
            </div>
            <span className="rounded-md bg-[#0F766E] px-2 py-0.5 text-[10px] font-medium text-white">
              Live
            </span>
          </div>
          <ul className="mt-4 space-y-2.5">
            {after.map((a, i) => (
              <li
                key={a}
                className="flex items-center gap-2.5 rounded-lg border border-[#E5E5E0] bg-[#FAFAF8] px-3 py-2.5"
                style={{ animationDelay: `${i * 0.2}s` }}
              >
                <span className="grid h-6 w-6 place-items-center rounded-md bg-[#0F766E]/10 text-[#0F766E]">
                  <Check size={13} strokeWidth={2.5} />
                </span>
                <span className="text-[13px] font-medium text-foreground">{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- PRODUCT ----------------------------------- */

function ProductOverview() {
  const chips = [
    "News",
    "Funding",
    "Translator",
    "Documents",
    "Emails",
    "Country Alerts",
    "NGO Network",
  ];
  return (
    <section className="border-y border-[#E5E5E0] bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-24">
        <Reveal>
          <SectionHeader
            eyebrow="One workspace"
            title="One intelligent workspace for international NGOs."
            subtitle="Canopy brings together the tools NGOs already use into one customizable dashboard powered by AI."
          />
        </Reveal>
        <Reveal delay={120}>
          <div className="relative mx-auto mt-14 max-w-[1100px]">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-12 top-4 -bottom-4 rounded-[28px] bg-[radial-gradient(50%_60%_at_50%_30%,rgba(15,118,110,0.14),transparent_70%)] blur-2xl"
            />
            <DashboardMockup highlight />
          </div>
        </Reveal>
        <Reveal delay={220}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {chips.map((c) => (
              <span
                key={c}
                className="rounded-full border border-[#E5E5E0] bg-[#FAFAF8] px-3.5 py-1.5 text-[12.5px] font-medium text-[#4B5563]"
              >
                {c}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ----------------------------- FEATURES ---------------------------------- */

function FeatureGrid() {
  const features: {
    icon: ReactNode;
    title: string;
    text: string;
    preview: ReactNode;
  }[] = [
    {
      icon: <Globe2 size={18} />,
      title: "AI News Monitor",
      text: "Track local, political, humanitarian, environmental, and security developments that could affect your projects.",
      preview: (
        <PreviewBox>
          <PreviewRow dot="red" text="Security alert · Bujumbura" />
          <PreviewRow dot="yellow" text="New education policy announced" />
          <PreviewRow dot="green" text="Weather outlook stable" />
        </PreviewBox>
      ),
    },
    {
      icon: <Search size={18} />,
      title: "Funding Discovery",
      text: "Find grants, open calls, and funding opportunities matched to your mission, countries, and deadlines.",
      preview: (
        <PreviewBox>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11.5px] font-semibold text-foreground">BMZ grant</div>
              <div className="truncate text-[10.5px] text-[#6B7280]">Girls' Education · Sub-Saharan Africa</div>
            </div>
            <span className="shrink-0 rounded-full bg-[#0F766E]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#0F766E]">
              92% match
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[10.5px]">
            <span className="rounded bg-[#DC2626]/10 px-1.5 py-0.5 font-medium text-[#B91C1C]">
              4 days left
            </span>
            <span className="text-[#9CA3AF]">€80k – €250k</span>
          </div>
        </PreviewBox>
      ),
    },
    {
      icon: <Languages size={18} />,
      title: "Smart Translation",
      text: "Translate reports, proposals, and local-language documents while preserving context and meaning.",
      preview: (
        <PreviewBox>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-[#E5E5E0] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#4B5563]">
              FR
            </span>
            <ArrowRight size={11} className="text-[#9CA3AF]" />
            <span className="rounded-md bg-[#0F766E] px-1.5 py-0.5 text-[10px] font-medium text-white">
              EN
            </span>
            <span className="ml-auto text-[10px] text-[#9CA3AF]">2 pages</span>
          </div>
          <div className="mt-2 space-y-1">
            <div className="h-1.5 w-full rounded bg-[#E5E5E0]" />
            <div className="h-1.5 w-[88%] rounded bg-[#E5E5E0]" />
            <div className="h-1.5 w-[72%] rounded bg-[#E5E5E0]" />
          </div>
        </PreviewBox>
      ),
    },
    {
      icon: <FileText size={18} />,
      title: "Reports & Documents",
      text: "Keep project reports, partner updates, and important files organized in one searchable place.",
      preview: (
        <PreviewBox>
          <FilePreviewRow name="Q3 Field Report" meta="12 Sep · Field team" />
          <FilePreviewRow name="Partner MoU" meta="28 Aug · Signed" />
          <FilePreviewRow name="Budget Review" meta="Pending review" muted />
        </PreviewBox>
      ),
    },
    {
      icon: <Mail size={18} />,
      title: "Daily Intelligence Briefing",
      text: "Receive a clear daily summary of what changed, why it matters, and which actions to take next.",
      preview: (
        <PreviewBox>
          <MicroBriefLine label="What changed" text="Security alert near project area" />
          <MicroBriefLine label="Why it matters" text="Partner travel may be affected" />
          <MicroBriefLine label="Next step" text="Contact field coordinator" />
        </PreviewBox>
      ),
    },
    {
      icon: <Network size={18} />,
      title: "NGO Network",
      text: "Discover and connect with organizations working in similar countries, causes, or emergency contexts.",
      preview: (
        <PreviewBox>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-[#0F766E]/10 text-[#0F766E]">
              <HeartHandshake size={13} />
            </span>
            <div className="min-w-0">
              <div className="text-[11.5px] font-semibold text-foreground">AFEM Bujumbura</div>
              <div className="truncate text-[10.5px] text-[#6B7280]">GBV prevention · Burundi</div>
            </div>
            <span className="ml-auto shrink-0 rounded-full bg-[#0F766E]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#0F766E]">
              Match
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {["GBV", "Education", "Great Lakes"].map((t) => (
              <span key={t} className="rounded-full border border-[#E5E5E0] px-1.5 py-0.5 text-[10px] text-[#6B7280]">
                {t}
              </span>
            ))}
          </div>
        </PreviewBox>
      ),
    },
  ];
  return (
    <section id="features" className="mx-auto max-w-[1200px] px-6 py-24">
      <Reveal>
        <SectionHeader
          eyebrow="Features"
          title="Everything your NGO needs to operate effectively."
          subtitle="Each module is designed to remove a recurring source of friction for small international teams."
        />
      </Reveal>
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={(i % 3) * 90}>
            <div className="group h-full rounded-xl border border-[#E5E5E0] bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-[#0F766E]/35 hover:shadow-[0_14px_32px_-16px_rgba(15,118,110,0.22)]">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#0F766E]/10 text-[#0F766E] transition-colors group-hover:bg-[#0F766E]/15">
                  {f.icon}
                </span>
              </div>
              <h3 className="mt-4 text-[15px] font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-[#6B7280]">{f.text}</p>
              <div className="mt-4">{f.preview}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function PreviewBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-[#E5E5E0] bg-[#FAFAF8] p-3">
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function PreviewRow({
  dot,
  text,
}: {
  dot: "red" | "yellow" | "green";
  text: string;
}) {
  const dotColor = { red: "#DC2626", yellow: "#D97706", green: "#059669" } as const;
  return (
    <div className="flex items-center gap-2 text-[11.5px] text-[#4B5563]">
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: dotColor[dot] }}
      />
      <span className="truncate">{text}</span>
    </div>
  );
}

function FilePreviewRow({
  name,
  meta,
  muted = false,
}: {
  name: string;
  meta: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-6 w-6 place-items-center rounded bg-white text-[#6B7280] ring-1 ring-[#E5E5E0]">
        <FileText size={11} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11.5px] font-medium text-foreground">{name}</div>
        <div className="truncate text-[10.5px] text-[#9CA3AF]">{meta}</div>
      </div>
      {!muted && (
        <span className="text-[10px] font-semibold text-[#0F766E]">View</span>
      )}
    </div>
  );
}

function MicroBriefLine({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex gap-2">
      <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0F766E]" />
      <div className="min-w-0">
        <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
          {label}
        </div>
        <div className="text-[11.5px] leading-snug text-[#374151]">{text}</div>
      </div>
    </div>
  );
}

/* ----------------------------- DARK SECTION ------------------------------ */

function DarkSection() {
  const alerts = [
    { tone: "red", title: "Burundi · Security update", sub: "Border area · low risk" },
    { tone: "amber", title: "Kenya · Animal welfare regulation", sub: "Draft bill published" },
    { tone: "amber", title: "Tanzania · Funding deadline", sub: "Closes in 6 days" },
    { tone: "teal", title: "French report · Translation ready", sub: "12 pages · Reviewed" },
    { tone: "teal", title: "Partner update · Needs review", sub: "AFEM · sent 2h ago" },
  ] as const;

  const toneStyles = {
    red: { dot: "bg-[#F87171]", glow: "shadow-[0_0_24px_-8px_rgba(248,113,113,0.45)]" },
    amber: { dot: "bg-[#FBBF24]", glow: "shadow-[0_0_24px_-8px_rgba(251,191,36,0.4)]" },
    teal: { dot: "bg-[#5EEAD4]", glow: "shadow-[0_0_24px_-8px_rgba(94,234,212,0.45)]" },
  } as const;

  return (
    <section className="relative overflow-hidden bg-[#0B1F1D] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_20%_10%,rgba(15,118,110,0.35),transparent_60%),radial-gradient(40%_40%_at_85%_90%,rgba(94,234,212,0.15),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="relative mx-auto max-w-[1200px] px-6 py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <Reveal>
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-[#5EEAD4]">
                <Bell size={12} />
                Live intelligence
              </span>
              <h2 className="mt-5 text-balance text-3xl font-semibold tracking-[-0.01em] sm:text-[40px] sm:leading-[1.15]">
                Built for teams working where information changes fast.
              </h2>
              <p className="mt-5 max-w-[520px] text-[15.5px] leading-relaxed text-white/70">
                Canopy helps NGOs monitor changing local conditions, funding
                deadlines, documents, and partner updates before they become missed
                opportunities.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/login"
                  className="group inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_32px_-12px_rgba(15,118,110,0.7)] transition-all hover:-translate-y-0.5 hover:bg-[#0c655e]"
                >
                  Get Started
                  <ArrowRight
                    size={15}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-all hover:border-white/30 hover:bg-white/10"
                >
                  View Demo
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal delay={140}>
            <div className="relative">
              <div className="space-y-3">
                {alerts.map((a, i) => {
                  const t = toneStyles[a.tone];
                  return (
                    <div
                      key={a.title}
                      className={`flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-md ${
                        i % 2 === 0 ? "float-a" : "float-b"
                      }`}
                      style={{ animationDelay: `${i * 0.5}s` }}
                    >
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${t.dot} ${t.glow}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] font-semibold text-white">
                          {a.title}
                        </div>
                        <div className="truncate text-[12px] text-white/60">{a.sub}</div>
                      </div>
                      <span className="hidden text-[11px] text-white/40 sm:inline">
                        just now
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- HOW IT WORKS ------------------------------- */

function HowItWorks() {
  const steps = [
    {
      n: "01",
      icon: <Compass size={18} />,
      title: "Create your NGO profile",
      text: "Select your countries, languages, mission areas, and current needs.",
    },
    {
      n: "02",
      icon: <Sparkles size={18} />,
      title: "Customize your dashboard",
      text: "Choose the tools your team needs, from funding alerts to translation and news monitoring.",
    },
    {
      n: "03",
      icon: <HeartHandshake size={18} />,
      title: "Act on what matters",
      text: "Canopy surfaces relevant updates and turns them into clear next steps for your team.",
    },
  ];
  return (
    <section className="border-y border-[#E5E5E0] bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-24">
        <Reveal>
          <SectionHeader eyebrow="How it works" title="How Canopy works" />
        </Reveal>
        <div className="relative mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <div className="relative h-full">
                <div className="h-full rounded-2xl border border-[#E5E5E0] bg-[#FAFAF8] p-6 transition-all hover:-translate-y-0.5 hover:border-[#0F766E]/30 hover:shadow-[0_10px_28px_-14px_rgba(15,118,110,0.2)]">
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#0F766E]/10 text-[#0F766E]">
                      {s.icon}
                    </span>
                    <span className="text-[11px] font-semibold tracking-[0.18em] text-[#9CA3AF]">
                      STEP {s.n}
                    </span>
                  </div>
                  <h3 className="mt-5 text-[16px] font-semibold text-foreground">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-[#6B7280]">
                    {s.text}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <div
                    aria-hidden
                    className="absolute right-[-18px] top-1/2 hidden -translate-y-1/2 text-[#E5E5E0] md:block"
                  >
                    <ArrowRight size={18} />
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- BUILT FOR --------------------------------- */

function BuiltFor() {
  const tags = [
    { label: "Children's Aid", icon: <Users size={14} /> },
    { label: "Animal Welfare", icon: <Leaf size={14} /> },
    { label: "Healthcare", icon: <Stethoscope size={14} /> },
    { label: "Education", icon: <GraduationCap size={14} /> },
    { label: "Humanitarian Relief", icon: <LifeBuoy size={14} /> },
    { label: "Climate & Environment", icon: <TreePine size={14} /> },
    { label: "Human Rights", icon: <Scale size={14} /> },
    { label: "Community Development", icon: <HeartHandshake size={14} /> },
  ];
  return (
    <section className="mx-auto max-w-[1200px] px-6 py-24">
      <Reveal>
        <SectionHeader
          eyebrow="Built for"
          title="Built for NGOs working across borders."
          subtitle="Whether your team supports children, animals, healthcare, education, emergency relief, or community development, Canopy adapts to your mission."
        />
      </Reveal>
      <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tags.map((t, i) => (
          <Reveal key={t.label} delay={i * 50}>
            <div className="flex items-center gap-2.5 rounded-xl border border-[#E5E5E0] bg-white px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:border-[#0F766E]/30 hover:shadow-[0_8px_22px_-14px_rgba(15,118,110,0.2)]">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-[#0F766E]/10 text-[#0F766E]">
                {t.icon}
              </span>
              <span className="text-[13.5px] font-medium text-foreground">{t.label}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------- MISSION ----------------------------------- */

function Mission() {
  return (
    <section id="mission" className="border-y border-[#E5E5E0] bg-white">
      <div className="mx-auto max-w-[820px] px-6 py-24 text-center">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#E5E5E0] bg-[#FAFAF8] px-3 py-1 text-xs font-medium text-[#4B5563]">
            <Leaf size={12} className="text-[#0F766E]" />
            Our mission
          </span>
          <h2 className="mt-5 text-balance text-3xl font-semibold tracking-[-0.01em] text-foreground sm:text-[40px] sm:leading-[1.15]">
            Time should go to the work, not the search for it.
          </h2>
          <div className="mx-auto mt-6 max-w-[640px] space-y-4 text-[15.5px] leading-relaxed text-[#4B5563]">
            <p>
              We believe small NGO teams should spend their time helping people,
              animals, and communities, not searching for information.
            </p>
            <p>
              Canopy exists to reduce administrative work through AI, giving
              organizations faster access to the insights, funding, translations, and
              collaboration they need to create greater impact.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ----------------------------- BENEFITS ---------------------------------- */

function Benefits() {
  const items = [
    "Save hours of manual research",
    "Discover relevant funding faster",
    "Monitor country developments",
    "Translate reports instantly",
    "Work from one centralized platform",
  ];
  return (
    <section className="mx-auto max-w-[1200px] px-6 py-24">
      <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <Reveal>
          <div>
            <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0F766E]">
              Benefits
            </span>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.01em] text-foreground sm:text-[40px] sm:leading-[1.15]">
              Designed to give time back to your team.
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#4B5563]">
              Canopy quietly handles the recurring work that pulls staff away from
              programs, so your team can focus on the outcomes that matter.
            </p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <ul className="divide-y divide-[#E5E5E0] overflow-hidden rounded-2xl border border-[#E5E5E0] bg-white shadow-[0_12px_36px_-24px_rgba(15,23,42,0.18)]">
            {items.map((b) => (
              <li key={b} className="flex items-center gap-4 px-5 py-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#0F766E]/10 text-[#0F766E]">
                  <Check size={15} strokeWidth={2.5} />
                </span>
                <span className="text-[14.5px] font-medium text-foreground">{b}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

/* ----------------------------- FINAL CTA --------------------------------- */

function FinalCTA() {
  return (
    <section id="contact" className="mx-auto max-w-[1200px] px-6 pb-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-[#E5E5E0] bg-white px-6 py-16 text-center shadow-[0_24px_60px_-32px_rgba(15,23,42,0.2)] sm:px-12 sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(15,118,110,0.12),transparent_70%)]"
          />
          <div className="relative">
            <h2 className="mx-auto max-w-3xl text-balance text-3xl font-semibold tracking-[-0.01em] text-foreground sm:text-[44px] sm:leading-[1.1]">
              Ready to spend less time searching and more time making an impact?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[15.5px] leading-relaxed text-[#4B5563]">
              Start building your NGO's intelligent workspace with Canopy.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/login"
                className="group inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0F766E] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_-12px_rgba(15,118,110,0.55)] transition-all hover:-translate-y-0.5 hover:bg-[#0c655e] sm:w-auto"
              >
                Get Started
                <ArrowRight
                  size={15}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex w-full items-center justify-center rounded-xl border border-[#E5E5E0] bg-white px-5 py-3 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-[#0F766E]/40 hover:text-[#0F766E] sm:w-auto"
              >
                View Demo
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------ FOOTER ----------------------------------- */

function Footer() {
  return (
    <footer className="border-t border-[#E5E5E0] bg-white">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-6 py-12 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <CanopyLogo size={22} />
            <span className="text-[15px] font-semibold tracking-[0.02em] text-foreground">
              CANOPY
            </span>
          </div>
          <p className="mt-3 max-w-sm text-[13.5px] leading-relaxed text-[#6B7280]">
            The intelligent workspace for international NGOs.
          </p>
        </div>
        <FooterCol
          title="Product"
          links={[
            { label: "Product", href: "#product" },
            { label: "Features", href: "#features" },
            { label: "Mission", href: "#mission" },
            { label: "Contact", href: "#contact" },
          ]}
        />
        <FooterCol
          title="Legal"
          links={[
            { label: "Privacy", href: "#" },
            { label: "Terms", href: "#" },
          ]}
        />
      </div>
      <div className="border-t border-[#E5E5E0]">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-2 px-6 py-5 text-[12px] text-[#6B7280] sm:flex-row">
          <span>© {new Date().getFullYear()} Canopy. All rights reserved.</span>
          <span>Made for teams creating impact.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">
        {title}
      </div>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              className="text-[13.5px] text-[#4B5563] transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ----------------------------- PRIMITIVES -------------------------------- */

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow && (
        <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0F766E]">
          {eyebrow}
        </span>
      )}
      <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.01em] text-foreground sm:text-[40px] sm:leading-[1.15]">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-[15.5px] leading-relaxed text-[#4B5563]">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// Unused-import guard: keep Inbox referenced for future use
void Inbox;
