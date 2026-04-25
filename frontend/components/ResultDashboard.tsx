"use client";

import type { AnalyzeResponse, SavedAnalysis } from "@/lib/api";
import type { AIExplanation, ExplanationMode } from "@/lib/api";
import CompareView from "./CompareView";
import GuideTable from "./GuideTable";
import InsightPanel from "./InsightPanel";
import SummaryPanel from "./SummaryPanel";

type ResultDashboardProps = {
  results: AnalyzeResponse | null;
  isLoading: boolean;
  compareAnalyses: SavedAnalysis[];
  explanationMode: ExplanationMode;
  aiExplanation: AIExplanation | null;
  aiError: string;
  isAiLoading: boolean;
  onExplanationModeChange: (mode: ExplanationMode) => void;
  onGenerateExplanation: () => void;
  onSaveAnalysis: () => void;
  onExportCsv: () => void;
  canSave: boolean;
};

export default function ResultDashboard({
  results,
  isLoading,
  compareAnalyses,
  explanationMode,
  aiExplanation,
  aiError,
  isAiLoading,
  onExplanationModeChange,
  onGenerateExplanation,
  onSaveAnalysis,
  onExportCsv,
  canSave,
}: ResultDashboardProps) {
  const hasGuides = Boolean(results?.guides.length);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-panel">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
              Workflow
            </p>
            <h2 className="mt-1 text-lg font-semibold text-gray-900">
              Results actions
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Save this run locally, export guide candidates, or compare saved
              analyses.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700">
              Mode
              <select
                value={explanationMode}
                onChange={(event) =>
                  onExplanationModeChange(event.target.value as ExplanationMode)
                }
                className="bg-transparent text-sm font-semibold text-blue-700 outline-none"
              >
                <option value="student">Student</option>
                <option value="researcher">Researcher</option>
              </select>
            </label>
            <button
              type="button"
              onClick={onGenerateExplanation}
              disabled={!results || isAiLoading}
              className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
            >
              {isAiLoading ? "Generating..." : "Generate AI Insight"}
            </button>
            <button
              type="button"
              onClick={onSaveAnalysis}
              disabled={!canSave}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Save Analysis
            </button>
            <button
              type="button"
              onClick={onExportCsv}
              disabled={!hasGuides}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
            >
              Download CSV
            </button>
          </div>
        </div>
      </section>

      <SummaryPanel results={results} isLoading={isLoading} />
      <GuideTable guides={results?.guides ?? []} isLoading={isLoading} />
      <InsightPanel
        results={results}
        isLoading={isLoading}
        explanationMode={explanationMode}
        aiExplanation={aiExplanation}
        aiError={aiError}
        isAiLoading={isAiLoading}
      />
      <CompareView analyses={compareAnalyses} />
    </div>
  );
}
