import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { NGOS, useNgoStore, type NgoId } from "@/lib/ngo-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AidSignal — Der intelligente Posteingang für kleine NGOs" },
      {
        name: "description",
        content:
          "AidSignal überwacht News, Förderaufrufe und Berichte für kleine NGOs — übersetzt, zusammengefasst und priorisiert.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const setNgo = useNgoStore((s) => s.setNgo);

  const login = (id: NgoId) => {
    setNgo(NGOS[id]);
    navigate({ to: "/inbox" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="px-10 pt-8">
        <div className="whitespace-pre-line text-[15px] font-semibold tracking-tight text-foreground">
          {"CANOPY\n\n"}
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-3xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Der intelligente Posteingang für kleine NGOs.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-[color:var(--metadata)]">
            AidSignal beobachtet Nachrichten, Förderaufrufe und Feldberichte zu
            den Ländern und Themen Ihrer Organisation — übersetzt,
            zusammengefasst und täglich nach Dringlichkeit priorisiert.
          </p>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            <LoginCard
              title="Login as Burundi Kids"
              subtitle="Kinder, Bildung, GBV · Burundi"
              onClick={() => login("bk")}
            />
            <LoginCard
              title="Login as WTG"
              subtitle="Tierschutz · 20+ Länder weltweit"
              onClick={() => login("wtg")}
            />
          </div>
        </div>
      </main>

      <footer className="px-10 pb-6 text-center text-xs text-[color:var(--metadata)]">
        Hackathon-Prototyp · AI4Good TUM 2026
      </footer>
    </div>
  );
}

function LoginCard({
  title,
  subtitle,
  onClick,
}: {
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-xl border border-border bg-card p-6 text-left transition-all hover:border-[color:var(--accent)] hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
    >
      <div className="text-base font-semibold text-foreground">{title}</div>
      <div className="mt-1 text-xs text-[color:var(--metadata)]">{subtitle}</div>
      <div className="mt-6 text-xs font-medium text-[color:var(--accent)] opacity-0 transition-opacity group-hover:opacity-100">
        Posteingang öffnen →
      </div>
    </button>
  );
}
