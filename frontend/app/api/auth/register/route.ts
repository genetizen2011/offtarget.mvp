import { NextResponse } from "next/server";
import { jsonError, readJson, requireString } from "../../_utils";
import { registerUser } from "@/lib/server/authStore";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const email = requireString(body.email, "email");
    const password = requireString(body.password, "password");
    return NextResponse.json(registerUser(email, password));
  } catch (error) {
    return jsonError(error);
  }
}
