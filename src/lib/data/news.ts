import { articles } from "@/lib/mock/articles";
import type { Article } from "@/types";

// Point de bascule : remplacer par une lecture Supabase (table `articles`,
// déjà remplie par le pipeline RSS + IA) une fois le projet branché.
export function getArticles(): Article[] {
  return [...articles].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}
