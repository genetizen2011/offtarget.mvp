import { NextResponse } from "next/server";
import { jsonError, requireServerEnv } from "../../_utils";
import { getCurrentUser } from "@/lib/server/authStore";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const envError = requireServerEnv(["APP_JWT_SECRET"]);
  if (envError) return envError;

  try {
    return NextResponse.json(
      getCurrentUser(request.headers.get("authorization")),
    );
  } catch (error) {
    return jsonError(error);
  }
}
