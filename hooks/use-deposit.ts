import { RuntimeDispatchInfo } from "@polkadot/types/interfaces";

import { useAppStore } from "@/app/zustand";
import { TxTypes, getTxCost } from "@/components/util-client";
import { DEFAULT_CHAIN, getChainByName } from "@/config/chains";
import { useSubstrateChain } from "@/context/substrate-chain-context";
import { ChainConfig, ChainType, SubstrateChain } from "@/types";
import { useQuery } from "react-query";
import { Observable } from "rxjs";
import { ApiPromise } from "@polkadot/api";

export enum Deposit {
  Collection = "collectionDeposit",
  Item = "itemDeposit",
  Metadata = "metadataDeposit",
  Attribute = "attributeDeposit",
}

export interface UseDepositsType extends Record<Deposit, string | undefined> {
  collectionDeposit: string | undefined;
  itemDeposit: string | undefined;
  metadataDeposit: string | undefined;
  attributeDeposit: string | undefined;
}

export const useDeposits = (
  chainType: ChainType | undefined = ChainType.Relay
) => {
  const { activeChain } = useSubstrateChain();
  const chainName = activeChain?.name || DEFAULT_CHAIN;

  const api =
    chainType === ChainType.AssetHub
      ? activeChain?.assetHubApi
      : activeChain?.api;

  return useQuery<UseDepositsType, Error>({
    queryKey: ["deposits", chainName, chainType],
    queryFn: async () => {
      const [
        collectionDeposit,
        itemDeposit,
        metadataDeposit,
        attributeDeposit,
      ] = await Promise.all([
        api?.consts.nfts?.collectionDeposit.toString(),
        api?.consts.nfts?.itemDeposit.toString(),
        api?.consts.nfts?.metadataDepositBase.toString(),
        api?.consts.nfts?.attributeDepositBase.toString(),
      ]);

      return {
        collectionDeposit,
        itemDeposit,
        metadataDeposit,
        attributeDeposit,
      };
    },
  });
};
