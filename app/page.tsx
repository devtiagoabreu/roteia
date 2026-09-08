import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";

export default async function HubPage() {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/login");
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Roteia</h1>
        <p className="mt-2 text-sm text-zinc-500">
          {user.name}, o que vamos programar hoje?
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/dia"
          className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
        >
          <h2 className="text-xl font-bold">Programa o Dia</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Tarefas, visitas e compromissos pessoais com prioridades e rota
            otimizada no seu dia.
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-blue-600 group-hover:underline dark:text-blue-400">
            Abrir Meu Dia →
          </span>
        </Link>

        <Link
          href="/rota"
          className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
        >
          <h2 className="text-xl font-bold">Programa a Rota</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Entregas e deslocamentos do motorista: clientes, rota otimizada,
            mapa e execução das paradas.
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-blue-600 group-hover:underline dark:text-blue-400">
            Abrir Rota →
          </span>
        </Link>
      </div>
    </main>
  );
}