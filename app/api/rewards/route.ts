import { zodSchemaObject } from "@/app/[chain]/referendum-rewards/util";
import { DEFAULT_CHAIN, getChainByName, getChainInfo } from "@/config/chains";
import { SubstrateChain } from "@/types";
import { NextRequest, NextResponse } from "next/server";
import { zfd } from "zod-form-data";
import {
  RewardConfiguration,
  GenerateRewardsResult,
} from "../../[chain]/referendum-rewards/types";
import { BN, bnToBn } from "@polkadot/util";
import { getDecoratedVotesWithInfo, setupPinata } from "./util";
import PinataClient from "@pinata/sdk";
import seedrandom from "seedrandom";
import { getTxsReferendumRewards } from "./get-reward-txs";
import { Readable } from "stream";
import { encodeAddress } from "@polkadot/keyring";
import {
  getNFTCollectionDeposit,
  getNFTItemDeposit,
  getNFTMetadataDeposit,
} from "@/config/txs";
import fs from "fs";
import { rewardsConfig } from "../../../config/rewards";
import { mergeWithDefaultConfig } from "@/components/util";

export async function POST(req: NextRequest) {
  //   let { rewardsConfig }: { rewardsConfig: unknown } = await req.json();

  let res = NextResponse<GenerateRewardsResult>;
  const { DEFAULT_REWARDS_CONFIG } = rewardsConfig;

  let zodErrors = {};
  let formData: FormData;
  let rewardConfig: RewardConfiguration;
  let selectedChain: SubstrateChain;
  let sender;

  try {
    // parse the form data that is coming from the client
    formData = await req.formData();
    console.log("formData", formData);

    sender = formData?.get("sender");

    // get the form data as json so we can work with it
    const rewardConfigData = formData?.get("rewardConfig");
    if (!rewardConfigData) {
      throw new Error("Missing formData");
    }
    rewardConfig = JSON.parse(rewardConfigData?.toString());

    console.log("rewardConfig json", rewardConfig);
  } catch (error) {
    console.log("Error parsing form data", error);
    return res.json({
      errors: { form: "Error parsing form data" },
      success: false,
    });
  }

  try {
    // validate the incoming form data (without the files that were sent)
    selectedChain = (rewardConfig.chain as SubstrateChain) || DEFAULT_CHAIN;
    const { ss58Format } = getChainInfo(selectedChain);

    // override the file of each option with a file from the parsed form data
    // this is needed because the file is not serializable
    rewardConfig.options.forEach((option) => {
      option.file = formData?.get(`${option.rarity}File`);
    });

    // override the file of the collection config with a file from the parsed form data
    rewardConfig.collectionConfig.file = formData?.get("collectionImage");

    console.log("rewardConfig after file transform", rewardConfig);

    const schemaObject = zodSchemaObject(selectedChain, ss58Format);
    const schema = zfd.formData(schemaObject);

    console.info("validating form data", rewardConfig);
    const result = schema.safeParse(rewardConfig);
    console.log("result", result);

    if (!result.success) {
      result.error.issues.map((issue) => {
        zodErrors = {
          ...zodErrors,
          [issue.path[0]]: issue.message,
        };
      });
    }
  } catch (error) {
    console.log("error validating form data", error);
    return res.json(
      Object.keys(zodErrors).length > 0
        ? { errors: zodErrors, success: false }
        : { success: true }
    );
  }

  try {
    // add the Buffers instead of the files so we can work with it
    rewardConfig?.options?.forEach(async (option) => {
      const file: File | null = formData?.get(`${option.rarity}File`) as File;

      if (file) {
        const bytes = await file?.arrayBuffer();
        option.file = option.file = Readable.from(Buffer.from(bytes));
      }
    });

    if (rewardConfig.collectionConfig.isNew) {
      const file = formData?.get("collectionImage") as File;
      const bytes = await file?.arrayBuffer();
      rewardConfig.collectionConfig.file = Readable.from(Buffer.from(bytes));
    }
  } catch (e) {
    throw "Error converting files to readable streams";
  }

  try {
    const apiPinata = await setupPinata();
    rewardConfig = mergeWithDefaultConfig(rewardConfig);
    const callResult: GenerateRewardsResult = await generateCalls(
      apiPinata,
      selectedChain,
      rewardConfig,
      sender as string
    );

    return res.json({ status: "success", ...callResult });
  } catch (error: any) {
    console.trace(error);
    // res.status(400).json({
    //   name: error.name,
    //   message: error.message,
    // });
    return res.json({
      status: "error",
      errors: { form: error.message },
    });
  }
}

