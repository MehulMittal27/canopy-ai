import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { createOrgForCurrentUser } from "@/lib/api/orgs";

const FONT_STACK =
  '"Schibsted Grotesk", -apple-system, "Helvetica Neue", Arial, sans-serif';

function Spinner() {
  return (
    <div
      aria-label="Loading"
      className="h-8 w-8 animate-spin rounded-full"
      style={{
        border: "3px solid #CFE3DC",
        borderTopColor: "#16A06B",
      }}
    />
  );
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const { refreshOrg } = useAuth();
  const hasStarted = useRef(false);
  const [orgName, setOrgName] = useState("");
  const [needsOrgName, setNeedsOrgName] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createWorkspace = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNeedsOrgName(true);
      return;
    }

    setCreating(true);
    setNeedsOrgName(false);
    setError(null);

    try {
      await createOrgForCurrentUser(trimmed);
      window.sessionStorage.removeItem("pending_full_name");
      window.sessionStorage.removeItem("pending_org_name");
      await refreshOrg();
      navigate({ to: "/choose-template" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set up your workspace.");
      setCreating(false);
    }
  };

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const pendingOrgName = window.sessionStorage.getItem("pending_org_name")?.trim() ?? "";
    setOrgName(pendingOrgName);

    if (!pendingOrgName) {
      setNeedsOrgName(true);
      return;
    }

    createWorkspace(pendingOrgName);
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createWorkspace(orgName);
  };

  const retry = () => {
    createWorkspace(orgName);
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{
        background: "#F2F1EC",
        color: "#1B1B17",
        fontFamily: FONT_STACK,
      }}
    >
      <div
        className="w-full max-w-[420px]"
        style={{
          background: "#FFFFFF",
          border: "1px solid #EBEAE4",
          borderRadius: 18,
          boxShadow: "0 1px 2px rgba(20,20,18,.04), 0 14px 30px -22px rgba(20,20,18,.22)",
          padding: 32,
        }}
      >
        {creating ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <Spinner />
            <div style={{ fontSize: 15, fontWeight: 600 }}>Setting up your workspace...</div>
          </div>
        ) : needsOrgName ? (
          <>
            <h1
              className="text-center"
              style={{ fontSize: 24, fontWeight: 600, color: "#1B1B17" }}
            >
              Name your workspace
            </h1>
            <p className="mt-1.5 text-center" style={{ fontSize: 13, color: "#6E6E64" }}>
              We need your organization name to finish setup.
            </p>

            <form className="mt-7 grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-1.5">
                <span style={{ fontSize: 12, fontWeight: 600, color: "#6E6E64" }}>
                  Organization name
                </span>
                <input
                  type="text"
                  value={orgName}
                  onChange={(event) => setOrgName(event.target.value)}
                  required
                  className="h-11 rounded-xl px-3 text-sm outline-none"
                  style={{
                    border: "1px solid #EBEAE4",
                    color: "#1B1B17",
                    background: "#FFFFFF",
                  }}
                />
              </label>

              {error && (
                <div
                  role="alert"
                  style={{
                    background: "#FBE9E7",
                    color: "#CC4444",
                    borderRadius: 10,
                    padding: "9px 11px",
                    fontSize: 13,
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="h-11 rounded-xl text-sm font-semibold text-white"
                style={{ background: "#137A5C" }}
              >
                Continue
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <div
              role="alert"
              style={{
                background: "#FBE9E7",
                color: "#CC4444",
                borderRadius: 10,
                padding: "9px 11px",
                fontSize: 13,
              }}
            >
              {error ?? "Could not set up your workspace."}
            </div>
            <button
              type="button"
              onClick={retry}
              className="h-10 rounded-xl px-5 text-sm font-semibold text-white"
              style={{ background: "#137A5C" }}
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
