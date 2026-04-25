import LearnArticle from "@/components/LearnArticle";
import { getLearnPage } from "@/lib/learnContent";

export default function CrisprOverviewPage() {
  const page = getLearnPage("crispr-overview");

  if (!page) return null;

  return <LearnArticle page={page} />;
}
