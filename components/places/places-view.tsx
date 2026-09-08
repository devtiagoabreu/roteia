"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deletePlaceAction,
  toggleFavoriteAction,
  addPlaceToTodayAction,
} from "@/app/actions/places";
import { Button, Card } from "@/components/ui";
import { PlaceForm } from "@/components/places/place-form";
import type { PlaceDto } from "@/components/places/types";

function formatLastUsed(iso: string | null, tz: string): string {
  if (!iso) return "Ainda não usado";
  const label = new Intl.DateTimeFormat("pt-BR", {
    timeZone: tz,
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(iso));
  return `Usado em ${label}`;
}

export function PlacesView({
  places,
  tz,
}: {
  places: PlaceDto[];
  tz: string;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const res = await action();
      if (!res.ok && res.error) setFeedback(res.error);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <Button
        variant="secondary"
        onClick={() => setAdding((v) => !v)}
        className="w-full"
      >
        {adding ? "Fechar formulário" : "+ Novo local"}
      </Button>

      {adding && (
        <Card>
          <PlaceForm
            onDone={() => {
              setAdding(false);
              setFeedback("Local salvo.");
            }}
          />
        </Card>
      )}

      {feedback && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          {feedback}
        </p>
      )}

      {places.length === 0 && !adding && (
        <Card className="text-center">
          <p className="text-sm text-zinc-500">
            Nenhum local salvo ainda. Crie um abaixo ou salve direto de uma
            parada no{" "}
            <button
              type="button"
              onClick={() => router.push("/dia")}
              className="font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Meu Dia
            </button>
            .
          </p>
        </Card>
      )}

      <ul className="space-y-3">
        {places.map((place) => (
          <li key={place.id}>
            <Card>
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => run(() => toggleFavoriteAction(place.id))}
                      disabled={pending}
                      aria-label={place.isFavorite ? "Remover dos favoritos" : "Marcar como favorito"}
                      className={
                        place.isFavorite
                          ? "text-amber-500"
                          : "text-zinc-300 hover:text-amber-400 dark:text-zinc-600"
                      }
                    >
                      {place.isFavorite ? "★" : "☆"}
                    </button>
                    <span className="truncate text-sm font-semibold">
                      {place.label}
                    </span>
                    {place.category && (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        {place.category}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-zinc-600 dark:text-zinc-300">
                    {place.address}
                  </p>
                  {place.notes && (
                    <p className="mt-0.5 truncate text-xs text-zinc-400">
                      {place.notes}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-zinc-400">
                    {formatLastUsed(place.lastUsedAt, tz)}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-stretch gap-1.5">
                  <Button
                    variant="secondary"
                    className="px-3 py-1 text-xs"
                    onClick={() => run(() => addPlaceToTodayAction(place.id))}
                    disabled={pending}
                  >
                    Usar hoje
                  </Button>
                  <Button
                    variant="ghost"
                    className="px-3 py-1 text-xs"
                    onClick={() => setEditingId((v) => (v === place.id ? null : place.id))}
                  >
                    {editingId === place.id ? "Fechar" : "Editar"}
                  </Button>
                  <Button
                    variant="danger"
                    className="px-3 py-1 text-xs"
                    onClick={() => {
                      if (confirm(`Excluir "${place.label}"?`)) {
                        run(() => deletePlaceAction(place.id));
                      }
                    }}
                    disabled={pending}
                  >
                    Excluir
                  </Button>
                </div>
              </div>

              {editingId === place.id && (
                <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <PlaceForm
                    mode="edit"
                    place={place}
                    onDone={() => {
                      setEditingId(null);
                      setFeedback("Local atualizado.");
                    }}
                  />
                </div>
              )}
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}