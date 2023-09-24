import { ApiPromise } from "@polkadot/api";

/**
 * Will get the txs for creating a collection but NOT adding the metadata
 * @param apiKusamaAssetHub
 * @param rewardConfig
 * @returns
 */
export const getTxCollectionCreate = (
  apiWithNFTsPallet: ApiPromise | undefined,
  address: string | undefined
) => {
  const admin = {
    Id: address,
  };
  const config = {
    max_supply: null,
    mint_settings: {
      default_item_settings: 0,
      end_block: null,
      mint_type: "Issuer",
      price: null,
      start_block: null,
    },
    settings: 0,
  };

  return apiWithNFTsPallet?.tx.nfts.create(admin, config);
};

export async function getNFTCollectionDeposit(api: ApiPromise | undefined) {
  const deposit = await api?.consts.nfts?.collectionDeposit.toString();
  return deposit;
}

export async function getNFTItemDeposit(api: ApiPromise | undefined) {
  const deposit = await api?.consts.nfts?.itemDeposit.toString();
  return deposit;
}

export async function getNFTMetadataDeposit(api: ApiPromise | undefined) {
  const deposit = await api?.consts.nfts?.metadataDepositBase.toString();
  return deposit;
}

export async function getNFTAttributeDeposit(api: ApiPromise | undefined) {
  const deposit = await api?.consts.nfts?.attributeDepositBase.toString();
  return deposit;
}
