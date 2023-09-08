import { title } from "@/components/primitives";
import { Metadata } from "next";
import { SubstrateChain } from "@/types";
import { getChainByName } from "@/config/chains";
import { Referendum, UIReferendum } from "../types";
import {
  isConvictionVote,
  transformReferenda,
  decorateWithPolkassemblyInfo,
} from "../util";
import { bnToBn, formatBalance } from "@polkadot/util";
import { ReferendumDetail } from "./referendum-detail";

export const metadata: Metadata = {
  title: "Vote",
  description: "Vote on OpenGov Referenda on Polkadot and Kusama",
};

const getReferenda = async () => {
  const { api } = await getChainByName(SubstrateChain.Kusama);
  const openGovRefs = await api?.query.referenda.referendumInfoFor.entries();
  const referenda = openGovRefs
    ?.map(transformReferenda)
    ?.filter((ref) => ref?.status === "ongoing");

  const decoratedRefs = Promise.all(
    referenda?.map(decorateWithPolkassemblyInfo) ?? []
  );
  return decoratedRefs;
};

export default async function ReferendumList() {
  const referenda = await getReferenda();

  console.log("Referenda", referenda);

  return (
    <div className="referendum-list shadow-xl">
      {referenda?.map((ref) => (
        <ReferendumDetail referendum={ref} isExpanded={false} />
      ))}
    </div>
  );
}
