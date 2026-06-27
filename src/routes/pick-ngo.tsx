import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/pick-ngo")({
  head: () => ({
    meta: [{ title: "Redirecting · Canopy" }],
  }),
  component: PickNgoRedirect,
});

function PickNgoRedirect() {
  const navigate = useNavigate();
  const { user, org, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    navigate({ to: org ? "/dashboard" : "/onboarding" });
  }, [loading, navigate, org, user]);

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{
        background: "#F2F1EC",
        color: "#6E6E64",
        fontFamily: '"Schibsted Grotesk", -apple-system, "Helvetica Neue", Arial, sans-serif',
        fontSize: 13,
      }}
    >
      Loading your workspace...
    </div>
  );
}
