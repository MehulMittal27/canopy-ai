import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getMyOrg, type Org } from "@/lib/api/orgs";
import { NGOS, useNgoStore, type CurrentNgo, type NgoId } from "@/lib/ngo-store";
import { useDashboardStore } from "@/lib/dashboard-store";
import { supabase } from "@/lib/supabase";

interface SignInResult {
  user: User;
  org: Org | null;
}

interface SignUpResult {
  user: User | null;
}

interface AuthContextValue {
  user: User | null;
  org: Org | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signInDemo: (ngoId: NgoId) => Promise<SignInResult>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  refreshOrg: () => Promise<Org | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const DEMO_AUTH_KEY = "canopy_demo_auth";

function ngoFromOrg(org: Org): CurrentNgo | null {
  if (org.slug === "burundi-kids") {
    return { ...NGOS.bk, name: org.name };
  }
  if (org.slug === "wtg") {
    return { ...NGOS.wtg, name: org.name };
  }

  return {
    id: org.slug as CurrentNgo["id"],
    name: org.name,
    workingLanguage: "en",
    topics: org.topics ?? [],
  };
}

function clearDemoNgoId() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEMO_AUTH_KEY);
}

function demoEmailForNgo(ngoId: NgoId): string {
  return ngoId === "bk" ? "burundi-kids@canopy.demo" : "wtg@canopy.demo";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [org, setOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);

  const setNgo = useNgoStore((s) => s.setNgo);
  const clearNgo = useNgoStore((s) => s.logout);

  const syncOrg = useCallback(
    (nextOrg: Org | null) => {
      setOrg(nextOrg);
      if (!nextOrg) {
        clearNgo();
        return;
      }
      const nextNgo = ngoFromOrg(nextOrg);
      if (nextNgo) {
        setNgo(nextNgo);
      }
    },
    [clearNgo, setNgo],
  );

  const fetchOrgForUser = useCallback(
    async (nextUser: User | null): Promise<Org | null> => {
      if (!nextUser) {
        setUser(null);
        syncOrg(null);
        return null;
      }

      setUser(nextUser);
      const nextOrg = await getMyOrg();
      syncOrg(nextOrg);
      return nextOrg;
    },
    [syncOrg],
  );

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      setLoading(true);
      clearDemoNgoId();

      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error) {
        setUser(null);
        syncOrg(null);
        setLoading(false);
        return;
      }

      try {
        await fetchOrgForUser(data.session?.user ?? null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoading(true);
      setTimeout(() => {
        fetchOrgForUser(session?.user ?? null).finally(() => {
          if (mounted) setLoading(false);
        });
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchOrgForUser, syncOrg]);

  const refreshOrg = useCallback(async () => {
    return fetchOrgForUser(user);
  }, [fetchOrgForUser, user]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      clearDemoNgoId();
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.user) throw new Error("Sign in did not return a user.");
        const nextOrg = await fetchOrgForUser(data.user);
        return { user: data.user, org: nextOrg };
      } finally {
        setLoading(false);
      }
    },
    [fetchOrgForUser],
  );

  const signInDemo = useCallback(
    async (ngoId: NgoId) => {
      return signIn(demoEmailForNgo(ngoId), "canopy123");
    },
    [signIn],
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      clearDemoNgoId();
      try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          await fetchOrgForUser(data.user);
        }
        return { user: data.user };
      } finally {
        setLoading(false);
      }
    },
    [fetchOrgForUser],
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    clearDemoNgoId();
    useDashboardStore.getState().clear();
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      syncOrg(null);
    } finally {
      setLoading(false);
    }
  }, [syncOrg]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      org,
      loading,
      signIn,
      signInDemo,
      signUp,
      signOut,
      refreshOrg,
    }),
    [loading, org, refreshOrg, signIn, signInDemo, signOut, signUp, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
