import { getSessionUser } from "@/lib/auth/session";
import { ApiError } from "@/lib/api-error";
import type { SessionUser } from "@/lib/auth/session";

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new ApiError("NOT_AUTHENTICATED", 401, "Faça login para continuar.");
  }
  return user;
}