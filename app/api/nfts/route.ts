import type { PalletReferendaReferendumInfoConvictionVotingTally } from "@polkadot/types/lookup";
import { StorageKey, u32, Option } from "@polkadot/types";
import { NextResponse, NextRequest } from "next/server";
import { SubstrateChain } from "@/types/index";
import { getChainByName } from "@/config/chains";
import {
  decorateWithPolkassemblyInfo,
  transformReferendum,
  transformTrack,
} from "@/app/[chain]/vote/util";
import { UIReferendum, UITrack } from "@/app/[chain]/vote/types";

export async function POST(req: NextRequest) {
  let { chain }: { chain: SubstrateChain; refId: string } = await req.json();

  const chainConfig = await getChainByName(chain);
  const { api } = chainConfig;

  if (typeof api === "undefined") {
    throw `can not get api of ${chain}`;
  }
  // here comes your query logic, async fetch all the things you need

  //...

  // and return here as serializable json (aka strings, numbers, booleans, plain objects, arrays, etc.)
  return NextResponse.json({});
}
