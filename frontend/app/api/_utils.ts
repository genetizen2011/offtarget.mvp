import { NextResponse } from "next/server";
import { ApiError } from "@/lib/server/crispr";

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
