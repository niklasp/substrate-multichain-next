import { Suspense, cache } from "react";
import { DEFAULT_CHAIN, ENABLED_CHAINS, getChainByName } from "@/config/chains";
import { ChainConfig, SubstrateChain } from "@/types";
import { getReferenda } from "./get-referenda";
import { getTracks } from "./get-tracks";
import ReferendumList from "./referendum-list";
import { TrackFilter } from "./track-filter";

export async function generateStaticParams() {
  const params: { chain: SubstrateChain }[] = [];

  Object.values(ENABLED_CHAINS).forEach((chain: ChainConfig) => {
    const chainTracks = chain.tracks;
    const chainParams: { chain: SubstrateChain }[] = [];
    chainTracks.push(
      ...[
        {
          id: "all",
        },
        {
          id: "voted",
        },
        {
          id: "unvoted",
        },
      ]
    );

    chainTracks.forEach((track) => {
      const trackFilter = track.id.toString();
      const chainName = chain.name;
      chainParams.push({
        chain: chainName,
      });
    });

    params.push(...chainParams);
  });

  return params;
}

export default async function Test({
  params: { chain },
}: {
  params: {
    chain: string;
    trackFilter: string;
  };
}) {
  const selectedChain = Object.values(SubstrateChain).includes(
    chain as SubstrateChain
  )
    ? (chain as SubstrateChain)
    : DEFAULT_CHAIN;

  const referenda = await getReferenda(selectedChain);
  const tracks = await getTracks(selectedChain);
  // const chainInfo = await getChainInfo(selectedChain);

  // const filteredReferenda =
  //   selectedTrackFilter === "all"
  //     ? referenda
  //     : selectedTrackFilter !== "voted" && selectedTrackFilter !== "unvoted"
  //     ? referenda?.filter((ref) => ref.track === selectedTrackFilter)
  //     : //TODO
  //       referenda;

  return (
    <>
      {/* <pre>{JSON.stringify(chainInfo, null, 2)}</pre> */}
      <TrackFilter
        chain={chain as SubstrateChain}
        tracks={tracks}
        referenda={referenda}
      />
      <ReferendumList
        referenda={referenda}
        tracks={tracks}
        chain={chain as SubstrateChain}
      />
    </>
  );
}
