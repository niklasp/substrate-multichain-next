import { getChainByName } from "@/config/chains";
import { SubstrateChain } from "@/types";
import Link from "next/link";
import { transformReferendum } from "../vote/util";
import { ReferendumDetail } from "./referendum-detail-test";

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

  return (
    <>
      <h1>Connected to {selectedChain} </h1>
      <pre>{JSON.stringify(searchParams, null, 2)} </pre>
      {Object.values(SubstrateChain).map((chain: SubstrateChain) => (
        <Link key={chain} href={`?chain=${chain}&thing=${selectedThing}`}>
          {chain}
        </Link>
      ))}
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
