"use client";

import { useEffect, useMemo, useState } from "react";
import HistoryPanel from "@/components/HistoryPanel";
import ResultDashboard from "@/components/ResultDashboard";
import SequenceEditor from "@/components/SequenceEditor";
import { GUIDE_COLUMNS } from "@/lib/guideColumns";
import {
  analyzeSequence,
  clearAuthToken,
  explainAnalysis,
  getAuthToken,
  getCurrentUser,
  saveAnalysisToBackend,
  type AIExplanation,
  type AnalyzeResponse,
  type AuthUser,
  type ExplanationMode,
  type SavedAnalysis,
} from "@/lib/api";
import {
  getLocalStorageItem,
  getStorageBlockedMessage,
  PENDING_RELOAD_STORAGE_KEY,
  removeLocalStorageItem,
  SAVED_ANALYSES_STORAGE_KEY,
  STORAGE_BLOCKED_EVENT,
  setLocalStorageItem,
} from "@/lib/storage";

const EXAMPLE_SEQUENCE =
  "ATGCGTACCGTAGCTAGCTAGGACCTGATCGTAGGCTAGCTAGGATCGATCGGATCCGTACTAGGCTA";
const FASTA_NOTICE = "FASTA header detected and removed.";
const TRIM_NOTICE = "Sequence trimmed to 200 bp.";

function validateSequence(sequence: string) {
  const fastaHeaderRemoved = sequence.trim().startsWith(">");
  const sanitized = sequence
    .replace(/[^ATCGUatcgu]/g, "")
    .toUpperCase()
    .replace(/U/g, "T");
  const wasTrimmed = sanitized.length > 200;
  const cleaned = sanitized.slice(0, 200);

  if (!cleaned) {
    return {
      isValid: false,
      message: "Paste a target sequence to begin.",
      sequence: cleaned,
      fastaHeaderRemoved,
      wasTrimmed,
    };
  }

  if (cleaned.length < 20) {
    return {
      isValid: false,
      message:
        "Sequence too short — need at least 20 bp after removing non-DNA characters.",
      sequence: cleaned,
      fastaHeaderRemoved,
      wasTrimmed,
    };
  }

  return {
    isValid: true,
    message: "Sequence is valid and ready to analyze.",
    sequence: cleaned,
    fastaHeaderRemoved,
    wasTrimmed,
  };
}

