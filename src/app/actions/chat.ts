"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { getAuthenticatedUserId } from "@/lib/auth";
import type { ChatMessage } from "@/types";

// One room's worth of history never needs to exceed this — older rows are
// deleted right after each send (see sendChatMessage's prune step below),
// so a plain read-time limit here is just a safety net, not the mechanism
// that actually enforces the cap.
const CHAT_ROOM_MESSAGE_CAP = 100;

interface ChatMessageRow {
  id: string;
  room_id: string;
  device_id: string;
  user_id: string | null;
  author_name: string;
  country_id: string | null;
  content: string;
  created_at: string;
}

const MESSAGE_COLUMNS = "id, room_id, device_id, user_id, author_name, country_id, content, created_at";

function toChatMessage(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    roomId: row.room_id,
    deviceId: row.device_id,
    userId: row.user_id,
    authorName: row.author_name,
    countryId: row.country_id,
    content: row.content,
    createdAt: row.created_at,
  };
}

// Called once per room switch/mount — the most recent 100 messages, oldest
// first (ready to render top-to-bottom).
export async function getRecentChatMessages(roomId: string): Promise<ChatMessage[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("chat_messages")
    .select(MESSAGE_COLUMNS)
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(CHAT_ROOM_MESSAGE_CAP);
  if (error || !data) return [];

  return data.map(toChatMessage).reverse();
}

// Polled every few seconds by chat-room.tsx while a room is open — only
// messages strictly newer than the last one already rendered.
export async function getChatMessagesSince(roomId: string, sinceCreatedAt: string | null): Promise<ChatMessage[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  let query = supabase.from("chat_messages").select(MESSAGE_COLUMNS).eq("room_id", roomId).order("created_at", { ascending: true });
  if (sinceCreatedAt) query = query.gt("created_at", sinceCreatedAt);

  const { data, error } = await query.limit(CHAT_ROOM_MESSAGE_CAP);
  if (error || !data) return [];

  return data.map(toChatMessage);
}

// Deletes every row in `roomId` beyond the 100 most recent — the actual
// enforcement of the rolling cap, run right after every insert. Not a
// database trigger: no stored procedures exist anywhere in this schema,
// logic lives in the Server Action layer like everywhere else in this app.
async function pruneRoom(supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>, roomId: string) {
  const { data: staleRows } = await supabase
    .from("chat_messages")
    .select("id")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .range(CHAT_ROOM_MESSAGE_CAP, CHAT_ROOM_MESSAGE_CAP + 500);
  if (staleRows && staleRows.length > 0) {
    await supabase
      .from("chat_messages")
      .delete()
      .in("id", staleRows.map((row) => row.id));
  }
}

// `deviceId` is always recorded (guest identity, or a signed-in sender's
// "last seen from" breadcrumb); `user_id` is set too when a session exists,
// and takes priority for the "own message"/profile-lookup purposes (see
// ChatMessage's userId field and chat-room.tsx).
export async function sendChatMessage(
  deviceId: string,
  roomId: string,
  authorName: string,
  countryId: string | null,
  content: string
): Promise<{ ok: boolean; message: ChatMessage | null }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, message: null };
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      room_id: roomId,
      device_id: deviceId,
      ...(userId ? { user_id: userId } : {}),
      author_name: authorName,
      country_id: countryId,
      content,
    })
    .select(MESSAGE_COLUMNS)
    .single();
  if (error || !data) return { ok: false, message: null };

  await pruneRoom(supabase, roomId);

  return { ok: true, message: toChatMessage(data) };
}
