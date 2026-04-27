import {
  AUTH_TOKEN_STORAGE_KEY,
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

export function getAuthToken() {
  return getLocalStorageItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string) {
  setLocalStorageItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken() {
  removeLocalStorageItem(AUTH_TOKEN_STORAGE_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message =
      typeof body?.message === "string"
        ? body.message
        : typeof body?.error === "string"
          ? body.error
        : typeof body?.detail?.message === "string"
          ? body.detail.message
          : typeof body?.detail === "string"
            ? body.detail
            : `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function analyzeSequence(sequence: string): Promise<AnalyzeResponse> {
  return requestJson<AnalyzeResponse>("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sequence }),
  });
}

export async function explainAnalysis(
  mode: ExplanationMode,
  results: AnalyzeResponse,
): Promise<AIExplanation> {
  const payload = await requestJson<{ explanation: AIExplanation }>("/api/ai/explain", {
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
  return payload.explanation;
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
  const payload = await requestJson<AuthResponse>(`/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  setAuthToken(payload.access_token);
  return payload;
}

export async function getCurrentUser(): Promise<AuthUser> {
  return requestJson<AuthUser>("/api/auth/me", {
    headers: authHeaders(),
  });
}

export async function saveAnalysisToBackend(
  sequence: string,
  results: AnalyzeResponse,
): Promise<StoredAnalysis> {
  return requestJson<StoredAnalysis>("/api/analyses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ sequence, results_json: results }),
  });
}

export async function fetchSavedAnalyses(): Promise<StoredAnalysis[]> {
  return requestJson<StoredAnalysis[]>("/api/analyses", {
    headers: authHeaders(),
  });
}
