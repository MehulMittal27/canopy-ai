import { useEffect } from "react";
import { useNgoStore } from "@/lib/ngo-store";
import { TEMPLATES, useTemplateStore, readSavedTemplate } from "@/lib/template-store";

/**
 * Applies the active NGO's saved template by writing CSS custom properties
 * onto :root and a data-template attribute onto <body>. Presentation only.
 */
export function TemplateApplier() {
  const current = useNgoStore((s) => s.current);
  const hydrate = useTemplateStore((s) => s.hydrate);
  const selected = useTemplateStore((s) =>
    current ? s.selections[current.id] : undefined,
  );

  useEffect(() => {
    if (current) hydrate(current.id);
  }, [current, hydrate]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const body = document.body;

    if (!current) {
      // Reset to default tokens by clearing inline overrides
      const props = [
        "--background",
        "--foreground",
        "--card",
        "--card-foreground",
        "--border",
        "--input",
        "--accent",
        "--primary",
        "--ring",
        "--metadata",
        "--muted-foreground",
        "--secondary",
        "--muted",
      ];
      props.forEach((p) => root.style.removeProperty(p));
      body?.removeAttribute("data-template");
      return;
    }

    const id =
      selected ?? readSavedTemplate(current.id) ?? "clarity";
    const tpl = TEMPLATES[id];
    const t = tpl.theme;

    root.style.setProperty("--background", t.background);
    root.style.setProperty("--foreground", t.foreground);
    root.style.setProperty("--card", t.card);
    root.style.setProperty("--card-foreground", t.foreground);
    root.style.setProperty("--popover", t.card);
    root.style.setProperty("--popover-foreground", t.foreground);
    root.style.setProperty("--border", t.border);
    root.style.setProperty("--input", t.border);
    root.style.setProperty("--accent", t.accent);
    root.style.setProperty("--accent-foreground", "#FFFFFF");
    root.style.setProperty("--primary", t.accent);
    root.style.setProperty("--primary-foreground", "#FFFFFF");
    root.style.setProperty("--ring", t.accent);
    root.style.setProperty("--metadata", t.metadata);
    root.style.setProperty("--muted-foreground", t.metadata);
    root.style.setProperty("--secondary", t.secondary);
    root.style.setProperty("--secondary-foreground", t.foreground);
    root.style.setProperty("--muted", t.secondary);

    body?.setAttribute("data-template", id);
  }, [current, selected]);

  return null;
}
