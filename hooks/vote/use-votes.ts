import { SubstrateChain } from "@/types";
import { useQuery } from "react-query";
import { useSubstrateChain } from "@/context/substrate-chain-context";
import { DEFAULT_CHAIN } from "@/config/chains";
import { VotePolkadot } from "@/app/vote/types";

type UseVotesType = {
  votes: VotePolkadot[];
};

export const useVotes = () => {
  const { activeChain } = useSubstrateChain();
  const chain = activeChain?.name || DEFAULT_CHAIN;

  return useQuery({
    queryKey: ["votes", chain],
    queryFn: async () => {
      const res = await fetch(`/api/votes`, {
        method: "post",
        body: JSON.stringify({
          chain
        }),
      });

      const { votes } = (await res.json()) as UseVotesType;
      return { votes };
    },
  });
};
