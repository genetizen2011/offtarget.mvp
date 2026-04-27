import { NextResponse } from "next/server";
import { ApiError } from "@/lib/server/crispr";

const missingEnvMessage = (key: string) =>
  `Server misconfiguration: ${key} is not set. Add it in Vercel → Settings → Environment Variables.`;

export function requireServerEnv(keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];

    if (!value) {
      console.error(`Missing required environment variable: ${key}`);
      return NextResponse.json(
        { error: missingEnvMessage(key), message: missingEnvMessage(key) },
        { status: 500 },
      );
    }
  }

  return null;
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  const message =
    error instanceof Error ? error.message : "Unexpected server error.";
  return NextResponse.json({ message }, { status: 500 });
}

export async function readJson(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    throw new ApiError("Request body must be valid JSON.", 400);
  }
}

export function requireString(value: unknown, name: string) {
  if (typeof value !== "string") {
    throw new ApiError(`${name} is required.`, 400);
  }

  return value;
}
