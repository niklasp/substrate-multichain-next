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
  let {
    chain,
    refFilter,
    withTracks = true,
  }: {
    chain: SubstrateChain;
    refFilter: string;
    withTracks: boolean;
  } = await req.json();

  let openGovRefs: [
      id: StorageKey<[u32]>,
      info: Option<PalletReferendaReferendumInfoConvictionVotingTally>
    ][],
    referenda: UIReferendum[] = [],
    tracks: UITrack[] = [];

  if (typeof refFilter === "undefined") {
    refFilter = "all";
  }

  const chainConfig = await getChainByName(chain);
  const { api, tracks: trackInfo } = chainConfig;

  if (typeof api === "undefined") {
    throw `can not get api of ${chain}`;
  }

  if (refFilter === "all" || refFilter === "past") {
    openGovRefs = await api?.query.referenda.referendumInfoFor.entries();
    referenda = openGovRefs?.map(transformReferendum);

    if (refFilter === "all") {
      referenda = referenda?.filter((ref) => ref?.status === "ongoing");
    } else {
      referenda = referenda
        ?.filter(
          (ref) =>
            ref?.status === "approved" ||
            ref?.status === "rejected" ||
            ref?.status === "cancelled" ||
            ref?.status === "timedOut"
        )
        .sort((a, b) => parseInt(b.index) - parseInt(a.index));
    }
  } else if (isFinite(parseInt(refFilter))) {
    const refFromChain = await api?.query.referenda.referendumInfoFor(
      refFilter
    );
    const ref = transformReferendum([refFilter, refFromChain]);
    const decoratedRef = await decorateWithPolkassemblyInfo(
      ref,
      chainConfig.name
    );
    referenda = [decoratedRef];
  } else {
    return [];
  }

  if (withTracks) {
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
  }

  return NextResponse.json({ referenda, tracks });
}
