import { useAppStore } from "@/app/zustand";
import { useEffect } from "react";
import { useQuery } from "react-query";
import { getTitleAndContentForRef } from "@/app/vote/util";
import { SubstrateChain } from "@/types";

export const useReferendumDetail = (
  refId: string,
  chain: SubstrateChain | undefined
) => {
  let safeChain = chain || SubstrateChain.Kusama;

  return useQuery({
    queryKey: ["referendumDetail", refId, safeChain],
    queryFn: async () => {
      const { title, content } = await getTitleAndContentForRef(
        refId,
        safeChain
      );
      return { title, content };
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
