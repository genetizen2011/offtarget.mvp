import {
  createHmac,
  pbkdf2Sync,
  randomBytes,
  timingSafeEqual,
} from "crypto";
import type { AnalyzeResponse } from "./crispr";
import { ApiError } from "./crispr";

type UserRecord = {
  id: number;
  email: string;
  passwordHash: string;
  created_at: string;
};

export type AuthUser = {
  id: number;
  email: string;
  created_at: string;
};

export type StoredAnalysis = {
  id: number;
  sequence: string;
  results_json: AnalyzeResponse;
  created_at: string;
};

type Store = {
  nextUserId: number;
  nextAnalysisId: number;
  usersByEmail: Map<string, UserRecord>;
  usersById: Map<number, UserRecord>;
  analysesByUserId: Map<number, StoredAnalysis[]>;
};

declare global {
  // eslint-disable-next-line no-var
  var offtargetStore: Store | undefined;
}

const store =
  globalThis.offtargetStore ??
  (globalThis.offtargetStore = {
    nextUserId: 1,
    nextAnalysisId: 1,
    usersByEmail: new Map<string, UserRecord>(),
    usersById: new Map<number, UserRecord>(),
    analysesByUserId: new Map<number, StoredAnalysis[]>(),
  });

function getJwtSecret() {
  const secret = process.env.APP_JWT_SECRET ?? process.env.JWT_SECRET_KEY;

  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new ApiError(
      "APP_JWT_SECRET is not configured. Add it in Vercel project environment variables.",
      500,
    );
  }

  return "local-dev-only-change-me";
}

function base64Url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;

  const incoming = hashPassword(password, salt).split(":")[1];
  const incomingBuffer = Buffer.from(incoming, "hex");
  const storedBuffer = Buffer.from(hash, "hex");

  return (
    incomingBuffer.length === storedBuffer.length &&
    timingSafeEqual(incomingBuffer, storedBuffer)
  );
}

function signToken(userId: number) {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      sub: String(userId),
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    }),
  );
  const signature = base64Url(
    createHmac("sha256", getJwtSecret()).update(`${header}.${payload}`).digest(),
  );

  return `${header}.${payload}.${signature}`;
}

function verifyToken(token: string) {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) return null;

  const expected = base64Url(
    createHmac("sha256", getJwtSecret()).update(`${header}.${payload}`).digest(),
  );
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== actualBuffer.length ||
    !timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    return null;
  }

  const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
    sub?: string;
    exp?: number;
  };

  if (!claims.sub || !claims.exp || claims.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return Number(claims.sub);
}

function serializeUser(user: UserRecord): AuthUser {
  return {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
  };
}

export function registerUser(emailInput: string, password: string) {
  const email = emailInput.trim().toLowerCase();

  if (!email.includes("@")) {
    throw new ApiError("Enter a valid email address.", 422);
  }

  if (password.length < 8) {
    throw new ApiError("Password must be at least 8 characters.", 422);
  }

  if (store.usersByEmail.has(email)) {
    throw new ApiError("Email is already registered.", 409);
  }

  const user: UserRecord = {
    id: store.nextUserId,
    email,
    passwordHash: hashPassword(password),
    created_at: new Date().toISOString(),
  };
  store.nextUserId += 1;
  store.usersByEmail.set(email, user);
  store.usersById.set(user.id, user);

  return {
    access_token: signToken(user.id),
    token_type: "bearer",
    user: serializeUser(user),
  };
}

export function loginUser(emailInput: string, password: string) {
  const email = emailInput.trim().toLowerCase();
  const user = store.usersByEmail.get(email);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new ApiError("Invalid email or password.", 401);
  }

  return {
    access_token: signToken(user.id),
    token_type: "bearer",
    user: serializeUser(user),
  };
}

export function getUserFromAuthorization(authorization: string | null) {
  const token = authorization?.replace(/^Bearer\s+/i, "");
  if (!token) {
    throw new ApiError("Authentication is required.", 401);
  }

  const userId = verifyToken(token);
  const user = userId ? store.usersById.get(userId) : null;
  if (!user) {
    throw new ApiError("Invalid or expired session. Please log in again.", 401);
  }

  return user;
}

export function getCurrentUser(authorization: string | null) {
  return serializeUser(getUserFromAuthorization(authorization));
}

export function saveAnalysis(
  authorization: string | null,
  sequence: string,
  results: AnalyzeResponse,
) {
  const user = getUserFromAuthorization(authorization);
  const analysis: StoredAnalysis = {
    id: store.nextAnalysisId,
    sequence,
    results_json: results,
    created_at: new Date().toISOString(),
  };
  store.nextAnalysisId += 1;

  const analyses = store.analysesByUserId.get(user.id) ?? [];
  analyses.unshift(analysis);
  store.analysesByUserId.set(user.id, analyses.slice(0, 50));

  return analysis;
}

export function listAnalyses(authorization: string | null) {
  const user = getUserFromAuthorization(authorization);
  return store.analysesByUserId.get(user.id) ?? [];
}
