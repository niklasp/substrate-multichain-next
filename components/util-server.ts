import { RewardConfiguration } from "@/app/[chain]/referendum-rewards/types";
import { pinMetadataForConfigNFT } from "@/app/api/_pinata-utils";
import { generateNFTId } from "@/app/api/rewards/get-txs-vote";
import { initAccount } from "@/store/server/account";
import { ChainConfig, SubstrateChain } from "@/types";
import PinataClient from "@pinata/sdk";
import { ApiPromise } from "@polkadot/api";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { encodeAddress } from "@polkadot/keyring";
import { KeyringPair } from "@polkadot/keyring/types";
import { ISubmittableResult } from "@polkadot/types/types";

// Function to create a config NFT
export const createConfigNFT = async (
  chain: ChainConfig | undefined,
  apiPinata: PinataClient | null,
  config: RewardConfiguration
) => {
  if (!chain) throw "createConfigNFT: chain not found";
  if (!apiPinata) throw "createConfigNFT: apiPinata not found";

  let configCollectionId: number;

  if (chain.name === SubstrateChain.Rococo) {
    if (!process.env.ROCOCO_CONFIG_COLLECTION_ID) {
      throw "createConfigNFT: ROCOCO_CONFIG_COLLECTION_ID not found";
    }
    configCollectionId = parseInt(process.env.ROCOCO_CONFIG_COLLECTION_ID);
  } else if (chain.name === SubstrateChain.Kusama) {
    if (!process.env.KUSAMA_CONFIG_COLLECTION_ID) {
      throw "createConfigNFT: KUSAMA_CONFIG_COLLECTION_ID not found";
    }
    configCollectionId = parseInt(process.env.KUSAMA_CONFIG_COLLECTION_ID);
  }

  const txs = [];
  const account = await initAccount();
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
  const { collectionConfig, configNFT, options } = config;

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
