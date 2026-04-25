"use client";

import { useMemo, useState } from "react";
import type { Guide } from "@/lib/api";
import RiskBadge from "./RiskBadge";
import Tooltip from "./Tooltip";

type SortKey = "sequence" | "gc_content" | "score" | "risk" | "position";
type SortDirection = "asc" | "desc";

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
  const [copiedSequence, setCopiedSequence] = useState<string | null>(null);

  const sortedGuides = useMemo(() => {
    return [...guides].sort((a, b) => {
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
  }, [guides, sortDirection, sortKey]);

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
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-panel">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200">
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
                    <Tooltip label="GC content help">
                      GC content measures the percentage of G and C bases. Many
                      CRISPR designs prefer roughly 40-65%.
                    </Tooltip>
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
                    <Tooltip label="Off-target risk help">
                      Risk is a basic heuristic based on GC extremes, repeated
                      motifs, and homopolymer runs.
                    </Tooltip>
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button type="button" onClick={() => updateSort("position")}>
                    PAM
                    <Tooltip label="PAM help">
                      NGG PAM sites are scanned across the sequence. Guides use
                      the 20 bases immediately upstream.
                    </Tooltip>
                  </button>
                </th>
                <th className="px-4 py-3">Copy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {isLoading ? <LoadingRows /> : null}
              {!isLoading && sortedGuides.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    No candidate guides yet. Run analysis on a sequence with an
                    NGG PAM and 20 upstream bases.
                  </td>
                </tr>
              ) : null}
              {!isLoading
                ? sortedGuides.map((guide) => (
                    <tr
                      key={`${guide.sequence}-${guide.position}`}
                      className="transition hover:bg-blue-50/40"
                    >
                      <td className="max-w-xs break-all px-4 py-4 font-mono text-xs text-gray-900">
                        {guide.sequence}
                      </td>
                      <td className="px-4 py-4 text-gray-700">
                        {guide.gc_content.toFixed(1)}%
                      </td>
                      <td className="px-4 py-4 font-semibold text-gray-900">
                        {guide.score.toFixed(2)}
                      </td>
                      <td className="px-4 py-4">
                        <RiskBadge risk={guide.risk} />
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-gray-700">
                        {guide.pam} @ {guide.position}
                      </td>
                      <td className="px-4 py-4">
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
