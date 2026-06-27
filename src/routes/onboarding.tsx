import { Navigate, createFileRoute } from "@tanstack/react-router";
import { OnboardingPage } from "@/pages/Onboarding";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Onboarding · Canopy" }] }),
  component: OnboardingRoute,
});

function OnboardingRoute() {
  const { user, org, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{
          background: "#F2F1EC",
          color: "#6E6E64",
          fontFamily: '"Schibsted Grotesk", -apple-system, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <div
          aria-label="Loading"
          className="h-8 w-8 animate-spin rounded-full"
          style={{
            border: "3px solid #CFE3DC",
            borderTopColor: "#16A06B",
          }}
        />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (org) return <Navigate to="/dashboard" replace />;

  return <OnboardingPage />;
}
