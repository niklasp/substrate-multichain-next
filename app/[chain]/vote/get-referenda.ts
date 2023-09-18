import { transformReferendum } from "@/app/[chain]/vote/util";
import { getChainByName } from "@/config/chains";
import { SubstrateChain } from "@/types";
import { cache } from "react";
import "server-only";

export const preload = (chain: SubstrateChain) => {
  void getReferenda(chain);
};

export const getReferenda = cache(
  async (chain: SubstrateChain, trackFilter = "all", refFilter = "all") => {
    const safeChain = (chain as SubstrateChain) || SubstrateChain.Kusama;
    const chainConfig = await getChainByName(safeChain);
    const { api } = chainConfig;

    if (typeof api === "undefined") {
      throw `can not get api of ${chain}`;
    }

    const openGovRefs = await api?.query.referenda.referendumInfoFor.entries();

    let referenda = openGovRefs
      ?.map(transformReferendum)
      .filter((ref) => ref?.status === "ongoing");

    if (trackFilter !== "all") {
      referenda = referenda?.filter((ref) => ref?.track === trackFilter);
    }

    referenda = referenda.sort((a, b) => parseInt(b.index) - parseInt(a.index));

    return referenda;
  }
);
