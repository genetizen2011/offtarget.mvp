import LearnArticle from "@/components/LearnArticle";
import { getLearnPage } from "@/lib/learnContent";

export default function GrnaDesignPage() {
  const page = getLearnPage("grna-design");

  if (!page) return null;

  return <LearnArticle page={page} />;
}
