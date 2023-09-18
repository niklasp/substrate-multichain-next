import { useAppStore } from "@/app/zustand";
import { useEffect } from "react";
import { useQuery } from "react-query";
import { getTitleAndContentForRef } from "@/app/[chain]/vote/util";
import { SubstrateChain } from "@/types";
import { useSubstrateChain } from "@/context/substrate-chain-context";
import { DEFAULT_CHAIN } from "@/config/chains";

export const useReferendumDetail = (refId: string) => {
  const { activeChain } = useSubstrateChain();
  const chainName = activeChain?.name || DEFAULT_CHAIN;

  return useQuery({
    queryKey: ["referendumDetail", refId, chainName],
    queryFn: async () => {
      const polkassemblyRef = await getTitleAndContentForRef(refId, chainName);

      const { title, content, requested } = polkassemblyRef;
      return { title, content, requested };
    },
  });
};

// const getEndDateByBlock = (
//   blockNumber,
//   currentBlockNumber,
//   currentTimestamp
// ) => {
//   let newStamp =
//     parseInt(currentTimestamp.toString()) +
//     (parseInt(blockNumber.toString()) - currentBlockNumber.toNumber()) *
//       BLOCK_DURATION;
//   return new Date(newStamp);
// };
