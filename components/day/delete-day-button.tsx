"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteDayAction } from "@/app/actions/day";
import { Button } from "@/components/ui";

export function DeleteDayButton({
  dayId,
  dateIso,
}: {
  dayId: string;
  dateIso: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm(`Excluir o dia ${dateIso} e todas as suas paradas?`)) return;
    startTransition(async () => {
      await deleteDayAction(dayId);
      router.refresh();
    });
  }

  return (
    <Button variant="ghost" onClick={handleDelete} disabled={pending} className="px-3 py-1 text-xs">
      Excluir
    </Button>
  );
}