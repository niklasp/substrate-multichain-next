import { UIReferendum } from "@/app/vote/types";
import { transformReferendum } from "@/app/vote/util";
import { DEFAULT_CHAIN, getChainByName } from "@/config/chains";
import { useSubstrateChain } from "@/context/substrate-chain-context";
import { SubstrateChain } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chain: SubstrateChain =
    (searchParams.get("chain") as SubstrateChain) || DEFAULT_CHAIN;

  const chainConfig = await getChainByName(chain);
  const { api, tracks: trackInfo } = chainConfig;

  const referenda = await api?.query.referenda.referendumInfoFor.entries();

  const pastReferenda = referenda
    ?.map(transformReferendum)
    .filter(
      (ref: UIReferendum) =>
        ref.status === "approved" ||
        ref.status === "rejected" ||
        ref.status === "cancelled" ||
        ref.status === "timedOut"
    )
    .sort((a, b) => parseInt(b.index) - parseInt(a.index));

  return NextResponse.json({ pastReferenda });
}
