import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";
import type { Tenant, User } from "@/generated/prisma/client";

export const SESSION_COOKIE = "roteia_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type SessionUser = User & { tenant: Tenant };

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function createSession(
  userId: string,
  tenantId: string,
): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  const session = await db.session.create({
    data: {
      userId,
      tenantId,
      tokenHash: randomBytes(32).toString("base64url"),
      expiresAt,
    },
  });

  const token = await new SignJWT({ sid: session.id })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const sessionId = payload.sid as string | undefined;
    if (!sessionId) return null;

    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: { user: { include: { tenant: true } } },
    });
    if (!session) return null;
    if (session.revokedAt) return null;
    if (session.expiresAt < new Date()) return null;
    if (!session.user.active) return null;

    return session.user;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSecret());
      const sessionId = payload.sid as string | undefined;
      if (sessionId) {
        await db.session
          .update({
            where: { id: sessionId },
            data: { revokedAt: new Date() },
          })
          .catch(() => {});
      }
    } catch {
      // token inválido/vencido — ignora
    }
  }

  cookieStore.delete(SESSION_COOKIE);
}