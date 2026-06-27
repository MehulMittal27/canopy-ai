import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/canopy/TopBar";
import { TranslatorTool } from "@/components/canopy/TranslatorTool";
import { useTranslatorSession } from "@/components/canopy/useTranslatorSession";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DetailHeader } from "./news";

export const Route = createFileRoute("/translator")({
  head: () => ({ meta: [{ title: "Translator · CANOPY" }] }),
  component: TranslatorRoute,
});

function TranslatorRoute() {
  return (
    <ProtectedRoute>
      <TranslatorView />
    </ProtectedRoute>
  );
}

function TranslatorView() {
  const translator = useTranslatorSession();

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <DetailHeader
        title="Translator"
        subtitle="Translate pasted text or PDF documents into the language your team needs"
      />
      <main className="mx-auto max-w-[1440px] px-6 pb-12">
        <TranslatorTool session={translator} variant="page" />
      </main>
    </div>
  );
}
