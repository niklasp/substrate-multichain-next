import { Suspense, cache } from "react";
import { DEFAULT_CHAIN, ENABLED_CHAINS, getChainByName } from "@/config/chains";
import { ChainConfig, SubstrateChain } from "@/types";
import { getReferenda } from "../get-referenda";
import { getTracks } from "../get-tracks";
import ReferendumList from "../referendum-list";
import { TrackFilter } from "../track-filter";

export async function generateStaticParams() {
  const params: { chain: SubstrateChain; trackFilter: string }[] = [];

  Object.values(ENABLED_CHAINS).forEach((chain: ChainConfig) => {
    const chainTracks = chain.tracks;
    const chainParams: { chain: SubstrateChain; trackFilter: string }[] = [];

    chainTracks.forEach((track) => {
      const trackFilter = track.id.toString();
      const chainName = chain.name;
      chainParams.push({
        chain: chainName,
        trackFilter,
      });
    });

    params.push(...chainParams);
  });

  console.log("generateStaticParams", params);

  return params;
}

export default async function Test({
  params: { chain, trackFilter },
}: {
  params: {
    chain: string;
    trackFilter: string;
  };
}) {
  const selectedTrackFilter = trackFilter || "";
  const selectedChain = Object.values(SubstrateChain).includes(
    chain as SubstrateChain
  )
    ? (chain as SubstrateChain)
    : DEFAULT_CHAIN;

  console.log(`test page ${selectedChain} ${selectedTrackFilter}`);

  const referenda = await getReferenda(selectedChain);
  const tracks = await getTracks(selectedChain);
  // const chainInfo = await getChainInfo(selectedChain);

  return (
    <>
      {/* <pre>{JSON.stringify(chainInfo, null, 2)}</pre> */}
      <TrackFilter
        tracks={tracks}
        referenda={referenda}
        trackFilter={trackFilter}
        chain={chain as SubstrateChain}
      />
      <ReferendumList
        trackFilter={selectedTrackFilter}
        referenda={referenda}
        tracks={tracks}
        chain={chain as SubstrateChain}
      />
    </>
  );
}
