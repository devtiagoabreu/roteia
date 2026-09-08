"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { placeSchema, type PlaceInput } from "@/lib/validations";
import {
  createPlaceAction,
  updatePlaceAction,
} from "@/app/actions/places";
import { Button, Input, Label } from "@/components/ui";
import { AddressInput } from "@/components/address-input";
import type { PlaceDto } from "@/components/places/types";

export function PlaceForm({
  mode = "create",
  place,
  onDone,
}: {
  mode?: "create" | "edit";
  place?: PlaceDto | null;
  onDone?: () => void;
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
    formState: { errors },
  } = useForm<PlaceInput>({
    resolver: zodResolver(placeSchema),
    defaultValues: {
      label: place?.label ?? "",
      category: place?.category ?? "",
      address: place?.address ?? "",
      notes: place?.notes ?? "",
    },
  });

  function onSubmit(values: PlaceInput) {
    const formData = new FormData();
    formData.set("label", values.label);
    formData.set("category", values.category ?? "");
    formData.set("address", values.address);
    formData.set("notes", values.notes ?? "");
    if (pickedCoords) {
      formData.set("lat", String(pickedCoords.lat));
      formData.set("lng", String(pickedCoords.lng));
    }

    startTransition(async () => {
      const result =
        mode === "edit" && place
          ? await updatePlaceAction(place.id, formData)
          : await createPlaceAction(formData);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setError(null);
      if (mode === "create") {
        reset();
        setPickedCoords(null);
      }
      onDone?.();
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <Label htmlFor="place-label">Nome do local</Label>
        <Input id="place-label" {...register("label")} placeholder="Ex.: Escritório / Posto Ipiranga" />
        {errors.label && (
          <p className="mt-1 text-xs text-red-600">{errors.label.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="place-category">Categoria</Label>
        <Input id="place-category" {...register("category")} placeholder="Trabalho" />
      </div>

      <div>
        <Label htmlFor="place-address">Endereço</Label>
        <AddressInput
          id="place-address"
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
        {errors.address && (
          <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="place-notes">Observações</Label>
        <Input id="place-notes" {...register("notes")} placeholder="Opcional" />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending
          ? "Salvando…"
          : mode === "edit"
            ? "Salvar alterações"
            : "Salvar local"}
      </Button>
    </form>
  );
}