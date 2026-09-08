import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Card } from "@/components/ui";

export default async function RecoverPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">
        {token ? "Definir nova senha" : "Recuperar senha"}
      </h1>
      <Card>
        <ForgotPasswordForm token={token} />
      </Card>
      <p className="mt-4 text-center text-sm text-zinc-500">
        Lembrou a senha?{" "}
        <Link
          href="/login"
          className="font-medium text-zinc-900 underline dark:text-zinc-100"
        >
          Fazer login
        </Link>
      </p>
    </main>
  );
}