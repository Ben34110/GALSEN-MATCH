import { ChatRoom } from "@/components/chat/chat-room";
import { getRooms } from "@/lib/data/chat";
import { getAfricanPlayers } from "@/lib/data/african-players";

// Fills exactly the space main reserves between its own top/bottom padding
// and the bottom nav clearance (see (app)/layout.tsx paddings) so only the
// message log scrolls — the input stays on-screen without scrolling the page.
// Header text lives inside ChatRoom (a Client Component) since the locale is
// a client-only localStorage value this Server Component can't read — see
// AGENTS.md's i18n notes.
export default function ChatPage() {
  const rooms = getRooms();
  const playerPool = getAfricanPlayers();

  return (
    <div className="flex h-[calc(100dvh-7.25rem-var(--safe-top)-var(--safe-bottom))] flex-col lg:h-[calc(100dvh-7rem)]">
      <ChatRoom rooms={rooms} playerPool={playerPool} />
    </div>
  );
}
