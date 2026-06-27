import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/pages/Login";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · Canopy" },
      { name: "description", content: "Sign in to your Canopy workspace." },
    ],
  }),
  component: LoginPage,
});
