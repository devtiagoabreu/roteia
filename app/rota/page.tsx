import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Programa a Rota · Roteia",
  description:
    "Roteirização de entregas: clientes, rota otimizada, mapa e execução das paradas.",
};

const roadmap = [
  {
    step: "Clientes",
    detail:
      "Cadastro com endereço, geocodificação automática, ajuste manual do marcador no mapa e cache por endereço.",
  },
  {
    step: "Planejamento da rota",
    detail:
      "Selecionar clientes, otimizar a sequência (origem → paradas → destino), reordenar e salvar.",
  },
  {
    step: "Execução",
    detail:
      "Status por parada, horários previstos/reais, compartilhar a rota com o motorista e replanejar pendências.",
  },
  {
    step: "Importação e auditoria",
    detail:
      "Importação de clientes por planilha, trilha de auditoria e isolamento multi-tenant.",
  },
];

export default function RotaLandingPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Programa a Rota</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Módulo de entregas e deslocamentos: dos clientes à execução da rota,
          seguindo a arquitetura de roteirização do estudo de caso.
        </p>
      </div>

      <ol className="space-y-3">
        {roadmap.map((item, i) => (
          <li
            key={item.step}
            className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-semibold">{item.step}</p>
              <p className="mt-0.5 text-sm text-zinc-500">{item.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-xl border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
        <p className="text-sm font-medium">
          Comece pelo cadastro de clientes
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          O registro permanente com geocodificação é a base para montar,
          otimizar e executar suas rotas.
        </p>
        <Link
          href="/rota/clientes"
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-85 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Cadastrar clientes
        </Link>
      </div>
    </main>
  );
}