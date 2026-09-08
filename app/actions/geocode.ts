"use server";

import { requireUser } from "@/lib/auth/require-user";
import {
  autocompleteAddress,
  type AddressSuggestion,
} from "@/lib/maps/geocode";

export async function autocompleteAddressAction(
  query: string,
): Promise<AddressSuggestion[]> {
  await requireUser();
  try {
    return await autocompleteAddress(query);
  } catch {
    return [];
  }
}