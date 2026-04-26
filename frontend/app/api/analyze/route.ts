import { NextResponse } from "next/server";
import { jsonError, readJson, requireString } from "../_utils";
import { analyzeCrisprSequence } from "@/lib/server/crispr";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const sequence = requireString(body.sequence, "sequence");
    return NextResponse.json(analyzeCrisprSequence(sequence));
  } catch (error) {
    return jsonError(error);
  }
}
