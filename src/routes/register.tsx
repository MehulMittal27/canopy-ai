import { createFileRoute } from "@tanstack/react-router";
import { RegisterPage } from "@/pages/Register";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account · Canopy" },
      { name: "description", content: "Create your Canopy workspace account." },
    ],
  }),
  component: RegisterPage,
});
