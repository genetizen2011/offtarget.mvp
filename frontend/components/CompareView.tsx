import type { SavedAnalysis } from "@/lib/api";
import RiskBadge from "./RiskBadge";

type CompareViewProps = {
  analyses: SavedAnalysis[];
};

function formatTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export default function CompareView({ analyses }: CompareViewProps) {
  const [first, second] = analyses;

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-panel">
      <div className="mb-5 border-b border-gray-100 pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
          Compare
        </p>
        <h2 className="mt-1 text-lg font-semibold text-gray-900">
          Saved analysis comparison
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Select two saved analyses to compare best guide, score, and risk.
        </p>
      </div>

      {analyses.length !== 2 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
          {analyses.length === 0
            ? "No analyses selected for comparison."
            : "Select one more saved analysis to complete the comparison."}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {[first, second].map((analysis, index) => {
            const guide = analysis.best_guide;
            return (
              <article
                key={analysis.id}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-5"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Analysis {index + 1}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatTimestamp(analysis.timestamp)}
                    </p>
                  </div>
                  {guide ? <RiskBadge risk={guide.risk} /> : null}
                </div>

                {guide ? (
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Best guide
                      </dt>
                      <dd className="mt-1 break-all font-mono text-xs text-gray-900">
                        {guide.sequence}
                      </dd>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl bg-white p-3 ring-1 ring-gray-200">
                        <dt className="text-xs text-gray-500">Score</dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">
                          {guide.score.toFixed(2)}
                        </dd>
                      </div>
                      <div className="rounded-xl bg-white p-3 ring-1 ring-gray-200">
                        <dt className="text-xs text-gray-500">GC</dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">
                          {guide.gc_content.toFixed(1)}%
                        </dd>
                      </div>
                      <div className="rounded-xl bg-white p-3 ring-1 ring-gray-200">
                        <dt className="text-xs text-gray-500">Guides</dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">
                          {analysis.guides.length}
                        </dd>
                      </div>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Risk note
                      </dt>
                      <dd className="mt-1 text-sm leading-6 text-gray-600">
                        {guide.risk_reason}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-sm text-gray-500">
                    This analysis did not produce a valid guide.
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
