"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  activitySchema,
  priorityLabels,
  timeTypeLabels,
  type ActivityInput,
} from "@/lib/validations";
import {
  createActivityAction,
  type ActivityActionResult,
} from "@/app/actions/activity";
import { addToDayAction } from "@/app/actions/day";
import { markPlaceUsedAction } from "@/app/actions/places";
import { Button, Input, Label, Select } from "@/components/ui";
import { AddressInput } from "@/components/address-input";
import type { PlaceDto } from "@/components/places/types";

export function ActivityForm({
  dayId,
  dateIso,
  savedPlaces = [],
  onCreated,
}: {
  dayId: string;
  dateIso: string;
  savedPlaces?: PlaceDto[];
  onCreated?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pickedCoords, setPickedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ActivityInput>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: "",
      category: "",
      address: "",
      priority: "NORMAL",
      timeType: "FLEXIVEL",
      startTime: "",
      windowStartTime: "",
      windowEndTime: "",
      durationMinutes: 30,
      notes: "",
    },
  });

  const timeType = watch("timeType");

  async function onSubmit(values: ActivityInput) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) {
      formData.set(key, value == null ? "" : String(value));
    }
    if (pickedCoords) {
      formData.set("lat", String(pickedCoords.lat));
      formData.set("lng", String(pickedCoords.lng));
    }

    startTransition(async () => {
      const result = (await createActivityAction(dateIso, {
        ok: false,
        error: "",
      }, formData)) as ActivityActionResult;

      if (!result.ok) {
        setError(result.error);
        return;
      }

      const addResult = await addToDayAction(dayId, result.activity.id);
      if (!addResult.ok) {
        setError(addResult.error ?? "Não foi possível adicionar ao dia.");
        return;
      }

      setError(null);
      reset();
      setPickedCoords(null);
      onCreated?.();
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <Label htmlFor="title">O que precisa fazer?</Label>
        <Input
          id="title"
          {...register("title")}
          placeholder="Ex.: Entregar pedido na Gerencial"
        />
        {errors.title && (
          <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="category">Categoria</Label>
          <Input id="category" {...register("category")} placeholder="Entrega" />
        </div>
        <div>
          <Label htmlFor="durationMinutes">Duração (min)</Label>
<Input
          id="durationMinutes"
          type="number"
          min={5}
          max={600}
          {...register("durationMinutes", { valueAsNumber: true })}
        />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="priority">Prioridade</Label>
          <Select id="priority" {...register("priority")}>
            {Object.entries(priorityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="timeType">Horário</Label>
          <Select id="timeType" {...register("timeType")}>
            {Object.entries(timeTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {timeType === "FIXO" && (
        <div>
          <Label htmlFor="startTime">Início às</Label>
          <Input id="startTime" type="time" {...register("startTime")} />
          {errors.startTime && (
            <p className="mt-1 text-xs text-red-600">
              {errors.startTime.message}
            </p>
          )}
        </div>
      )}

      {timeType === "JANELA" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="windowStartTime">Janela de</Label>
            <Input
              id="windowStartTime"
              type="time"
              {...register("windowStartTime")}
            />
          </div>
          <div>
            <Label htmlFor="windowEndTime">Até</Label>
            <Input
              id="windowEndTime"
              type="time"
              {...register("windowEndTime")}
            />
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="address">Endereço</Label>
        <AddressInput
          id="address"
          value={watch("address") ?? ""}
          onText={(v) => {
            setPickedCoords(null);
            setValue("address", v, { shouldValidate: true });
          }}
          onPick={(s) => {
            setPickedCoords({ lat: s.lat, lng: s.lng });
            setValue("address", s.label, { shouldValidate: true });
          }}
          placeholder="Rua, número, bairro, cidade"
        />
        <p className="mt-1 text-[11px] text-zinc-400">
          Deixe em branco para marcar como flexível (sem local).
        </p>
      </div>

      {savedPlaces.length > 0 && (
        <div>
          <Label htmlFor="savedPlace">Preencher com local salvo</Label>
          <Select
            id="savedPlace"
            defaultValue=""
            onChange={(e) => {
              const id = e.target.value;
              if (!id) return;
              const place = savedPlaces.find((p) => p.id === id);
              if (!place) return;
              setValue("address", place.address, { shouldValidate: true });
              setPickedCoords(
                place.lat != null && place.lng != null
                  ? { lat: place.lat, lng: place.lng }
                  : null,
              );
              if (!getValues("title")) setValue("title", place.label);
              markPlaceUsedAction(place.id).catch(() => {});
              e.target.value = "";
            }}
          >
            <option value="">— selecione um local —</option>
            {savedPlaces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
                {p.address ? ` — ${p.address}` : ""}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="notes">Observações</Label>
        <Input id="notes" {...register("notes")} placeholder="Opcional" />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Adicionando…" : "Adicionar ao dia"}
      </Button>
    </form>
  );
}