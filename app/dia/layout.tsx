import Link from "next/link";

const nav = [
  { href: "/dia", label: "Meu Dia" },
  { href: "/dia/days", label: "Meus Dias" },
  { href: "/dia/places", label: "Meus Locais" },
  { href: "/dia/perfil", label: "Perfil" },
];

export default function DiaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-1 flex-col">
      <nav className="sticky top-16 z-10 border-b border-zinc-200 bg-zinc-50/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-1 overflow-x-auto px-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      {children}
    </div>
  );
}