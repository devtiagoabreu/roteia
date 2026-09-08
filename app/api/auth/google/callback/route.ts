import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import {
  googleConfigured,
  verifyGoogleCode,
} from "@/lib/auth/google";
import { slugify } from "@/lib/slug";

export async function GET(req: NextRequest) {
  if (!googleConfigured()) {
    return NextResponse.redirect("/login");
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const hasError = url.searchParams.get("error");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("roteia_oauth_state")?.value;
  cookieStore.delete("roteia_oauth_state");

  if (hasError || !code || !state || state !== expectedState) {
    return NextResponse.redirect("/login?error=google");
  }

  let info;
  try {
    info = await verifyGoogleCode(code);
  } catch {
    return NextResponse.redirect("/login?error=google");
  }

  if (!info.emailVerified || !info.email) {
    return NextResponse.redirect("/login?error=google");
  }

  let user = await db.user.findFirst({ where: { email: info.email } });

  if (!user) {
    const baseSlug = slugify(info.name) || "negocio";
    const suffix = randomBytes(3).toString("hex");
    user = await db.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: info.name, slug: `${baseSlug}-${suffix}` },
      });
      const created = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: info.name,
          email: info.email,
          passwordHash: await hashPassword(randomBytes(24).toString("hex")),
          role: "OWNER",
        },
      });
      await tx.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: created.id,
          action: "CREATE",
          entityType: "Tenant",
          entityId: tenant.id,
        },
      });
      return created;
    });
  }

  if (!user.active) {
    return NextResponse.redirect("/login?error=blocked");
  }

  await createSession(user.id, user.tenantId);
  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  await db.auditLog.create({
    data: {
      tenantId: user.tenantId,
      userId: user.id,
      action: "LOGIN",
      entityType: "Session",
    },
  });

  return NextResponse.redirect("/");
}