"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  customerWithAddressSchema,
  type CustomerWithAddressInput,
} from "@/lib/validations";
import {
  createCustomerAction,
  updateCustomerAction,
} from "@/app/actions/customers";
import { Button, Input, Label } from "@/components/ui";
import { AddressInput } from "@/components/address-input";
import { CoordinatePicker } from "@/components/maps/coordinate-picker";
import type { CustomerDto } from "@/components/customers/types";

export function CustomerForm({
  mode = "create",
  customer,
  onDone,
}: {
  mode?: "create" | "edit";
  customer?: CustomerDto | null;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    customer?.primaryAddress?.lat != null &&
      customer?.primaryAddress?.lng != null
      ? {
          lat: customer.primaryAddress.lat,
          lng: customer.primaryAddress.lng,
        }
      : null,
  );
  const [addressText, setAddressText] = useState(
    customer?.primaryAddress?.raw ?? "",
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CustomerWithAddressInput>({
    resolver: zodResolver(customerWithAddressSchema),
    defaultValues: {
      code: customer?.code ?? "",
      name: customer?.name ?? "",
      document: customer?.document ?? "",
      email: customer?.email ?? "",
      phone: customer?.phone ?? "",
      mobile: customer?.mobile ?? "",
      notes: customer?.notes ?? "",
      address: {
        label: customer?.primaryAddress?.label ?? "",
        raw: customer?.primaryAddress?.raw ?? "",
        zipcode: customer?.primaryAddress?.zipcode ?? "",
        number: "",
        complement: "",
        district: customer?.primaryAddress?.district ?? "",
        city: customer?.primaryAddress?.city ?? "",
        state: customer?.primaryAddress?.state ?? "",
        country: "BR",
      },
    },
  });

  function onSubmit(values: CustomerWithAddressInput) {
    const formData = new FormData();
    formData.set("code", values.code ?? "");
    formData.set("name", values.name);
    formData.set("document", values.document ?? "");
    formData.set("email", values.email ?? "");
    formData.set("phone", values.phone ?? "");
    formData.set("mobile", values.mobile ?? "");
    formData.set("notes", values.notes ?? "");

    const a = values.address;
    formData.set("addressLabel", a.label ?? "");
    formData.set("addressRaw", a.raw);
    formData.set("addressZipcode", a.zipcode ?? "");
    formData.set("addressStreet", "");
    formData.set("addressNumber", a.number ?? "");
    formData.set("addressComplement", a.complement ?? "");
    formData.set("addressDistrict", a.district ?? "");
    formData.set("addressCity", a.city ?? "");
    formData.set("addressState", a.state ?? "");
    formData.set("addressCountry", a.country ?? "BR");

    if (coords) {
      formData.set("lat", String(coords.lat));
      formData.set("lng", String(coords.lng));
    }

    startTransition(async () => {
      const result =
        mode === "edit" && customer
          ? await updateCustomerAction(customer.id, formData)
          : await createCustomerAction(formData);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setError(null);
      if (mode === "create") {
        reset();
        setCoords(null);
        setAddressText("");
        setMapOpen(false);
      }
      onDone?.();
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="customer-name">Nome *</Label>
          <Input
            id="customer-name"
            {...register("name")}
            placeholder="Empresa ou pessoa"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="customer-code">Código</Label>
          <Input
            id="customer-code"
            {...register("code")}
            placeholder="Ex.: CLI-001"
          />
        </div>
        <div>
          <Label htmlFor="customer-document">CPF / CNPJ</Label>
          <Input
            id="customer-document"
            {...register("document")}
            placeholder="Somente números ou formatado"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="customer-mobile">WhatsApp / Celular</Label>
          <Input
            id="customer-mobile"
            {...register("mobile")}
            placeholder="(00) 00000-0000"
          />
        </div>
        <div>
          <Label htmlFor="customer-phone">Telefone</Label>
          <Input
            id="customer-phone"
            {...register("phone")}
            placeholder="(00) 0000-0000"
          />
        </div>
        <div>
          <Label htmlFor="customer-email">E-mail</Label>
          <Input
            id="customer-email"
            {...register("email")}
            placeholder="contato@exemplo.com.br"
            type="email"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="address-label">Nome do endereço</Label>
            <Input
              id="address-label"
              {...register("address.label")}
              placeholder="Matriz, Filial, Depósito…"
            />
          </div>
          <div>
            <Label htmlFor="address-zipcode">CEP</Label>
            <Input
              id="address-zipcode"
              {...register("address.zipcode")}
              placeholder="00000-000"
            />
          </div>
        </div>

        <div className="mt-3">
          <Label htmlFor="customer-address">Endereço *</Label>
          <AddressInput
            id="customer-address"
            value={addressText}
            onText={(v) => {
              setAddressText(v);
              setCoords(null);
              setValue("address.raw", v, { shouldValidate: true });
            }}
            onPick={(s) => {
              setAddressText(s.label);
              setCoords({ lat: s.lat, lng: s.lng });
              setMapOpen(false);
              setValue("address.raw", s.label, { shouldValidate: true });
            }}
            placeholder="Rua, número, bairro, cidade"
          />
          {errors.address?.raw && (
            <p className="mt-1 text-xs text-red-600">
              {errors.address.raw.message}
            </p>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <Label htmlFor="address-number">Número</Label>
            <Input
              id="address-number"
              {...register("address.number")}
              placeholder="123"
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="address-complement">Complemento</Label>
            <Input
              id="address-complement"
              {...register("address.complement")}
              placeholder="Apto, sala, bloco…"
            />
          </div>
          <div>
            <Label htmlFor="address-district">Bairro</Label>
            <Input
              id="address-district"
              {...register("address.district")}
              placeholder="Centro"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="address-city">Cidade</Label>
            <Input
              id="address-city"
              {...register("address.city")}
              placeholder="Santa Bárbara d'Oeste"
            />
          </div>
          <div>
            <Label htmlFor="address-state">UF</Label>
            <Input
              id="address-state"
              {...register("address.state")}
              placeholder="SP"
              maxLength={2}
            />
          </div>
          <div>
            <Label htmlFor="address-country">País</Label>
            <Input
              id="address-country"
              {...register("address.country")}
              placeholder="BR"
              maxLength={2}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-zinc-500">
            {coords
              ? "Coordenadas definidas." +
                (customer?.primaryAddress?.geocodingProvider
                  ? ` (${customer.primaryAddress.geocodingProvider})`
                  : "")
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
            <CoordinatePicker
              coords={coords}
              onPick={(c) => setCoords(c)}
            />
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="customer-notes">Observações</Label>
        <Input
          id="customer-notes"
          {...register("notes")}
          placeholder="Portaria, restrições, instruções de entrega…"
        />
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
            : "Salvar cliente"}
      </Button>
    </form>
  );
}