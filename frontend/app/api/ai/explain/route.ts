import { NextResponse } from "next/server";
import { jsonError, readJson } from "../../_utils";
import type { AnalyzeResponse } from "@/lib/server/crispr";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const bestGuide = (body.best_guide ??
      null) as AnalyzeResponse["best_guide"];

    if (!bestGuide) {
      return NextResponse.json({
        explanation: {
          summary:
            "No guide candidate was found, so there is no best guide to explain.",
          recommended_next_steps: [
            "Add more flanking sequence around the intended edit site.",
            "Check that the target contains an NGG PAM with 20 upstream bases.",
          ],
          limitations:
            "This local explanation uses only the heuristic guide metrics shown in the app.",
        },
      });
    }

    return NextResponse.json({
      explanation: {
        summary: `The best guide scores ${bestGuide.score.toFixed(
          2,
        )} with ${bestGuide.gc_content}% GC and a ${bestGuide.risk} risk label.`,
        best_guide_explanation: `It was selected because it has an NGG-compatible PAM (${bestGuide.pam}), a complete 20 nt upstream guide, and the strongest score among the candidates.`,
        gc_reasoning:
          bestGuide.gc_content >= 40 && bestGuide.gc_content <= 65
            ? "GC content is within the common 40-65% guide design range."
            : "GC content is outside the common 40-65% guide design range.",
        risk_assessment: bestGuide.risk_reason,
        recommended_next_steps: [
          "Validate specificity with a genome-aware off-target search.",
          "Check nearby candidate guides before ordering reagents.",
          "Confirm the target context experimentally before editing.",
        ],
        limitations:
          "This local explanation does not perform genome-wide alignment or experimental validation.",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
