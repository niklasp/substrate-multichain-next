import { NextResponse } from "next/server";
import { SubstrateChain } from "@/types/index";
import { getChainByName } from "@/config/chains";
import { ChainType } from "../../../types/index";

export async function POST(req: Request) {
  const {
    address,
    chain,
    chainType,
  }: { address: String; chain: SubstrateChain; chainType: ChainType } =
    await req.json();
  const chainConfig = await getChainByName(chain);
  const api =
    chainType === ChainType.AssetHub
      ? chainConfig.assetHubApi
      : chainConfig.api;

  const balance = await api?.query.system.account(address);

  return NextResponse.json({ balance });
}
