import { ChatRoom } from "@/components/chat/chat-room";
import { SectionHeader } from "@/components/ui/section-header";
import { getRooms } from "@/lib/data/chat";

// Fills exactly the space main reserves between the top bar and the bottom
// nav clearance (see (app)/layout.tsx paddings) so only the message log
// scrolls — the input stays on-screen without scrolling the page.
export default function ChatPage() {
  const rooms = getRooms();

  return (
    <div className="flex h-[calc(100dvh-10.75rem-var(--safe-top)-var(--safe-bottom))] flex-col lg:h-[calc(100dvh-7rem)]">
      <SectionHeader eyebrow="Communauté" title="Chat" subtitle="Salons par pays et salon général, temps réel." />
      <ChatRoom rooms={rooms} />
    </div>
  );
}
