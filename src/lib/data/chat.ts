import { chatRooms } from "@/lib/mock/chat";
import type { ChatRoom } from "@/types";

// Rooms are a static/derived list (54 nations + "Général") — nothing about
// a room is user-editable, so unlike messages there's no table to read
// here. Messages themselves are real now: see app/actions/chat.ts
// (getRecentChatMessages/getChatMessagesSince, polled from chat-room.tsx)
// and supabase/schema.sql's chat_messages table.
export function getRooms(): ChatRoom[] {
  return chatRooms;
}
