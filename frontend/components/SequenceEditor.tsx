"use client";

const MAX_PREVIEW_CHARS = 200;
const allowedBases = new Set(["A", "T", "C", "G", "U"]);

type SequenceEditorProps = {
  sequence: string;
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
  validationMessage,
  isValid,
  isLoading,
  onSequenceChange,
  onAnalyze,
  onClear,
  onLoadExample,
}: SequenceEditorProps) {
  const normalizedPreview = sequence.toUpperCase().slice(0, MAX_PREVIEW_CHARS);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-panel">
      <div className="mb-4 flex items-start justify-between gap-4">
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
          {sequence.length}/200
        </span>
      </div>

      <textarea
        value={sequence}
        onChange={(event) => onSequenceChange(event.target.value.toUpperCase())}
        spellCheck={false}
        placeholder="Paste A, T, C, G, or U sequence..."
        className="min-h-64 w-full resize-y rounded-xl border border-gray-200 bg-gray-50 p-4 font-mono text-sm leading-6 text-gray-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
      />

      <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
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

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          className={`text-sm ${
            isValid ? "text-emerald-600" : "text-red-600"
          }`}
          role="status"
        >
          {validationMessage}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onLoadExample}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-blue-200 hover:text-blue-700"
          >
            Load Example
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-red-200 hover:text-red-700"
          >
            Clear
          </button>
          <button
            type="button"
            disabled={!isValid || isLoading}
            onClick={onAnalyze}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isLoading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
      </div>
    </section>
  );
}
