"use server";

import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import {
  passwordResetHtml,
  passwordResetText,
  sendEmail,
} from "@/lib/email";

export type ForgotResult = { ok?: boolean; error?: string };

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function requestResetAction(
  formData: FormData,
): Promise<ForgotResult> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "E-mail inválido." };
  }

  const user = await db.user.findFirst({ where: { email } });
  // Sempre responde ok para não revelar se o e-mail existe.
  if (!user) return { ok: true };

  const token = randomBytes(32).toString("hex");
  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = `${origin}/recuperar-senha?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: "Redefinir sua senha no Roteia",
    html: passwordResetHtml(url),
    text: passwordResetText(url),
  });

  return { ok: true };
}

export async function resetPasswordAction(
  formData: FormData,
): Promise<ForgotResult> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  if (token.length < 32) return { error: "Link inválido ou expirado." };
  if (password.length < 8) {
    return { error: "A senha precisa de pelo menos 8 caracteres." };
  }

  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: "Link inválido ou expirado." };
  }

  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(password) },
    }),
    db.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    db.session.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return { ok: true };
}