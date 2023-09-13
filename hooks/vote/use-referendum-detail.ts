import { useAppStore } from "@/app/zustand";
import { useEffect } from "react";
import { useQuery } from "react-query";
import { getTitleAndContentForRef } from "@/app/vote/util";

export const useReferendumDetail = (refId: string) => {
  const chain = useAppStore((s) => s.chain);
  const { name } = chain || {};
  const isChainApiReady = useAppStore((s) => s.isChainApiReady);

  return useQuery({
    queryKey: ["referendumDetail", refId, name, isChainApiReady],
    enabled: !!isChainApiReady,
    queryFn: async () => {
      const { title, content } = await getTitleAndContentForRef(refId, name);
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
