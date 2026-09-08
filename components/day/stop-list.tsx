"use client";

import { useTransition } from "react";
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

function StopRow({
  stop,
  tz,
  isLast,
  onRemove,
  onToggle,
}: {
  stop: StopDto;
  tz: string;
  isLast: boolean;
  onRemove: (id: string) => void;
  onToggle: (id: string, status: StopDto["status"]) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: stop.id });

  const done = stop.status === "FEITO";
  const skipped = stop.status === "PULADO";

  const meta: string[] = [];
  if (stop.address) meta.push(stop.address);
  meta.push(timeTypeLabels[stop.timeType]);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative flex gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 ${
        isDragging ? "z-10 shadow-lg opacity-90" : ""
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
          <span className="truncate text-sm font-medium">{stop.title}</span>
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
        </div>

        {stop.conflict && (
          <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
            ⚠ {stop.conflict}
          </p>
        )}
      </div>

      <div className="flex flex-col items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() =>
            onToggle(stop.id, done ? "PENDENTE" : "FEITO")
          }
          aria-label={done ? "Desmarcar como feito" : "Marcar como feito"}
          className="p-1.5"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={done ? "text-green-600" : "text-zinc-300"}
            aria-hidden
          >
            <circle cx="12" cy="12" r="9" />
            {done && <path d="M8 12.5l2.5 2.5L16 9.5" strokeLinecap="round" strokeLinejoin="round" />}
          </svg>
        </Button>
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
              onRemove={onRemove}
              onToggle={handleToggle}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}