import type { PalletReferendaReferendumInfoConvictionVotingTally } from "@polkadot/types/lookup";
import { StorageKey, u32, Option } from "@polkadot/types";
import { NextResponse, NextRequest } from "next/server";
import { SubstrateChain } from "@/types/index";
import { getChainByName } from "@/config/chains";
import {
  decorateWithPolkassemblyInfo,
  transformReferendum,
  transformTrack,
} from "@/app/vote/util";
import { UIReferendum, UITrack } from "@/app/vote/types";

export async function POST(req: NextRequest) {
  let { chain, refId }: { chain: SubstrateChain; refId: string } =
    await req.json();

  let openGovRefs: [
      id: StorageKey<[u32]>,
      info: Option<PalletReferendaReferendumInfoConvictionVotingTally>
    ][],
    referenda: UIReferendum[] = [],
    tracks: UITrack[] = [];

  if (typeof refId === "undefined") {
    refId = "all";
  }

  const chainConfig = await getChainByName(chain);
  const { api, tracks: trackInfo } = chainConfig;

  if (typeof api === "undefined") {
    throw `can not get api of ${chain}`;
  }

  if (refId === "all") {
    openGovRefs = await api?.query.referenda.referendumInfoFor.entries();
    referenda = openGovRefs
      ?.map(transformReferendum)
      ?.filter((ref) => ref?.status === "ongoing");
  } else if (isFinite(parseInt(refId))) {
    const refFromChain = await api?.query.referenda.referendumInfoFor(refId);
    const ref = transformReferendum([refId, refFromChain]);
    const decoratedRef = await decorateWithPolkassemblyInfo(
      ref,
      chainConfig.name
    );
    referenda = [decoratedRef];
  } else {
    return [];
  }

  const tracksFromChain = await api?.consts.referenda.tracks;
  tracks = tracksFromChain?.map(transformTrack);
  tracks = tracks?.map((track) => {
    const info = trackInfo?.find(
      (trackInfo) => trackInfo.id.toString() === track.id.toString()
    );
    return {
      ...track,
      text: info?.text,
    };
  });

  return NextResponse.json({ referenda, tracks });
}
