import { useAppStore } from "@/app/zustand";
import { useEffect } from "react";
import { useQuery } from "react-query";

export const useEndDate = (endBlock: number) => {
  const chain = useAppStore((s) => s.chain);
  const { api, blockTime, name } = chain || {};
  const isChainApiReady = useAppStore((s) => s.isChainApiReady);

  return useQuery({
    queryKey: ["referendumEndDate", endBlock, name, isChainApiReady],
    enabled: !!isChainApiReady,
    queryFn: async () => {
      console.log(
        "useEndDate",
        endBlock,
        name,
        api,
        blockTime,
        isChainApiReady
      );
      if (!api) {
        return;
      }

      await api.isReady;

      const { hash, number: latestBlockNumber } =
        (await api?.rpc.chain.getHeader()) || {};

      if (!hash || !latestBlockNumber) {
        return;
      }

      const currentBlockTimestamp = await (
        await api?.at(hash)
      )?.query.timestamp.now();

      if (!currentBlockTimestamp) {
        return;
      }

      const endBlockTimestamp =
        currentBlockTimestamp.toNumber() +
        (endBlock - latestBlockNumber.toNumber()) * blockTime;

      console.log(
        "endBlockTimestamp",
        endBlock,
        endBlockTimestamp,
        currentBlockTimestamp.toNumber(),
        Date.now(),
        endBlock - latestBlockNumber.toNumber()
      );

      return new Date(endBlockTimestamp);
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
