import type { Guide } from "./api";

export const GUIDE_COLUMNS = [
  { key: "sequence", label: "Sequence", csvHeader: "Sequence" },
  { key: "gc_content", label: "GC %", csvHeader: "GC%" },
  { key: "score", label: "Score", csvHeader: "Score" },
  { key: "risk", label: "Risk", csvHeader: "Risk" },
  { key: "position", label: "PAM position", csvHeader: "PAM position" },
  { key: "strand", label: "Strand", csvHeader: "Strand" },
] as const satisfies readonly {
  key: keyof Pick<Guide, "sequence" | "gc_content" | "score" | "risk" | "position" | "strand">;
  label: string;
  csvHeader: string;
}[];

export type GuideColumnKey = (typeof GUIDE_COLUMNS)[number]["key"];
