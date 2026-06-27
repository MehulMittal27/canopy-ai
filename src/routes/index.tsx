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
        <ValueStrip />
        <ProblemSection />
        <ProductOverview />
        <FeatureGrid />
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

/* ---------------------------------- NAV ---------------------------------- */

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#E5E5E0]/80 bg-[#FAFAF8]/85 backdrop-blur">
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
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F766E] px-3.5 py-2 text-sm font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.05)] transition-colors hover:bg-[#0c655e]"
          >
            Get Started
            <ArrowRight size={14} />
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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-32 h-[520px] bg-[radial-gradient(60%_60%_at_50%_30%,rgba(15,118,110,0.10),transparent_70%)]"
      />
      <div className="mx-auto max-w-[1200px] px-6 pt-16 pb-12 lg:pt-24 lg:pb-20">
        <div className="mx-auto max-w-3xl text-center">
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
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0F766E] px-5 py-3 text-sm font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.05)] transition-colors hover:bg-[#0c655e] sm:w-auto"
            >
              Get Started
              <ArrowRight size={15} />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex w-full items-center justify-center rounded-xl border border-[#E5E5E0] bg-white px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-[#0F766E]/40 hover:text-[#0F766E] sm:w-auto"
            >
              View Demo
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-[1100px]">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}

/* --------------------------- DASHBOARD MOCKUP ---------------------------- */

function DashboardMockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className="relative">
      <div className="rounded-2xl border border-[#E5E5E0] bg-white p-3 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.25)]">
        {/* faux window chrome */}
        <div className="flex items-center justify-between border-b border-[#E5E5E0] px-3 pb-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#E5E5E0]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#E5E5E0]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#E5E5E0]" />
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#9CA3AF]">
            <CanopyLogo size={12} />
            <span>canopy.app / dashboard</span>
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
}: {
  icon: React.ReactNode;
  title: string;
  meta: string;
  items: { dot: "red" | "yellow" | "green"; text: string }[];
}) {
  const dotColor = {
    red: "#DC2626",
    yellow: "#D97706",
    green: "#059669",
  } as const;
  return (
    <div className="rounded-xl border border-[#E5E5E0] bg-white p-3.5 transition-colors hover:border-[#0F766E]/30">
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

/* ------------------------------ VALUE STRIP ------------------------------ */

function ValueStrip() {
  return (
    <section className="mx-auto max-w-[1200px] px-6">
      <div className="rounded-2xl border border-[#E5E5E0] bg-white px-6 py-5 sm:px-8 sm:py-6">
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:gap-5 sm:text-left">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#0F766E]/10 text-[#0F766E]">
            <Sparkles size={16} />
          </span>
          <p className="text-balance text-[15px] leading-relaxed text-foreground sm:text-[16px]">
            Every morning, Canopy tells your team{" "}
            <span className="font-semibold">what changed</span>,{" "}
            <span className="font-semibold">why it matters</span>, and{" "}
            <span className="font-semibold">what to do next</span>.
          </p>
        </div>
      </div>
    </section>
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
      <SectionHeader
        eyebrow="The problem"
        title="NGOs shouldn't spend hours searching for information."
        subtitle="Small teams are expected to monitor breaking news, political developments, funding opportunities, local reports, emails, and multilingual documents, while still running projects that change lives."
      />
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.title}
            className="group rounded-xl border border-[#E5E5E0] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#0F766E]/30 hover:shadow-[0_8px_24px_-12px_rgba(15,118,110,0.18)]"
          >
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#0F766E]/10 text-[#0F766E]">
              {c.icon}
            </span>
            <h3 className="mt-4 text-[15px] font-semibold text-foreground">{c.title}</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[#6B7280]">{c.text}</p>
          </div>
        ))}
      </div>
    </section>
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
        <SectionHeader
          eyebrow="One workspace"
          title="One intelligent workspace for international NGOs."
          subtitle="Canopy brings together the tools NGOs already use into one customizable dashboard powered by AI."
        />
        <div className="mx-auto mt-14 max-w-[1100px]">
          <DashboardMockup />
        </div>
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
      </div>
    </section>
  );
}

