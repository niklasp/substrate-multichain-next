import { useAppStore } from "@/app/zustand";
import { ApiPromise } from "@polkadot/api";
import { InjectedExtension } from "@polkadot/extension-inject/types";
import { useQuery } from "react-query";
import { encodeAddress } from "@polkadot/keyring";
import { useSubstrateChain } from "@/context/substrate-chain-context";

export const useAccountBalance = () => {
  const { activeChain } = useSubstrateChain();
  const { ss58Format } = activeChain || {};
  const user = useAppStore((state) => state.user);
  const { address } = user?.accounts?.[user.actingAccountIdx] || {};
  const userAddress = address && encodeAddress(address, ss58Format);

  console.log("useAccountBalance", activeChain?.name, address, userAddress);

  return useQuery({
    queryKey: [activeChain?.name, address, "accountBalance"],
    enabled: !!activeChain && !!address,
    queryFn: async () => {
      const res = await fetch(`/api/account-balance`, {
        method: "post",
        body: JSON.stringify({
          chain: activeChain?.name,
          address: userAddress,
        }),
      });
      const { balance } = await res.json();
      return balance;
    },
  });
};
