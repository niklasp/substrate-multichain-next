import { cache } from "react";
import { DEFAULT_CHAIN, getChainByName } from "@/config/chains";
import { SubstrateChain } from "@/types";
import Link from "next/link";
import { transformReferendum } from "../../vote/util";
import { ReferendumDetail } from "./referendum-detail-test";
import { getReferenda } from "./get-referenda";

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
  params: { chain },
  searchParams,
}: {
  params: {
    chain: string;
  };
  searchParams: {
    thing: string;
  };
}) {
  const selectedThing = searchParams.thing || "nothing";
  const selectedChain = Object.values(SubstrateChain).includes(
    chain as SubstrateChain
  )
    ? (chain as SubstrateChain)
    : DEFAULT_CHAIN;

  console.log(`test page ${selectedChain} ${selectedThing}`);

  const referenda = await getReferenda(selectedChain);
  const chainInfo = await getChainInfo(selectedChain);

  return (
    <>
      <pre>{JSON.stringify(chainInfo, null, 2)}</pre>
      {referenda?.map((ref) => (
        <ReferendumDetail
          key={ref.index}
          referendum={ref}
          track={undefined}
          isExpanded
        />
      ))}
    </>
  );
}
