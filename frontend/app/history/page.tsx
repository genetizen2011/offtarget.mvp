"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  clearAuthToken,
  fetchSavedAnalyses,
  getAuthToken,
  type StoredAnalysis,
} from "@/lib/api";
import {
  getStorageBlockedMessage,
  PENDING_RELOAD_STORAGE_KEY,
  setLocalStorageItem,
} from "@/lib/storage";

export default function HistoryPage() {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<StoredAnalysis[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!getAuthToken()) {
      setError("Log in to view your saved analysis history.");
      setIsLoading(false);
      return;
    }

    fetchSavedAnalyses()
      .then(setAnalyses)
      .catch((apiError) => {
        setError(
          apiError instanceof Error ? apiError.message : "Unable to load history.",
        );
      })
      .finally(() => setIsLoading(false));
  }, []);

  function handleLogout() {
    clearAuthToken();
    router.push("/login");
  }

  function handleReload(analysis: StoredAnalysis) {
    const wasSaved = setLocalStorageItem(
      PENDING_RELOAD_STORAGE_KEY,
      JSON.stringify({
        sequence: analysis.sequence,
        results: analysis.results_json,
      }),
    );
    if (!wasSaved) {
      setError(getStorageBlockedMessage());
      return;
    }
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-[#F9FAFB] text-[#111827]">
      <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
        <header className="rounded-[2rem] border border-gray-200 bg-white p-8 shadow-panel">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link href="/" className="text-sm font-semibold text-blue-700">
                Back to analysis
              </Link>
              <h1 className="mt-6 text-3xl font-semibold text-gray-950">
                Saved analysis history
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Cloud-synced analyses saved to your authenticated account.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              Log out
            </button>
          </div>
        </header>

        {error ? (
          <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            {error}{" "}
            <Link href="/login" className="font-semibold underline">
              Log in
            </Link>
          </div>
        ) : null}

        <section className="mt-6 space-y-4">
          {isLoading ? (
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-panel">
              <div className="h-5 animate-pulse rounded bg-gray-100" />
              <div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-gray-100" />
            </div>
          ) : null}

          {!isLoading && analyses.length === 0 && !error ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-sm text-gray-500">
              No cloud-saved analyses yet. Run an analysis, log in, and click
              Save Analysis.
            </div>
          ) : null}

          {analyses.map((analysis) => (
            <article
              key={analysis.id}
              className="rounded-3xl border border-gray-200 bg-white p-6 shadow-panel"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {analysis.results_json.best_guide
                      ? `${analysis.results_json.best_guide.score.toFixed(2)} best score`
                      : "No guide found"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(analysis.created_at).toLocaleString()} ·{" "}
                    {analysis.results_json.guides.length} guides
                  </p>
                  <p className="mt-3 break-all font-mono text-xs text-gray-600">
                    {analysis.sequence}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleReload(analysis)}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Reload
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
