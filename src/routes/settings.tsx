import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, RefreshCw, Unlink } from "lucide-react";
import { useNgoStore } from "@/lib/ngo-store";
import { TEMPLATES, useTemplateStore, readSavedTemplate } from "@/lib/template-store";
import { DASH_TEMPLATES, defaultTemplateForNgo, useDashboardStore } from "@/lib/dashboard-store";
import {
  disconnectGmail,
  getGmailConnection,
  startGmailOAuth,
  syncGmailInbox,
  type GmailSyncResult,
} from "@/lib/api/gmail";
import {
  normalizeNewsPreferences,
  updateMyNewsPreferences,
  type NewsPreferences,
} from "@/lib/api/news-preferences";
import { TopBar } from "@/components/canopy/TopBar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · Canopy" }] }),
  component: SettingsRoute,
});

function SettingsRoute() {
  return (
    <ProtectedRoute>
      <Settings />
    </ProtectedRoute>
  );
}

function Settings() {
  const current = useNgoStore((s) => s.current);
  const logout = useNgoStore((s) => s.logout);
  const { signOut } = useAuth();
  if (!current) throw redirect({ to: "/login" });
  const navigate = useNavigate();
  const selected = useTemplateStore((s) => s.selections[current.id]);

  const activeId = selected ?? readSavedTemplate(current.id) ?? "clarity";
  const active = TEMPLATES[activeId];

  const handleLogout = async () => {
    await signOut();
    logout();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="mx-auto max-w-[760px] px-6 py-10">
        <Link
          to="/inbox"
          className="text-[13px] font-medium text-[color:var(--accent)] hover:underline"
        >
          ← Back to inbox
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">Settings</h1>

        <Section title="Workspace Template">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[15px] font-semibold text-foreground">{active.name}</div>
              <div className="text-[13px] text-[color:var(--metadata)]">{active.tagline}</div>
            </div>
            <Link
              to="/choose-template"
              className="rounded-lg border border-[color:var(--accent)] px-3 py-1.5 text-sm font-medium text-[color:var(--accent)] hover:bg-[color:var(--accent)]/5"
            >
              Change template
            </Link>
          </div>
        </Section>

        <Section title="Dashboard Layout">
          <DashboardLayoutSection />
        </Section>

        <Section title="Organization">
          <div className="text-[15px] font-semibold text-foreground">{current.name}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {current.topics.map((t) => (
              <span
                key={t}
                className="rounded-full border border-border bg-card px-2.5 py-0.5 text-[12px] text-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </Section>

        <Section title="News Monitor Preferences">
          <NewsPreferencesSection />
        </Section>

        <Section title="Gmail Inbox">
          <GmailSection />
        </Section>

        <Section title="Session">
          <button
            type="button"
            onClick={handleLogout}
            className="text-[14px] font-medium text-[#DC2626] hover:underline"
          >
            Log out
          </button>
        </Section>
      </main>
    </div>
  );
}

const LANGUAGE_OPTIONS = [
  { code: "en", label: "English" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "rn", label: "Kirundi" },
  { code: "es", label: "Spanish" },
  { code: "ar", label: "Arabic" },
];

function NewsPreferencesSection() {
  const { org, refreshOrg } = useAuth();
  const initial = useMemo(() => normalizeNewsPreferences(org), [org]);
  const [draft, setDraft] = useState<NewsPreferences>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(initial);
  }, [initial]);

  const updateDraft = (updates: Partial<NewsPreferences>) => {
    setSaved(false);
    setError(null);
    setDraft((previous) => ({ ...previous, ...updates }));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const nextPreferences = await updateMyNewsPreferences(draft);
      setDraft(nextPreferences);
      await refreshOrg();
      setSaved(true);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not save preferences.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <EditableList
        label="Countries"
        placeholder="Add country"
        values={draft.countries}
        onChange={(countries) => updateDraft({ countries })}
      />
      <EditableList
        label="Topics"
        placeholder="Add topic"
        values={draft.topics}
        onChange={(topics) => updateDraft({ topics })}
      />
      <div>
        <div className="text-[13px] font-semibold text-foreground">Languages</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {LANGUAGE_OPTIONS.map((language) => {
            const active = draft.languages.includes(language.code);
            return (
              <button
                key={language.code}
                type="button"
                onClick={() =>
                  updateDraft({
                    languages: active
                      ? draft.languages.filter((item) => item !== language.code)
                      : [...draft.languages, language.code],
                  })
                }
                className={
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
                  (active
                    ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white"
                    : "border-border bg-card text-foreground hover:border-[color:var(--accent)]")
                }
              >
                {language.label}
              </button>
            );
          })}
        </div>
      </div>
      <EditableList
        label="Trusted source domains"
        placeholder="reliefweb.int"
        values={draft.trustedDomains}
        onChange={(trustedDomains) => updateDraft({ trustedDomains })}
      />
      {error && <p className="text-[13px] font-medium text-[#CC4444]">{error}</p>}
      {saved && <p className="text-[13px] font-medium text-[#137A5C]">Preferences saved.</p>}
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="self-start rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--accent)]/90 disabled:cursor-not-allowed disabled:bg-[#9B9B90]"
      >
        {saving ? "Saving..." : "Save news preferences"}
      </button>
    </div>
  );
}

function EditableList({
  label,
  placeholder,
  values,
  onChange,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const addValue = () => {
    const value = input.trim();
    if (!value) return;
    if (values.some((item) => item.toLowerCase() === value.toLowerCase())) {
      setInput("");
      return;
    }
    onChange([...values, value]);
    setInput("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addValue();
  };

  return (
    <div>
      <label className="text-[13px] font-semibold text-foreground">{label}</label>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-[12px] text-foreground"
          >
            {value}
            <button
              type="button"
              onClick={() => onChange(values.filter((item) => item !== value))}
              className="text-[color:var(--metadata)] hover:text-[#CC4444]"
              aria-label={`Remove ${value}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-[color:var(--accent)]"
        />
        <button
          type="button"
          onClick={addValue}
          className="rounded-lg border border-[color:var(--accent)] px-3 py-2 text-sm font-medium text-[color:var(--accent)] hover:bg-[color:var(--accent)]/5"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function GmailSection() {
  const queryClient = useQueryClient();
  const [syncResult, setSyncResult] = useState<GmailSyncResult | null>(null);
  const { data: connection, isLoading, error } = useQuery({
    queryKey: ["gmail_connection"],
    queryFn: getGmailConnection,
  });

  const connectMutation = useMutation({
    mutationFn: startGmailOAuth,
    onSuccess: (authUrl) => {
      window.location.assign(authUrl);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectGmail,
    onSuccess: () => {
      setSyncResult(null);
      void queryClient.invalidateQueries({ queryKey: ["gmail_connection"] });
      void queryClient.invalidateQueries({ queryKey: ["inbox_items"] });
    },
  });

  const syncMutation = useMutation({
    mutationFn: syncGmailInbox,
    onSuccess: (result) => {
      setSyncResult(result);
      void queryClient.invalidateQueries({ queryKey: ["inbox_items"] });
    },
  });

  if (isLoading) {
    return <div className="h-20 rounded-lg border border-border bg-background/50" />;
  }

  const mutationError = connectMutation.error ?? disconnectMutation.error ?? syncMutation.error;

  return (
    <div>
      {connection ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
              <Mail size={16} strokeWidth={1.8} />
              <span>{connection.google_email ?? "Connected Gmail"}</span>
            </div>
            <div className="mt-1 text-[13px] capitalize text-[color:var(--metadata)]">
              {connection.status}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={syncMutation.isPending}
              onClick={() => syncMutation.mutate()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              <RefreshCw size={14} strokeWidth={1.8} />
              {syncMutation.isPending ? "Syncing..." : "Sync now"}
            </button>
            <button
              type="button"
              disabled={disconnectMutation.isPending}
              onClick={() => disconnectMutation.mutate()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#F4C7C0] px-3 py-1.5 text-sm font-medium text-[#CC4444] disabled:opacity-60"
            >
              <Unlink size={14} strokeWidth={1.8} />
              {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={connectMutation.isPending}
          onClick={() => connectMutation.mutate()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--accent)] px-3 py-1.5 text-sm font-medium text-[color:var(--accent)] hover:bg-[color:var(--accent)]/5 disabled:opacity-60"
        >
          <Mail size={14} strokeWidth={1.8} />
          {connectMutation.isPending ? "Connecting..." : "Connect Gmail"}
        </button>
      )}

      {syncResult && (
        <div
          className="mt-3 rounded-lg px-3 py-2 text-[13px]"
          style={{ background: "#E7F3ED", color: "#137A5C" }}
        >
          Imported {syncResult.imported}. Skipped {syncResult.skipped}. Errors {syncResult.errors}.
        </div>
      )}

      {(error || mutationError) && (
        <div
          role="alert"
          className="mt-3 rounded-lg px-3 py-2 text-[13px]"
          style={{ background: "#FBE9E7", color: "#CC4444" }}
        >
          {error instanceof Error
            ? error.message
            : mutationError instanceof Error
              ? mutationError.message
              : "Gmail request failed."}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7 rounded-xl border border-border bg-card p-5">
      <h2 className="text-[12px] font-semibold uppercase tracking-wider text-[color:var(--metadata)]">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function DashboardLayoutSection() {
  const current = useNgoStore((s) => s.current)!;
  const { user } = useAuth();
  const hydrate = useDashboardStore((s) => s.hydrate);
  const tplId = useDashboardStore((s) => (user ? s.templates[user.id] : undefined));
  useEffect(() => {
    if (!user) return;
    void hydrate(user.id, defaultTemplateForNgo(current.id));
  }, [current.id, hydrate, user]);
  const tpl = tplId ? DASH_TEMPLATES[tplId] : null;
  return (
    <div>
      <div className="text-[15px] font-semibold text-foreground">
        {tpl ? tpl.name : "Custom layout"}
      </div>
      {tpl && <div className="text-[13px] text-[color:var(--metadata)]">{tpl.description}</div>}
      <Link
        to="/choose-template"
        className="mt-3 inline-block rounded-lg border border-[color:var(--accent)] px-3 py-1.5 text-sm font-medium text-[color:var(--accent)] hover:bg-[color:var(--accent)]/5"
      >
        Change layout
      </Link>
      <p className="mt-2 text-[12px] text-[color:var(--metadata)]">
        Your current widget positions will be replaced with the new template defaults.
      </p>
    </div>
  );
}
