import LearnArticle from "@/components/LearnArticle";
import { getLearnPage } from "@/lib/learnContent";

export default function OffTargetPage() {
  const page = getLearnPage("off-target");

  if (!page) return null;

  return <LearnArticle page={page} />;
}
