import { MessagesView } from "@/components/messages/messages-view";
import { getConversations, meta } from "@/lib/data";

export default function MessagesPage() {
  return (
    <div className="flex flex-col gap-6 pt-2">
      <header>
        <h1 className="text-2xl font-semibold">Messages</h1>
        <p className="text-sm text-muted-foreground">Conversations with your students.</p>
      </header>

      <MessagesView initial={getConversations()} today={meta.today} />
    </div>
  );
}
