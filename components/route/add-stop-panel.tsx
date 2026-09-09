"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { addCustomerStopAction, addAddressStopAction } from "@/app/actions/routes";
import { AddressInput } from "@/components/address-input";
import { Button, Input, Label } from "@/components/ui";
import type { RouteCustomerOption, RouteStopDto } from "@/components/route/types";

export function AddStopPanel({
  routeId,
  customers,
  stops,
}: {
  routeId: string;
  customers: RouteCustomerOption[];
  stops: RouteStopDto[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"customer" | "address">("customer");

  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [addressText, setAddressText] = useState("");
  const [title, setTitle] = useState("");

  const addedCustomerIds = new Set(
    stops.map((s) => s.customerId).filter(Boolean),
  );

  const filtered = customers
    .filter((c) => !addedCustomerIds.has(c.id))
    .filter((c) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.code?.toLowerCase().includes(q) ?? false) ||
        (c.address?.toLowerCase().includes(q) ?? false)
      );
    })
    .slice(0, 50);

  function addCustomer(customerId: string) {
    setError(null);
    startTransition(async () => {
      const res = await addCustomerStopAction(routeId, customerId);
      if (!res.ok) {
        setError(res.error ?? "Não foi possível adicionar.");
        return;
      }
      router.refresh();
    });
  }

  function addAddress(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.set("title", title);
    formData.set("address", addressText);
    if (coords) {
      formData.set("lat", String(coords.lat));
      formData.set("lng", String(coords.lng));
    }
    startTransition(async () => {
      const res = await addAddressStopAction(routeId, formData);
      if (!res.ok) {
        setError(res.error ?? "Não foi possível adicionar.");
        return;
      }
      setTitle("");
      setAddressText("");
      setCoords(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-700">
        {(
          [
            { key: "customer", label: "Do cliente" },
            { key: "address", label: "Endereço livre" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t.key
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {tab === "customer" ? (
        <div className="space-y-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente por nome, código ou endereço"
          />
          {filtered.length === 0 ? (
            <p className="text-center text-xs text-zinc-400">
              Nenhum cliente disponível (já adicionados ficam ocultos).
            </p>
          ) : (
            <ul className="max-h-64 space-y-1.5 overflow-auto">
              {filtered.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {c.name}
                      {c.code && (
                        <span className="ml-1 text-xs font-normal text-zinc-400">
                          {c.code}
                        </span>
                      )}
                    </p>
                    {c.address && (
                      <p className="truncate text-xs text-zinc-500">{c.address}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => addCustomer(c.id)}
                    disabled={pending}
                    className="shrink-0 px-3 py-1.5 text-xs"
                  >
                    Adicionar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <form onSubmit={addAddress} className="space-y-3">
          <div>
            <Label htmlFor="stop-title">Título da parada *</Label>
            <Input
              id="stop-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Panificação Silva"
            />
          </div>
          <div>
            <Label htmlFor="stop-address">Endereço *</Label>
            <AddressInput
              id="stop-address"
              value={addressText}
              onText={(v) => {
                setAddressText(v);
                setCoords(null);
              }}
              onPick={(s) => {
                setAddressText(s.label);
                setCoords({ lat: s.lat, lng: s.lng });
              }}
              placeholder="Rua, número, bairro, cidade"
            />
            <p className="mt-1 text-[11px] text-zinc-400">
              {coords
                ? "Coordenadas definidas pela sugestão."
                : "Sem coordenadas ainda — geocodifica ao adicionar."}
            </p>
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Adicionando…" : "Adicionar parada"}
          </Button>
        </form>
      )}
    </div>
  );
}