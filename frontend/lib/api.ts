import {
  getLocalStorageItem,
  removeLocalStorageItem,
  setLocalStorageItem,
} from "./storage";

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

export type ExplanationMode = "student" | "researcher";

export type AIExplanation = {
  summary?: string;
  best_guide_explanation?: string;
  gc_reasoning?: string;
  risk_assessment?: string;
  key_points?: string[];
  warnings?: string[];
  recommended_next_steps?: string[];
  limitations?: string;
};

export type AuthUser = {
  id: number;
  email: string;
  created_at: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};

export type StoredAnalysis = {
  id: number;
  sequence: string;
  results_json: AnalyzeResponse;
  created_at: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";
const TOKEN_KEY = "offtarget.authToken";

export function getAuthToken() {
  return getLocalStorageItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  setLocalStorageItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  removeLocalStorageItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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

export async function explainAnalysis(
  mode: ExplanationMode,
  results: AnalyzeResponse,
): Promise<AIExplanation> {
  const response = await fetch(`${API_BASE_URL}/ai/explain`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mode,
      guides: results.guides,
      best_guide: results.best_guide,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.detail?.message ??
      payload?.detail ??
      "AI explanation failed. Please try again.";
    throw new Error(String(message));
  }

  return payload.explanation as AIExplanation;
}

export async function registerUser(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return authRequest("/auth/register", email, password);
}

export async function loginUser(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return authRequest("/auth/login", email, password);
}

async function authRequest(
  path: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.detail?.message ?? payload?.detail ?? "Authentication failed.";
    throw new Error(String(message));
  }

  setAuthToken(payload.access_token);
  return payload as AuthResponse;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: authHeaders(),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.detail?.message ?? payload?.detail ?? "Unauthorized.";
    throw new Error(String(message));
  }

  return payload as AuthUser;
}

export async function saveAnalysisToBackend(
  sequence: string,
  results: AnalyzeResponse,
): Promise<StoredAnalysis> {
  const response = await fetch(`${API_BASE_URL}/analyses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ sequence, results_json: results }),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.detail?.message ?? payload?.detail ?? "Unable to save analysis.";
    throw new Error(String(message));
  }

  return payload as StoredAnalysis;
}

export async function fetchSavedAnalyses(): Promise<StoredAnalysis[]> {
  const response = await fetch(`${API_BASE_URL}/analyses`, {
    headers: authHeaders(),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.detail?.message ?? payload?.detail ?? "Unable to load history.";
    throw new Error(String(message));
  }

  return payload as StoredAnalysis[];
}
