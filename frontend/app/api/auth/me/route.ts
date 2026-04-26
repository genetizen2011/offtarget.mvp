import { NextResponse } from "next/server";
import { jsonError } from "../../_utils";
import { getCurrentUser } from "@/lib/server/authStore";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    return NextResponse.json(
      getCurrentUser(request.headers.get("authorization")),
    );
  } catch (error) {
    return jsonError(error);
  }
}
