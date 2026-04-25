"use client";

import { useMemo, useState } from "react";
import GuideTable from "@/components/GuideTable";
import InsightPanel from "@/components/InsightPanel";
import SequenceEditor from "@/components/SequenceEditor";
import SummaryPanel from "@/components/SummaryPanel";
import { analyzeSequence, type AnalyzeResponse } from "@/lib/api";

const EXAMPLE_SEQUENCE =
  "ATGCGTACCGTAGCTAGCTAGGACCTGATCGTAGGCTAGCTAGGATCGATCGGATCCGTACTAGGCTA";

function validateSequence(sequence: string) {
  if (!sequence) {
    return {
      isValid: false,
      message: "Enter a target sequence to begin.",
    };
  }

  if (/[^ATCGU]/.test(sequence)) {
    return {
      isValid: false,
      message: "Only A, T, C, G, and U bases are allowed.",
    };
  }

  if (sequence.length < 20) {
    return {
      isValid: false,
      message: "Sequence must be at least 20 bp.",
    };
  }

  if (sequence.length > 200) {
    return {
      isValid: false,
      message: "Sequence must be 200 bp or shorter.",
    };
  }

  return {
    isValid: true,
    message: "Sequence is valid and ready to analyze.",
  };
}

function exportGuides(results: AnalyzeResponse | null) {
  if (!results?.guides.length) return;

  const headers = ["sequence", "pam", "position", "gc_percent", "score", "risk"];
  const rows = results.guides.map((guide) => [
    guide.sequence,
    guide.pam,
    guide.position,
    guide.gc_content,
    guide.score,
    guide.risk,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "offtarget-guides.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [sequence, setSequence] = useState("");
  const [results, setResults] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validation = useMemo(() => validateSequence(sequence), [sequence]);

  async function handleAnalyze() {
    if (!validation.isValid) return;

    setError("");
    setIsLoading(true);

    try {
      const response = await analyzeSequence(sequence);
      setResults(response);
    } catch (apiError) {
      setError(
        apiError instanceof Error
          ? apiError.message
          : "Unable to analyze this sequence.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleClear() {
    setSequence("");
    setResults(null);
    setError("");
  }

  function handleLoadExample() {
    setSequence(EXAMPLE_SEQUENCE);
    setResults(null);
    setError("");
  }

  return (
    <main className="min-h-screen bg-[#F9FAFB] text-[#111827]">
      <nav className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm">
              OT
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">OffTarget MVP</p>
              <p className="text-xs text-gray-500">Genome engineering workspace</p>
            </div>
          </div>
          <div className="hidden items-center gap-1 rounded-full border border-gray-200 bg-gray-50 p-1 text-sm font-medium text-gray-600 sm:flex">
            <a className="rounded-full bg-white px-4 py-2 text-blue-700 shadow-sm" href="#analyze">
              Analyze
            </a>
            <a className="rounded-full px-4 py-2 transition hover:bg-white" href="#learn">
              Learn
            </a>
            <a className="rounded-full px-4 py-2 transition hover:bg-white" href="#saved">
              Saved
            </a>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-panel">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
              CRISPR guide analysis
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">
              Design candidate guide RNAs from a target sequence.
            </h1>
            <p className="mt-3 text-base leading-7 text-gray-600">
              Scan NGG PAM sites, score upstream 20 nt guides, estimate basic
              off-target risk, and export candidates for review.
            </p>
          </div>
        </header>

        {error ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div
          id="analyze"
          className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]"
        >
          <div className="space-y-4">
            <SequenceEditor
              sequence={sequence}
              validationMessage={validation.message}
              isValid={validation.isValid}
              isLoading={isLoading}
              onSequenceChange={setSequence}
              onAnalyze={handleAnalyze}
              onClear={handleClear}
              onLoadExample={handleLoadExample}
            />
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-panel">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Export candidates
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Download guide sequence, PAM, score, GC, and risk as CSV.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => exportGuides(results)}
                  disabled={!results?.guides.length}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                >
                  Download CSV
                </button>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <SummaryPanel results={results} isLoading={isLoading} />
            <GuideTable guides={results?.guides ?? []} isLoading={isLoading} />
            <InsightPanel results={results} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </main>
  );
}
