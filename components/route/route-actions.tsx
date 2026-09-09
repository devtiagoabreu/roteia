"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  archiveRouteAction,
  restoreRouteAction,
} from "@/app/actions/routes";

export function RouteArchiveButton({
  routeId,
  archived = false,
}: {
  routeId: string;
  archived?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const res = archived
        ? await restoreRouteAction(routeId)
        : await archiveRouteAction(routeId);
      if (res.ok) router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="text-[11px] font-medium text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
    >
      {pending ? "…" : archived ? "Restaurar" : "Arquivar"}
    </button>
  );
}