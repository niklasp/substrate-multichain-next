import { Readable } from "stream";
import fs from "fs";
import { PinataPinOptions } from "@pinata/sdk";
import { config } from "process";
import pinataSDK from "@pinata/sdk";

import { sum } from "lodash";
import {
  PinImageAndMetadataForCollectionResult,
  PinImageAndMetadataForConfigNFTResult,
  PinImageAndMetadataForOptionsResult,
  RarityDistribution,
  RewardConfiguration,
  RewardOption,
} from "../[chain]/referendum-rewards/types";
import { defaultReferendumRewardsConfig } from "@/config/default-rewards-config";
import { rewardsConfig } from "@/config/rewards";

const defaultOptions: Partial<PinataPinOptions> = {
  pinataOptions: {
    cidVersion: 1,
  },
};

export type StreamPinata = Readable & {
  path?: string;
};

/**
 * Given a config and a pinata api, pin all the images rarity option
 * @param pinata
 * @param config
 * @returns {Promise<PinImageAndMetadataForOptionsResult>}
 */
// export const pinImagesForOptions = async (
//   pinata: pinataSDK,
//   config: RewardConfiguration
// ): Promise<PinImagesForOptionsResult> => {
//   const imageIpfsCids = {};

//   for (const option of config.options) {
//     const pinataFileOptions: PinataPinOptions = {
//       pinataMetadata: {
//         name: `referendum-${config.refIndex}_${option.rarity}`,
//       },
//       pinataOptions: {
//         cidVersion: 1,
//       },
//     };

//     //pin image file
//     const imageIpfsCid = await pinata.pinFileToIPFS(
//       option.file,
//       pinataFileOptions
//     );

//     imageIpfsCids[option.rarity] = {
//       direct: imageIpfsCid.IpfsHash,
//       // TODO
//       delegated: imageIpfsCid.IpfsHash,
//     };
//   }

//   return { imageIpfsCids };
// };

/**
 * Given a config and a pinata api, pin all the images and metadata for each rarity option
 * @param pinata
 * @param config
 * @returns {Promise<PinImageAndMetadataForOptionsResult>}
 */
