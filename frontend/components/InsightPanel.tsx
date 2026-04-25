import type { AIExplanation, AnalyzeResponse, ExplanationMode } from "@/lib/api";
import Link from "next/link";
import Tooltip from "./Tooltip";

type InsightPanelProps = {
  results: AnalyzeResponse | null;
  isLoading: boolean;
  explanationMode: ExplanationMode;
  aiExplanation: AIExplanation | null;
  aiError: string;
  isAiLoading: boolean;
};

export default function InsightPanel({
  results,
  isLoading,
  explanationMode,
  aiExplanation,
  aiError,
  isAiLoading,
}: InsightPanelProps) {
  const bestGuide = results?.best_guide ?? null;

  let insight = "Run an analysis to generate design rationale and risk notes.";
  let gcNote = "GC balance has not been evaluated yet.";
  let stabilityNote = "Sequence stability has not been evaluated yet.";
  let riskNote = "No risks have been evaluated yet.";
  let selectionPoints = [
    "No guide has been selected yet.",
    "Run analysis to evaluate PAM-compatible candidates.",
  ];

  if (bestGuide) {
    const gcFit =
      bestGuide.gc_content >= 40 && bestGuide.gc_content <= 65
        ? "falls inside"
        : "sits outside";
    const hasExtremeGc = bestGuide.gc_content < 25 || bestGuide.gc_content > 75;
    const hasPotentialInstability = /(AAAA|TTTT|CCCC|GGGG)/.test(
      bestGuide.sequence,
    );

    insight = `This guide is ranked highest because it combines a ${bestGuide.score.toFixed(
      2,
    )} efficiency score with ${bestGuide.gc_content}% GC, which ${gcFit} the preferred CRISPR design window.`;
    gcNote = hasExtremeGc
      ? "Extreme GC content may reduce specificity or make synthesis and binding less reliable."
      : "GC content is within a practical range for short guide design.";
    stabilityNote = hasPotentialInstability
      ? "A repeated base run may indicate instability or elevated off-target risk."
      : "No obvious homopolymer instability pattern is present in the best guide.";
    riskNote = bestGuide.risk_reason;
    selectionPoints = [
      `Efficiency score: ${bestGuide.score.toFixed(2)} on a 0-1 heuristic scale.`,
      `GC content: ${bestGuide.gc_content}% compared with the preferred 40-65% design window.`,
      `Risk category: ${bestGuide.risk}, based on GC extremes, repeats, and homopolymer patterns.`,
    ];
  } else if (results) {
    insight =
      "No valid NGG PAM sites were found with a full 20 nt upstream guide region.";
    gcNote = "No guide was available for GC evaluation.";
    stabilityNote = "No guide was available for stability screening.";
    riskNote =
      "Try a longer target sequence or include genomic context around the intended edit site.";
    selectionPoints = [
      "No NGG PAM produced a full upstream 20 nt guide.",
      "Add flanking sequence around the target site before re-analysis.",
    ];
  }

  const aiKeyPoints =
    aiExplanation?.key_points ?? aiExplanation?.recommended_next_steps ?? [];
  const aiWarnings = [
    ...(aiExplanation?.warnings ?? []),
    ...(aiExplanation?.risk_assessment ? [aiExplanation.risk_assessment] : []),
    ...(aiExplanation?.limitations ? [aiExplanation.limitations] : []),
  ];

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-panel">
      <div className="mb-5 border-b border-gray-100 pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
          Insight Panel
        </p>
        <h2 className="mt-1 text-lg font-semibold text-gray-900">
          Design rationale
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Transparent explanations based only on the current guide metrics.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-5 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-5/6 animate-pulse rounded bg-gray-100" />
          <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 md:col-span-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-950">
                  AI explanation
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-blue-700">
                  {explanationMode} mode
                </p>
              </div>
              {isAiLoading ? (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">
                  Generating...
                </span>
              ) : null}
            </div>

            {isAiLoading ? (
              <div className="mt-4 space-y-3">
                <div className="h-4 animate-pulse rounded bg-blue-100" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-blue-100" />
                <div className="h-16 animate-pulse rounded-xl bg-blue-100" />
              </div>
            ) : aiError ? (
              <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm leading-6 text-yellow-800">
                AI explanation is unavailable: {aiError}
              </div>
            ) : aiExplanation ? (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                    Explanation
                  </p>
                  <p className="mt-2 text-sm leading-6 text-blue-950">
                    {aiExplanation.summary ??
                      aiExplanation.best_guide_explanation ??
                      "AI explanation generated for this analysis."}
                  </p>
                  {aiExplanation.best_guide_explanation &&
                  aiExplanation.summary ? (
                    <p className="mt-2 text-sm leading-6 text-blue-950">
                      {aiExplanation.best_guide_explanation}
                    </p>
                  ) : null}
                </div>

                {aiKeyPoints.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                      Key points
                    </p>
                    <ul className="mt-2 space-y-2 text-sm leading-6 text-blue-950">
                      {aiKeyPoints.map((point) => (
                        <li key={point}>- {point}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {aiWarnings.length > 0 ? (
                  <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-yellow-800">
                      Warnings
                    </p>
                    <ul className="mt-2 space-y-2 text-sm leading-6 text-yellow-900">
                      {aiWarnings.map((warning) => (
                        <li key={warning}>- {warning}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-blue-900">
                Click Generate AI Insight after analysis to request an
                AI-assisted explanation.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 md:col-span-2">
            <p className="text-sm font-semibold text-gray-900">
              Best guide selection
            </p>
            <p className="mt-2 text-sm leading-6 text-gray-600">{insight}</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-gray-600">
              {selectionPoints.map((point) => (
                <li key={point}>- {point}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-semibold text-emerald-900">
              GC context
              <Tooltip term="gc-content" label="GC content help" />
            </p>
            <p className="mt-2 text-sm leading-6 text-emerald-800">{gcNote}</p>
          </div>
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
            <p className="text-sm font-semibold text-yellow-900">
              Stability screen
            </p>
            <p className="mt-2 text-sm leading-6 text-yellow-800">
              {stabilityNote}
            </p>
          </div>
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 md:col-span-2">
            <p className="text-sm font-semibold text-red-900">
              Potential{" "}
              <Link
                href="/learn/off-target"
                className="underline decoration-red-300 underline-offset-2 hover:text-red-700"
              >
                off-target
              </Link>
              <Tooltip term="off-target" label="Off-target help" /> risks
            </p>
            <p className="mt-2 text-sm leading-6 text-red-800">{riskNote}</p>
            <Link
              href="/learn/off-target"
              className="mt-3 inline-flex text-sm font-semibold text-red-800 hover:text-red-900"
            >
              Learn more about off-target effects
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
