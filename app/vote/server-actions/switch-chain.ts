"use server";

import { SubstrateChain } from "@/types";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function storeChain(chain: SubstrateChain) {
  cookies().set("chain", chain, { secure: true });
  console.log("cookie set");
  revalidatePath("/vote");
}
