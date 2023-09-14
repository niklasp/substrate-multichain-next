import { useAppStore } from "@/app/zustand";
import { useEffect } from "react";
import { useQuery } from "react-query";
import { SubstrateChain } from "../../types/index";

export const useEndDate = (
  chain: SubstrateChain | undefined,
  endBlock: string
) => {
  return useQuery({
    queryKey: ["endDate", endBlock, chain],
    enabled: !!chain,
    queryFn: async () => {
      const res = await fetch(`/api/end-date`, {
        method: "post",
        body: JSON.stringify({
          chain,
          endBlock,
        }),
      });
      const { endDate } = await res.json();
      return endDate;
    },
  });
};
