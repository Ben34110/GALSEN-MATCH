import { ChatRoom } from "@/components/chat/chat-room";
import { SectionHeader } from "@/components/ui/section-header";
import { getRooms } from "@/lib/data/chat";

export default function ChatPage() {
  const rooms = getRooms();

  return (
    <div>
      <SectionHeader eyebrow="Communauté" title="Chat" subtitle="Salons par pays et salon général, temps réel." />
      <ChatRoom rooms={rooms} />
    </div>
  );
}
