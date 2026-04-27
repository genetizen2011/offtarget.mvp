"use client";

const MAX_PREVIEW_CHARS = 200;
const allowedBases = new Set(["A", "T", "C", "G"]);

type SequenceEditorProps = {
  sequence: string;
  sanitizedLength: number;
  validationMessage: string;
  isValid: boolean;
  isLoading: boolean;
  onSequenceChange: (sequence: string) => void;
  onAnalyze: () => void;
  onClear: () => void;
  onLoadExample: () => void;
};

export default function SequenceEditor({
  sequence,
  sanitizedLength,
  validationMessage,
  isValid,
  isLoading,
  onSequenceChange,
  onAnalyze,
  onClear,
  onLoadExample,
}: SequenceEditorProps) {
  const cleanedLength = sanitizedLength;
  const normalizedPreview = sequence
    .replace(/[^ATCGUatcgu]/g, "")
    .toUpperCase()
    .replace(/U/g, "T")
    .slice(0, MAX_PREVIEW_CHARS);
  const progress = Math.min(100, (cleanedLength / 200) * 100);

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-panel">
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Sequence Input
          </p>
          <h2 className="mt-1 text-lg font-semibold text-gray-900">
            Target sequence
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Paste 20-200 bp. RNA bases are accepted and normalized for PAM search.
          </p>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          {cleanedLength}/200
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2 text-xs text-gray-500">
          <span className="font-medium uppercase tracking-wide">Editor</span>
          <span>{Math.max(0, 200 - cleanedLength)} bp remaining</span>
        </div>
        <textarea
          value={sequence}
          onChange={(event) => onSequenceChange(event.target.value)}
          spellCheck={false}
          placeholder="Paste A, T, C, G, or U sequence..."
          className="min-h-64 w-full resize-y bg-transparent p-4 font-mono text-sm leading-7 text-gray-900 outline-none"
        />
        <div className="h-1 bg-gray-100">
          <div
            className={`h-full transition-all ${
              isValid ? "bg-emerald-500" : "bg-blue-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
          Base quality preview
        </p>
        {normalizedPreview ? (
          <div className="flex flex-wrap gap-1 font-mono text-xs">
            {normalizedPreview.split("").map((base, index) => {
              const valid = allowedBases.has(base);
              return (
                <span
                  key={`${base}-${index}`}
                  className={`rounded px-1.5 py-1 ${
                    valid
                      ? "bg-white text-gray-700"
                      : "bg-red-100 text-red-700 ring-1 ring-red-200"
                  }`}
                >
                  {base}
                </span>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No sequence loaded yet.</p>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            isValid
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
          role="status"
        >
          {validationMessage}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onLoadExample}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            Load Example
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            Clear
          </button>
          <button
            type="button"
            disabled={!isValid || isLoading}
            onClick={onAnalyze}
            className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isLoading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
      </div>
    </section>
  );
}
