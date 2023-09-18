import {
  decorateWithPolkassemblyInfo,
  getTitleAndContentForRef,
  transformReferendum,
} from "@/app/vote/util";
import { getChainByName } from "@/config/chains";
import { SubstrateChain } from "@/types";
import { cache } from "react";
import "server-only";

export const preload = (chain: SubstrateChain) => {
  void getReferenda(chain);
};

export const getReferenda = cache(
  async (chain: SubstrateChain, refFilter = "all") => {
    const safeChain = (chain as SubstrateChain) || SubstrateChain.Kusama;
    const chainConfig = await getChainByName(safeChain);
    const { api, tracks: trackInfo } = chainConfig;

    if (typeof api === "undefined") {
      throw `can not get api of ${chain}`;
    }

    const openGovRefs = await api?.query.referenda.referendumInfoFor.entries();

    // const referendumIds = openGovRefs?.map((ref) => ref[0].args[0].toString());

    // const polkassemblyRefs = await Promise.all(
    //   referendumIds?.map((refId) => {
    //     return getTitleAndContentForRef(refId, safeChain);
    //   })
    // );

    // console.log(
    //   "polkassembly referenda",
    //   polkassemblyRefs.map((ref) => ref?.post_id)
    // );

    const referenda = openGovRefs
      ?.map(transformReferendum)
      .filter((ref) => ref?.status === "ongoing")
      //   .map((ref) => {
      //     return {
      //       ...ref,
      //       ...polkassemblyRefs.find((polkRef) => polkRef.post_id === ref.index),
      //     };
      //   })
      .sort((a, b) => parseInt(b.index) - parseInt(a.index));

    return referenda;
  }
);
