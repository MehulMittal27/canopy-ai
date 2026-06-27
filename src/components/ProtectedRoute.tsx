import { Navigate, Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

function LoadingScreen() {
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

export function ProtectedRoute({ children }: { children?: ReactNode }) {
  const { user, org, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!org) return <Navigate to="/onboarding" replace />;

  return children ? <>{children}</> : <Outlet />;
}
