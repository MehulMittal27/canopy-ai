import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Building2,
  ChevronRight,
  FileText,
  Link2,
  MessageCircle,
  Paperclip,
  Plus,
  Search,
  Send,
  UsersRound,
  X,
} from "lucide-react";
import { TopBar } from "@/components/canopy/TopBar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useNgoStore, type NgoId } from "@/lib/ngo-store";

export const Route = createFileRoute("/connections")({
  head: () => ({ meta: [{ title: "Connections · Canopy" }] }),
  component: ConnectionsRoute,
});

type Presence = "available" | "busy" | "offline";

interface ChatMessage {
  id: string;
  sender: string;
  senderRole: "me" | "them";
  body: string;
  sentAt: string;
}

interface Participant {
  name: string;
  organization: string;
  role: string;
  presence: Presence;
}

interface Conversation {
  id: string;
  title: string;
  organization: string;
  type: "group" | "direct";
  topic: string;
  tags: string[];
  participants: Participant[];
  messages: ChatMessage[];
  updatedAt: string;
  unread: number;
}

interface ContactSeed {
  id: string;
  name: string;
  organization: string;
  role: string;
  topic: string;
  tags: string[];
}

const FONT_STACK =
  '"Schibsted Grotesk", -apple-system, "Helvetica Neue", Arial, sans-serif';
const STORAGE_KEY = "canopy.connectionsPrototype.v1";

const STATUS_META: Record<Presence, { label: string; color: string; bg: string }> = {
  available: { label: "Available", color: "#137A5C", bg: "#E7F3ED" },
  busy: { label: "In a meeting", color: "#B07814", bg: "#FBF1DC" },
  offline: { label: "Offline", color: "#6E6E64", bg: "#F4F3EE" },
};

function ConnectionsRoute() {
  return (
    <ProtectedRoute>
      <ConnectionsPage />
    </ProtectedRoute>
  );
}

