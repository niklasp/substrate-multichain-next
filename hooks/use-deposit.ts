import { RuntimeDispatchInfo } from "@polkadot/types/interfaces";

import { useAppStore } from "@/app/zustand";
import { TxTypes, getTxCost } from "@/components/util-client";
import { DEFAULT_CHAIN, getChainByName } from "@/config/chains";
import { useSubstrateChain } from "@/context/substrate-chain-context";
import { ChainConfig, SubstrateChain } from "@/types";
import { useQuery } from "react-query";
import { Observable } from "rxjs";

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

export const useDeposits = () => {
  const { activeChain } = useSubstrateChain();
  const chainName = activeChain?.name || DEFAULT_CHAIN;
  const { assetHubApi } = activeChain || {};

  return useQuery<UseDepositsType, Error>({
    queryKey: ["deposits", chainName],
    queryFn: async () => {
      const [
        collectionDeposit,
        itemDeposit,
        metadataDeposit,
        attributeDeposit,
      ] = await Promise.all([
        assetHubApi?.consts.nfts?.collectionDeposit.toString(),
        assetHubApi?.consts.nfts?.itemDeposit.toString(),
        assetHubApi?.consts.nfts?.metadataDepositBase.toString(),
        assetHubApi?.consts.nfts?.attributeDepositBase.toString(),
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
