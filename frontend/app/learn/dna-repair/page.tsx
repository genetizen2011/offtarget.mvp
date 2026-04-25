import LearnArticle from "@/components/LearnArticle";
import { getLearnPage } from "@/lib/learnContent";

export default function DnaRepairPage() {
  const page = getLearnPage("dna-repair");

  if (!page) return null;

  return <LearnArticle page={page} />;
}