export const pinImageAndMetadataForOptions = async (
  pinata: pinataSDK,
  config: RewardConfiguration,
  rarityDistribution: RarityDistribution
): Promise<PinImageAndMetadataForOptionsResult> => {
  const imageIpfsCids: Record<string, string> = {};
  const metadataIpfsCids: Record<
    string,
    { direct: string; delegated: string }
  > = {};

  let configOptionsAndDefault: RewardOption[] = [];

  // create a fourth option for votes not meeting requirements
  let commonOption = config.options.find(
    (option) => option.rarity === "common"
  );

  if (commonOption) {
    let defaultOption: RewardOption = { ...commonOption };
    defaultOption.royalty = config.defaultRoyalty;

    configOptionsAndDefault = [...config.options]; // Deep copy to avoid modifying the original config.options
    configOptionsAndDefault.push(defaultOption); // Clone the third element before pushing to ensure they remain distinct objects
  }

  for (const option of configOptionsAndDefault) {
    const pinataFileOptions: PinataPinOptions = {
      pinataMetadata: {
        name: `referendum-${config.refIndex}_${option.rarity}`,
      },
      pinataOptions: {
        cidVersion: 1,
      },
    };

    const pinataMetadataOptions: PinataPinOptions = {
      pinataMetadata: {
        name: `referendum-${config.refIndex}_${option.rarity}_meta`,
        a: "b",
      },
      pinataOptions: {
        cidVersion: 1,
      },
    };

    //image file
    let imageIpfsCid = imageIpfsCids[option.rarity];

    //no need to do the image pin for default option
    if (!imageIpfsCid) {
      if (option.imageCid) {
        console.info(
          "getting image cid from config",
          option.imageCid,
          "for rarity",
          option.rarity
        );
        imageIpfsCid = option.imageCid;
      } else {
        imageIpfsCid = (
          await pinata.pinFileToIPFS(option.file, pinataFileOptions)
        ).IpfsHash;
      }
      imageIpfsCids[option.rarity] = imageIpfsCid;
    }

    let recipientValue;
    if (config.royaltyAddress === rewardsConfig.royaltyAddress) {
      recipientValue = [[config.royaltyAddress, 100]];
    } else {
      recipientValue = [
        [config.royaltyAddress, 80],
        [rewardsConfig.royaltyAddress, 20],
      ];
    }

    const totalNFTs = sum(Object.values(rarityDistribution));

    // Base metadata
    const baseMetadata = {
      external_url: "https://www.proofofchaos.app/",
      mediaUri: `ipfs://ipfs/${imageIpfsCid}`,
      image: `ipfs://ipfs/${imageIpfsCid}`,
      name: option.title,
      description: `${option.description}\n\n_This NFT was created with [proofofchaos.app](https://proofofchaos.app/referendum-rewards)_`,
      attributes: [
        { trait_type: "rarity", value: option.rarity },
        { trait_type: "name", value: option.title },
        { trait_type: "description", value: option.description },
        { trait_type: "artist", value: option.artist },
        { trait_type: "referendum", value: parseInt(config.refIndex) },
        { trait_type: "recipient", value: recipientValue },
        { trait_type: "totalSupply", value: totalNFTs },
        {
          trait_type: "totalSupplyRarity",
          value: rarityDistribution[option.rarity],
        },
        { trait_type: "royalty", value: option.royalty },
      ],
    };

    // Create metadataDirect and metadataDelegated by spreading the baseMetadata
    // and appending the unique voteType attribute.
    const metadataDirect = {
      ...baseMetadata,
      attributes: [
        ...baseMetadata.attributes,
        { trait_type: "voteType", value: "direct" },
      ],
    };

    const metadataDelegated = {
      ...baseMetadata,
      attributes: [
        ...baseMetadata.attributes,
        { trait_type: "voteType", value: "delegated" },
      ],
    };

    const metadataIpfsCidDirect = await pinata.pinJSONToIPFS(
      metadataDirect,
      pinataMetadataOptions
    );

    const metadataIpfsCidDelegated = await pinata.pinJSONToIPFS(
      metadataDelegated,
      pinataMetadataOptions
    );
    let index = configOptionsAndDefault.indexOf(option);

    //push the last option as the default option
    metadataIpfsCids[index < 3 ? option.rarity : "default"] = {
      direct: metadataIpfsCidDirect.IpfsHash,
      delegated: metadataIpfsCidDelegated.IpfsHash,
    };
  }

  return {
    imageIpfsCids,
    metadataIpfsCids,
  };
};

/**
 * Given a config and a pinata api, pin all the images and metadata for each rarity option
 * @param pinata
 * @param config
 * @returns {Promise<PinImageAndMetadataForOptionsResult>}
 */
export const pinImageAndMetadataForCollection = async (
  pinata: pinataSDK,
  config: RewardConfiguration
): Promise<PinImageAndMetadataForCollectionResult> => {
  const { collectionConfig } = config;
  const pinataFileOptions: PinataPinOptions = {
    pinataMetadata: {
      name: `referendum-${config.refIndex}_${collectionConfig.name}`,
    },
    pinataOptions: {
      cidVersion: 1,
    },
  };

  const pinataMetadataOptions: PinataPinOptions = {
    pinataMetadata: {
      name: `referendum-${config.refIndex}_${collectionConfig.name}_meta`,
      a: "b",
    },
    pinataOptions: {
      cidVersion: 1,
    },
  };

  //pin image file
  const imageIpfsCid = (
    await pinata.pinFileToIPFS(collectionConfig.file, pinataFileOptions)
  ).IpfsHash;

  //pin metadata
  const metadata = {
    external_url: "https://www.proofofchaos.app/",
    mediaUri: `ipfs://ipfs/${imageIpfsCid}`,
    image: `ipfs://ipfs/${imageIpfsCid}`,
    name: `Referendum ${config.refIndex} - ${collectionConfig.name}`,
    description: `${collectionConfig.description}\n\n_This collection was created on [proofofchaos.app](https://proofofchaos.app/referendum-rewards)_`,
  };
  const metadataIpfsCid = (
    await pinata.pinJSONToIPFS(metadata, pinataMetadataOptions)
  ).IpfsHash;

  return {
    imageIpfsCid,
    metadataIpfsCid,
  };
};