function exportGuides(results: AnalyzeResponse | null) {
  if (!results?.guides.length) return;

  const headers = GUIDE_COLUMNS.map((column) => column.csvHeader);
  const rows = results.guides.map((guide) =>
    GUIDE_COLUMNS.map((column) => {
      if (column.key === "position") return `${guide.pam} @ ${guide.position}`;
      if (column.key === "strand") return guide.strand ?? "+";
      return guide[column.key];
    }),
  );

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
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [explanationMode, setExplanationMode] =
    useState<ExplanationMode>("student");
  const [aiExplanation, setAiExplanation] = useState<AIExplanation | null>(null);
  const [aiError, setAiError] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState("");
  const [storageError, setStorageError] = useState("");
  const [fastaNotice, setFastaNotice] = useState("");
  const [trimNotice, setTrimNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validation = useMemo(() => validateSequence(sequence), [sequence]);
  const compareAnalyses = useMemo(
    () =>
      compareIds
        .map((id) => savedAnalyses.find((analysis) => analysis.id === id))
        .filter((analysis): analysis is SavedAnalysis => Boolean(analysis)),
    [compareIds, savedAnalyses],
  );

  useEffect(() => {
    function showStorageUnavailable() {
      setStorageError(getStorageBlockedMessage());
    }

    window.addEventListener(STORAGE_BLOCKED_EVENT, showStorageUnavailable);
    return () =>
      window.removeEventListener(STORAGE_BLOCKED_EVENT, showStorageUnavailable);
  }, []);

  useEffect(() => {
    function showStorageUnavailable() {
      setStorageError(getStorageBlockedMessage());
    }

    try {
      const stored = getLocalStorageItem(
        SAVED_ANALYSES_STORAGE_KEY,
        showStorageUnavailable,
      );
      if (!stored) {
        console.log("Loaded saved analyses", { count: 0, analyses: [] });
        return;
      }

      const parsed = JSON.parse(stored) as SavedAnalysis[];
      if (Array.isArray(parsed)) {
        setSavedAnalyses(parsed);
        console.log("Loaded saved analyses", {
          count: parsed.length,
          analyses: parsed,
        });
      }
    } catch {
      removeLocalStorageItem(SAVED_ANALYSES_STORAGE_KEY, showStorageUnavailable);
    } finally {
      setIsHistoryLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isHistoryLoaded) return;
    setLocalStorageItem(
      SAVED_ANALYSES_STORAGE_KEY,
      JSON.stringify(savedAnalyses),
      () => setStorageError(getStorageBlockedMessage()),
    );
  }, [isHistoryLoaded, savedAnalyses]);

  useEffect(() => {
    if (!getAuthToken()) return;

    getCurrentUser()
      .then(setCurrentUser)
      .catch(() => {
        clearAuthToken();
        setCurrentUser(null);
      });
  }, []);

  useEffect(() => {
    const showStorageUnavailable = () =>
      setStorageError(getStorageBlockedMessage());
    const pendingReload = getLocalStorageItem(
      PENDING_RELOAD_STORAGE_KEY,
      showStorageUnavailable,
    );
    if (!pendingReload) return;

    try {
      const parsed = JSON.parse(pendingReload) as {
        sequence: string;
        results: AnalyzeResponse;
      };
      setSequence(parsed.sequence);
      setResults(parsed.results);
    } finally {
      removeLocalStorageItem(PENDING_RELOAD_STORAGE_KEY, showStorageUnavailable);
    }
  }, []);

  async function handleAnalyze() {
    if (isLoading) return;
    if (!validation.isValid) return;

    setError("");
    setResults(null);
    setAiExplanation(null);
    setAiError("");
    setIsLoading(true);

    try {
      setSequence(validation.sequence);
      setFastaNotice(validation.fastaHeaderRemoved ? FASTA_NOTICE : "");
      setTrimNotice(validation.wasTrimmed ? TRIM_NOTICE : "");
      const response = await analyzeSequence(validation.sequence);
      setResults(response);
    } catch (apiError) {
      setError(
        apiError instanceof Error
          ? `Analysis failed: ${apiError.message}`
          : "Analysis failed: Unable to analyze this sequence.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleClear() {
    setSequence("");
    setResults(null);
    setAiExplanation(null);
    setAiError("");
    setError("");
    setFastaNotice("");
    setTrimNotice("");
  }

  function handleLoadExample() {
    setSequence(EXAMPLE_SEQUENCE);
    setResults(null);
    setAiExplanation(null);
    setAiError("");
    setError("");
    setFastaNotice("");
    setTrimNotice("");
  }

  async function handleGenerateExplanation() {
    if (!results) return;

    setAiError("");
    setIsAiLoading(true);

    try {
      const explanation = await explainAnalysis(explanationMode, results);
      setAiExplanation(explanation);
    } catch (apiError) {
      setAiExplanation(null);
      setAiError(
        apiError instanceof Error
          ? apiError.message
          : "Unable to generate AI explanation.",
      );
    } finally {
      setIsAiLoading(false);
    }
  }

  function handleSequenceChange(nextSequence: string) {
    setSequence(nextSequence);
    setFastaNotice("");
    setTrimNotice("");
    setError("");
  }

  async function handleSaveAnalysis() {
    if (!results) return;

    const saved: SavedAnalysis = {
      ...results,
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      sequence,
      timestamp: new Date().toISOString(),
    };

    setSavedAnalyses((current) => [saved, ...current].slice(0, 12));

    if (currentUser) {
      try {
        await saveAnalysisToBackend(sequence, results);
        setError("");
      } catch (apiError) {
        setError(
          apiError instanceof Error
            ? `Saved locally, but cloud save failed: ${apiError.message}`
            : "Saved locally, but cloud save failed.",
        );
      }
    } else {
      setError("Saved locally. Log in to sync analyses to your account.");
    }
  }

  function handleReloadAnalysis(analysis: SavedAnalysis) {
    setSequence(analysis.sequence);
    setResults({
      guides: analysis.guides,
      best_guide: analysis.best_guide,
    });
    setError("");
  }

  function handleToggleCompare(id: string) {
    setCompareIds((current) => {
      if (current.includes(id)) {
        return current.filter((selectedId) => selectedId !== id);
      }

      return [...current, id].slice(-2);
    });
  }

  function handleClearHistory() {
    setSavedAnalyses([]);
    setCompareIds([]);
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
            <a className="rounded-full px-4 py-2 transition hover:bg-white" href="/learn">
              Learn
            </a>
            <a className="rounded-full px-4 py-2 transition hover:bg-white" href="#saved">
              Saved
            </a>
            <a className="rounded-full px-4 py-2 transition hover:bg-white" href="/history">
              History
            </a>
            {currentUser ? (
              <span className="rounded-full bg-white px-4 py-2 text-gray-700 shadow-sm">
                {currentUser.email}
              </span>
            ) : (
              <a
                className="rounded-full bg-blue-600 px-4 py-2 text-white shadow-sm"
                href="/login"
              >
                Log in
              </a>
            )}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-[2rem] border border-gray-200 bg-white p-8 shadow-panel">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
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
            <div className="grid grid-cols-3 gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3 text-center">
              <div className="px-3">
                <p className="text-lg font-semibold text-gray-900">NGG</p>
                <p className="text-xs text-gray-500">PAM scan</p>
              </div>
              <div className="border-x border-gray-200 px-3">
                <p className="text-lg font-semibold text-gray-900">20 nt</p>
                <p className="text-xs text-gray-500">Guide window</p>
              </div>
              <div className="px-3">
                <p className="text-lg font-semibold text-gray-900">CSV</p>
                <p className="text-xs text-gray-500">Export</p>
              </div>
            </div>
          </div>
        </header>

        {storageError ? (
          <div className="mb-5 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm font-semibold text-yellow-800">
            {storageError}
          </div>
        ) : null}

        {fastaNotice ? (
          <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            <span>{fastaNotice}</span>
            <button
              type="button"
              onClick={() => setFastaNotice("")}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Dismiss
            </button>
          </div>
        ) : null}

        {trimNotice ? (
          <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            <span>{trimNotice}</span>
            <button
              type="button"
              onClick={() => setTrimNotice("")}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-yellow-700 transition hover:bg-yellow-100"
            >
              Dismiss
            </button>
          </div>
        ) : null}

        {error ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div
          id="analyze"
          className="grid items-start gap-6 xl:grid-cols-[360px_minmax(0,1fr)_360px]"
        >
          <div className="space-y-5 xl:sticky xl:top-24">
            <SequenceEditor
              sequence={sequence}
              sanitizedLength={validation.sequence.length}
              validationMessage={validation.message}
              isValid={validation.isValid}
              isLoading={isLoading}
              onSequenceChange={handleSequenceChange}
              onAnalyze={handleAnalyze}
              onClear={handleClear}
              onLoadExample={handleLoadExample}
            />
          </div>

          <ResultDashboard
            results={results}
            isLoading={isLoading}
            compareAnalyses={compareAnalyses}
            savedAnalysisCount={savedAnalyses.length}
            explanationMode={explanationMode}
            aiExplanation={aiExplanation}
            aiError={aiError}
            isAiLoading={isAiLoading}
            onExplanationModeChange={setExplanationMode}
            onGenerateExplanation={handleGenerateExplanation}
            onSaveAnalysis={handleSaveAnalysis}
            onExportCsv={() => exportGuides(results)}
            canSave={Boolean(results) && !isLoading}
          />

          <div className="xl:sticky xl:top-24">
            <HistoryPanel
              savedAnalyses={savedAnalyses}
              selectedIds={compareIds}
              canCompare={savedAnalyses.length >= 2}
              onReload={handleReloadAnalysis}
              onToggleCompare={handleToggleCompare}
              onClearHistory={handleClearHistory}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
