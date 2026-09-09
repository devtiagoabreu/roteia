"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRouteAction } from "@/app/actions/routes";
import { AddressInput } from "@/components/address-input";
import { CoordinatePicker } from "@/components/maps/coordinate-picker";
import { Button, Input, Label } from "@/components/ui";
import { todayIso } from "@/lib/date";

export function RouteCreateForm({
  tz,
  onDone,
}: {
  tz: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [addressText, setAddressText] = useState("");
  const [name, setName] = useState("");
  const [date, setDate] = useState(() => todayIso(tz));
  const [startTime, setStartTime] = useState("08:00");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("date", date);
    formData.set("name", name);
    formData.set("startAddress", addressText);
    formData.set("startTime", startTime);
    if (coords) {
      formData.set("startLat", String(coords.lat));
      formData.set("startLng", String(coords.lng));
    }

    startTransition(async () => {
      const res = await createRouteAction(formData);
      if (!res.ok) {
        setError(res.error ?? "Não foi possível criar a rota.");
        return;
      }
      setError(null);
      onDone?.();
      router.push(`/rota/rotas/${res.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="route-date">Data *</Label>
          <Input
            id="route-date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="route-name">Nome (opcional)</Label>
          <Input
            id="route-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Entregas centro-ok"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="route-start-address">Origem / ponto de partida</Label>
        <AddressInput
          id="route-start-address"
          value={addressText}
          onText={(v) => {
            setAddressText(v);
            setCoords(null);
          }}
          onPick={(s) => {
            setAddressText(s.label);
            setCoords({ lat: s.lat, lng: s.lng });
            setMapOpen(false);
          }}
          placeholder="Ex.: Rua Duque de Caxias, 1000"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-zinc-500">
            {coords
              ? "Coordenadas definidas."
              : "Sem coordenadas ainda — geocodifica ao salvar."}
          </span>
          <Button
            type="button"
            variant="secondary"
            className="px-3 py-1 text-xs"
            onClick={() => setMapOpen((v) => !v)}
          >
            {mapOpen ? "Fechar mapa" : "Ajustar no mapa"}
          </Button>
        </div>
        {mapOpen && (
          <div className="mt-3">
            <CoordinatePicker coords={coords} onPick={(c) => setCoords(c)} />
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="route-start-time">Início (estimado)</Label>
        <Input
          id="route-start-time"
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

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Criando…" : "Criar rota"}
      </Button>
    </form>
  );
}