"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/require-user";
import { destroySession } from "@/lib/auth/session";
import { profileSchema } from "@/lib/validations";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export type ProfileResult = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export const TIMEZONE_OPTIONS = [
  "America/Sao_Paulo",
  "America/Manaus",
  "America/Belem",
  "America/Fortaleza",
  "America/Recife",
  "America/Bahia",
  "America/Brasilia",
  "America/Cuiaba",
  "America/Campo_Grande",
  "America/Porto_Velho",
  "America/Boa_Vista",
  "America/Noronha",
  "UTC",
] as const;

export const PROFILE_TYPE_OPTIONS = [
  { value: "PESSOAL", label: "Pessoal" },
  { value: "TECNICO", label: "Técnico / prestador de serviço" },
  { value: "REPRESENTANTE", label: "Representante / vendedor externo" },
  { value: "ENTREGADOR", label: "Entregador / motorista de curta distância" },
] as const;

export const TRANSPORT_MODE_LABELS: Record<string, string> = {
  CARRO: "Carro",
  MOTO: "Moto",
  BICICLETA: "Bicicleta",
  PEDESTRE: "A pé",
};

export async function updateProfileAction(
  _prev: ProfileResult,
  formData: FormData,
): Promise<ProfileResult> {
  try {
    const user = await requireUser();
    const parsed = profileSchema.safeParse({
      name: formData.get("name"),
      timezone: formData.get("timezone"),
      profileType: formData.get("profileType"),
      transportMode: formData.get("transportMode"),
    });

    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!fields[key]) fields[key] = issue.message;
      }
      return { fieldErrors: fields };
    }

    const { name, timezone, profileType, transportMode } = parsed.data;

    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { name },
      }),
      db.tenant.update({
        where: { id: user.tenantId },
        data: { timezone, profileType, transportMode },
      }),
    ]);

    revalidatePath("/dia");
    revalidatePath("/dia/perfil");
    return { ok: true };
  } catch {
    return { error: "Não foi possível salvar o perfil." };
  }
}

export async function deleteAccountAction(): Promise<void> {
  const user = await requireUser();
  await db.tenant.delete({ where: { id: user.tenantId } });
  await destroySession();
  redirect("/login");
}

export async function changePasswordAction(
  _prev: ProfileResult,
  formData: FormData,
): Promise<ProfileResult> {
  try {
    const user = await requireUser();
    const current = String(formData.get("currentPassword") ?? "");
    const next = String(formData.get("newPassword") ?? "");

    const fresh = await db.user.findUnique({ where: { id: user.id } });
    if (!fresh) return { error: "Usuário não encontrado." };
    if (!(await verifyPassword(current, fresh.passwordHash))) {
      return { error: "Senha atual incorreta." };
    }
    if (next.length < 8) {
      return { error: "A nova senha precisa de pelo menos 8 caracteres." };
    }

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(next) },
    });
    return { ok: true };
  } catch {
    return { error: "Não foi possível alterar a senha." };
  }
}