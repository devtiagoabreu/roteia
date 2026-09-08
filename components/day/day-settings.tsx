"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setDaySettingsAction } from "@/app/actions/day";
import { AddressInput } from "@/components/address-input";
import { CoordinatePicker } from "@/components/maps/coordinate-picker";
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
  endAddress,
  tz,
}: {
  dayId: string;
  dateKey: string;
  startAddress: string | null;
  startTimeIso: string | null;
  endAddress: string | null;
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
  const [showStartMap, setShowStartMap] = useState(false);

  const [endAddr, setEndAddr] = useState(endAddress ?? "");
  const [endPickedCoords, setEndPickedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showEndMap, setShowEndMap] = useState(false);

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
    formData.set("endAddress", endAddr);
    if (endPickedCoords) {
      formData.set("endLat", String(endPickedCoords.lat));
      formData.set("endLng", String(endPickedCoords.lng));
    }

    startTransition(async () => {
      const res = await setDaySettingsAction(dayId, formData);
      if (!res.ok) {
        setError(res.error ?? "Não foi possível salvar.");
        return;
      }
      setError(null);
      setPickedCoords(null);
      setEndPickedCoords(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
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
        {pickedCoords && (
          <p className="mt-1 text-[11px] text-zinc-500">
            {pickedCoords.lat.toFixed(5)}, {pickedCoords.lng.toFixed(5)}
          </p>
        )}
        <button
          type="button"
          onClick={() => setShowStartMap((v) => !v)}
          className="mt-1 text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          {showStartMap ? "Fechar ajuste no mapa" : "Ajustar no mapa"}
        </button>
        {showStartMap && (
          <div className="mt-2">
            <CoordinatePicker
              coords={pickedCoords}
              onPick={(c) => setPickedCoords(c)}
            />
          </div>
        )}
        <p className="mt-1 text-[11px] text-zinc-400">
          Usado como início da rota na otimização.
        </p>
      </div>

      <div>
        <label htmlFor="day-end-address" className="mb-1.5 block text-sm font-medium">
          Destino final (opcional)
        </label>
        <AddressInput
          id="day-end-address"
          value={endAddr}
          onText={(v) => {
            setEndPickedCoords(null);
            setEndAddr(v);
          }}
          onPick={(s) => {
            setEndPickedCoords({ lat: s.lat, lng: s.lng });
            setEndAddr(s.label);
          }}
          placeholder="Ex.: sua casa / escritório"
        />
        {endPickedCoords && (
          <p className="mt-1 text-[11px] text-zinc-500">
            {endPickedCoords.lat.toFixed(5)}, {endPickedCoords.lng.toFixed(5)}
          </p>
        )}
        <button
          type="button"
          onClick={() => setShowEndMap((v) => !v)}
          className="mt-1 text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          {showEndMap ? "Fechar ajuste no mapa" : "Ajustar no mapa"}
        </button>
        {showEndMap && (
          <div className="mt-2">
            <CoordinatePicker
              coords={endPickedCoords}
              onPick={(c) => setEndPickedCoords(c)}
            />
          </div>
        )}
        <p className="mt-1 text-[11px] text-zinc-400">
          Aparece como ponto final no mapa do dia.
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