"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import {
  routeStopPriorityLabels,
  type RouteStopDto,
} from "@/components/route/types";

export type RouteStopEditData = {
  priority: RouteStopDto["priority"];
  serviceMinutes: number;
  windowStart: string | null;
  windowEnd: string | null;
  notes: string | null;
};

export function toWindowInput(iso: string | null, tz: string): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function RouteStopEditForm({
  stop,
  tz,
  onSave,
  onCancel,
}: {
  stop: RouteStopDto;
  tz: string;
  onSave: (data: RouteStopEditData) => void;
  onCancel: () => void;
}) {
  const [priority, setPriority] = useState<RouteStopDto["priority"]>(
    stop.priority,
  );
  const [serviceMinutes, setServiceMinutes] = useState(stop.serviceMinutes);
  const [windowStart, setWindowStart] = useState(
    toWindowInput(stop.windowStart, tz),
  );
  const [windowEnd, setWindowEnd] = useState(
    toWindowInput(stop.windowEnd, tz),
  );
  const [notes, setNotes] = useState(stop.notes ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      priority: priority as RouteStopDto["priority"],
      serviceMinutes,
      windowStart: windowStart || null,
      windowEnd: windowEnd || null,
      notes: notes.trim() || null,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-medium">
          Prioridade
          <select
            value={priority}
            onChange={(e) =>
              setPriority(e.target.value as RouteStopDto["priority"])
            }
            className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="AUTO">{routeStopPriorityLabels.AUTO}</option>
            <option value="PRIMEIRA">{routeStopPriorityLabels.PRIMEIRA}</option>
            <option value="ULTIMA">{routeStopPriorityLabels.ULTIMA}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium">
          Atendimento (min)
          <input
            type="number"
            min={0}
            max={600}
            value={serviceMinutes}
            onChange={(e) =>
              setServiceMinutes(Math.max(0, Number(e.target.value)))
            }
            className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>

        <fieldset className="flex flex-col gap-1 text-xs font-medium">
          <legend>Janela</legend>
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={windowStart}
              onChange={(e) => setWindowStart(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <span className="text-zinc-400">–</span>
            <input
              type="time"
              value={windowEnd}
              onChange={(e) => setWindowEnd(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          {(windowStart || windowEnd) && (
            <button
              type="button"
              onClick={() => {
                setWindowStart("");
                setWindowEnd("");
              }}
              className="text-left text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              Remover janela
            </button>
          )}
        </fieldset>
      </div>

      <label className="mt-3 flex flex-col gap-1 text-xs font-medium">
        Observações
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Instruções de acesso, referências…"
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <div className="mt-3 flex justify-end gap-2">
        <Button type="button" variant="ghost" className="px-3 py-1.5 text-xs" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="px-3 py-1.5 text-xs">
          Salvar
        </Button>
      </div>
    </form>
  );
}