import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { logoutAction } from "@/app/actions/auth";

export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Roteia
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <Link
              href="/dia"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
            >
              Meu Dia
            </Link>
            <Link
              href="/rota"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
            >
              Rota
            </Link>
            <span className="hidden text-sm text-zinc-500 dark:text-zinc-400 sm:inline">
              {user.name}
            </span>
            <form action={logoutAction}>
              <button className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                Sair
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-700 hover:text-zinc-950 dark:text-zinc-300"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}