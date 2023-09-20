import { ApiPromise } from "@polkadot/api";

/**
 * Will get the txs for creating a collection but NOT adding the metadata
 * @param apiKusamaAssetHub
 * @param rewardConfig
 * @returns
 */
export const getTxCollectionCreate = async (
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
