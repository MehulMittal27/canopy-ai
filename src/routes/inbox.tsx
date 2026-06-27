import { createFileRoute, redirect } from "@tanstack/react-router";
import { useNgoStore } from "@/lib/ngo-store";
import { items } from "@/data/items";

export const Route = createFileRoute("/inbox")({
  head: () => ({ meta: [{ title: "Posteingang · AidSignal" }] }),
  component: Inbox,
});

function Inbox() {
  const current = useNgoStore((s) => s.current);

  // Client-side guard: redirect to "/" if no NGO selected.
  if (!current) {
    throw redirect({ to: "/" });
  }

  const count = items.filter((i) => i.ngo_id === current.id).length;

  return (
    <div className="min-h-screen bg-background px-10 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="text-[15px] font-semibold text-foreground">AidSignal</div>
        <div className="mt-10 text-base text-foreground">
          Inbox für <span className="font-semibold">{current.name}</span> ·{" "}
          {count} Einträge geladen
        </div>
      </div>
    </div>
  );
}
