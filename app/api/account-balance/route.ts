import { NextResponse } from "next/server";
import { SubstrateChain } from "@/types/index";
import { getChainByName } from "@/config/chains";

export async function POST(req: Request) {
  const { address, chain }: { address: String; chain: SubstrateChain } =
    await req.json();
  const chainConfig = await getChainByName(chain);

  console.log(
    `get account balance waiting for user extension injected promise ${address}`
  );
  const balance = await chainConfig.api?.query.system.account(address);

  return NextResponse.json({ balance });
}
