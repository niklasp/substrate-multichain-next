import { pinMetadataForConfigNFT } from "@/app/api/_pinata-utils";
import { titleCase } from "@/components/util";
import { rewardsConfig } from "@/config/rewards";
import { ChainConfig, SubstrateChain } from "@/types";
import PinataClient from "@pinata/sdk";
import { ApiPromise } from "@polkadot/api";
import { decodeAddress, encodeAddress } from "@polkadot/keyring";
import { z } from "zod";
import { initAccount } from "@/store/server/account";
import { generateNFTId } from "@/app/api/rewards/get-txs-vote";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { KeyringPair } from "@polkadot/keyring/types";
import type { RewardConfiguration, RewardCriteria } from "./types";

export function validateAddress(address: string, ss58Format: number) {
  try {
    decodeAddress(address, false, ss58Format);
  } catch (error) {
    return false;
  }
  return true;
}

// this is needed because on client side we have a FileList and on server side we have a File
// however next does not support FileList / File on server side so this workaround is needed
const fileUpload =
  typeof window === "undefined"
    ? z
        .any()
        .refine((file) => file, "Image is required.")
        .refine(
          (file) => file?.size <= 2 * 1024 * 1024,
          `Max file size is 2MB.`
        )
        .refine(
          (file) => rewardsConfig.acceptedNftFormats.includes(file?.type),
          "File Format not supported"
        )
    : z
        .any()
        .refine((files) => files?.length == 1, "Image is required.")
        .refine(
          (files) => files?.[0]?.size <= 2 * 1024 * 1024,
          `Max file size is 2MB.`
        )
        .refine(
          (files) =>
            rewardsConfig.acceptedNftFormats.includes(files?.[0]?.type),
          "File Format not supported"
        );

export const zodSchemaObject = (chain: SubstrateChain, ss58Format: number) => {
  return {
    chain: z.nativeEnum(SubstrateChain).default(SubstrateChain.Kusama),
    criteria: z.nativeEnum(RewardCriteria, {
      required_error: "Please select a criteria",
    }),
    refIndex: z.string().min(1, "Please select a referendum"),
    royaltyAddress: z.custom<string>(
      (value) => validateAddress(value as string, ss58Format),
      `Not a valid ${titleCase(chain)} address`
    ),
    collectionConfig: z.object({
      id: z
        .any()
        .transform((id) => parseInt(id) || -1)
        .refine((id) => id >= 0, "Id must be a positive number"),
      name: z.string().optional(),
      description: z.string().optional(),
      // TODO
      // name: z.string().min(1, "Name is required"),
      // description: z.string().min(1, "Description is required"),
      isNew: z.boolean().default(false),
      file: fileUpload.optional(),
    }),
    options: z.array(
      z.object({
        rarity: z.string(),
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        artist: z.string().optional(),
        imageCid: z.string().optional(),
        //TODO
        file: fileUpload,
        // file: z.any().optional(),
      })
    ),
  };
};

// validation schema for rewards form
export const rewardsSchema = (chain: SubstrateChain, ss58Format: number) => {
  const obj = zodSchemaObject(chain, ss58Format);
  return z.object(obj);
};

export async function executeAsyncFunctionsInSequence<T>(
  asyncFunctions: Array<() => Promise<T>>
) {
  let results: T[] = [];

  for (const asyncFunction of asyncFunctions) {
    results.push(await asyncFunction());
  }

  return results;
}

// Function to create a config NFT
export const createConfigNFT = async (
  chain: ChainConfig | undefined,
  apiPinata: PinataClient | null,
  config: RewardConfiguration
) => {
  if (!chain) throw "createConfigNFT: chain not found";
  if (!apiPinata) throw "createConfigNFT: apiPinata not found";

  const txs = [];
  const account = initAccount();
  const nftId = generateNFTId(Date.now());

  const { assetHubApi: apiWithNftPallet, ss58Format } = chain;

  if (!apiWithNftPallet) throw "createConfigNFT: apiWithNftPallet not found";

  txs.push(
    apiWithNftPallet.tx.nfts.mint(
      config.configNFT.settingsCollectionId,
      nftId,
      encodeAddress(account.address, ss58Format),
      null
    )
  );

  //add all attributes for all config variables other than the collectionConfig and options
  //filter out all attributes other tan the collectionConfig and options
  const { collectionConfig, configNFT, options, ...configAttributes } = config;

  // pin metadata and file for config NFT to Pinata
  const configMetadataCid = (await pinMetadataForConfigNFT(apiPinata, config))
    .metadataIpfsCid;

  config.configNFT.metadataCid = `ipfs://ipfs/${configMetadataCid}`;

  txs.push(
    apiWithNftPallet.tx.nfts.setMetadata(
      config.configNFT.settingsCollectionId,
      nftId,
      config.configNFT.metadataCid
    )
  );

  txs.push(
    apiWithNftPallet.tx.nfts.lockItemProperties(
      config.configNFT.settingsCollectionId,
      nftId,
      true,
      true
    )
  );

  const batch = apiWithNftPallet?.tx.utility.batchAll(txs);

  //send transactions using our account
  const { block, hash, success } = await sendAndFinalizeKeyPair(
    apiWithNftPallet,
    batch,
    account
  );
  return success;
};

export const sendAndFinalizeKeyPair = async (
  api: ApiPromise,
  tx: SubmittableExtrinsic<"promise", ISubmittableResult>,
  account: KeyringPair
): Promise<{
  block: number;
  success: boolean;
  hash: string;
  included: any[];
  finalized: any[];
}> => {
  return new Promise(async (resolve, reject) => {
    let success = false;
    let included: any = [];
    let finalized = [];
    let block = 0;
    const unsubscribe = await tx.signAndSend(
      account,
      async ({ events = [], status, dispatchError }) => {
        if (status.isInBlock) {
          // console.log(`status: ${status}`)

          success = dispatchError ? false : true;
          console.log(
            `📀 Transaction ${tx.meta.name} included at blockHash ${status.asInBlock} [success = ${success}]`
          );
          const signedBlock = await api.rpc.chain.getBlock(status.asInBlock);
          block = signedBlock.block.header.number.toNumber();
          included = [...events];
        } else if (status.isBroadcast) {
          // console.log(`🚀 Transaction broadcasted.`)
        } else if (status.isFinalized) {
          console.log(
            `💯 Transaction ${tx.meta.name}(..) Finalized at blockHash ${status.asFinalized}`
          );

          if (dispatchError) {
            if (dispatchError.isModule) {
              // for module errors, we have the section indexed, lookup
              const decoded = api.registry.findMetaError(
                dispatchError.asModule
              );
              const { docs, name, section } = decoded;

              // console.log("here we are")

              reject(docs.join(" "));
            } else {
              // Other, CannotLookup, BadOrigin, no extra info
              reject({ status: "error", message: dispatchError.toString() });
            }
          } else {
            finalized = [...events];
            const hash = tx.hash.toHex();
            resolve({ success, hash, included, finalized, block });
          }
          unsubscribe();
        } else if (status.isReady) {
          // let's not be too noisy..
        } else {
          // console.log(`🤷 Other status ${status}`)
        }
      }
    );
  });
};
