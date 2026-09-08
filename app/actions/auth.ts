"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { loginSchema, registerSchema } from "@/lib/validations";
import { isUniqueViolation } from "@/lib/api-error";

export type ActionResult = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function toFieldErrors(
  error: { issues: Array<{ path: unknown[]; message: string }> },
): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0]);
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function registerAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    companyName: formData.get("companyName"),
  });

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) };
  }

  const { name, email, password, companyName } = parsed.data;
  const baseSlug = slugify(companyName) || "negocio";
  let slug = baseSlug;
  let slugTaken = true;

  for (let i = 0; i < 5 && slugTaken; i++) {
    const existing = await db.tenant.findUnique({ where: { slug } });
    if (existing) {
      slug = `${baseSlug}-${randomBytes(2).toString("hex")}`;
    } else {
      slugTaken = false;
    }
  }

  try {
    const user = await db.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: companyName, slug },
      });
      const owner = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name,
          email,
          passwordHash: await hashPassword(password),
          role: "OWNER",
        },
      });
      await tx.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: owner.id,
          action: "CREATE",
          entityType: "Tenant",
          entityId: tenant.id,
        },
      });
      return owner;
    });

    await createSession(user.id, user.tenantId);
    await db.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: "LOGIN",
        entityType: "Session",
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: "Este e-mail já está cadastrado." };
    }
    return { error: "Não foi possível criar a conta. Tente novamente." };
  }

  redirect("/");
}

export async function loginAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) };
  }

  const { email, password } = parsed.data;
  const user = await db.user.findFirst({ where: { email } });

  if (!user || !user.active) {
    return { error: "E-mail ou senha incorretos." };
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return { error: "E-mail ou senha incorretos." };
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

  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}