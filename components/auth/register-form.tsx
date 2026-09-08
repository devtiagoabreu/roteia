"use client";

import { useActionState } from "react";
import { registerAction, type ActionResult } from "@/app/actions/auth";
import { Button, Input, Label } from "@/components/ui";

export function RegisterForm() {
  const [state, action, pending] = useActionState<ActionResult, FormData>(
    registerAction,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="companyName">Nome do negócio</Label>
        <Input
          id="companyName"
          name="companyName"
          required
          placeholder="Ex.: Distribuidora Silva"
        />
        {state.fieldErrors?.companyName && (
          <p className="mt-1 text-xs text-red-600">
            {state.fieldErrors.companyName}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="name">Seu nome</Label>
        <Input id="name" name="name" required placeholder="Maria Silva" />
        {state.fieldErrors?.name && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors.name}</p>
        )}
      </div>

      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="voce@empresa.com.br"
        />
        {state.fieldErrors?.email && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors.email}</p>
        )}
      </div>

      <div>
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Mínimo de 8 caracteres"
        />
        {state.fieldErrors?.password && (
          <p className="mt-1 text-xs text-red-600">
            {state.fieldErrors.password}
          </p>
        )}
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Criando conta…" : "Criar conta"}
      </Button>
    </form>
  );
}