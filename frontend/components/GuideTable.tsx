"use client";

import { useMemo, useState } from "react";
import type { Guide } from "@/lib/api";
import RiskBadge from "./RiskBadge";
import Tooltip from "./Tooltip";

type SortKey = "sequence" | "gc_content" | "score" | "risk" | "position";
type SortDirection = "asc" | "desc";
type RiskFilter = "all" | "low" | "medium" | "high";

type GuideTableProps = {
  guides: Guide[];
  isLoading: boolean;
};

const riskRank = {
  low: 1,
  medium: 2,
  high: 3,
};

function LoadingRows() {
  return (
    <>
      {[0, 1, 2].map((row) => (
        <tr key={row} className="border-t border-gray-100">
          {[0, 1, 2, 3, 4].map((cell) => (
            <td key={cell} className="px-4 py-4">
              <div className="h-5 animate-pulse rounded bg-gray-100" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function GuideTable({ guides, isLoading }: GuideTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [scoreThreshold, setScoreThreshold] = useState(0);
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [copiedSequence, setCopiedSequence] = useState<string | null>(null);

  const visibleGuides = useMemo(() => {
    return guides
      .filter((guide) => guide.score >= scoreThreshold)
      .filter((guide) => riskFilter === "all" || guide.risk === riskFilter)
      .sort((a, b) => {
      let valueA: string | number = a[sortKey];
      let valueB: string | number = b[sortKey];

      if (sortKey === "risk") {
        valueA = riskRank[a.risk];
        valueB = riskRank[b.risk];
      }

      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [guides, riskFilter, scoreThreshold, sortDirection, sortKey]);

  function updateSort(nextKey: SortKey) {
    if (nextKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === "sequence" ? "asc" : "desc");
  }

  async function copyGuide(sequence: string) {
    await navigator.clipboard.writeText(sequence);
    setCopiedSequence(sequence);
    window.setTimeout(() => setCopiedSequence(null), 1400);
  }

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-panel">
      <div className="mb-5 flex flex-col gap-4 border-b border-gray-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Guide Table
          </p>
          <h2 className="mt-1 text-lg font-semibold text-gray-900">
            Candidate gRNAs
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Sort by sequence, GC, score, risk, or PAM position.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Sort
            <select
              value={sortKey}
              onChange={(event) => updateSort(event.target.value as SortKey)}
              className="mt-1 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option value="score">Score</option>
              <option value="gc_content">GC %</option>
              <option value="position">PAM position</option>
              <option value="risk">Risk</option>
              <option value="sequence">Sequence</option>
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Min score
            <select
              value={scoreThreshold}
              onChange={(event) => setScoreThreshold(Number(event.target.value))}
              className="mt-1 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option value={0}>All scores</option>
              <option value={0.5}>0.50+</option>
              <option value={0.7}>0.70+</option>
              <option value={0.85}>0.85+</option>
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Risk
            <select
              value={riskFilter}
              onChange={(event) => setRiskFilter(event.target.value as RiskFilter)}
              className="mt-1 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">All risks</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
        <span>
          Showing {visibleGuides.length} of {guides.length} candidates
        </span>
        <button
          type="button"
          onClick={() =>
            setSortDirection((current) => (current === "asc" ? "desc" : "asc"))
          }
          className="rounded-lg border border-gray-200 px-3 py-1.5 font-medium text-gray-700 transition hover:border-blue-300 hover:text-blue-700"
        >
          {sortDirection === "asc" ? "Ascending" : "Descending"}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">
                  <button type="button" onClick={() => updateSort("sequence")}>
                    Sequence
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button type="button" onClick={() => updateSort("gc_content")}>
                    GC %
                    <Tooltip term="gc-content" label="GC content help" />
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button type="button" onClick={() => updateSort("score")}>
                    Score
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button type="button" onClick={() => updateSort("risk")}>
                    Risk
                    <Tooltip term="off-target" label="Off-target risk help" />
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button type="button" onClick={() => updateSort("position")}>
                    PAM
                    <Tooltip term="pam" label="PAM help" />
                  </button>
                </th>
                <th className="px-4 py-3">Copy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {isLoading ? <LoadingRows /> : null}
              {!isLoading && visibleGuides.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    No candidate guides match the current filters.
                  </td>
                </tr>
              ) : null}
              {!isLoading
                ? visibleGuides.map((guide) => (
                    <tr
                      key={`${guide.sequence}-${guide.position}`}
                      className="transition hover:bg-blue-50/60"
                    >
                      <td className="max-w-xs break-all px-4 py-5 font-mono text-xs text-gray-900">
                        {guide.sequence}
                      </td>
                      <td className="px-4 py-5 text-gray-700">
                        {guide.gc_content.toFixed(1)}%
                      </td>
                      <td className="px-4 py-5 font-semibold text-gray-900">
                        {guide.score.toFixed(2)}
                      </td>
                      <td className="px-4 py-5">
                        <RiskBadge risk={guide.risk} />
                      </td>
                      <td className="px-4 py-5 font-mono text-xs text-gray-700">
                        {guide.pam} @ {guide.position}
                      </td>
                      <td className="px-4 py-5">
                        <button
                          type="button"
                          onClick={() => copyGuide(guide.sequence)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-blue-300 hover:text-blue-700"
                        >
                          {copiedSequence === guide.sequence ? "Copied" : "Copy"}
                        </button>
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