/* ----------------------------- FEATURES ---------------------------------- */

function FeatureGrid() {
  const features = [
    {
      icon: <Globe2 size={18} />,
      title: "AI News Monitor",
      text: "Track local, political, humanitarian, environmental, and security developments that could affect your projects.",
    },
    {
      icon: <Search size={18} />,
      title: "Funding Discovery",
      text: "Find grants, open calls, and funding opportunities matched to your mission, countries, and deadlines.",
    },
    {
      icon: <Languages size={18} />,
      title: "Smart Translation",
      text: "Translate reports, proposals, and local-language documents while preserving context and meaning.",
    },
    {
      icon: <FileText size={18} />,
      title: "Reports & Documents",
      text: "Keep project reports, partner updates, and important files organized in one searchable place.",
    },
    {
      icon: <Mail size={18} />,
      title: "Daily Intelligence Briefing",
      text: "Receive a clear daily summary of what changed, why it matters, and which actions to take next.",
    },
    {
      icon: <Network size={18} />,
      title: "NGO Network",
      text: "Discover and connect with organizations working in similar countries, causes, or emergency contexts.",
    },
  ];
  return (
    <section id="features" className="mx-auto max-w-[1200px] px-6 py-24">
      <SectionHeader
        eyebrow="Features"
        title="Everything your NGO needs to operate effectively."
        subtitle="Each module is designed to remove a recurring source of friction for small international teams."
      />
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-[#E5E5E0] bg-white p-6 transition-all hover:border-[#0F766E]/30 hover:shadow-[0_8px_24px_-12px_rgba(15,118,110,0.15)]"
          >
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#0F766E]/10 text-[#0F766E]">
              {f.icon}
            </span>
            <h3 className="mt-4 text-[15px] font-semibold text-foreground">{f.title}</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[#6B7280]">{f.text}</p>
          </div>
        ))}
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
        <SectionHeader eyebrow="How it works" title="How Canopy works" />
        <div className="relative mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.n} className="relative">
              <div className="rounded-2xl border border-[#E5E5E0] bg-[#FAFAF8] p-6">
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
      <SectionHeader
        eyebrow="Built for"
        title="Built for NGOs working across borders."
        subtitle="Whether your team supports children, animals, healthcare, education, emergency relief, or community development, Canopy adapts to your mission."
      />
      <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tags.map((t) => (
          <div
            key={t.label}
            className="flex items-center gap-2.5 rounded-xl border border-[#E5E5E0] bg-white px-4 py-3.5 transition-colors hover:border-[#0F766E]/30"
          >
            <span className="grid h-7 w-7 place-items-center rounded-md bg-[#0F766E]/10 text-[#0F766E]">
              {t.icon}
            </span>
            <span className="text-[13.5px] font-medium text-foreground">{t.label}</span>
          </div>
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
        <ul className="divide-y divide-[#E5E5E0] overflow-hidden rounded-2xl border border-[#E5E5E0] bg-white">
          {items.map((b) => (
            <li key={b} className="flex items-center gap-4 px-5 py-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#0F766E]/10 text-[#0F766E]">
                <Check size={15} strokeWidth={2.5} />
              </span>
              <span className="text-[14.5px] font-medium text-foreground">{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ----------------------------- FINAL CTA --------------------------------- */

function FinalCTA() {
  return (
    <section id="contact" className="mx-auto max-w-[1200px] px-6 pb-24">
      <div className="relative overflow-hidden rounded-3xl border border-[#E5E5E0] bg-white px-6 py-16 text-center sm:px-12 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(15,118,110,0.08),transparent_70%)]"
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
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0F766E] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0c655e] sm:w-auto"
            >
              Get Started
              <ArrowRight size={15} />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex w-full items-center justify-center rounded-xl border border-[#E5E5E0] bg-white px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-[#0F766E]/40 hover:text-[#0F766E] sm:w-auto"
            >
              View Demo
            </Link>
          </div>
        </div>
      </div>
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
