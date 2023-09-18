import { DEFAULT_CHAIN, ENABLED_CHAINS, getChainByName } from "@/config/chains";
import { ChainConfig, SubstrateChain } from "@/types";
import { getReferenda } from "./get-referenda";
import { getTracks } from "./get-tracks";
import ReferendumList from "./components/referendum-list";

export async function generateStaticParams() {
  const params: { chain: SubstrateChain }[] = [];

  Object.values(ENABLED_CHAINS).forEach((chain: ChainConfig) => {
    params.push({ chain: chain.name as SubstrateChain });
  });

  return params;
}

export default async function PageVote({
  params: { chain },
}: {
  params: {
    chain: string;
  };
}) {
  const selectedChain = Object.values(SubstrateChain).includes(
    chain as SubstrateChain
  )
    ? (chain as SubstrateChain)
    : DEFAULT_CHAIN;

  const referenda = await getReferenda(selectedChain);
  const tracks = await getTracks(selectedChain);

  return (
    <>
      <ReferendumList
        referenda={referenda}
        tracks={tracks}
        chain={chain as SubstrateChain}
      />
    </>
  );
}
