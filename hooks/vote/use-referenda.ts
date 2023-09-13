import { SubstrateChain } from "@/types";
import { useQuery } from "react-query";
import { UIReferendum, UITrack } from "@/app/vote/types";

type UseReferendaType = {
  referenda: UIReferendum[];
  tracks: UITrack[];
};

export const useReferenda = (chain: SubstrateChain) => {
  return useQuery<UseReferendaType, Error>(["referenda", chain], async () => {
    const res = await fetch(`/api/referenda`, {
      method: "post",
      body: JSON.stringify({
        chain,
        refId: "all",
      }),
    });
    const { referenda, tracks } = (await res.json()) as UseReferendaType;
    return { referenda, tracks };
  });
};
