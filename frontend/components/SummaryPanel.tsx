import type { AnalyzeResponse } from "@/lib/api";
import Link from "next/link";
import RiskBadge from "./RiskBadge";
import Tooltip from "./Tooltip";

type SummaryPanelProps = {
  results: AnalyzeResponse | null;
  isLoading: boolean;
};

function MetricSkeleton() {
  return <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />;
}

export default function SummaryPanel({ results, isLoading }: SummaryPanelProps) {
  const bestGuide = results?.best_guide ?? null;
  const guides = results?.guides ?? [];
  const averageScore =
    guides.length > 0
      ? guides.reduce((total, guide) => total + guide.score, 0) / guides.length
      : 0;

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-panel">
      <div className="mb-5 flex items-start justify-between border-b border-gray-100 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Summary
          </p>
          <h2 className="mt-1 text-lg font-semibold text-gray-900">
            Analysis overview
          </h2>
        </div>
        {bestGuide ? <RiskBadge risk={bestGuide.risk} /> : null}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricSkeleton />
          <MetricSkeleton />
          <MetricSkeleton />
        </div>
      ) : results ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-xs font-medium text-gray-500">Guides found</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {guides.length}
              </p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-xs font-medium text-gray-500">
                Best score
                <Tooltip label="Efficiency score help">
                  Efficiency is a 0-1 heuristic based on GC balance, PAM context,
                  repeats, and homopolymer penalties.
                </Tooltip>
              </p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {bestGuide ? bestGuide.score.toFixed(2) : "N/A"}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-xs font-medium text-gray-500">
                Avg. score
              </p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {guides.length ? averageScore.toFixed(2) : "N/A"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Best guide RNA
            </p>
            {bestGuide ? (
              <div className="mt-2 flex flex-col gap-2">
                <p className="break-all font-mono text-sm font-semibold text-gray-900">
                  {bestGuide.sequence}
                </p>
                <p className="text-sm text-gray-600">
                  <Link
                    href="/learn/crispr-overview"
                    className="font-semibold text-blue-700 hover:text-blue-800"
                  >
                    PAM
                  </Link>
                  <Tooltip term="pam" label="PAM help" /> {bestGuide.pam} at
                  position {bestGuide.position} with {bestGuide.gc_content}%{" "}
                  <span className="font-semibold">
                    GC content
                    <Tooltip term="gc-content" label="GC content help" />
                  </span>
                  .
                </p>
                <Link
                  href="/learn/grna-design"
                  className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                >
                  Learn more about guide design
                </Link>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-600">
                No NGG PAM with 20 upstream bases was found.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-sm text-gray-500">
          Run an analysis to see guide counts, best guide RNA, and quick metrics.
        </div>
      )}
    </section>
  );
}
