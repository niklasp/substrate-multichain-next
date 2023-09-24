import { RuntimeDispatchInfo } from "@polkadot/types/interfaces";

import { useAppStore } from "@/app/zustand";
import { TxTypes, getTxCost } from "@/components/util-client";
import { DEFAULT_CHAIN, getChainByName } from "@/config/chains";
import { useSubstrateChain } from "@/context/substrate-chain-context";
import { ChainConfig, ChainType, SubstrateChain } from "@/types";
import { useQuery } from "react-query";
import { Observable } from "rxjs";
import { ApiPromise } from "@polkadot/api";

type Type = RuntimeDispatchInfo | Observable<RuntimeDispatchInfo>;

export const useTxCost = (tx: TxTypes, chainType?: ChainType) => {
  const { activeChain } = useSubstrateChain();
  const chainName = activeChain?.name || DEFAULT_CHAIN;
  const user = useAppStore((s) => s.user);
  const { address } = user?.accounts?.[user.actingAccountIdx] || {};

  const api =
    chainType === ChainType.AssetHub
      ? activeChain?.assetHubApi
      : activeChain?.api;

  return useQuery<Type, Error>({
    queryKey: ["txCost", chainName, chainType, tx?.toString(), address],
    queryFn: async () => {
      const txCost = await getTxCost(api, tx, address);
      return txCost;
    },
    refetchOnWindowFocus: false,
  });
};
