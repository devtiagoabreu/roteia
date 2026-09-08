import { z } from "zod";
import type { Priority, TimeType } from "@/generated/prisma/client";

const email = z.string().email("E-mail inválido.").trim().toLowerCase();
const name = z.string().trim().min(2, "Informe um nome.").max(120);

const time = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Use o formato HH:MM")
  .optional()
  .or(z.literal(""));

export const registerSchema = z.object({
  name,
  email,
  password: z.string().min(8, "A senha precisa de pelo menos 8 caracteres."),
  companyName: z
    .string()
    .trim()
    .min(2, "Informe o nome do negócio.")
    .max(120),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Informe a senha."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const profileSchema = z.object({
  name,
  timezone: z.string().min(1, "Selecione o fuso."),
  profileType: z.string().min(1, "Selecione o perfil de uso."),
  transportMode: z.enum(["CARRO", "MOTO", "BICICLETA", "PEDESTRE"]),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const activitySchema = z.object({
  title: z.string().trim().min(2, "Informe o título.").max(140),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  priority: z.enum(["ESSENCIAL", "ALTA", "NORMAL", "BAIXA"]),
  timeType: z.enum(["FIXO", "JANELA", "FLEXIVEL"]),
  startTime: time,
  windowStartTime: time,
  windowEndTime: time,
  durationMinutes: z
    .number()
    .int()
    .min(5, "Mínimo de 5 minutos.")
    .max(600),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type ActivityInput = z.infer<typeof activitySchema>;

export const placeSchema = z.object({
  label: z.string().trim().min(2, "Informe um nome.").max(120),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  address: z.string().trim().min(3, "Informe o endereço.").max(300),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type PlaceInput = z.infer<typeof placeSchema>;

export const priorityLabels: Record<Priority, string> = {
  ESSENCIAL: "Essencial",
  ALTA: "Alta",
  NORMAL: "Normal",
  BAIXA: "Baixa",
};

export const timeTypeLabels: Record<TimeType, string> = {
  FIXO: "Horário fixo",
  JANELA: "Janela",
  FLEXIVEL: "Flexível",
};

export function combineTimeIntoDate(
  date: Date,
  hhmm: string | undefined | null,
): Date | null {
  if (!hhmm) return null;
  const [hours, minutes] = hhmm.split(":").map(Number);
  const value = new Date(date);
  value.setHours(hours, minutes, 0, 0);
  return value;
}

export function firstFieldMessage(
  error: z.ZodError,
): string | undefined {
  return error.issues[0]?.message;
}