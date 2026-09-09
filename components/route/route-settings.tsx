"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateRouteSettingsAction } from "@/app/actions/routes";
import { AddressInput } from "@/components/address-input";
import { CoordinatePicker } from "@/components/maps/coordinate-picker";
import { Button, Input, Label } from "@/components/ui";

export function RouteSettings({
  routeId,
  date,
  name,
  startAddress,
  startTimeIso,
  tz,
}: {
  routeId: string;
  date: string;
  name: string | null;
  startAddress: string | null;
  startTimeIso: string | null;
  tz: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [routeName, setRouteName] = useState(name ?? "");
  const [routeDate, setRouteDate] = useState(date);
  const [address, setAddress] = useState(startAddress ?? "");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [startTime, setStartTime] = useState(() => {
    if (!startTimeIso) return "08:00";
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(startTimeIso));
  });

  function onSubmit() {
    const formData = new FormData();
    formData.set("date", routeDate);
    formData.set("name", routeName);
    formData.set("startAddress", address);
    formData.set("startTime", startTime);
    if (coords) {
      formData.set("startLat", String(coords.lat));
      formData.set("startLng", String(coords.lng));
    }

    startTransition(async () => {
      const res = await updateRouteSettingsAction(routeId, formData);
      if (!res.ok) {
        setError(res.error ?? "Não foi possível salvar.");
        return;
      }
      setError(null);
      setCoords(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="route-settings-date">Data</Label>
          <Input
            id="route-settings-date"
            type="date"
            value={routeDate}
            onChange={(e) => setRouteDate(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="route-settings-name">Nome (opcional)</Label>
          <Input
            id="route-settings-name"
            value={routeName}
            onChange={(e) => setRouteName(e.target.value)}
            placeholder="Ex.: Entregas centro-ok"
          />
        </div>
      </div>

      <div>
        <label htmlFor="route-settings-address" className="mb-1.5 block text-sm font-medium">
          Origem / ponto de partida
        </label>
        <AddressInput
          id="route-settings-address"
          value={address}
          onText={(v) => {
            setCoords(null);
            setAddress(v);
          }}
          onPick={(s) => {
            setCoords({ lat: s.lat, lng: s.lng });
            setAddress(s.label);
          }}
          placeholder="Ex.: Rua Duque de Caxias, 1000"
        />
        {coords && (
          <p className="mt-1 text-[11px] text-zinc-500">
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </p>
        )}
        <button
          type="button"
          onClick={() => setShowMap((v) => !v)}
          className="mt-1 text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          {showMap ? "Fechar ajuste no mapa" : "Ajustar no mapa"}
        </button>
        {showMap && (
          <div className="mt-2">
            <CoordinatePicker coords={coords} onPick={(c) => setCoords(c)} />
          </div>
        )}
        <p className="mt-1 text-[11px] text-zinc-400">
          Usado como início da rota na otimização.
        </p>
      </div>

      <div>
        <Label htmlFor="route-settings-time">Início (estimado)</Label>
        <Input
          id="route-settings-time"
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
        <p className="mt-1 text-[11px] text-zinc-400">
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
        onClick={() => void onSubmit()}
        disabled={pending}
        className="w-full"
      >
        {pending ? "Salvando…" : "Salvar configurações"}
      </Button>
    </div>
  );
}