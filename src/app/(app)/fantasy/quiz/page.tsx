import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { QuizThemePicker } from "@/components/fantasy/quiz-theme-picker";

export default function QuizPage() {
  return (
    <div>
      <Link
        href="/fantasy"
        className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted transition-colors hover:text-foreground"
      >
        <ChevronLeft size={18} aria-hidden />
        Retour
      </Link>

      <QuizThemePicker />
    </div>
  );
}
