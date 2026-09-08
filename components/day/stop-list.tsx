"use client";

import { useTransition, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toggleStopStatusAction } from "@/app/actions/day";
import { saveStopAsPlaceAction } from "@/app/actions/places";
import { Badge, Button } from "@/components/ui";
import { priorityLabels, timeTypeLabels } from "@/lib/validations";
import type { StopDto } from "@/components/day/types";

function formatTime(iso: string | null, tz: string): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

const statusLabels: Record<StopDto["status"], string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  FEITO: "Concluída",
  PULADO: "Pulada",
};

function navigateLinks(stop: StopDto) {
  if (stop.lat == null || stop.lng == null) return null;
  const ll = `${stop.lat},${stop.lng}`;
  return (
    <div className="mt-1 flex items-center gap-2 text-[11px]">
      <span className="text-zinc-400">Navegar:</span>
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${ll}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-blue-600 hover:underline dark:text-blue-400"
      >
        Google Maps
      </a>
      <a
        href={`https://waze.com/ul?ll=${ll}&navigate=yes`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-blue-600 hover:underline dark:text-blue-400"
      >
        Waze
      </a>
    </div>
  );
}

function StopRow({
  stop,
  tz,
  isLast,
  isNext,
  saved,
  onRemove,
  onToggle,
  onSave,
}: {
  stop: StopDto;
  tz: string;
  isLast: boolean;
  isNext: boolean;
  saved: boolean;
  onRemove: (id: string) => void;
  onToggle: (id: string, status: StopDto["status"]) => void;
  onSave: (stop: StopDto) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: stop.id });

  const done = stop.status === "FEITO";
  const skipped = stop.status === "PULADO";
  const active = stop.status === "PENDENTE" || stop.status === "EM_ANDAMENTO";

  const meta: string[] = [];
  if (stop.address) meta.push(stop.address);
  meta.push(timeTypeLabels[stop.timeType]);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative flex gap-3 rounded-lg border p-3 ${
        isDragging ? "z-10 shadow-lg opacity-90" : ""
      } ${
        isNext && active
          ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/20"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      } ${done ? "opacity-60" : ""} ${skipped ? "opacity-40" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Arrastar para reordenar"
        className="flex cursor-grab touch-none items-center px-0.5 text-zinc-300 active:cursor-grabbing dark:text-zinc-600"
      >
        <svg width="10" height="20" viewBox="0 0 10 20" fill="currentColor" aria-hidden>
          <circle cx="2.5" cy="3" r="1.2" />
          <circle cx="7.5" cy="3" r="1.2" />
          <circle cx="2.5" cy="10" r="1.2" />
          <circle cx="7.5" cy="10" r="1.2" />
          <circle cx="2.5" cy="17" r="1.2" />
          <circle cx="7.5" cy="17" r="1.2" />
        </svg>
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Badge priority={stop.priority}>{priorityLabels[stop.priority]}</Badge>
          {isNext && active && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Próxima
            </span>
          )}
          <span className="truncate text-sm font-medium">{stop.title}</span>
          <span className={`ml-auto shrink-0 text-[11px] font-medium ${done ? "text-green-600" : skipped ? "text-zinc-400" : "text-zinc-500"}`}>
            {statusLabels[stop.status]}
          </span>
        </div>
        <div className="mt-1 truncate text-xs text-zinc-500">
          {meta.join(" · ")}
          {stop.travelMinutes != null && stop.travelMinutes > 0 && (
            <span> · +{stop.travelMinutes} min de deslocamento</span>
          )}
        </div>

        <div className="mt-1 flex items-center gap-3 text-xs">
          {stop.plannedStartAt ? (
            <span className="font-semibold text-zinc-800 dark:text-zinc-100">
              {formatTime(stop.plannedStartAt, tz)} –{" "}
              {formatTime(stop.plannedEndAt, tz)}
            </span>
          ) : (
            stop.startAt && (
              <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                {formatTime(stop.startAt, tz)} (fixo)
              </span>
            )
          )}
          <span className="text-zinc-400">
            {stop.durationMinutes} min
            {stop.windowStartAt &&
              ` · janela ${formatTime(stop.windowStartAt, tz)}–${formatTime(stop.windowEndAt, tz)}`}
          </span>
          {(stop.startedAt || stop.finishedAt) && (
            <span className="text-zinc-400">
              {stop.startedAt && ` · iniciada às ${formatTime(stop.startedAt, tz)}`}
              {stop.finishedAt && ` · concluída às ${formatTime(stop.finishedAt, tz)}`}
            </span>
          )}
        </div>

        {navigateLinks(stop)}

        {stop.address && !saved && (
          <button
            type="button"
            onClick={() => onSave(stop)}
            className="mt-1 text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Salvar local
          </button>
        )}
        {saved && (
          <span className="mt-1 block text-[11px] font-medium text-green-600 dark:text-green-400">
            Local salvo ✓
          </span>
        )}

        {stop.conflict && (
          <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
            ⚠ {stop.conflict}
          </p>
        )}
      </div>

      <div className="flex flex-col items-stretch justify-between gap-2">
        {active && (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                onToggle(
                  stop.id,
                  stop.status === "EM_ANDAMENTO" ? "FEITO" : "EM_ANDAMENTO",
                )
              }
              className="px-3 py-1 text-xs"
            >
              {stop.status === "EM_ANDAMENTO" ? "Concluído" : "Cheguei"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onToggle(stop.id, "PULADO")}
              className="px-3 py-1 text-xs"
            >
              Pular
            </Button>
          </>
        )}
        {!active && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => onToggle(stop.id, "PENDENTE")}
            className="px-3 py-1 text-xs"
          >
            Reabrir
          </Button>
        )}
        <Button type="button" variant="danger" onClick={() => onRemove(stop.id)} className="p-1.5" aria-label="Remover">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </Button>
      </div>

      {!isLast && (
        <div className="absolute -bottom-2 left-7 right-7 h-0.5 rounded bg-zinc-100 dark:bg-zinc-800" aria-hidden />
      )}
    </li>
  );
}

export function StopList({
  stops,
  tz,
  onReorder,
  onRemove,
}: {
  stops: StopDto[];
  tz: string;
  onReorder: (ids: string[]) => void;
  onRemove: (id: string) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const [, startTransition] = useTransition();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = stops.map((s) => s.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(ids, oldIndex, newIndex);
    onReorder(next);
  }

  function handleToggle(id: string, status: StopDto["status"]) {
    startTransition(async () => {
      await toggleStopStatusAction(id, status);
      window.location.reload();
    });
  }

  function handleSave(stop: StopDto) {
    startTransition(async () => {
      const res = await saveStopAsPlaceAction({
        title: stop.title,
        address: stop.address,
        lat: stop.lat,
        lng: stop.lng,
        notes: stop.notes ?? null,
      });
      if (res.ok) {
        setSavedIds((prev) => new Set(prev).add(stop.id));
      }
    });
  }

  const nextIndex = stops.findIndex(
    (s) => s.status === "PENDENTE" || s.status === "EM_ANDAMENTO",
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={stops.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <ol className="space-y-3">
          {stops.map((stop, index) => (
            <StopRow
              key={stop.id}
              stop={stop}
              tz={tz}
              isLast={index === stops.length - 1}
              isNext={index === nextIndex}
              saved={savedIds.has(stop.id)}
              onRemove={onRemove}
              onToggle={handleToggle}
              onSave={handleSave}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}