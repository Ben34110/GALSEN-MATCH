import { QuizHallOfFameView } from "@/components/fantasy/quiz-hall-of-fame-view";
import { getQuizHallOfFame } from "@/lib/data/quiz-hall-of-fame";

export default async function QuizHallOfFamePage() {
  const weeks = await getQuizHallOfFame();
  return <QuizHallOfFameView weeks={weeks} />;
}
