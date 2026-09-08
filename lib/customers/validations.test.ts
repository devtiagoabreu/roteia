import { describe, expect, it } from "vitest";
import {
  addressSchema,
  customerSchema,
  customerWithAddressSchema,
} from "@/lib/validations";

describe("validations clientes", () => {
  it("customerSchema aceita um cliente válido com campos opcionais vazios", () => {
    const parsed = customerSchema.safeParse({
      name: "Padaria do Zé",
      code: "",
      document: "",
      email: "",
      phone: "",
      mobile: "",
      notes: "  ",
    });
    expect(parsed.success).toBe(true);
  });

  it("customerSchema rejeita nome curto e e-mail inválido", () => {
    expect(customerSchema.safeParse({ name: "A" }).success).toBe(false);
    expect(
      customerSchema.safeParse({ name: "Padaria", email: "não-e-mail" }).success,
    ).toBe(false);
  });

  it("addressSchema rejeita endereço vazio e aceita com coordenadas", () => {
    expect(addressSchema.safeParse({ raw: "  " }).success).toBe(false);
    expect(
      addressSchema.safeParse({
        raw: "Rua XV de Novembro, 100, Centro, Santa Barbara d'Oeste - SP",
        lat: -22.7539,
        lng: -47.4136,
      }).success,
    ).toBe(true);
  });

  it("customerWithAddressSchema valida cliente + endereço", () => {
    const parsed = customerWithAddressSchema.safeParse({
      name: "Mercado Bom",
      address: { raw: "Rua 1, 10, Centro, Limeira - SP" },
    });
    expect(parsed.success).toBe(true);
  });
});