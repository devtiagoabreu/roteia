"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setDaySettingsAction } from "@/app/actions/day";
import { AddressInput } from "@/components/address-input";
import { Button, Input } from "@/components/ui";

function defaultStartTime(startTimeIso: string | null, tz: string): string {
  if (!startTimeIso) return "08:00";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(startTimeIso));
}

export function DaySettings({
  dayId,
  dateKey,
  startAddress,
  startTimeIso,
  tz,
}: {
  dayId: string;
  dateKey: string;
  startAddress: string | null;
  startTimeIso: string | null;
  tz: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState(startAddress ?? "");
  const [pickedCoords, setPickedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [startTime, setStartTime] = useState(() =>
    defaultStartTime(startTimeIso, tz),
  );

  function onSubmit() {
    const formData = new FormData();
    formData.set("address", address);
    if (pickedCoords) {
      formData.set("lat", String(pickedCoords.lat));
      formData.set("lng", String(pickedCoords.lng));
    }
    formData.set("startTime", startTime);

    startTransition(async () => {
      const res = await setDaySettingsAction(dayId, formData);
      if (!res.ok) {
        setError(res.error ?? "Não foi possível salvar.");
        return;
      }
      setError(null);
      setPickedCoords(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="day-start-address" className="mb-1.5 block text-sm font-medium">
          Origem / ponto de partida
        </label>
        <AddressInput
          id="day-start-address"
          value={address}
          onText={(v) => {
            setPickedCoords(null);
            setAddress(v);
          }}
          onPick={(s) => {
            setPickedCoords({ lat: s.lat, lng: s.lng });
            setAddress(s.label);
          }}
          placeholder="Ex.: Rua Duque de Caxias, 1000"
        />
        <p className="mt-1 text-[11px] text-zinc-400">
          Usado como início da rota na otimização.
        </p>
      </div>

      <div className="grid grid-cols-[1fr_auto] items-end gap-3">
        <div>
          <label htmlFor="day-start-time" className="mb-1.5 block text-sm font-medium">
            Início do dia (estimado)
          </label>
          <Input
            id="day-start-time"
            key={dateKey}
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <p className="pb-1 text-[11px] text-zinc-400">
          Padrão <span className="font-medium">08:00</span> se vazio.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <Button
        type="button"
        onClick={() => {
          void onSubmit();
        }}
        disabled={pending}
        className="w-full"
      >
        {pending ? "Salvando…" : "Salvar configurações"}
      </Button>
      <p className="text-center text-[11px] text-zinc-400">
        Depois de salvar, clique em otimizar para aplicar na rota.
      </p>
    </div>
  );
}