import { NextResponse } from "next/server";
import { jsonError, readJson, requireString } from "../_utils";
import { listAnalyses, saveAnalysis } from "@/lib/server/authStore";
import type { AnalyzeResponse } from "@/lib/server/crispr";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    return NextResponse.json(listAnalyses(request.headers.get("authorization")));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const sequence = requireString(body.sequence, "sequence");
    const results = body.results_json as AnalyzeResponse | undefined;

    if (!results || !Array.isArray(results.guides)) {
      return NextResponse.json(
        { message: "results_json with guides is required." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      saveAnalysis(request.headers.get("authorization"), sequence, results),
    );
  } catch (error) {
    return jsonError(error);
  }
}
