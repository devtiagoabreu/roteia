"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  PROFILE_TYPE_OPTIONS,
  TRANSPORT_MODE_LABELS,
  TIMEZONE_OPTIONS,
  changePasswordAction,
  deleteAccountAction,
  updateProfileAction,
} from "@/app/actions/profile";
import type { ProfileResult } from "@/app/actions/profile";
import { Button, Input } from "@/components/ui";
import type { TransportMode } from "@/generated/prisma/client";

type ProfileFormProps = {
  user: {
    name: string;
    email: string;
    timezone: string;
    profileType: string;
    transportMode: TransportMode;
  };
  companyName: string;
};

export function ProfileForm({ user, companyName }: ProfileFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function save(formData: FormData) {
    setError(null);
    setSuccess(false);
    const prev: ProfileResult = {};
    startTransition(async () => {
      const res = await updateProfileAction(prev, formData);
      if (!res.ok) {
        setError(res.error ?? (res.fieldErrors ? Object.values(res.fieldErrors)[0] : "Erro ao salvar."));
        return;
      }
      setSuccess(true);
      router.refresh();
    });
  }

  function changePassword(formData: FormData) {
    setError(null);
    setSuccess(false);
    const prev = {};
    startTransition(async () => {
      const res = await changePasswordAction(prev, formData);
      if (!res.ok) {
        setError(res.error ?? "Erro ao alterar a senha.");
        return;
      }
      setSuccess(true);
    });
  }

  return (
    <div className="space-y-6">
      {/* Dados pessoais */}
      <form action={save} className="space-y-4">
        <h2 className="text-sm font-semibold">Preferências do dia</h2>

        <div>
          <label htmlFor="profile-name" className="mb-1.5 block text-sm font-medium">
            Nome
          </label>
          <Input
            id="profile-name"
            name="name"
            defaultValue={user.name}
            required
          />
        </div>

        <div>
          <label htmlFor="profile-type" className="mb-1.5 block text-sm font-medium">
            Perfil de uso
          </label>
          <select
            id="profile-type"
            name="profileType"
            defaultValue={user.profileType}
            className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
          >
            {PROFILE_TYPE_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="profile-tz" className="mb-1.5 block text-sm font-medium">
              Fuso horário
            </label>
            <select
              id="profile-tz"
              name="timezone"
              defaultValue={user.timezone}
              className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
            >
              {TIMEZONE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="profile-mode" className="mb-1.5 block text-sm font-medium">
              Transporte
            </label>
            <select
              id="profile-mode"
              name="transportMode"
              defaultValue={user.transportMode}
              className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
            >
              {Object.entries(TRANSPORT_MODE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-[11px] text-zinc-400">
          O transporte muda a estimativa de deslocamento na otimização.
        </p>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
            Salvo.
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Salvando…" : "Salvar preferências"}
        </Button>
      </form>

      <hr className="border-zinc-200 dark:border-zinc-800" />

      {/* Conta */}
      <form action={changePassword} className="space-y-3">
        <h2 className="text-sm font-semibold">Conta</h2>
        <div>
          <label htmlFor="account-email" className="mb-1.5 block text-sm font-medium">
            E-mail
          </label>
          <Input id="account-email" value={user.email} readOnly className="opacity-70" />
        </div>
        <div>
          <label htmlFor="account-company" className="mb-1.5 block text-sm font-medium">
            Conta (tenant)
          </label>
          <Input id="account-company" value={companyName} readOnly className="opacity-70" />
        </div>
        <div>
          <label htmlFor="account-current" className="mb-1.5 block text-sm font-medium">
            Senha atual
          </label>
          <Input id="account-current" name="currentPassword" type="password" required />
        </div>
        <div>
          <label htmlFor="account-new" className="mb-1.5 block text-sm font-medium">
            Nova senha
          </label>
          <Input id="account-new" name="newPassword" type="password" required minLength={8} />
        </div>
        <Button type="submit" disabled={pending} variant="secondary" className="w-full">
          {pending ? "Alterando…" : "Alterar senha"}
        </Button>
      </form>

      {/* Zona de risco */}
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
        <h2 className="text-sm font-semibold text-red-700 dark:text-red-300">
          Excluir conta
        </h2>
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
          Apaga permanentemente todos os seus dados (dias, locais, atividades).
          Ação irreversível.
        </p>
        {confirmingDelete ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="border-red-300 text-red-700 dark:border-red-700 dark:text-red-300"
              onClick={() => {
                setConfirmingDelete(false);
                startTransition(async () => {
                  await deleteAccountAction();
                });
              }}
              disabled={pending}
            >
              {pending ? "Excluindo…" : "Confirmar exclusão"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmingDelete(false)}
            >
              Cancelar
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="secondary"
            className="mt-3 border-red-300 text-red-700 dark:border-red-700 dark:text-red-300"
            onClick={() => setConfirmingDelete(true)}
          >
            Excluir conta
          </Button>
        )}
      </div>
    </div>
  );
}