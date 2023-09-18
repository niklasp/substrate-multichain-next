import { DEFAULT_CHAIN } from "@/config/chains";
import { useSubstrateChain } from "@/context/substrate-chain-context";
import { useQuery } from "react-query";

export const usePastReferendaIndices = () => {
  const { activeChain } = useSubstrateChain();
  const chain = activeChain?.name || DEFAULT_CHAIN;

  return useQuery({
    queryKey: ["past-referenda", chain],
    queryFn: async () => {
      const res = await fetch(`/api/referenda/past?chain=${chain}`);
      const { pastReferenda } = await res.json();
      return pastReferenda;
    },
  });
};
