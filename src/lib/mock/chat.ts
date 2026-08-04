import type { ChatMessage, ChatRoom } from "@/types";

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export const chatRooms: ChatRoom[] = [
  { id: "general", type: "general", name: "Général", flag: "🌍" },
  { id: "sn", type: "country", countryCode: "SN", name: "Sénégal", flag: "🇸🇳" },
  { id: "ci", type: "country", countryCode: "CI", name: "Côte d'Ivoire", flag: "🇨🇮" },
  { id: "cm", type: "country", countryCode: "CM", name: "Cameroun", flag: "🇨🇲" },
  { id: "ml", type: "country", countryCode: "ML", name: "Mali", flag: "🇲🇱" },
  { id: "ma", type: "country", countryCode: "MA", name: "Maroc", flag: "🇲🇦" },
];

export const chatMessages: ChatMessage[] = [
  { id: "c1", roomId: "sn", authorName: "AminataD", content: "Jaraaf mène 1-0, la charnière tient bien ce soir 👏", createdAt: minutesAgo(11) },
  { id: "c2", roomId: "sn", authorName: "Modou_Tfc", content: "Vivement Teungueth-Guédiawaye à 18h, on peut prendre la tête", createdAt: minutesAgo(8) },
  { id: "c3", roomId: "sn", authorName: "FatouBall", content: "Quelqu'un a une compo probable pour Casa Sports ?", createdAt: minutesAgo(4) },
  { id: "c4", roomId: "general", authorName: "KouameFoot", content: "La CAN approche, les qualifs vont s'accélérer partout", createdAt: minutesAgo(22) },
  { id: "c5", roomId: "general", authorName: "YasmineCM", content: "Salut tout le monde depuis Douala 👋", createdAt: minutesAgo(15) },
  { id: "c6", roomId: "ci", authorName: "IbraDaloa", content: "Qui a suivi le match d'hier soir ?", createdAt: minutesAgo(40) },
  { id: "c7", roomId: "cm", authorName: "EtoFan237", content: "On prépare déjà l'équipe fantasy pour la prochaine journée", createdAt: minutesAgo(30) },
];

export function getMessagesForRoom(roomId: string): ChatMessage[] {
  return chatMessages
    .filter((message) => message.roomId === roomId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}
