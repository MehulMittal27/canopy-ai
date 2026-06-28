import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Bot, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { sendAssistantMessage, type AssistantCitation } from "@/lib/api/assistant";
import { useAuth } from "@/contexts/AuthContext";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  citations?: AssistantCitation[];
};

type StoredChat = {
  sessionId: string | null;
  messages: ChatMessage[];
};

const FONT_STACK = '"Schibsted Grotesk", -apple-system, "Helvetica Neue", Arial, sans-serif';
const MAX_STORED_MESSAGES = 24;

export function BedrockAssistant() {
  const { user, org, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const storageKey = org?.slug ? `canopy_assistant_chat_${org.slug}` : null;
  const quickPrompts = useMemo(() => getQuickPrompts(org?.slug), [org?.slug]);

  useEffect(() => {
    if (!storageKey || !org) return;

    const stored = readStoredChat(storageKey);
    if (stored) {
      setMessages(stored.messages);
      setSessionId(stored.sessionId);
      return;
    }

    setMessages([
      {
        id: createMessageId(),
        role: "assistant",
        text: getGreeting(org.slug, org.name),
      },
    ]);
    setSessionId(createSessionId(org.slug));
  }, [org, storageKey]);

  useEffect(() => {
    if (!storageKey || messages.length === 0) return;
    writeStoredChat(storageKey, {
      sessionId,
      messages: messages.slice(-MAX_STORED_MESSAGES),
    });
  }, [messages, sessionId, storageKey]);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, pending]);

  if (loading || !user || !org) return null;

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    const userMessage: ChatMessage = { id: createMessageId(), role: "user", text: trimmed };
    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setError(null);
    setPending(true);

    try {
      const response = await sendAssistantMessage({ message: trimmed, sessionId });
      setSessionId(response.sessionId);
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "assistant",
          text: response.answer,
          citations: response.citations,
        },
      ]);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Assistant request failed.");
    } finally {
      setPending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(draft);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(draft);
    }
  };

  return (
    <div
      className="fixed bottom-5 right-5 z-50"
      style={{ fontFamily: FONT_STACK, color: "#1B1B17" }}
    >
      {open && (
        <section
          className="mb-3 flex max-h-[min(680px,calc(100vh-92px))] w-[min(390px,calc(100vw-32px))] flex-col overflow-hidden"
          aria-label="Canopy assistant"
          style={{
            border: "1px solid rgba(207, 227, 220, .95)",
            borderRadius: 18,
            background: "linear-gradient(180deg, #FFFFFF 0%, #FBF8FF 100%)",
            boxShadow:
              "0 20px 50px -28px rgba(20,20,18,.34), 0 10px 28px -20px rgba(22,160,107,.45)",
          }}
        >
          <div
            className="flex items-center justify-between gap-3"
            style={{ padding: "14px 14px 12px", borderBottom: "1px solid #F0EFEA" }}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center"
                style={{
                  borderRadius: 999,
                  background: "linear-gradient(135deg, #16A06B, #8B5CF6)",
                  color: "#FFFFFF",
                  boxShadow: "0 0 0 5px rgba(22,160,107,.12)",
                }}
              >
                <Sparkles size={17} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>Canopy Assistant</div>
                <div className="truncate" style={{ fontSize: 11.5, color: "#6E6E64" }}>
                  Searching {org.name}'s knowledge base
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="flex h-8 w-8 shrink-0 items-center justify-center hover:bg-[#F0F7F3]"
              style={{ borderRadius: 999, color: "#3A3A34" }}
            >
              <X size={16} strokeWidth={1.9} />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex flex-1 flex-col gap-3 overflow-y-auto"
            style={{ padding: "14px", minHeight: 260 }}
          >
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {pending && (
              <div className="flex items-center gap-2" style={{ color: "#6E6E64", fontSize: 12 }}>
                <Bot size={15} strokeWidth={1.8} />
                Searching filtered documents...
              </div>
            )}
          </div>

          <div style={{ padding: "0 14px 10px" }}>
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  disabled={pending}
                  className="hover:bg-[#F0F7F3] disabled:opacity-60"
                  style={{
                    border: "1px solid #CFE3DC",
                    borderRadius: 999,
                    background: "#FFFFFF",
                    color: "#137A5C",
                    fontSize: 11.5,
                    fontWeight: 650,
                    padding: "6px 9px",
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div
              style={{
                margin: "0 14px 10px",
                border: "1px solid #FBE9E7",
                borderRadius: 10,
                background: "#FBE9E7",
                color: "#CC4444",
                padding: "8px 10px",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ padding: "0 14px 14px" }}>
            <div
              className="flex items-end gap-2"
              style={{
                border: "1px solid #EBEAE4",
                borderRadius: 15,
                background: "#FFFFFF",
                padding: "8px 8px 8px 11px",
              }}
            >
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Ask about funding, news, reports..."
                disabled={pending}
                className="min-h-8 flex-1 resize-none bg-transparent outline-none disabled:opacity-60"
                style={{ color: "#1B1B17", fontSize: 13, lineHeight: 1.45 }}
              />
              <button
                type="submit"
                disabled={pending || !draft.trim()}
                aria-label="Send message"
                className="flex h-9 w-9 shrink-0 items-center justify-center disabled:opacity-45"
                style={{
                  borderRadius: 999,
                  background: "#16A06B",
                  color: "#FFFFFF",
                  boxShadow: "0 8px 20px -12px rgba(22,160,107,.9)",
                }}
              >
                <Send size={15} strokeWidth={2} />
              </button>
            </div>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className="ml-auto flex h-14 w-14 items-center justify-center"
        style={{
          borderRadius: 999,
          background: open ? "#1B1B17" : "linear-gradient(135deg, #16A06B, #8B5CF6)",
          color: "#FFFFFF",
          boxShadow: "0 18px 36px -20px rgba(20,20,18,.45), 0 0 0 6px rgba(22,160,107,.12)",
        }}
      >
        {open ? <X size={22} strokeWidth={2} /> : <MessageCircle size={22} strokeWidth={2} />}
      </button>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        style={{
          maxWidth: "86%",
          border: isUser ? "1px solid #16A06B" : "1px solid #F0EFEA",
          borderRadius: isUser ? "15px 15px 5px 15px" : "15px 15px 15px 5px",
          background: isUser ? "#16A06B" : "#FFFFFF",
          color: isUser ? "#FFFFFF" : "#1B1B17",
          padding: "9px 11px",
          fontSize: 12.5,
          lineHeight: 1.5,
          boxShadow: isUser ? "none" : "0 8px 24px -22px rgba(20,20,18,.35)",
          whiteSpace: "pre-wrap",
        }}
      >
        {message.text}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div style={{ marginTop: 8, borderTop: "1px solid #F4F3EE", paddingTop: 7 }}>
            {message.citations.slice(0, 3).map((citation, index) => (
              <div key={`${citation.sourceUri ?? citation.title ?? "source"}-${index}`}>
                {citation.sourceUri ? (
                  <a
                    href={citation.sourceUri}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#137A5C", fontSize: 11.5, fontWeight: 700 }}
                  >
                    {citation.title || `Source ${index + 1}`}
                  </a>
                ) : (
                  <span style={{ color: "#137A5C", fontSize: 11.5, fontWeight: 700 }}>
                    {citation.title || `Source ${index + 1}`}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting(slug: string, name: string) {
  if (slug === "burundi-kids") {
    return `Hi, I can search ${name}'s filtered knowledge base for Burundi, education, health, protection, and funding signals.`;
  }

  if (slug === "wtg") {
    return `Hi, I can search ${name}'s filtered knowledge base for animal welfare, wildlife trafficking, rabies, and East Africa updates.`;
  }

  return `Hi, I can search ${name}'s filtered knowledge base.`;
}

function getQuickPrompts(slug?: string) {
  if (slug === "burundi-kids") {
    return ["Funding for education", "Health risks in Burundi", "GBV updates"];
  }

  if (slug === "wtg") {
    return ["Animal welfare news", "Wildlife trafficking", "Rabies updates"];
  }

  return ["Recent funding", "Urgent updates", "Key reports"];
}

function createSessionId(slug: string) {
  return `canopy-${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readStoredChat(key: string): StoredChat | null {
  if (typeof window === "undefined") return null;

  try {
    const value = window.sessionStorage.getItem(key);
    if (!value) return null;

    const parsed = JSON.parse(value) as Partial<StoredChat>;
    if (!Array.isArray(parsed.messages)) return null;

    return {
      sessionId: typeof parsed.sessionId === "string" ? parsed.sessionId : null,
      messages: parsed.messages.filter(isChatMessage).slice(-MAX_STORED_MESSAGES),
    };
  } catch (_error) {
    return null;
  }
}

function writeStoredChat(key: string, value: StoredChat) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch (_error) {
    // Session history is a convenience only.
  }
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<ChatMessage>;
  return (
    typeof message.id === "string" &&
    (message.role === "assistant" || message.role === "user") &&
    typeof message.text === "string"
  );
}
