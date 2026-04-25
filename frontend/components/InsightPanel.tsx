import type { AnalyzeResponse } from "@/lib/api";

type InsightPanelProps = {
  results: AnalyzeResponse | null;
  isLoading: boolean;
};

export default function InsightPanel({ results, isLoading }: InsightPanelProps) {
  const bestGuide = results?.best_guide ?? null;

  let insight = "Run an analysis to generate design rationale and risk notes.";
  let riskNote = "No risks have been evaluated yet.";

  if (bestGuide) {
    const gcFit =
      bestGuide.gc_content >= 40 && bestGuide.gc_content <= 65
        ? "falls inside"
        : "sits outside";

    insight = `This guide is ranked highest because it combines a ${bestGuide.score.toFixed(
      2,
    )} efficiency score with ${bestGuide.gc_content}% GC, which ${gcFit} the preferred CRISPR design window.`;
    riskNote = bestGuide.risk_reason;
  } else if (results) {
    insight =
      "No valid NGG PAM sites were found with a full 20 nt upstream guide region.";
    riskNote =
      "Try a longer target sequence or include genomic context around the intended edit site.";
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-panel">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
          Insight Panel
        </p>
        <h2 className="mt-1 text-lg font-semibold text-gray-900">
          Design rationale
        </h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-5 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-5/6 animate-pulse rounded bg-gray-100" />
          <div className="h-20 animate-pulse rounded-xl bg-gray-100" />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900">Why this guide?</p>
            <p className="mt-2 text-sm leading-6 text-gray-600">{insight}</p>
          </div>
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm font-semibold text-yellow-800">
              Potential risks
            </p>
            <p className="mt-2 text-sm leading-6 text-yellow-800">{riskNote}</p>
          </div>
        </div>
      )}
    </section>
  );
}
