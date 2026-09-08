import Link from "next/link";

export default function RotaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-1 flex-col">
      <nav className="sticky top-16 z-10 border-b border-zinc-200 bg-zinc-50/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-1 overflow-x-auto px-4">
          <Link
            href="/rota"
            className="shrink-0 border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Início
          </Link>
          <Link
            href="/rota/clientes"
            className="shrink-0 border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Clientes
          </Link>
          {["Rotas", "Execução"].map((label) => (
            <span
              key={label}
              className="shrink-0 px-3 py-2.5 text-sm font-medium text-zinc-300 dark:text-zinc-600"
            >
              {label}
            </span>
          ))}
        </div>
      </nav>
      {children}
    </div>
  );
}