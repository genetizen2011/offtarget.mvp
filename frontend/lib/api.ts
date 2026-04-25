export type RiskLevel = "low" | "medium" | "high";

export type Guide = {
  sequence: string;
  pam: string;
  position: number;
  gc_content: number;
  score: number;
  risk: RiskLevel;
  risk_reason: string;
};

export type AnalyzeResponse = {
  guides: Guide[];
  best_guide: Guide | null;
};

export type SavedAnalysis = AnalyzeResponse & {
  id: string;
  sequence: string;
  timestamp: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export async function analyzeSequence(sequence: string): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sequence }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.detail?.message ??
      payload?.detail ??
      "Analysis failed. Please check the sequence and try again.";
    throw new Error(String(message));
  }

  return payload as AnalyzeResponse;
}