function ConnectionsPage() {
  const current = useNgoStore((s) => s.current);
  if (!current) throw redirect({ to: "/login" });

  const { conversations, ready, sendMessage, createConversation, markRead } =
    useConnectionsPrototype(current.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [composer, setComposer] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (selectedId && conversations.some((conversation) => conversation.id === selectedId)) return;
    setSelectedId(conversations[0]?.id ?? null);
  }, [conversations, selectedId]);

  const visibleConversations = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return conversations;
    return conversations.filter((conversation) =>
      searchableConversationText(conversation).includes(needle),
    );
  }, [conversations, query]);

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedId) ??
    visibleConversations[0] ??
    null;

  const contacts = CONTACTS_BY_NGO[current.id];

  const handleSelect = (id: string) => {
    setSelectedId(id);
    markRead(id);
  };

  const submitMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedConversation || !composer.trim()) return;
    sendMessage(selectedConversation.id, composer.trim());
    setComposer("");
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: "#F2F1EC", color: "#1B1B17", fontFamily: FONT_STACK }}
    >
      <TopBar />
      <main className="mx-auto max-w-[1440px] px-6 py-8">
        <section className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#9B9B90]">
              Connections
            </div>
            <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.03em] text-[#1B1B17]">
              {current.name} collaboration space
            </h1>
            <p className="mt-1 max-w-[680px] text-[15px] leading-6 text-[#6E6E64]">
              Search partners, people, and organizations, then keep lightweight team chats in one
              shared workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-[11px] border px-4 text-[14px] font-semibold"
            style={{
              background: "#16A06B",
              borderColor: "#16A06B",
              color: "#FFFFFF",
              boxShadow: "0 14px 30px -18px rgba(22,160,107,.7)",
            }}
          >
            <Plus size={17} strokeWidth={2} />
            New chat
          </button>
        </section>

        <section
          className="grid min-h-[720px] overflow-hidden rounded-[18px] border bg-white lg:grid-cols-[320px_minmax(0,1fr)_320px]"
          style={{
            borderColor: "#EBEAE4",
            boxShadow: "0 1px 2px rgba(20,20,18,.04), 0 14px 30px -22px rgba(20,20,18,.22)",
          }}
        >
          <aside className="border-b border-[#F4F3EE] lg:border-b-0 lg:border-r">
            <div className="border-b border-[#F4F3EE] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-[#1B1B17]">
                    Chats
                  </h2>
                  <p className="mt-1 text-[13px] text-[#6E6E64]">
                    {conversations.length} local conversations
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  aria-label="Start a new chat"
                  className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#CFE3DC] bg-[#F0F7F3] text-[#137A5C]"
                >
                  <Plus size={16} />
                </button>
              </div>
              <label className="relative mt-4 block">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9B90]"
                  size={16}
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search people, NGOs, companies..."
                  className="h-11 w-full rounded-[10px] border bg-[#FAF9F5] pl-9 pr-9 text-[14px] outline-none"
                  style={{ borderColor: "#E6E5DF", color: "#1B1B17" }}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[8px] text-[#9B9B90] hover:bg-[#EDECE6]"
                  >
                    <X size={14} />
                  </button>
                )}
              </label>
            </div>

            <div className="max-h-[620px] overflow-y-auto p-3">
              {!ready && <div className="px-3 py-8 text-center text-[14px] text-[#6E6E64]">Loading chats...</div>}
              {ready && visibleConversations.length === 0 && (
                <div className="px-3 py-10 text-center">
                  <div className="text-[15px] font-semibold text-[#1B1B17]">No matches found.</div>
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="mt-3 text-[13px] font-semibold text-[#137A5C] hover:underline"
                  >
                    Clear search
                  </button>
                </div>
              )}
              {visibleConversations.map((conversation) => (
                <ConversationButton
                  key={conversation.id}
                  conversation={conversation}
                  active={conversation.id === selectedConversation?.id}
                  onClick={() => handleSelect(conversation.id)}
                />
              ))}
            </div>
          </aside>

          <section className="flex min-h-[640px] min-w-0 flex-col bg-[#F7F8F7]">
            {selectedConversation ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E9E8E2] bg-white px-5 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar label={selectedConversation.title} size="lg" />
                    <div className="min-w-0">
                      <h2 className="truncate text-[18px] font-semibold tracking-[-0.02em] text-[#1B1B17]">
                        {selectedConversation.title}
                      </h2>
                      <p className="truncate text-[13px] text-[#6E6E64]">
                        {selectedConversation.organization} · {selectedConversation.topic}
                      </p>
                    </div>
                  </div>
                  <div className="inline-flex rounded-[999px] bg-[#E7F3ED] p-1 text-[13px] font-semibold text-[#137A5C]">
                    <span className="rounded-[999px] bg-white px-3 py-1 shadow-sm">Messages</span>
                    <span className="px-3 py-1 text-[#6E6E64]">
                      {selectedConversation.participants.length} participants
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6">
                  {selectedConversation.messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                </div>

                <form onSubmit={submitMessage} className="border-t border-[#E9E8E2] bg-white p-4">
                  <div className="flex items-center gap-3 rounded-[15px] border border-[#EBEAE4] bg-[#FAF9F5] p-2">
                    <button
                      type="button"
                      aria-label="Attach file"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-white text-[#9B9B90]"
                    >
                      <Paperclip size={17} />
                    </button>
                    <input
                      value={composer}
                      onChange={(event) => setComposer(event.target.value)}
                      placeholder={`Message ${selectedConversation.title}`}
                      className="h-10 min-w-0 flex-1 bg-transparent text-[14px] text-[#1B1B17] outline-none placeholder:text-[#9B9B90]"
                    />
                    <button
                      type="submit"
                      disabled={!composer.trim()}
                      aria-label="Send message"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] text-white disabled:cursor-not-allowed disabled:opacity-45"
                      style={{ background: "#16A06B" }}
                    >
                      <Send size={17} />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-center">
                <div>
                  <MessageCircle className="mx-auto text-[#C9C8C0]" size={42} />
                  <h2 className="mt-4 text-[18px] font-semibold text-[#1B1B17]">
                    Pick a conversation
                  </h2>
                  <p className="mt-1 text-[14px] text-[#6E6E64]">
                    Search by person, NGO, company, or message text.
                  </p>
                </div>
              </div>
            )}
          </section>

          <aside className="border-t border-[#F4F3EE] bg-white lg:border-l lg:border-t-0">
            {selectedConversation && <DetailsPanel conversation={selectedConversation} />}
          </aside>
        </section>
      </main>

      {pickerOpen && (
        <ContactPicker
          contacts={contacts}
          onClose={() => setPickerOpen(false)}
          onCreate={(contact) => {
            const id = createConversation(contact);
            setSelectedId(id);
            setPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}

function ConversationButton({
  conversation,
  active,
  onClick,
}: {
  conversation: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-2 grid w-full grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3 rounded-[14px] px-3 py-3 text-left transition hover:bg-[#FAF9F5]"
      style={{ background: active ? "#F0F7F3" : "#FFFFFF" }}
    >
      <Avatar label={conversation.title} />
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="truncate text-[14px] font-semibold text-[#1B1B17]">
            {conversation.title}
          </span>
          {conversation.type === "group" && <UsersRound size={13} className="shrink-0 text-[#9B9B90]" />}
        </span>
        <span className="mt-0.5 block truncate text-[12px] font-medium text-[#6E6E64]">
          {conversation.organization}
        </span>
        <span className="mt-1 block truncate text-[12px] text-[#9B9B90]">
          {lastMessage?.body ?? "No messages yet"}
        </span>
      </span>
      <span className="flex flex-col items-end gap-2">
        <span className="text-[11px] font-medium text-[#9B9B90]">{shortTime(conversation.updatedAt)}</span>
        {conversation.unread > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#16A06B] px-1.5 text-[11px] font-bold text-white">
            {conversation.unread}
          </span>
        )}
      </span>
    </button>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const mine = message.senderRole === "me";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[78%] gap-3 ${mine ? "flex-row-reverse" : "flex-row"}`}>
        <Avatar label={message.sender} size="sm" />
        <div>
          <div className={`mb-1 text-[11px] font-semibold text-[#6E6E64] ${mine ? "text-right" : ""}`}>
            {mine ? "You" : message.sender}, {shortTime(message.sentAt)}
          </div>
          <div
            className="rounded-[16px] px-4 py-3 text-[14px] leading-6"
            style={{
              background: mine ? "#DDE2F1" : "#FFFFFF",
              color: "#273047",
              border: mine ? "1px solid #D6DCEC" : "1px solid #EBEAE4",
              borderTopRightRadius: mine ? 5 : 16,
              borderTopLeftRadius: mine ? 16 : 5,
              boxShadow: "0 10px 24px -22px rgba(20,20,18,.35)",
            }}
          >
            {message.body}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailsPanel({ conversation }: { conversation: Conversation }) {
  const files = [
    { label: "Documents", count: 12, icon: FileText, bg: "#E7E9FB", color: "#626DCE" },
    { label: "Shared links", count: 8, icon: Link2, bg: "#E7F3ED", color: "#137A5C" },
    { label: "Organizations", count: conversation.participants.length, icon: Building2, bg: "#FBF1DC", color: "#B07814" },
  ];

  return (
    <div className="p-5">
      <div className="border-b border-[#F4F3EE] pb-5 text-center">
        <Avatar label={conversation.title} size="xl" />
        <h2 className="mt-4 text-[20px] font-semibold tracking-[-0.03em] text-[#1B1B17]">
          {conversation.title}
        </h2>
        <p className="mt-1 text-[13px] text-[#6E6E64]">{conversation.organization}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {conversation.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-[999px] bg-[#F4F3EE] px-2.5 py-1 text-[12px] font-semibold text-[#6E6E64]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="border-b border-[#F4F3EE] py-5">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#9B9B90]">
          Participants
        </h3>
        <div className="mt-3 space-y-3">
          {conversation.participants.map((participant) => (
            <div key={`${participant.name}-${participant.organization}`} className="flex items-center gap-3">
              <Avatar label={participant.name} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-[#1B1B17]">
                  {participant.name}
                </div>
                <div className="truncate text-[12px] text-[#6E6E64]">{participant.role}</div>
              </div>
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: STATUS_META[participant.presence].color }}
                title={STATUS_META[participant.presence].label}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="py-5">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#9B9B90]">
          Shared space
        </h3>
        <div className="mt-3 grid gap-3">
          {files.map((file) => {
            const Icon = file.icon;
            return (
              <button
                key={file.label}
                type="button"
                className="flex items-center gap-3 rounded-[13px] border border-[#F4F3EE] bg-white p-3 text-left hover:bg-[#FAF9F5]"
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-[11px]"
                  style={{ background: file.bg, color: file.color }}
                >
                  <Icon size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-[#1B1B17]">{file.label}</span>
                  <span className="block text-[12px] text-[#9B9B90]">{file.count} items</span>
                </span>
                <ChevronRight size={15} className="text-[#9B9B90]" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ContactPicker({
  contacts,
  onClose,
  onCreate,
}: {
  contacts: ContactSeed[];
  onClose: () => void;
  onCreate: (contact: ContactSeed) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return contacts;
    return contacts.filter((contact) =>
      `${contact.name} ${contact.organization} ${contact.role} ${contact.topic} ${contact.tags.join(" ")}`
        .toLowerCase()
        .includes(needle),
    );
  }, [contacts, query]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,20,18,.28)] px-4">
      <div
        className="w-full max-w-[620px] rounded-[18px] border bg-white p-5"
        style={{
          borderColor: "#EBEAE4",
          boxShadow: "0 24px 70px -30px rgba(20,20,18,.45)",
          fontFamily: FONT_STACK,
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#9B9B90]">
              New connection
            </div>
            <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.03em] text-[#1B1B17]">
              Start a fake demo chat
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] border border-[#E6E5DF] px-3 py-2 text-[13px] font-semibold text-[#6E6E64]"
          >
            Close
          </button>
        </div>

        <label className="relative mt-5 block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9B90]" size={16} />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, NGO, company, or role..."
            className="h-11 w-full rounded-[10px] border border-[#E6E5DF] bg-white pl-9 pr-3 text-[14px] outline-none"
          />
        </label>

        <div className="mt-4 max-h-[360px] overflow-y-auto">
          {filtered.map((contact) => (
            <button
              key={contact.id}
              type="button"
              onClick={() => onCreate(contact)}
              className="mb-2 flex w-full items-center gap-3 rounded-[14px] border border-[#F4F3EE] p-3 text-left hover:bg-[#FAF9F5]"
            >
              <Avatar label={contact.name} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold text-[#1B1B17]">
                  {contact.name}
                </span>
                <span className="block truncate text-[13px] text-[#6E6E64]">
                  {contact.organization} · {contact.role}
                </span>
              </span>
              <span className="rounded-[999px] bg-[#E7F3ED] px-2.5 py-1 text-[12px] font-semibold text-[#137A5C]">
                {contact.topic}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="py-8 text-center text-[14px] text-[#6E6E64]">No contacts match that search.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Avatar({
  label,
  size = "md",
}: {
  label: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const classes = {
    sm: "h-8 w-8 text-[11px]",
    md: "h-10 w-10 text-[12px]",
    lg: "h-12 w-12 text-[14px]",
    xl: "mx-auto h-20 w-20 text-[22px]",
  }[size];
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-[#137A5C] ${classes}`}
      style={{ background: "#E7F3ED", boxShadow: "inset 0 0 0 1px #CFE3DC" }}
    >
      {initials(label)}
    </span>
  );
}

function useConnectionsPrototype(ngoId: NgoId) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredConversations();
    const next = stored[ngoId] ?? seedConversations(ngoId);
    setConversations(next);
    setReady(true);
  }, [ngoId]);

  useEffect(() => {
    if (!ready) return;
    const stored = readStoredConversations();
    stored[ngoId] = conversations;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }, [ngoId, ready, conversations]);

  const sendMessage = (conversationId: string, body: string) => {
    const now = new Date().toISOString();
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              updatedAt: now,
              messages: [
                ...conversation.messages,
                {
                  id: `msg-${Date.now()}`,
                  sender: "You",
                  senderRole: "me",
                  body,
                  sentAt: now,
                },
              ],
            }
          : conversation,
      ),
    );
  };

  const createConversation = (contact: ContactSeed) => {
    const now = new Date().toISOString();
    const id = `local-${contact.id}-${Date.now()}`;
    const conversation: Conversation = {
      id,
      title: contact.name,
      organization: contact.organization,
      type: "direct",
      topic: contact.topic,
      tags: contact.tags,
      participants: [
        {
          name: contact.name,
          organization: contact.organization,
          role: contact.role,
          presence: "available",
        },
        {
          name: "You",
          organization: "Canopy workspace",
          role: "Programme team",
          presence: "available",
        },
      ],
      messages: [
        {
          id: `${id}-welcome`,
          sender: contact.name,
          senderRole: "them",
          body: `Hi, happy to coordinate on ${contact.topic.toLowerCase()} here.`,
          sentAt: now,
        },
      ],
      updatedAt: now,
      unread: 0,
    };
    setConversations((prev) => [conversation, ...prev]);
    return id;
  };

  const markRead = (conversationId: string) => {
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === conversationId ? { ...conversation, unread: 0 } : conversation,
      ),
    );
  };

  return { conversations, ready, sendMessage, createConversation, markRead };
}

function readStoredConversations(): Record<string, Conversation[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Conversation[]>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function searchableConversationText(conversation: Conversation) {
  return [
    conversation.title,
    conversation.organization,
    conversation.topic,
    ...conversation.tags,
    ...conversation.participants.flatMap((participant) => [
      participant.name,
      participant.organization,
      participant.role,
    ]),
    ...conversation.messages.map((message) => message.body),
  ]
    .join(" ")
    .toLowerCase();
}

function seedConversations(ngoId: NgoId): Conversation[] {
  return ngoId === "bk" ? BURUNDI_CONVERSATIONS : WTG_CONVERSATIONS;
}

function initials(label: string) {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function shortTime(value: string) {
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

const CONTACTS_BY_NGO: Record<NgoId, ContactSeed[]> = {
  bk: [
    {
      id: "claudia-giz",
      name: "Claudia Werner",
      organization: "GIZ Education Partnership",
      role: "Programme officer",
      topic: "Education",
      tags: ["GIZ", "donor", "Germany"],
    },
    {
      id: "jean-bujumbura",
      name: "Jean Ndayisaba",
      organization: "Bujumbura School Network",
      role: "Field coordinator",
      topic: "Schools",
      tags: ["Burundi", "field", "Kirundi"],
    },
    {
      id: "sarah-translation",
      name: "Sarah Klein",
      organization: "Canopy Translation Pool",
      role: "French and German translator",
      topic: "Translation",
      tags: ["French", "German", "documents"],
    },
  ],
  wtg: [
    {
      id: "maria-vets",
      name: "Maria Okafor",
      organization: "African Veterinary Alliance",
      role: "Regional partner lead",
      topic: "Animal Welfare",
      tags: ["Africa", "veterinary", "partner"],
    },
    {
      id: "nils-policy",
      name: "Nils Becker",
      organization: "WTG Policy Desk",
      role: "Policy analyst",
      topic: "Policy",
      tags: ["Germany", "briefing", "coalition"],
    },
    {
      id: "lina-comms",
      name: "Lina Hoffmann",
      organization: "Global Animal Care Fund",
      role: "Communications contact",
      topic: "Communications",
      tags: ["funding", "media", "updates"],
    },
  ],
};

const BURUNDI_CONVERSATIONS: Conversation[] = [
  {
    id: "bk-school-network",
    title: "Burundi school network",
    organization: "Burundi Kids · Bujumbura School Network",
    type: "group",
    topic: "Education monitoring",
    tags: ["Burundi Kids", "schools", "Kirundi", "field reports"],
    participants: [
      {
        name: "Amina Ndayizeye",
        organization: "Burundi Kids",
        role: "Programme lead",
        presence: "available",
      },
      {
        name: "Jean Ndayisaba",
        organization: "Bujumbura School Network",
        role: "Field coordinator",
        presence: "busy",
      },
      {
        name: "Lea Fischer",
        organization: "Burundi Kids Germany",
        role: "Operations",
        presence: "available",
      },
    ],
    messages: [
      {
        id: "bk-school-1",
        sender: "Jean Ndayisaba",
        senderRole: "them",
        body: "The latest attendance notes are in French and Kirundi. I marked the three schools that need a follow-up call.",
        sentAt: daysAgo(1),
      },
      {
        id: "bk-school-2",
        sender: "You",
        senderRole: "me",
        body: "Great, please keep the urgent safeguarding note separate so we can route it before the donor update.",
        sentAt: hoursAgo(20),
      },
      {
        id: "bk-school-3",
        sender: "Amina Ndayizeye",
        senderRole: "them",
        body: "I can review the note this afternoon and add a short English summary for the team.",
        sentAt: hoursAgo(5),
      },
    ],
    updatedAt: hoursAgo(5),
    unread: 2,
  },
  {
    id: "bk-giz-donor",
    title: "GIZ donor follow-up",
    organization: "GIZ Education Partnership",
    type: "direct",
    topic: "Funding",
    tags: ["GIZ", "grant", "Germany", "reporting"],
    participants: [
      {
        name: "Claudia Werner",
        organization: "GIZ Education Partnership",
        role: "Programme officer",
        presence: "available",
      },
      {
        name: "Jonas Weber",
        organization: "Burundi Kids Germany",
        role: "Fundraising",
        presence: "offline",
      },
    ],
    messages: [
      {
        id: "bk-giz-1",
        sender: "Claudia Werner",
        senderRole: "them",
        body: "Could you send the updated classroom numbers before Friday? The grant committee wants one clean table.",
        sentAt: daysAgo(2),
      },
      {
        id: "bk-giz-2",
        sender: "You",
        senderRole: "me",
        body: "Yes. We are checking the newest field report and will share the numbers with the German summary.",
        sentAt: daysAgo(1),
      },
    ],
    updatedAt: daysAgo(1),
    unread: 0,
  },
  {
    id: "bk-translation-pool",
    title: "Translation pool",
    organization: "Canopy Translation Pool",
    type: "group",
    topic: "Translation",
    tags: ["French", "Kirundi", "German", "English"],
    participants: [
      {
        name: "Sarah Klein",
        organization: "Canopy Translation Pool",
        role: "French and German translator",
        presence: "available",
      },
      {
        name: "Olivier Hakizimana",
        organization: "Local language partner",
        role: "Kirundi reviewer",
        presence: "busy",
      },
    ],
    messages: [
      {
        id: "bk-trans-1",
        sender: "Sarah Klein",
        senderRole: "them",
        body: "I finished the German donor summary. Olivier is checking the Kirundi phrasing for the parent letter.",
        sentAt: hoursAgo(9),
      },
    ],
    updatedAt: hoursAgo(9),
    unread: 1,
  },
];

const WTG_CONVERSATIONS: Conversation[] = [
  {
    id: "wtg-africa-vets",
    title: "Africa veterinary partners",
    organization: "WTG · African Veterinary Alliance",
    type: "group",
    topic: "Animal welfare response",
    tags: ["WTG", "Africa", "veterinary", "field reports"],
    participants: [
      {
        name: "Maria Okafor",
        organization: "African Veterinary Alliance",
        role: "Regional partner lead",
        presence: "available",
      },
      {
        name: "Lea Fischer",
        organization: "WTG",
        role: "International programmes",
        presence: "busy",
      },
      {
        name: "Jonas Weber",
        organization: "WTG Germany",
        role: "Operations",
        presence: "available",
      },
    ],
    messages: [
      {
        id: "wtg-vets-1",
        sender: "Maria Okafor",
        senderRole: "them",
        body: "The field team flagged two urgent veterinary supply requests. One is ready for WTG review today.",
        sentAt: hoursAgo(14),
      },
      {
        id: "wtg-vets-2",
        sender: "You",
        senderRole: "me",
        body: "Please add the country, partner NGO name, and any photos so comms can decide what to include.",
        sentAt: hoursAgo(13),
      },
      {
        id: "wtg-vets-3",
        sender: "Jonas Weber",
        senderRole: "them",
        body: "I will turn the urgent request into a ticket after Maria confirms the quantities.",
        sentAt: hoursAgo(6),
      },
    ],
    updatedAt: hoursAgo(6),
    unread: 3,
  },
  {
    id: "wtg-policy",
    title: "Animal welfare policy desk",
    organization: "WTG Policy Desk",
    type: "direct",
    topic: "Policy",
    tags: ["policy", "Germany", "coalition", "briefing"],
    participants: [
      {
        name: "Nils Becker",
        organization: "WTG Policy Desk",
        role: "Policy analyst",
        presence: "available",
      },
    ],
    messages: [
      {
        id: "wtg-policy-1",
        sender: "Nils Becker",
        senderRole: "them",
        body: "I added notes from the coalition meeting. The English source needs a short German briefing before tomorrow.",
        sentAt: daysAgo(1),
      },
      {
        id: "wtg-policy-2",
        sender: "You",
        senderRole: "me",
        body: "Thanks. Keep the original source link attached so the team can verify before the digest goes out.",
        sentAt: hoursAgo(22),
      },
    ],
    updatedAt: hoursAgo(22),
    unread: 0,
  },
  {
    id: "wtg-comms-fund",
    title: "Global Animal Care Fund",
    organization: "Global Animal Care Fund",
    type: "direct",
    topic: "Communications",
    tags: ["funding", "media", "partner updates"],
    participants: [
      {
        name: "Lina Hoffmann",
        organization: "Global Animal Care Fund",
        role: "Communications contact",
        presence: "offline",
      },
    ],
    messages: [
      {
        id: "wtg-comms-1",
        sender: "Lina Hoffmann",
        senderRole: "them",
        body: "Can WTG share a short update on the shelter partner work? We can publish it with the next funder note.",
        sentAt: daysAgo(3),
      },
    ],
    updatedAt: daysAgo(3),
    unread: 1,
  },
];