const generateCalls = async (
  apiPinata: PinataClient | null,
  selectedChain: SubstrateChain,
  config: RewardConfiguration,
  sender: string | null,
  seed: number = 0
): Promise<GenerateRewardsResult> => {
  const { refIndex } = config;

  console.info(
    `🚀 Generating calls for reward distribution of referendum ${refIndex}`
  );

  console.info("🔧 with config", config);

  const chainConfig = await getChainByName(selectedChain);
  const { api: referendaPalletApi, assetHubApi: nftPalletApi } = chainConfig;
  const { decimals: relayChainDecimals, ss58Format } = chainConfig;
  const referendumIndex = new BN(config.refIndex);

  // seed the randomizer
  const rng = seedrandom(seed.toString());

  //get ref ended block number
  //TODO check the referendum is not ongoing
  //   let blockNumber;
  //   console.info(`ℹ️  Getting block number for referendum ${refIndex}`);
  //   try {
  //     blockNumber = await getBlockNumber(referendaPalletApi, referendumIndex);
  //     if (!blockNumber) throw new Error("Referendum is still ongoing");
  //   } catch (e) {
  //     // logger.error(`Referendum is still ongoing: ${e}`)
  //     throw new Error(`Referendum is still ongoing: ${e}`);
  //   }

  console.info(`ℹ️  Getting all voting wallets for referendum ${refIndex}`);
  // get the list of all wallets that have voted along with their calculated NFT rarity and other info @see getDecoratedVotes
  const { decoratedVotes, distribution: rarityDistribution } =
    await getDecoratedVotesWithInfo(
      referendaPalletApi,
      config,
      bnToBn(relayChainDecimals)
    );

  console.info(
    `⚙️  Processing ${decoratedVotes.length} votes for referendum ${refIndex}`
  );

  //computing the actual calls is still WIP and likely to change

  // get all transactions that are needed for the distribution
  // TODO --- warning we slice by 10 here

  let { txsKusamaAssetHub, txsPerVote } = await getTxsReferendumRewards(
    nftPalletApi,
    referendaPalletApi,
    apiPinata,
    config,
    decoratedVotes,
    rarityDistribution,
    rng
  );

  // const nftCalls = nftPalletApi?.tx.utility
  //   .batchAll(txsKusamaAssetHub)
  //   .method.toHex();

  // // const kusamaCalls = referendaPalletApi.tx.utility.batchAll(txsKusama).method.toHex();

  console.info(
    `📊 Generated ${txsKusamaAssetHub.length} txs for minting NFTs on Asset Hub (Kusama)`
    // ,` and ${txsKusama.length} txs for Kusama XCM calls`
  );

  let infoNftCalls = undefined;

  if (sender) {
    const encodedAddress = encodeAddress(sender, ss58Format);
    console.info(
      `💵 Calculating fees for sender ${sender} on chain address ${encodedAddress}`
    );

    const amountOfTxs = txsKusamaAssetHub.length;
    const amountOfNFTs = decoratedVotes.length;
    const txsPerNFT = amountOfTxs / amountOfNFTs;

    console.info(`📊 Generated ${amountOfTxs} txs for ${amountOfNFTs} NFTs`);
    console.info(`📊 Generated ${txsPerNFT} txs per NFT`);

    infoNftCalls = await nftPalletApi?.tx.utility
      .batchAll(txsKusamaAssetHub)
      .paymentInfo(encodedAddress);

    console.info("successfully calculated fees");
  }

  let totalDeposit = undefined;
  const collectionDeposit = await getNFTCollectionDeposit(nftPalletApi);
  const itemDeposit = await getNFTItemDeposit(nftPalletApi);
  const metadataDepositBase = await getNFTMetadataDeposit(nftPalletApi);
  // const attributeDepositBase = await getNFTAttributeDeposit(nftPalletApi);

  const voters = decoratedVotes.map((vote) => vote.address);
  const totalNFTs = voters.length;

  if (itemDeposit && metadataDepositBase) {
    totalDeposit = new BN(itemDeposit)
      .add(new BN(metadataDepositBase))
      .muln(totalNFTs);

    if (config.collectionConfig.isNew && totalDeposit && collectionDeposit) {
      totalDeposit.add(new BN(collectionDeposit));
    }
  }

  // console.info(
  //   `📊 Total fees for sender ${
  //     config.sender
  //   } are ${totalDeposit.toString()} KSM`
  // );

  console.info("🎉 All Done");

  // console.info(
  //   `📄 Writing transactions to
  //   ./log/tmp_transactions_${config.refIndex}_xcm.json`
  // );

  // fs.writeFileSync(
  //   `./log/tmp_transactions_${config.refIndex}_xcm.json`,
  //   JSON.stringify(
  //     {
  //       nfts: txsKusamaAssetHub.map((tx) => tx.toHuman()),
  //       // xcm: txsKusama.map((tx) => tx.toHuman()),
  //       deposits: {
  //         collectionDeposit,
  //         itemDeposit,
  //       },
  //     },
  //     null,
  //     2
  //   )
  // );

  // console.info(
  //   `returning
  //   ${JSON.stringify(
  //     {
  //       call: "omitted",
  //       distribution: rarityDistribution,
  //       voters,
  //       fees: {
  //         // kusama: formatBalance(infoKusamaCalls.partialFee, {
  //         //   withSi: false,
  //         //   forceUnit: "KSM",
  //         //   decimals: relayChainDecimals.toNumber(),
  //         // }),
  //         nfts: formatBalance(infoNftCalls.partialFee, {
  //           withSi: false,
  //           forceUnit: "KSM",
  //           decimals: relayChainDecimals.toNumber(),
  //         }),
  //         deposits: {
  //           collectionDeposit,
  //           itemDeposit,
  //         },
  //       },
  //       txsCount: {
  //         // kusama: txsKusama.length,
  //         nfts: txsKusamaAssetHub.length,
  //       },
  //     },
  //     null,
  //     2
  //   )}`
  // );

  return {
    call: "omitted",
    config,
    // kusamaCall: JSON.stringify(kusamaCalls),
    kusamaCall: "",
    kusamaAssetHubCall: "", // JSON.stringify(nftCalls),
    kusamaAssetHubTxs: txsKusamaAssetHub,
    voters,
    distribution: rarityDistribution,
    fees: {
      // kusama: formatBalance(infoKusamaCalls.partialFee, {
      //   withSi: false,
      //   forceUnit: "KSM",
      //   decimals: kusamaChainDecimals.toNumber(),
      // }),
      nfts: infoNftCalls?.partialFee?.toString(),
      deposit: totalDeposit?.toString(),
    },
    txsCount: {
      kusama: txsKusamaAssetHub.length,
      nfts: txsKusamaAssetHub.length,
      txsPerVote,
    },
  };
};
