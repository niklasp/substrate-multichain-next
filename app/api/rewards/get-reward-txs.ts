import {
  RNG,
  RarityDistribution,
  RewardConfiguration,
} from "@/app/[chain]/referendum-rewards/types";
import { DecoratedConvictionVote } from "@/types";
import PinataClient from "@pinata/sdk";
import { ApiPromise } from "@polkadot/api";
import { getTxsCollectionSetMetadata } from "./get-txs-collection";
import { TxTypes } from "@/components/util-client";
import { pinImageAndMetadataForOptions } from "../_pinata-utils";
import { getNftAttributesForOptions } from "./util";
import { getTxsForVotes } from "./get-txs-vote";

export const getTxsReferendumRewards = async (
  apiAssetHub: ApiPromise | undefined,
  apiRelay: ApiPromise | undefined,
  apiPinata: PinataClient | null,
  config: RewardConfiguration,
  decoratedVotes: DecoratedConvictionVote[],
  rarityDistribution: RarityDistribution,
  rng: RNG
): Promise<{
  txsKusamaAssetHub: any[];
  txsKusama: any[];
  txsPerVote: number;
}> => {
  if (!apiAssetHub || !apiRelay || !apiPinata)
    throw "getTxsReferendumRewards needs defined apis";

  let txsKusamaAssetHub: TxTypes[] = [];
  let txsKusama: TxTypes[] = [];

  const { refIndex: referendumIndex } = config;

  // if a new collection was created by the user, we add the txs for pinning and setting the metadata
  if (config.collectionConfig.isNew) {
    const txsCollectionSetMetadata = await getTxsCollectionSetMetadata(
      apiAssetHub,
      apiPinata,
      config
    );
    txsKusamaAssetHub = [
      ...txsKusamaAssetHub,
      ...txsCollectionSetMetadata.txsKusamaAssetHub,
    ];
  }
  //todo lock collection after mint if new collection
  const attributes = getNftAttributesForOptions(
    config.options,
    rarityDistribution
  );

  console.info("rarityDistribution", rarityDistribution);

  // pin metadata and file for each rarity option to Pinata and get nft attributes
  const fileAndMetadataCids = await pinImageAndMetadataForOptions(
    apiPinata,
    config,
    rarityDistribution
  );

  //overwrite file attribute in config with the cid from pinata
  config.options.forEach((option) => {
    option.file =
      "ipfs://ipfs/" + fileAndMetadataCids.imageIpfsCids[option.rarity];
  });

  // generate NFT mint txs for each vote(er)
  const txsVotes = getTxsForVotes(
    apiAssetHub,
    config,
    fileAndMetadataCids,
    attributes,
    decoratedVotes,
    rng,
    referendumIndex.toString()
  );

  const txsPerVote = txsVotes.length / decoratedVotes.length;

  txsKusamaAssetHub = [...txsKusamaAssetHub, ...txsVotes];

  // txsKusamaAssetHub = [
  //   apiAssetHub.tx.system.remark(
  //     "Created with https://www.proofofchaos.app/referendum-rewards/"
  //   ),
  // ];

  // const txsKusamaXCM = await getTxsKusamaXCM(
  //   apiRelay,
  //   apiAssetHub,
  //   txsKusamaAssetHub
  // );

  // txsKusama = [...txsKusama, ...txsKusamaXCM];

  return { txsKusamaAssetHub, txsKusama, txsPerVote };
};
