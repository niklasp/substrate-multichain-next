import { RewardConfiguration } from "@/app/[chain]/referendum-rewards/types";
import { SubstrateChain } from "@/types";

export type RewardsConfigType = {
  royaltyAddress: string;
  acceptedNftFormats: string[];
  maxFileSize: number;
  defaultReferendumRewardsConfig: RewardConfiguration;
  rewardsFilter: string[];
};

export const rewardsConfig: RewardsConfigType = {
  //for tetsing, only consider the following addresses for the sendout
  rewardsFilter: process.env.REWARDS_FILTER_ADDRESSES
    ? process.env.REWARDS_FILTER_ADDRESSES.split(",")
    : [],
  royaltyAddress:
    process.env.NEXT_PUBLIC_ROYALTY_ADDRESS ||
    "Go8NpTvzdpfpK1rprXW1tE4TFTHtd2NDJCqZLw5V77GR8r4",
  acceptedNftFormats: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/tiff",
    "image/svg",
    "image/bmp",
    "video/mp4",
    "video/webp",
    "audio/mp3",
    "audio/flac",
    "3d/glb",
  ],
  maxFileSize: 2 * 1024 * 1024,
  defaultReferendumRewardsConfig: {
    chain: SubstrateChain.Kusama,
    refIndex: "99",
    criteria: "all",
    min: "1200000000000",
    max: "100000000000000000000000000000000000000000",
    first: null,
    blockCutOff: null,
    directOnly: false,
    configNFT: {
      settingsCollectionId: parseInt(
        process.env.NEXT_PUBLIC_SETTINGS_COLLECTION_ID || "86"
      ),
      file: undefined,
      imageCid: "ipfs://ipfs/QmZX9JAhur4ozT2mbHBVAWNRFZGfFRQLgkRgd1yyE35eme",
      description:
        "This is the config NFT for the referendum rewards. You can use this NFT to verify the configuration that was used for the specific sendout.",
    },
    collectionConfig: {
      id: 76,
      name: "",
      description: "",
      isNew: false,
      file: undefined,
    },
    // babyBonus: 7,
    // toddlerBonus: 13,
    // adolescentBonus: 16,
    // adultBonus: null,
    // quizBonus: 20,
    // identityBonus: null,
    // encointerBonus: 50,
    minAmount: 0.2,
    defaultRoyalty: 95,
    royaltyAddress: "5FbpLGeHYmGncjPEcYmzcj5CA3BtorgB4g4QzoRwz18UFGBR",
    options: [
      {
        maxProbability: 25,
        minProbability: 3,
        transferable: true,
        artist: "",
        rarity: "epic",
        title: "epic",
        royalty: 30,
        description: "",
      },
      {
        maxProbability: 40,
        minProbability: 10,
        transferable: true,
        artist: "",
        rarity: "rare",
        title: "rare",
        royalty: 25,
        description: "",
      },
      {
        maxProbability: 67,
        minProbability: 28,
        transferable: true,
        artist: "",
        rarity: "common",
        title: "common",
        royalty: 20,
        description: "",
      },
    ],
    isMetadataLocked: false,
    isAttributesLocked: false,
  },
};
