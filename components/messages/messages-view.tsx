"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, ChevronLeft, MessagesSquare } from "lucide-react";
import { FilterTabs, SearchField } from "@/components/dashboard/list-controls";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { ConversationOverview, Message } from "@/lib/data";
import { formatClock, formatDayLabel, formatInboxTime } from "@/lib/format";
import { avatarColor } from "@/lib/styles";
import { cn } from "@/lib/utils";

type InboxFilter = "all" | "unread";
const inboxFilters: { value: InboxFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
];

/** Messages from the same sender within this many minutes are grouped (one timestamp). */
const GROUP_MINUTES = 10;

const lastMessage = (c: ConversationOverview) => c.messages[c.messages.length - 1];

/**
 * A message from the teacher, stamped with the mock "today" and the current clock
 * time (never earlier than the conversation's last message). Shared with the
 * student page's message dropdown.
 */
export function createTeacherMessage(c: ConversationOverview, text: string, today: string): Message {
  const now = new Date();
  const clock = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const candidate = `${today}T${clock}`;
  const last = c.messages.at(-1)?.sentAt ?? "";
  return { id: `m-local-${Date.now()}`, from: "teacher", sentAt: candidate > last ? candidate : last, text };
}
const minutes = (sentAt: string) => Date.parse(`${sentAt}:00Z`) / 60_000;

export function MessagesView({ initial, today }: { initial: ConversationOverview[]; today: string }) {
  const [conversations, setConversations] = useState(initial);
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 200);
  // Open the most recent conversation that's already read, so unread ones still stand out.
  const [selectedId, setSelectedId] = useState(
    () =>
      [...initial]
        .sort((a, b) => lastMessage(b).sentAt.localeCompare(lastMessage(a).sentAt))
        .find((c) => c.unread === 0)?.id ?? initial[0]?.id,
  );
  // Phones show one pane at a time: the inbox, or the open thread.
  const [showThreadOnMobile, setShowThreadOnMobile] = useState(false);
  // Messages sent this session animate in.
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const sorted = useMemo(
    () => [...conversations].sort((a, b) => lastMessage(b).sentAt.localeCompare(lastMessage(a).sentAt)),
    [conversations],
  );

  const visible = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return sorted.filter(
      (c) =>
        // Keep the open thread listed under "Unread" even after it's been read.
        (filter === "all" || c.unread > 0 || c.id === selectedId) &&
        (!q ||
          c.student.name.toLowerCase().includes(q) ||
          c.messages.some((m) => m.text.toLowerCase().includes(q))),
    );
  }, [sorted, filter, debouncedQuery, selectedId]);

  const selected = conversations.find((c) => c.id === selectedId);

  function open(id: string) {
    setSelectedId(id);
    setShowThreadOnMobile(true);
    setConversations((cs) => cs.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
  }

  function send(text: string) {
    if (!selected) return;
    const message = createTeacherMessage(selected, text, today);
    setConversations((cs) => cs.map((c) => (c.id === selected.id ? { ...c, messages: [...c.messages, message] } : c)));
    setSentIds((ids) => new Set(ids).add(message.id));
  }

  return (
    <div className="grid h-[calc(100svh-12.375rem)] min-h-[30rem] gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
      {/* Inbox */}
      <Card className={cn("gap-0 overflow-hidden py-0", showThreadOnMobile && "hidden lg:flex")}>
        <div className="flex flex-col gap-3 border-b p-3">
          <SearchField value={query} onChange={setQuery} placeholder="Search messages" />
          <FilterTabs options={inboxFilters} value={filter} onChange={setFilter} />
        </div>
        <ul className="flex-1 overflow-y-auto p-1.5">
          {visible.map((c) => (
            <li key={c.id}>
              <InboxRow conversation={c} today={today} selected={c.id === selectedId} onOpen={() => open(c.id)} />
            </li>
          ))}
          {visible.length === 0 && (
            <li className="px-3 py-10 text-center text-sm text-muted-foreground">
              {filter === "unread" && !debouncedQuery ? "You're all caught up." : "No conversations match."}
            </li>
          )}
        </ul>
      </Card>

      {/* Thread */}
      <Card className={cn("gap-0 overflow-hidden py-0", !showThreadOnMobile && "hidden lg:flex")}>
        {selected ? (
          <Thread
            key={selected.id}
            conversation={selected}
            today={today}
            sentIds={sentIds}
            onBack={() => setShowThreadOnMobile(false)}
            onSend={send}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
            <MessagesSquare className="size-6" />
            <p className="text-sm">Select a conversation</p>
          </div>
        )}
      </Card>
    </div>
  );
}

// ---------- inbox ----------

function StudentAvatar({ id, initials, className }: { id: string; initials: string; className?: string }) {
  return (
    <Avatar className={cn("size-10", className)} aria-hidden>
      <AvatarFallback className={cn("text-xs font-medium", avatarColor(id))}>{initials}</AvatarFallback>
    </Avatar>
  );
}

