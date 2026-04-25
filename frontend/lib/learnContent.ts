import crisprOverview from "@/content/crispr-cas9-overview.json";
import dnaRepair from "@/content/dna-repair.json";
import guideRna from "@/content/guide-rna.json";
import offTarget from "@/content/off-target-effects.json";
import pam from "@/content/pam-ngg.json";

export type LearnTopic = {
  title: string;
  summary: string;
  sections: {
    heading: string;
    content: string;
  }[];
  key_points: string[];
  limitations: string;
  references: string[];
};

export type LearnPage = {
  slug: string;
  title: string;
  description: string;
  topics: LearnTopic[];
};

export const learnPages: LearnPage[] = [
  {
    slug: "crispr-overview",
    title: "CRISPR-Cas9 Overview",
    description: "Core mechanism, targeting constraints, and PAM recognition.",
    topics: [crisprOverview, pam],
  },
  {
    slug: "grna-design",
    title: "gRNA Design",
    description: "Guide RNA structure, spacer selection, and scoring context.",
    topics: [guideRna, pam],
  },
  {
    slug: "off-target",
    title: "Off-target Effects",
    description: "Specificity determinants and practical risk assessment.",
    topics: [offTarget],
  },
  {
    slug: "dna-repair",
    title: "DNA Repair",
    description: "NHEJ, HDR, and repair outcome interpretation.",
    topics: [dnaRepair],
  },
];

export function getLearnPage(slug: string) {
  return learnPages.find((page) => page.slug === slug);
}