/**
 * Given a config and a pinata api, pin all the images and metadata for each rarity option
 * @param pinata
 * @param config
 * @returns {Promise<PinImageAndMetadataForConfigNFTResult>}
 */
export const pinMetadataForConfigNFT = async (
  pinata: pinataSDK,
  config: RewardConfiguration
): Promise<PinImageAndMetadataForConfigNFTResult> => {
  const { collectionConfig, configNFT, options, ...configAttributes } = config;
  const pinataFileOptions: PinataPinOptions = {
    pinataMetadata: {
      name: `referendum-${config.refIndex}_configNFT`,
    },
    pinataOptions: {
      cidVersion: 1,
    },
  };

  const pinataMetadataOptions: PinataPinOptions = {
    pinataMetadata: {
      name: `referendum-${config.refIndex}_configNFT_meta`,
      a: "b",
    },
    pinataOptions: {
      cidVersion: 1,
    },
  };

  //pin image file
  let imageIpfsCid;

  if (configNFT.imageCid) {
    imageIpfsCid = configNFT.imageCid;
  } else {
    imageIpfsCid = (
      await pinata.pinFileToIPFS(configNFT.file, pinataFileOptions)
    ).IpfsHash;
  }

  let attributes = [];

  if (configAttributes) {
    for (const attribute in configAttributes) {
      if (!attribute) continue;

      if (
        attribute === "nftIds" &&
        configAttributes[attribute] &&
        Array.isArray(configAttributes[attribute])
      ) {
        // Convert the array to a string
        let ids = configAttributes[attribute]?.map((id) => id.toString());
        if (!ids) continue;

        let counter = 1;
        let chunk = "";

        for (let id of ids) {
          // Check if adding the next ID would exceed 254 characters
          if (chunk.length + id.length + 1 > 254) {
            // Push the current chunk and reset it
            attributes.push({
              trait_type: attribute + "_" + counter,
              value: chunk.slice(0, -1), // Remove trailing comma
            });
            chunk = "";
            counter++;
          }

          chunk += id + ",";
        }

        // Handle any remaining IDs
        if (chunk) {
          attributes.push({
            trait_type: attribute + "_" + counter,
            value: chunk.slice(0, -1), // Remove trailing comma
          });
        }
      } else {
        attributes.push({
          trait_type: attribute,
          value: configAttributes.hasOwnProperty(attribute)
            ? configAttributes[
                attribute as keyof typeof configAttributes
              ]?.toString() ?? ""
            : "",
        });
      }
    }
  }

  //add attributes for all the new collection config
  for (const attribute in collectionConfig) {
    attributes.push({
      trait_type: "collection_" + attribute,
      value: collectionConfig.hasOwnProperty(attribute)
        ? collectionConfig[
            attribute as keyof typeof collectionConfig
          ]?.toString() ?? ""
        : "",
    });
  }

  //add attributes for all the configNFT stuff
  for (const attribute in configNFT) {
    attributes.push({
      trait_type: "configNFT_" + attribute,
      value: configNFT.hasOwnProperty(attribute)
        ? configNFT[attribute as keyof typeof configNFT]?.toString() ?? ""
        : "",
    });
  }

  let optionIndex = 0;
  //add attributes for all the reward options
  for (const option of options) {
    for (const attribute in option) {
      if (attribute === "imageCid") {
        continue;
      }
      attributes.push({
        trait_type: "option_" + optionIndex + "_" + attribute,
        value: option.hasOwnProperty(attribute)
          ? option[attribute as keyof typeof option]?.toString() ?? ""
          : "",
      });
    }
    optionIndex++;
  }

  //pin metadata
  const metadata = {
    external_url: "https://www.proofofchaos.app/",
    mediaUri: imageIpfsCid,
    image: imageIpfsCid,
    name: `Referendum ${config.refIndex} - Config NFT`,
    description: `${configNFT.description}\n\n_This NFT was created with [proofofchaos.app](https://proofofchaos.app/referendum-rewards)_`,
    attributes,
  };
  const metadataIpfsCid = (
    await pinata.pinJSONToIPFS(metadata, pinataMetadataOptions)
  ).IpfsHash;

  return {
    imageIpfsCid,
    metadataIpfsCid,
  };
};
