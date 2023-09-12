// `app` directory
import ReferendumList from "@/app/vote/components/referendum-list";
import {
  decorateWithPolkassemblyInfo,
  transformReferendum,
} from "@/app/vote/util";

import { getChainByName } from "@/config/chains";
import { SubstrateChain } from "@/types";

// tell next to dynamically generate all paths not matching a generateStaticParam
export const dynamicParams = true;

// define the dynamic paths that should be pre-rendered at build time.
export async function generateStaticParams() {
  return [{ chain: "polkadot" }, { chain: "kusama" }];
}

async function getReferenda(params: { chain: string }) {
  console.log("xxx selected chain is", params.chain as SubstrateChain);
  const { api } = await getChainByName(params.chain as SubstrateChain);
  const openGovRefs = await api?.query.referenda.referendumInfoFor.entries();
  const referenda = openGovRefs
    ?.map(transformReferendum)
    ?.filter((ref) => ref?.status === "ongoing");

  const decoratedRefs = Promise.all(
    referenda?.map((ref) =>
      decorateWithPolkassemblyInfo(ref, params.chain as SubstrateChain)
    ) ?? []
  );
  return decoratedRefs;
  //   return post;
}

export default async function Referenda({
  params,
}: {
  params: { chain: string };
}) {
  const referenda = await getReferenda(params);

  return <ReferendumList referenda={referenda} />;
}
