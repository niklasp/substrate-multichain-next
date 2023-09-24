import { ApiPromise } from "@polkadot/api";
import PinataClient from "@pinata/sdk";
import { BN } from "@polkadot/util";
import { RuntimeDispatchInfo } from "@polkadot/types/interfaces";
import { TxTypes } from "@/components/util-client";
import { RewardConfiguration } from "@/app/[chain]/referendum-rewards/types";
import { pinImageAndMetadataForCollection } from "../_pinata-utils";

/**
 * Will get the txs for creating a collection but NOT adding the metadata
 * @param apiKusamaAssetHub
 * @param rewardConfig
 * @returns
 */
export const getTxCollectionCreate = async (
  apiKusamaAssetHub: ApiPromise,
  rewardConfig: RewardConfiguration
): Promise<any> => {
  let txsKusamaAssetHub = [];
  // console.log("getting collection create call")
  //create collection
  const admin = {
    Id: rewardConfig.sender,
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

  return apiKusamaAssetHub.tx.nfts.create(admin, config);
};

export const getUserLatestCollectionId = async (
  apiKusamaAssetHub: ApiPromise,
  address: string
): Promise<string> => {
  const allUserCollections =
    await apiKusamaAssetHub.query.nfts.collectionAccount.keys(address);
  const collectionIds: BN[] = allUserCollections.map(
    ({ args: [, collectionId] }) => new BN(collectionId.toString())
  );
  //loop over user collections and get collection with highest ID -> latest created
  return collectionIds
    .reduce((max, current) => (max.gt(current) ? max : current))
    .toString();
};

/**
 * Get the txs for setting the metadata for a collection
 * @param apiKusamaAssetHub
 * @param apiPinata
 * @param config
 * @returns
 */
export const getTxsCollectionSetMetadata = async (
  apiKusamaAssetHub: ApiPromise,
  apiPinata: PinataClient,
  config: RewardConfiguration
): Promise<{
  txsKusamaAssetHub: TxTypes[];
}> => {
  let txsKusamaAssetHub = [];

  if (!config.collectionConfig.id)
    throw "getTxsCollectionSetMetadata needs a collection config id";

  config.collectionConfig.metadataCid = (
    await pinImageAndMetadataForCollection(apiPinata, config)
  ).metadataIpfsCid;

  const ipfsIdentifier = `ipfs://ipfs/${config.collectionConfig.metadataCid}`;

  txsKusamaAssetHub.push(
    apiKusamaAssetHub.tx.nfts.setCollectionMetadata(
      config.collectionConfig.id,
      ipfsIdentifier
    )
  );
  return { txsKusamaAssetHub };
};
