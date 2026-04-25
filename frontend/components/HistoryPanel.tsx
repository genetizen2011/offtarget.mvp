"use client";

import type { SavedAnalysis } from "@/lib/api";

type HistoryPanelProps = {
  savedAnalyses: SavedAnalysis[];
  selectedIds: string[];
  onReload: (analysis: SavedAnalysis) => void;
  onToggleCompare: (id: string) => void;
  onClearHistory: () => void;
};

function formatTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export default function HistoryPanel({
  savedAnalyses,
  selectedIds,
  onReload,
  onToggleCompare,
  onClearHistory,
}: HistoryPanelProps) {
  return (
    <aside
      id="saved"
      className="rounded-3xl border border-gray-200 bg-white p-5 shadow-panel"
    >
      <div className="mb-4 flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Saved
          </p>
          <h2 className="mt-1 text-lg font-semibold text-gray-900">
            Analysis history
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Save runs, reload results, and select two to compare.
          </p>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          {savedAnalyses.length}
        </span>
      </div>

      {savedAnalyses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
          No saved analyses yet. Run an analysis and use Save Analysis to build
          your local history.
        </div>
      ) : (
        <div className="space-y-3">
          {savedAnalyses.map((analysis) => {
            const isSelected = selectedIds.includes(analysis.id);
            return (
              <article
                key={analysis.id}
                className={`rounded-2xl border p-4 transition ${
                  isSelected
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-200 bg-gray-50 hover:border-blue-200 hover:bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {analysis.best_guide
                        ? `${analysis.best_guide.score.toFixed(2)} best score`
                        : "No guide found"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatTimestamp(analysis.timestamp)} ·{" "}
                      {analysis.guides.length} guides
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleCompare(analysis.id)}
                    aria-label="Select analysis for comparison"
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                </div>
                <p className="mt-3 line-clamp-2 break-all font-mono text-xs text-gray-600">
                  {analysis.sequence}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onReload(analysis)}
                    className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-gray-700 ring-1 ring-gray-200 transition hover:text-blue-700 hover:ring-blue-300"
                  >
                    Reload
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleCompare(analysis.id)}
                    className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-gray-700 ring-1 ring-gray-200 transition hover:text-blue-700 hover:ring-blue-300"
                  >
                    {isSelected ? "Remove" : "Compare"}
                  </button>
                </div>
              </article>
            );
          })}
          <button
            type="button"
            onClick={onClearHistory}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            Clear history
          </button>
        </div>
      )}
    </aside>
  );
}
