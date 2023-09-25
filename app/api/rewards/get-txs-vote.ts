import {
  PinImageAndMetadataForOptionsResult,
  RNG,
  RewardConfiguration,
} from "@/app/[chain]/referendum-rewards/types";
import { DecoratedConvictionVote } from "@/types";
import { ApiPromise } from "@polkadot/api";
import crypto from "crypto";

export const getTxsForVotes = (
  apiKusamaAssetHub: ApiPromise,
  config: RewardConfiguration,
  fileAndMetadataCids: PinImageAndMetadataForOptionsResult,
  attributes: any,
  decoratedVotes: DecoratedConvictionVote[],
  rng: RNG,
  referendumIndex: string
): any => {
  const txs = [];
  const timestamp = Date.now();
  let ids = [];
  for (let i = 0; i < decoratedVotes.length; i++) {
    const vote = decoratedVotes[i];

    // the rarity option that was chosen for the voter
    const { chosenOption } = vote;

    if (!chosenOption) throw "getTxsForVotes has invalid chosenOption";
    if (!config.collectionConfig.id)
      throw "getTxsForVotes has invalid collection id";

    const nftId = generateNFTId(
      timestamp,
      //TODO is this safe?
      config.sender?.toString() || "",
      referendumIndex,
      i
    );

    ids.push(nftId);

    // console.info(
    //   `📤  ${vote.address.toString()} will get ${nftId} with rarity ${chosenOption.rarity
    //   } and nftId ${nftId}`
    // );

    const selectedMetadata =
      fileAndMetadataCids.metadataIpfsCids[
        vote.meetsRequirements ? chosenOption.rarity : "default"
      ];

    let metadataCid =
      vote.voteType == "Delegating"
        ? selectedMetadata.delegated
        : selectedMetadata.direct;

    // console.info(
    //   "checking vote by address: ",
    //   vote.address.toString(),
    //   vote.voteType
    // );
    // console.info("chosenOption", chosenOption.rarity);
    // console.info("selectedMetadata", selectedMetadata);
    // console.info("metadataCid", metadataCid);

    if (!metadataCid) {
      console.error(`metadataCid is null. exiting.`);
      return;
    }

    txs.push(
      apiKusamaAssetHub.tx.nfts.mint(
        config.collectionConfig.id,
        nftId,
        vote.address.toString(),
        null
      )
    );

    // txs.push(
    //   ...getAllSetAttributeTxs(
    //     apiKusamaAssetHub,
    //     config,
    //     fileAndMetadataCids,
    //     attributes,
    //     vote,
    //     nftId,
    //     chosenOption,
    //     rng
    //   )
    // );

    const ipfsIdentifier = `ipfs://ipfs/${metadataCid}`;

    txs.push(
      apiKusamaAssetHub.tx.nfts.setMetadata(
        config.collectionConfig.id,
        nftId,
        ipfsIdentifier
      )
    );

    if (config.isMetadataLocked || config.isAttributesLocked) {
      txs.push(
        apiKusamaAssetHub.tx.nfts.lockItemProperties(
          config.collectionConfig.id,
          nftId,
          config.isMetadataLocked,
          config.isAttributesLocked
        )
      );
    }
    // txs.push(
    //   apiKusamaAssetHub.tx.nfts.transfer(
    //     config.collectionConfig.id,
    //     nftId,
    //     vote.address.toString()
    //   )
    // );
  }
  config.nftIds = ids;
  return txs;
};

export const generateNFTId = (
  timestamp: number,
  senderAddress?: string,
  referendum?: string,
  index?: number
): number => {
  // Create an array to store the input components
  const inputComponents = [];

  // Push non-null arguments to the inputComponents array
  if (senderAddress !== undefined) {
    inputComponents.push(senderAddress);
  }
  if (referendum !== undefined) {
    inputComponents.push(referendum);
  }

  // Timestamp is always required, no need to check for null
  inputComponents.push(timestamp.toString());

  if (index !== undefined) {
    inputComponents.push(index.toString());
  }

  // Combine the input components into a single string
  const inputString = inputComponents.join("-");
  // Generate a SHA256 hash of the input string
  const hash = crypto.createHash("sha256").update(inputString).digest("hex");
  // Convert the hash to a 32-bit unsigned integer
  const id = bigIntMod(hash, Math.pow(2, 32));
  return id;
};

const bigIntMod = (hash: string, mod: number): number => {
  let result = 0;

  for (let i = 0; i < hash.length; i++) {
    result = (result * 16 + parseInt(hash[i], 16)) % mod;
  }

  return result;
};
