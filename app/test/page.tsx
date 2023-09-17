import { getChainByName } from "@/config/chains";
import { SubstrateChain } from "@/types";
import Link from "next/link";
import { transformReferendum } from "../vote/util";
import { ReferendumDetail } from "./referendum-detail-test";

export const revalidate = 20;

async function getReferenda(selectedChain: SubstrateChain) {
  const chainConfig = await getChainByName(selectedChain as SubstrateChain);
  const { api } = chainConfig;

  const openGovRefs = await api?.query.referenda.referendumInfoFor.entries();
  const referenda = openGovRefs
    ?.map(transformReferendum)
    .filter((ref) => ref?.status === "ongoing");

  console.log("Referenda", referenda);

  return referenda;
}

async function getChainInfo(selectedChain: SubstrateChain) {
  const chainConfig = await getChainByName(selectedChain as SubstrateChain);
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
}

export default async function Test({
  searchParams,
}: {
  searchParams: {
    chain: string;
    thing: string;
  };
}) {
  const selectedThing = searchParams.thing || "nothing";
  const selectedChain = searchParams.chain;

  const referenda = await getReferenda(selectedChain as SubstrateChain);
  const chainInfo = await getChainInfo(selectedChain as SubstrateChain);

  return (
    <>
      <h1>Connected to {selectedChain} </h1>
      <pre>{JSON.stringify(searchParams, null, 2)} </pre>
      {Object.values(SubstrateChain).map((chain: SubstrateChain) => (
        <Link key={chain} href={`?chain=${chain}&thing=${selectedThing}`}>
          {chain}
        </Link>
      ))}
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
