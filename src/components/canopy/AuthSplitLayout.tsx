import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { CanopyLogo } from "@/components/canopy/Logo";

const FONT_STACK = '"Schibsted Grotesk", -apple-system, "Helvetica Neue", Arial, sans-serif';

const BULLETS = [
  "Monitor news, funding, and field reports in one place.",
  "Prioritize urgent items with traffic-light signals.",
  "Keep your workspace saved for the next session.",
];

export function AuthSplitLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div
      className="grid min-h-screen lg:grid-cols-[minmax(340px,38vw)_1fr]"
      style={{ background: "#F2F1EC", fontFamily: FONT_STACK }}
    >
      <aside
        className="flex min-h-[330px] flex-col justify-between px-6 py-7 text-white sm:px-10 lg:min-h-screen lg:px-12 lg:py-12"
        style={{
          background: "#137A5C",
          borderRight: "1px solid rgba(255,255,255,.16)",
        }}
      >
        <div>
          <Link to="/" className="inline-flex items-center gap-3" aria-label="Back to Canopy home">
            <span
              className="flex items-center justify-center"
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: "#FFFFFF",
                boxShadow: "0 18px 34px -24px rgba(0,0,0,.45)",
              }}
            >
              <CanopyLogo size={28} />
            </span>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.14em" }}>CANOPY</span>
          </Link>

          <div className="max-w-[410px]" style={{ marginTop: 96 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "rgba(255,255,255,.72)",
              }}
            >
              NGO OPERATING WORKSPACE
            </div>
            <h1
              style={{
                marginTop: 14,
                fontSize: 42,
                lineHeight: 1.04,
                fontWeight: 700,
                color: "#FFFFFF",
              }}
            >
              Less searching. More impact.
            </h1>
            <div className="grid gap-4" style={{ marginTop: 32 }}>
              {BULLETS.map((item) => (
                <div key={item} className="flex gap-3">
                  <span
                    aria-hidden
                    className="mt-1 flex shrink-0 items-center justify-center"
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,.75)",
                      color: "#FFFFFF",
                      fontSize: 11,
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    <Check size={11} strokeWidth={2.4} />
                  </span>
                  <span style={{ color: "rgba(255,255,255,.88)", fontSize: 15, lineHeight: 1.45 }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            to="/"
            className="text-sm font-semibold"
            style={{ color: "#FFFFFF", textDecoration: "underline", textUnderlineOffset: 4 }}
          >
            Back to landing page
          </Link>
          <span
            style={{ width: 4, height: 4, borderRadius: 999, background: "rgba(255,255,255,.45)" }}
          />
          <span style={{ color: "rgba(255,255,255,.68)", fontSize: 13 }}>Built for small NGOs</span>
        </div>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10 lg:px-14">
        <section className="w-full max-w-[560px]">
          <div>
            <h1 style={{ fontSize: 42, lineHeight: 1.06, fontWeight: 700, color: "#1B1B17" }}>
              {title}
            </h1>
            <p style={{ marginTop: 12, fontSize: 16, lineHeight: 1.5, color: "#6E6E64" }}>
              {subtitle}
            </p>
          </div>
          <div style={{ marginTop: 34 }}>{children}</div>
        </section>
      </main>
    </div>
  );
}
