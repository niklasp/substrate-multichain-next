import { RuntimeDispatchInfo } from "@polkadot/types/interfaces";

import { useAppStore } from "@/app/zustand";
import { TxTypes, getTxCost } from "@/components/util-client";
import { DEFAULT_CHAIN, getChainByName } from "@/config/chains";
import { useSubstrateChain } from "@/context/substrate-chain-context";
import { ChainConfig, SubstrateChain } from "@/types";
import { useQuery } from "react-query";
import { Observable } from "rxjs";

type Type = RuntimeDispatchInfo | Observable<RuntimeDispatchInfo>;

export const useTxCost = (tx: TxTypes) => {
  const { activeChain } = useSubstrateChain();
  const chainName = activeChain?.name || DEFAULT_CHAIN;
  const user = useAppStore((s) => s.user);
  const { address } = user?.accounts?.[user.actingAccountIdx] || {};

  return useQuery<Type, Error>({
    queryKey: ["txCost", chainName, tx?.toString(), address],
    queryFn: async () => {
      const txCost = await getTxCost(activeChain?.api, tx, address);
      return txCost;
    },
  });
};
