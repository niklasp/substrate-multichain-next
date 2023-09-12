"use server";

import { SubstrateChain } from "@/types";
import { cookies } from "next/headers";

export async function getChain() {
  let selectedChain = SubstrateChain.Kusama;
  const cookieStore = cookies();
  if (cookieStore.has("chain")) {
    const value = cookieStore.get("chain")?.value;
    if (value && Object.values(SubstrateChain).includes(value as any)) {
      selectedChain = value as SubstrateChain;
    }
  }

  return selectedChain;
}
