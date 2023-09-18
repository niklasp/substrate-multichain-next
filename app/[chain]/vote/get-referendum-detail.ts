import { getTitleAndContentForRef } from "@/app/[chain]/vote/util";
import { SubstrateChain } from "@/types";
import { cache } from "react";

export const preload = (chain: SubstrateChain, refId: string) => {
  void getReferendumDetail(chain, refId);
};

export const getReferendumDetail = cache(
  async (chain: SubstrateChain, refId: string) => {
    const polkassemblyRef = await getTitleAndContentForRef(refId, chain);
    return polkassemblyRef;
  }
);
