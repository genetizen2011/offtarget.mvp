import { NextResponse } from "next/server";
import { jsonError, readJson, requireServerEnv, requireString } from "../_utils";
import { analyzeCrisprSequence } from "@/lib/server/crispr";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const envError = requireServerEnv(["APP_JWT_SECRET"]);
  if (envError) return envError;

  try {
    const body = await readJson(request);
    const sequence = requireString(body.sequence, "sequence");
    return NextResponse.json(analyzeCrisprSequence(sequence));
  } catch (error) {
    return jsonError(error);
  }
}
