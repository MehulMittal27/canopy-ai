import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { NGOS, useNgoStore, type NgoId } from "./ngo-store";
import {
  DASH_TEMPLATES,
  useDashboardStore,
  type DashTemplateId,
  type GridItem,
  type WidgetId,
} from "./dashboard-store";

export interface Organization {
  id: string;
  name: string;
  email: string;
  organization_type: string | null;
  country_focus: string[];
  source_languages: string[];
  focus_areas: string[];
  selected_template: DashTemplateId;
}

export interface DashboardPreferences {
  organization_id: string;
  selected_template: DashTemplateId;
  layout: GridItem[];
  hidden_widgets: WidgetId[];
  visible_widgets: WidgetId[];
}

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  organization_type?: string;
  country_focus?: string[];
  source_languages?: string[];
  focus_areas?: string[];
}

interface AuthContextValue {
  loading: boolean;
  user: User | null;
  session: Session | null;
  organization: Organization | null;
  preferences: DashboardPreferences | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (input: SignUpInput) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshOrganization: () => Promise<void>;
  refreshPreferences: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Map an organization to one of the hardcoded NGO "personas" used by widgets / mock feed.
// Real product would store this on the organization. For this hackathon, demo accounts map
// directly; everything else falls back to "bk" so the UI still has a feed to render.
const DEMO_EMAILS: Record<string, NgoId> = {
  "demo-bk@canopy.ngo": "bk",
  "demo-wtg@canopy.ngo": "wtg",
};
function personaFor(org: Organization): NgoId {
  return DEMO_EMAILS[org.email.toLowerCase()] ?? (org.selected_template === "wtg" ? "wtg" : "bk");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [preferences, setPreferences] = useState<DashboardPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const setNgo = useNgoStore((s) => s.setNgo);
  const clearNgo = useNgoStore((s) => s.logout);

  const fetchOrganization = async (uid: string): Promise<Organization | null> => {
    const { data, error } = await supabase
      .from("organizations" as never)
      .select("*")
      .eq("id", uid)
      .maybeSingle();
    if (error) {
      console.error("[auth] fetchOrganization", error);
      return null;
    }
    return data as Organization | null;
  };

  const fetchPreferences = async (uid: string): Promise<DashboardPreferences | null> => {
    const { data, error } = await supabase
      .from("dashboard_preferences" as never)
      .select("*")
      .eq("organization_id", uid)
      .maybeSingle();
    if (error) {
      console.error("[auth] fetchPreferences", error);
      return null;
    }
    return data as DashboardPreferences | null;
  };

  const ensurePreferences = async (
    uid: string,
    tpl: DashTemplateId,
  ): Promise<DashboardPreferences | null> => {
    const existing = await fetchPreferences(uid);
    if (existing) return existing;
    const defaults = DASH_TEMPLATES[tpl] ?? DASH_TEMPLATES.bk;
    const row = {
      organization_id: uid,
      selected_template: tpl,
      layout: defaults.layout,
      hidden_widgets: defaults.hidden,
      visible_widgets: [],
    };
    const { data, error } = await supabase
      .from("dashboard_preferences" as never)
      .insert(row as never)
      .select()
      .maybeSingle();
    if (error) {
      console.error("[auth] ensurePreferences insert", error);
      return row as unknown as DashboardPreferences;
    }
    return data as unknown as DashboardPreferences;
  };

  const loadWorkspace = async (uid: string) => {
    const org = await fetchOrganization(uid);
    if (!org) {
      setOrganization(null);
      setPreferences(null);
      return;
    }
    setOrganization(org);
    setNgo(NGOS[personaFor(org)]);
    const prefs = await ensurePreferences(uid, org.selected_template);
    setPreferences(prefs);
    if (prefs) {
      useDashboardStore.getState().setFromRemote(personaFor(org), prefs.layout, prefs.selected_template);
    }
  };

  useEffect(() => {
    // 1. Subscribe FIRST so we never miss a transition.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // Defer to avoid running inside the callback synchronously.
        setTimeout(() => void loadWorkspace(sess.user.id), 0);
      } else {
        setOrganization(null);
        setPreferences(null);
        clearNgo();
      }
    });

    // 2. Then hydrate from existing session.
    void (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) await loadWorkspace(data.session.user.id);
      setLoading(false);
    })();

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn: AuthContextValue["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp: AuthContextValue["signUp"] = async (input) => {
    const { error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          name: input.name,
          organization_type: input.organization_type ?? null,
          country_focus: input.country_focus ?? [],
          source_languages: input.source_languages ?? [],
          focus_areas: input.focus_areas ?? [],
          selected_template: "burundi-kids",
        },
      },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setOrganization(null);
    setPreferences(null);
    clearNgo();
  };

  const refreshOrganization = async () => {
    if (user) {
      const org = await fetchOrganization(user.id);
      if (org) setOrganization(org);
    }
  };
  const refreshPreferences = async () => {
    if (user) {
      const p = await fetchPreferences(user.id);
      if (p) setPreferences(p);
    }
  };

  // Register the remote saver so dashboard-store can persist layout/template changes.
  const orgRef = useRef<Organization | null>(null);
  orgRef.current = organization;
  useEffect(() => {
    useDashboardStore.getState().setRemoteSaver(async (patch) => {
      const uid = orgRef.current?.id;
      if (!uid) return;
      const update: Record<string, unknown> = {};
      if (patch.layout) update.layout = patch.layout;
      if (patch.selected_template) update.selected_template = patch.selected_template;
      if (patch.hidden_widgets) update.hidden_widgets = patch.hidden_widgets;
      if (patch.visible_widgets) update.visible_widgets = patch.visible_widgets;
      if (Object.keys(update).length === 0) return;
      const { error } = await supabase
        .from("dashboard_preferences" as never)
        .update(update as never)
        .eq("organization_id", uid);
      if (error) console.error("[dashboard] remote save failed", error);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      user,
      session,
      organization,
      preferences,
      signIn,
      signUp,
      signOut,
      refreshOrganization,
      refreshPreferences,
    }),
    [loading, user, session, organization, preferences],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/**
 * Gate hook for protected routes. Returns `ready=true` once we have both an
 * authenticated user and a loaded organization (current NGO). When auth is
 * fully resolved and no user exists, navigates to /login.
 */
export function useRequireOrg() {
  const { loading, user, organization } = useAuth();
  const current = useNgoStore((s) => s.current);
  useEffect(() => {
    if (!loading && !user && typeof window !== "undefined") {
      window.location.replace("/login");
    }
  }, [loading, user]);
  const ready = !loading && !!user && !!organization && !!current;
  return { ready, current, organization };
}
