import { useEffect } from "react";

/**
 * Cleans up stale localStorage from prior versions of the app and locks
 * the app to its canonical color tokens (warm off-white background,
 * teal #0F766E accent, white cards). No dark/blue themes are applied
 * under any circumstance.
 */

const VALID_DASHBOARD_TEMPLATES = new Set([
  "burundi-kids",
  "wtg",
  "fundraiser",
  "analyst",
]);

// Old template ids from a previous version that applied blue/dark themes.
const STALE_TEMPLATE_VALUES = new Set(["command", "clarity", "focus", "field"]);

const VALID_KEYS = new Set([
  "canopy_template_bk",
  "canopy_template_wtg",
  "canopy_layout_bk",
  "canopy_layout_wtg",
]);

function applyDefaultTokens() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  // Clear any inline overrides that older code may have set.
  [
    "--background",
    "--foreground",
    "--card",
    "--card-foreground",
    "--popover",
    "--popover-foreground",
    "--border",
    "--input",
    "--accent",
    "--accent-foreground",
    "--primary",
    "--primary-foreground",
    "--ring",
    "--metadata",
    "--muted-foreground",
    "--secondary",
    "--secondary-foreground",
    "--muted",
  ].forEach((p) => root.style.removeProperty(p));

  // Canonical defaults
  root.style.setProperty("--color-bg", "#FAFAF8");
  root.style.setProperty("--color-accent", "#0F766E");
  root.style.setProperty("--color-card", "#FFFFFF");

  document.body?.removeAttribute("data-template");
}

function cleanStaleLocalStorage() {
  if (typeof window === "undefined") return;
  try {
    const ls = window.localStorage;
    const toRemove: string[] = [];
    for (let i = 0; i < ls.length; i++) {
      const key = ls.key(i);
      if (!key) continue;
      const lower = key.toLowerCase();

      // Strip any leftover theme/color keys outright.
      if (lower.includes("theme") || lower.includes("color")) {
        toRemove.push(key);
        continue;
      }

      // For the per-NGO template keys, validate the value.
      if (key === "canopy_template_bk" || key === "canopy_template_wtg") {
        const v = ls.getItem(key);
        if (!v || STALE_TEMPLATE_VALUES.has(v) || !VALID_DASHBOARD_TEMPLATES.has(v)) {
          toRemove.push(key);
        }
        continue;
      }

      // Layout keys: keep as-is (their shape is validated by dashboard-store).
      if (key === "canopy_layout_bk" || key === "canopy_layout_wtg") continue;

      // Leave unrelated keys (e.g. the zustand persisted NGO selection) alone
      // unless they explicitly reference theme/color, handled above.
      void VALID_KEYS;
    }
    toRemove.forEach((k) => ls.removeItem(k));
  } catch {
    // Ignore storage access errors (private mode, etc.).
  }
}

// Run synchronously on module import so colors are correct before first paint.
if (typeof window !== "undefined") {
  cleanStaleLocalStorage();
  applyDefaultTokens();
}

export function TemplateApplier() {
  useEffect(() => {
    cleanStaleLocalStorage();
    applyDefaultTokens();
  }, []);
  return null;
}
