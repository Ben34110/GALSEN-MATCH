import { chatRooms, getMessagesForRoom } from "@/lib/mock/chat";
import type { ChatMessage, ChatRoom } from "@/types";

// Point de bascule : `getRooms` lira la table `chat_rooms`, et les messages
// seront synchronisés en direct via un canal Supabase Realtime plutôt que
// lus une seule fois au chargement.
export function getRooms(): ChatRoom[] {
  return chatRooms;
}

export function getInitialMessages(roomId: string): ChatMessage[] {
  return getMessagesForRoom(roomId);
}
