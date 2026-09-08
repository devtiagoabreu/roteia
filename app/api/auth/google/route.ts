import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { googleAuthUrl, googleConfigured } from "@/lib/auth/google";

export async function GET() {
  if (!googleConfigured()) {
    return NextResponse.redirect("/login");
  }

  const state = randomBytes(24).toString("hex");
  const res = NextResponse.redirect(googleAuthUrl(state));
  res.cookies.set("roteia_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + 10 * 60 * 1000),
    path: "/",
  });
  return res;
}