import { SubstrateChain } from "@/types";
import { useQuery } from "react-query";
import { UIReferendum, UITrack } from "@/app/vote/types";
import { useSubstrateChain } from "@/context/substrate-chain-context";
import { DEFAULT_CHAIN } from "@/config/chains";

type UseReferendaType = {
  referenda: UIReferendum[];
  tracks: UITrack[];
};

export const useReferenda = (refFilter: string = "all", withTracks = true) => {
  const { activeChain } = useSubstrateChain();
  const chain = activeChain?.name || DEFAULT_CHAIN;

  return useQuery({
    queryKey: ["referenda", chain, refFilter, withTracks],
    queryFn: async () => {
      const res = await fetch(`/api/referenda`, {
        method: "post",
        body: JSON.stringify({
          chain,
          refFilter,
          withTracks,
        }),
      });

      const { referenda, tracks } = (await res.json()) as UseReferendaType;
      return { referenda, tracks };
    },
  });
};
