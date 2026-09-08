"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { requestResetAction, resetPasswordAction } from "@/app/actions/password";
import { Button, Input } from "@/components/ui";

export function ForgotPasswordForm({ token }: { token?: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const action = token ? resetPasswordAction : requestResetAction;
      const res = await action(formData);
      if (!res.ok) {
        setError(res.error ?? "Algo deu errado.");
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {token
            ? "Senha redefinida! Você já pode entrar com a nova senha."
            : "Se o e-mail estiver cadastrado, enviaremos o link de recuperação. Verifique sua caixa de entrada."}
        </p>
        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-50 hover:opacity-85 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      {token ? (
        <input type="hidden" name="token" value={token} />
      ) : (
        <div>
          <label htmlFor="reset-email" className="mb-1.5 block text-sm font-medium">
            E-mail cadastrado
          </label>
          <Input
            id="reset-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            disabled={pending}
          />
        </div>
      )}

      {token && (
        <div>
          <label htmlFor="reset-password" className="mb-1.5 block text-sm font-medium">
            Nova senha
          </label>
          <Input
            id="reset-password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Mínimo de 8 caracteres"
            disabled={pending}
          />
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending
          ? "Enviando…"
          : token
            ? "Redefinir senha"
            : "Enviar link de recuperação"}
      </Button>
    </form>
  );
}