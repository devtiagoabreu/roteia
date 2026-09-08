"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  archiveCustomerAction,
  deleteCustomerAction,
} from "@/app/actions/customers";
import { Button, Card, Input } from "@/components/ui";
import { CustomerForm } from "@/components/customers/customer-form";
import type { CustomerDto } from "@/components/customers/types";

function CoordinatesBadge({ dto }: { dto: CustomerDto }) {
  const address = dto.primaryAddress;
  const hasCoords = address?.lat != null && address?.lng != null;
  return hasCoords ? (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
      No mapa
    </span>
  ) : (
    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
      Sem coordenadas
    </span>
  );
}

export function CustomersView({
  customers,
  search,
}: {
  customers: CustomerDto[];
  search: string;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [query, setQuery] = useState(search);
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
      else setFeedback("Cliente atualizado.");
      router.refresh();
    });
  }

  function runSearch() {
    const q = query.trim();
    router.push(q ? `/rota/clientes?q=${encodeURIComponent(q)}` : "/rota/clientes");
  }

  const archivedCount = customers.filter((c) => !c.active).length;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") runSearch();
          }}
          placeholder="Buscar por nome, código, documento ou endereço"
          aria-label="Buscar clientes"
        />
        <Button variant="secondary" onClick={runSearch} disabled={pending}>
          Buscar
        </Button>
      </div>

      <Button
        variant="secondary"
        onClick={() => setAdding((v) => !v)}
        className="w-full"
      >
        {adding ? "Fechar formulário" : "+ Novo cliente"}
      </Button>

      {adding && (
        <Card>
          <CustomerForm
            onDone={() => {
              setAdding(false);
              setFeedback("Cliente salvo.");
            }}
          />
        </Card>
      )}

      {feedback && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          {feedback}
        </p>
      )}

      {customers.length === 0 && !adding && (
        <Card className="text-center">
          <p className="text-sm text-zinc-500">
            Nenhum cliente encontrado. Cadastre o primeiro abaixo para começar
            a montar suas rotas.
          </p>
        </Card>
      )}

      {archivedCount > 0 && (
        <p className="text-xs text-zinc-400">
          {archivedCount} cliente{archivedCount > 1 ? "s" : ""} arquivado
          {archivedCount > 1 ? "s" : ""} no fim da lista.
        </p>
      )}

      <ul className="space-y-3">
        {customers.map((customer) => (
          <li key={customer.id}>
            <Card
              className={
                customer.active
                  ? ""
                  : "opacity-70"
              }
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold">
                      {customer.name}
                    </span>
                    {!customer.active && (
                      <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                        Arquivado
                      </span>
                    )}
                    <CoordinatesBadge dto={customer} />
                    {customer.code && (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        {customer.code}
                      </span>
                    )}
                  </p>

                  <p className="mt-0.5 truncate text-sm text-zinc-600 dark:text-zinc-300">
                    {customer.primaryAddress?.raw ?? "Sem endereço."}
                  </p>

                  <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-zinc-400">
                    {customer.mobile && <span>{customer.mobile}</span>}
                    {customer.document && (
                      <span>{customer.document}</span>
                    )}
                    {customer.email && <span>{customer.email}</span>}
                  </p>

                  {customer.notes && (
                    <p className="mt-0.5 truncate text-xs text-zinc-400">
                      {customer.notes}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-stretch gap-1.5">
                  <Button
                    variant="ghost"
                    className="px-3 py-1 text-xs"
                    onClick={() =>
                      setEditingId((v) => (v === customer.id ? null : customer.id))
                    }
                  >
                    {editingId === customer.id ? "Fechar" : "Editar"}
                  </Button>
                  <Button
                    variant="secondary"
                    className="px-3 py-1 text-xs"
                    onClick={() =>
                      run(() => archiveCustomerAction(customer.id))
                    }
                    disabled={pending}
                  >
                    {customer.active ? "Arquivar" : "Reativar"}
                  </Button>
                  <Button
                    variant="danger"
                    className="px-3 py-1 text-xs"
                    onClick={() => {
                      if (
                        confirm(
                          `Excluir "${customer.name}"? As rotas já criadas são mantidas.`,
                        )
                      ) {
                        run(() => deleteCustomerAction(customer.id));
                      }
                    }}
                    disabled={pending}
                  >
                    Excluir
                  </Button>
                </div>
              </div>

              {editingId === customer.id && (
                <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <CustomerForm
                    mode="edit"
                    customer={customer}
                    onDone={() => {
                      setEditingId(null);
                      setFeedback("Cliente atualizado.");
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