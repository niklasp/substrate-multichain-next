import { NextResponse } from "next/server";
import { SubstrateChain } from "@/types/index";
import { getChainByName } from "@/config/chains";

export async function POST(req: Request) {
  const { chain }: { chain: SubstrateChain } = await req.json();
  const chainConfig = await getChainByName(chain);
  return NextResponse.json({ api: chainConfig.blockTime });
}
