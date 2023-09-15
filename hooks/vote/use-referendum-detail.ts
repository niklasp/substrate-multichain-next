import { useAppStore } from "@/app/zustand";
import { useEffect } from "react";
import { useQuery } from "react-query";
import { getTitleAndContentForRef } from "@/app/vote/util";
import { SubstrateChain } from "@/types";
import { useSubstrateChain } from "@/context/substrate-chain-context";

export const useReferendumDetail = (refId: string) => {
  const { activeChain } = useSubstrateChain();

  return useQuery({
    queryKey: ["referendumDetail", refId, activeChain?.name],
    queryFn: async () => {
      const { title, content, requested } = await getTitleAndContentForRef(
        refId,
        activeChain?.name
      );
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