function InboxRow({
  conversation: c,
  today,
  selected,
  onOpen,
}: {
  conversation: ConversationOverview;
  today: string;
  selected: boolean;
  onOpen: () => void;
}) {
  const last = lastMessage(c);
  const unread = c.unread > 0;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors",
        selected ? "bg-muted" : "hover:bg-muted/60",
      )}
    >
      <StudentAvatar id={c.student.id} initials={c.student.initials} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={cn("truncate text-sm", unread ? "font-semibold" : "font-medium")}>{c.student.name}</p>
          <span className={cn("shrink-0 text-xs", unread ? "font-medium text-foreground" : "text-muted-foreground")}>
            {formatInboxTime(last.sentAt, today)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={cn("truncate text-xs", unread ? "text-foreground" : "text-muted-foreground")}>
            {last.from === "teacher" && "You: "}
            {last.text}
          </p>
          {unread && (
            <span
              className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-2xs font-medium text-primary-foreground tabular-nums"
              aria-label={`${c.unread} unread`}
            >
              {c.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ---------- thread ----------

/** Day sections, each split into runs of consecutive messages from one sender. */
function groupMessages(messages: Message[]) {
  const days: { date: string; runs: Message[][] }[] = [];
  for (const m of messages) {
    const date = m.sentAt.slice(0, 10);
    let day = days.at(-1);
    if (!day || day.date !== date) days.push((day = { date, runs: [] }));
    const run = day.runs.at(-1);
    const prev = run?.at(-1);
    if (run && prev && prev.from === m.from && minutes(m.sentAt) - minutes(prev.sentAt) <= GROUP_MINUTES) run.push(m);
    else day.runs.push([m]);
  }
  return days;
}

/** One conversation: header, messages, composer. Used by the Messages page and the student page dropdown. */
export function Thread({
  conversation: c,
  today,
  sentIds,
  onBack,
  headerAction,
  onSend,
}: {
  conversation: ConversationOverview;
  today: string;
  sentIds: Set<string>;
  /** Shows a back button on small screens (Messages page). */
  onBack?: () => void;
  /** Extra control on the right of the header (e.g. "Open in Messages"). */
  headerAction?: React.ReactNode;
  onSend: (text: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const days = useMemo(() => groupMessages(c.messages), [c.messages]);

  // Keep the newest message in view when opening a thread or sending.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [c.messages.length]);

  function submit() {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  }

  return (
    // Keyed by conversation in the parent, so switching threads fades the new one in.
    <div className="flex min-h-0 flex-1 flex-col animate-in duration-200 fade-in-0">
      <div className="flex items-center gap-3 border-b px-3 py-2.5">
        {onBack && (
          <Button variant="ghost" size="icon" aria-label="Back to inbox" className="lg:hidden" onClick={onBack}>
            <ChevronLeft />
          </Button>
        )}
        <StudentAvatar id={c.student.id} initials={c.student.initials} className="size-9" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{c.student.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {c.student.grade} · {c.student.classCodes.join(", ")}
          </p>
        </div>
        {headerAction}
      </div>

      <div ref={scrollRef} className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-5" aria-live="polite">
        {days.length === 0 && (
          <div className="m-auto flex flex-col items-center gap-2 text-center text-muted-foreground">
            <MessagesSquare className="size-6" />
            <p className="text-sm">No messages with {c.student.name.split(" ")[0]} yet.</p>
            <p className="text-xs">Say hello below.</p>
          </div>
        )}
        {days.map((day) => (
          <section key={day.date} className="flex flex-col gap-3">
            <p className="text-center text-xs font-medium text-muted-foreground">{formatDayLabel(day.date, today)}</p>
            {day.runs.map((run) => {
              const mine = run[0].from === "teacher";
              return (
                <div key={run[0].id} className={cn("flex flex-col gap-1", mine ? "items-end" : "items-start")}>
                  {run.map((m, i) => (
                    <p
                      key={m.id}
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words sm:max-w-[70%]",
                        mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                        // The last bubble in a run gets a tighter corner on the sender's side.
                        i === run.length - 1 && (mine ? "rounded-br-md" : "rounded-bl-md"),
                        sentIds.has(m.id) && "animate-in duration-300 fade-in-0 slide-in-from-bottom-2",
                      )}
                    >
                      {m.text}
                    </p>
                  ))}
                  <span className="px-1 text-2xs text-muted-foreground">
                    {mine ? "You · " : ""}
                    {formatClock(run.at(-1)!.sentAt)}
                  </span>
                </div>
              );
            })}
          </section>
        ))}
      </div>

      <form
        className="flex items-end gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends, Shift+Enter adds a new line (and never send mid-IME composition).
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder={`Message ${c.student.name.split(" ")[0]}`}
          aria-label={`Message ${c.student.name}`}
          className="max-h-32 min-h-9 resize-none rounded-xl"
        />
        <Button type="submit" size="icon" aria-label="Send" disabled={!draft.trim()} className="size-9 shrink-0 rounded-xl">
          <ArrowUp />
        </Button>
      </form>
    </div>
  );
}
