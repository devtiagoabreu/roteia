"use client";

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
import { Button } from "@/components/ui";
import { formatRouteTime, type RouteStopDto } from "@/components/route/types";
import { formatDistance } from "@/lib/format";

function navigateLinks(stop: RouteStopDto) {
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

function RouteStopRow({
  stop,
  tz,
  index,
  onRemove,
}: {
  stop: RouteStopDto;
  tz: string;
  index: number;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: stop.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative flex gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 ${
        isDragging ? "z-10 opacity-90 shadow-lg" : ""
      }`}
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
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
            {index + 1}
          </span>
          <span className="truncate text-sm font-medium">{stop.title}</span>
        </div>

        {stop.address && (
          <p className="mt-1 truncate text-xs text-zinc-500">{stop.address}</p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {stop.plannedStartAt && (
            <span className="font-semibold text-zinc-800 dark:text-zinc-100">
              {formatRouteTime(stop.plannedStartAt, tz)}
            </span>
          )}
          {stop.travelMinutes != null && stop.travelMinutes > 0 && (
            <span className="text-zinc-400">
              +{stop.travelMinutes} min de deslocamento
            </span>
          )}
          {stop.distanceFromPreviousMeters != null &&
            stop.distanceFromPreviousMeters > 0 && (
              <span className="text-zinc-400">
                {formatDistance(stop.distanceFromPreviousMeters)}
              </span>
            )}
        </div>

        {navigateLinks(stop)}
      </div>

      <Button
        type="button"
        variant="danger"
        onClick={() => onRemove(stop.id)}
        className="p-1.5"
        aria-label="Remover parada"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
      </Button>
    </li>
  );
}

export function RouteStopList({
  stops,
  tz,
  onReorder,
  onRemove,
}: {
  stops: RouteStopDto[];
  tz: string;
  onReorder: (ids: string[]) => void;
  onRemove: (id: string) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

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

  if (stops.length === 0) {
    return (
      <p className="text-center text-sm text-zinc-500">
        Nenhuma parada ainda. Adicione clientes ou endereços abaixo.
      </p>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={stops.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <ol className="space-y-2">
          {stops.map((stop, index) => (
            <RouteStopRow
              key={stop.id}
              stop={stop}
              tz={tz}
              index={index}
              onRemove={onRemove}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}