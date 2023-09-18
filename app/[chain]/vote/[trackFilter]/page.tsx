import { Suspense, cache } from "react";
import { DEFAULT_CHAIN, getChainByName } from "@/config/chains";
import { SubstrateChain } from "@/types";
import { getReferenda } from "../get-referenda";
import { getTracks } from "../get-tracks";
import ReferendumList from "../referendum-list";
import { TrackFilter } from "../track-filter";

const getChainInfo = cache(async (selectedChain: SubstrateChain) => {
  const safeChain = (selectedChain as SubstrateChain) || SubstrateChain.Kusama;
  const chainConfig = await getChainByName(safeChain);
  const { api } = chainConfig;

  if (!api) {
    return null;
  }

  await api.isReady;
  const [timestamp, chain] = await Promise.all([
    api.query.timestamp.now(),
    api.rpc.system.chain(),
  ]);
  return {
    timestamp,
    chain,
  };
});

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
