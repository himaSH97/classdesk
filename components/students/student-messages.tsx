"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MessageSquare } from "lucide-react";
import { createTeacherMessage, Thread } from "@/components/messages/messages-view";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ConversationOverview } from "@/lib/data";

/**
 * "Message" button on a student's page. Opens a dropdown with the conversation
 * (same thread view as the Messages page) so the teacher can read and reply
 * without leaving the page.
 */
export function StudentMessages({ conversation: initial, today }: { conversation: ConversationOverview; today: string }) {
  const [conversation, setConversation] = useState(initial);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const unread = conversation.unread;

  function send(text: string) {
    const message = createTeacherMessage(conversation, text, today);
    setConversation((c) => ({ ...c, messages: [...c.messages, message] }));
    setSentIds((ids) => new Set(ids).add(message.id));
  }

  return (
    <Popover
      // Opening the conversation counts as reading it.
      onOpenChange={(open) => open && unread > 0 && setConversation((c) => ({ ...c, unread: 0 }))}
    >
      <PopoverTrigger render={<Button variant="outline" className="self-start sm:self-center" />}>
        <MessageSquare />
        Message
        {unread > 0 && (
          <span
            className="flex size-4.5 items-center justify-center rounded-full bg-primary text-2xs font-medium text-primary-foreground tabular-nums"
            aria-label={`${unread} unread`}
          >
            {unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="flex h-[min(32rem,70svh)] w-[min(24rem,calc(100vw-2rem))] flex-col gap-0 overflow-hidden p-0"
      >
        <Thread
          conversation={conversation}
          today={today}
          sentIds={sentIds}
          onSend={send}
          headerAction={
            // A real link styled like a ghost icon button (not a Button rendered as <a>,
            // which Base UI would announce as a button).
            <Link
              href="/messages"
              aria-label="Open in Messages"
              title="Open in Messages"
              className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
            >
              <ArrowUpRight />
            </Link>
          }
        />
      </PopoverContent>
    </Popover>
  );
}
