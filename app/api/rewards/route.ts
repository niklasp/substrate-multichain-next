import fs from "fs";
import {
  rewardsSchema,
  zodSchemaObject,
} from "@/app/[chain]/referendum-rewards/util";
import { DEFAULT_CHAIN, getChainByName, getChainInfo } from "@/config/chains";
import { SubstrateChain } from "@/types";
import { NextRequest, NextResponse } from "next/server";
import formidable, { errors as formidableErrors } from "formidable";
import {
  GenerateRewardsResult,
  RewardOption,
} from "@/app/[chain]/referendum-rewards/types";
import { zfd } from "zod-form-data";
import { type } from "os";
import { RewardConfiguration } from "../../[chain]/referendum-rewards/types";
import { BN, bnToBn } from "@polkadot/util";
import { getDecoratedVotesWithInfo, setupPinata } from "./util";
import { ApiPromise } from "@polkadot/api";
import PinataClient from "@pinata/sdk";
import seedrandom from "seedrandom";
import { defaultReferendumRewardsConfig } from "@/config/default-rewards-config";
import { getTxsReferendumRewards } from "./get-reward-txs";

export async function POST(req: NextRequest) {
  //   let { rewardsConfig }: { rewardsConfig: unknown } = await req.json();

  let zodErrors = {};
  let formData: FormData;
  let rewardConfig: RewardConfiguration;
  let selectedChain: SubstrateChain;

  try {
    // parse the form data that is coming from the client
    formData = await req.formData();
    console.log("formData", formData);
    // get the form data as json so we can work with it
    const rewardConfigData = await formData?.get("rewardConfig");
    rewardConfig = JSON.parse(
      rewardConfigData as string
    ) as RewardConfiguration;

    console.log("rewardConfig json", rewardConfig);
  } catch (error) {
    console.log("Error parsing form data", error);
    return NextResponse.json({
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
    return NextResponse.json(
      Object.keys(zodErrors).length > 0
        ? { errors: zodErrors, success: false }
        : { success: true }
    );
  }

  // add the Buffers instead of the files so we can work with it
  rewardConfig?.options?.forEach(async (option) => {
    const file: File | null = (await formData?.get(
      `${option.rarity}File`
    )) as File;

    if (file) {
      const bytes = await file?.arrayBuffer();
      option.file = Buffer.from(bytes);
    }
  });

  try {
    const apiPinata = await setupPinata();
    rewardConfig = { ...rewardConfig, ...defaultReferendumRewardsConfig };
    const callResult: GenerateRewardsResult = await generateCalls(
      apiPinata,
      selectedChain,
      rewardConfig
    );

    return NextResponse.json(callResult);
  } catch (error: any) {
    console.trace(error);
    // res.status(400).json({
    //   name: error.name,
    //   message: error.message,
    // });
    return NextResponse.json({ errors: { form: error.message } });
  }
}

const generateCalls = async (
  apiPinata: PinataClient | null,
  selectedChain: SubstrateChain,
  config: RewardConfiguration,
  seed: number = 0
): Promise<GenerateRewardsResult> => {
  const { refIndex, sender } = config;

  console.info(
    `🚀 Generating calls for reward distribution of referendum ${refIndex}`
  );

  console.info("🔧 with config", config);

  const chainConfig = await getChainByName(selectedChain);
  const { api: referendaPalletApi, assetHubApi: nftPalletApi } = chainConfig;
  const { decimals: relayChainDecimals } = chainConfig;
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

  // console.info(
  //   `📊 Generated ${txsKusamaAssetHub.length} txs for minting NFTs on Asset Hub (Kusama)`
  //   // ,` and ${txsKusama.length} txs for Kusama XCM calls`
  // );

  // console.info(`💵 Calculating fees for sender ${config.sender}`);

  // // const infoKusamaCalls = await referendaPalletApi.tx.utility
  // //   .batchAll(txsKusama)
  // //   .paymentInfo(config.sender);

  // const amountOfTxs = txsKusamaAssetHub.length;
  // const amountOfNFTs = decoratedVotes.length;
  // const txsPerNFT = amountOfTxs / amountOfNFTs;

  // console.info(`📊 Generated ${amountOfTxs} txs for ${amountOfNFTs} NFTs`);
  // console.info(`📊 Generated ${txsPerNFT} txs per NFT`);

  // const infoNftCalls = await nftPalletApi.tx.utility
  //   .batchAll(txsKusamaAssetHub)
  //   .paymentInfo(config.sender);

  // console.info("successfully calculated fees");

  // const collectionDeposit = await getNFTCollectionDeposit(nftPalletApi);
  // const itemDeposit = await getNFTItemDeposit(nftPalletApi);
  // const metadataDepositBase = await getNFTMetadataDeposit(nftPalletApi);
  // // const attributeDepositBase = await getNFTAttributeDeposit(nftPalletApi);

  // const voters = decoratedVotes.map((vote) => vote.address);
  // const totalNFTs = voters.length;

  // let totalDeposit = new BN(itemDeposit)
  //   .add(new BN(metadataDepositBase))
  //   .muln(totalNFTs);

  // if (config.collectionConfig.isNew) {
  //   totalDeposit.add(new BN(collectionDeposit));
  // }

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
    voters: [],
    distribution: rarityDistribution,
    fees: {
      // kusama: formatBalance(infoKusamaCalls.partialFee, {
      //   withSi: false,
      //   forceUnit: "KSM",
      //   decimals: kusamaChainDecimals.toNumber(),
      // }),
      nfts: "123", //infoNftCalls.partialFee.toString(),
      deposit: "123", //totalDeposit.toString(),
    },
    txsCount: {
      // kusama: txsKusama.length,
      nfts: txsKusamaAssetHub.length,
      txsPerVote,
    },
  };
};
