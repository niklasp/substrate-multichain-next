import { useAppStore } from "@/app/zustand";
import { useSubstrateChain } from "@/context/substrate-chain-context";
import { SubstrateChain } from "@/types";
import { encodeAddress } from "@polkadot/keyring";
import { useQuery } from "react-query";

export const useUserVotes = (
  chain: SubstrateChain | undefined,
  address: string
) => {
  const user = useAppStore((s) => s.user);
  const { activeChain } = useSubstrateChain();
  const userAddress = user?.accounts?.[user.actingAccountIdx]?.address;

  return useQuery({
    queryKey: ["userVotes", chain, address],
    enabled: !!chain && !!userAddress,
    queryFn: async () => {
      var headers = new Headers();
      headers.append(
        "x-network",
        (chain || SubstrateChain.Kusama).toLowerCase()
      );

      var requestOptions: RequestInit = {
        method: "GET",
        headers,
        redirect: "follow",
      };

      const res = await fetch(
        `https://api.polkassembly.io/api/v1/votes/history?page=1&listingLimit=10000&voterAddress=${address}&voteType=ReferendumV2`,
        requestOptions
      );
      const { votes } = (await res.json()) as { votes: any[] };
      return votes;
    },
  });
};
