export function toDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function todayIso(tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y!, m! - 1, d!);
  date.setDate(date.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isValidDateIso(iso: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return false;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
}

/**
 * Interpreta "HH:MM" como um instante absoluto no fuso do tenant.
 * Sem dependências externas; assume offset fixo (ex.: America/Sao_Paulo => -03:00).
 */
export function timeInTz(
  dayIso: string,
  hhmm: string,
  tz: string,
): Date {
  const offset = tzOffset(tz);
  return new Date(`${dayIso}T${hhmm}:00${offset}`);
}

export function dayStartInTz(dayIso: string, tz: string): Date {
  return timeInTz(dayIso, "00:00", tz);
}

export function formatDateShort(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: tz,
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

export function formatTime(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function tzOffset(tz: string): string {
  if (/^UTC[+-]/.test(tz)) return `+${tz.replace("UTC", "")}`;
  if (tz === "America/Sao_Paulo" || tz === "America/Fortaleza")
    return "-03:00";
  if (tz === "America/Manaus") return "-04:00";
  if (tz === "America/Belem") return "-03:00";
  if (tz === "America/Recife") return "-03:00";
  if (tz === "America/Cuiaba") return "-04:00";
  if (/^[+-]\d{2}:?\d{2}$/.test(tz)) {
    const compact = tz.replace(":", "");
    return `${compact.slice(0, 3)}:${compact.slice(3)}`;
  }
  return "-03:00";
}