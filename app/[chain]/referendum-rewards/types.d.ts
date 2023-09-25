import { SubstrateChain } from "@/types";

export type GenerateRewardsResult =
  | {
      call?: string;
      config?: RewardConfiguration;
      kusamaCall?: string;
      kusamaAssetHubCall?: string;
      kusamaAssetHubTxs?: string[];
      kusamaAssetHubTxsBatches?: string[];
      distribution?: RarityDistribution;
      voters?: string[];
      fees?: {
        kusama?: string;
        nfts?: string;
        deposit?: string;
      };
      txsCount?: {
        kusama?: number;
        nfts?: number;
        txsPerVote?: number;
      };
      status: "success" | "error";
    }
  | undefined;

export type CreateCollectionResult = {
  call: string | undefined;
  kusamaAssetHubCall: string | undefined;
  kusamaAssetHubTxs: string[] | undefined;
  fees: string | undefined;
  txsCount: number | undefined;
};

export interface VoteConvictionDragon extends VoteConviction {
  dragonEquipped: string;
}

export interface VoteConvictionDragonQuiz extends VoteConvictionDragon {
  quizCorrect: number;
}

export interface VoteConvictionDragonQuizEncointer
  extends VoteConvictionDragonQuiz {
  encointerScore: number;
}

export interface VoteConvictionEncointer extends VoteConviction {
  encointerScore: number;
}

export type Chances = { [key: string]: number };

export interface EncointerMetadata {
  name: string;
  symbol: string;
  assets: string;
  theme: string | null;
  url: string | null;
}

export interface EncointerCommunity {
  name: string;
  symbol: string;
  geoHash: string;
  digest: string;
}

export interface ParaInclusions {
  backedCandidates: Array<{
    candidate: {
      descriptor: {
        paraId: number;
        paraHead: string;
      };
    };
  }>;
}

export interface QuizSubmission {
  blockNumber: number;
  quizId: string;
  timestamp: string;
  version: string;
  wallet: string;
  answers: Answer[];
}

interface Answer {
  isCorrect: boolean;
}

export interface RarityDistribution {
  [key: string]: number;
}

interface Attribute {
  name: "rarity" | "totalSupply" | "artist" | "name" | "typeOfVote";
  value: string | Uint8Array | Bytes;
}

export type MetadataCid = {
  direct: string;
  delegated: string;
};

export interface ProcessMetadataResult {
  metadataCids: {
    [key: string]: {
      direct: string;
      delegated: string;
    };
  };
  attributes: {
    [key: string]: {
      direct: string;
      delegated: string;
    };
  };
}

export type PinImagesForOptionsResult = {
  imageIpfsCids: {
    [key: string]: {
      direct: string;
      delegated: string;
    };
  };
};

export type PinImageAndMetadataForOptionsResult = {
  imageIpfsCids: {
    [key: string]: string;
  };
  metadataIpfsCids: {
    [key: string]: {
      direct: string;
      delegated: string;
    };
  };
};

export type PinImageAndMetadataForCollectionResult = {
  imageIpfsCid: string;
  metadataIpfsCid: string;
};

export type PinImageAndMetadataForConfigNFTResult = {
  imageIpfsCid: string;
  metadataIpfsCid: string;
};

export type NftAttributesResult = {
  [key: string]: {
    direct: string;
    delegated: string;
  };
};

export type RNG = () => number;

export interface FetchReputableVotersParams {
  confirmationBlockNumber: number;
  getEncointerBlockNumberFromKusama: (kusamaBlock: number) => Promise<number>;
  getCurrentEncointerCommunities: (
    block: number
  ) => Promise<EncointerCommunity[]>;
  getLatestEncointerCeremony: (block: number) => Promise<number>;
  getReputationLifetime: (block: number) => Promise<number>;
  getCeremonyAttendants: (
    community: EncointerCommunity,
    cIndex: number,
    encointerBlock: number
  ) => Promise<any[]>;
}

export interface DragonBonus {
  wallet: string;
}

export interface Bonuses {
  babies: DragonBonus[];
  toddlers: DragonBonus[];
  adolescents: DragonBonus[];
  adults: DragonBonus[];
}

export interface CollectionConfiguration {
  file?: any;
  id?: number;
  name?: string;
  description?: string;
  metadataCid?: string | null;
  isNew?: boolean;
}

export interface ConfigNFT {
  file: any;
  description: string;
  imageCid?: string;
  metadataCid?: string | null;
  settingsCollectionId: number;
}

enum RewardCriteria {
  All = "all",
  Threshold = "threshold",
}

export interface RewardConfiguration {
  chain: SubstrateChain | undefined;
  refIndex: string;
  criteria: RewardCriteria;
  min: string;
  max: string;
  first: number | null;
  blockCutOff: number | null;
  directOnly: boolean;
  collectionConfig: CollectionConfiguration;
  configNFT: ConfigNFT;
  // babyBonus: number;
  // toddlerBonus: number;
  // adolescentBonus: number;
  // adultBonus: null;
  // quizBonus: number;
  // identityBonus: null;
  // encointerBonus: number;
  minAmount: number;
  defaultRoyalty: number;
  royaltyAddress: string;
  options: RewardOption[];
  isMetadataLocked: boolean;
  isAttributesLocked: boolean;
  lowerLimitOfCurve?: number | null;
  upperLimitOfCurve?: number | null;
  medianOfCurve?: number | null;
  minRequiredLockedWithConviction?: number | null;
  maxAllowedLockedWithConviction?: number | null;
  maxLockedWithConviction?: number | null;
  minLockedWithConviction?: number | null;
  sender?: string;
  seed?: string;
  nftIds?: number[];
}

export interface RewardOption {
  description: string;
  maxProbability: number;
  minProbability: number;
  transferable: boolean;
  artist: string;
  rarity: string;
  title: string;
  royalty: number;
  metadataCidDirect?: string;
  metadataCidDelegated?: string;
  file?: any;
  imageCid?: string;
}

export interface SendAndFinalizeResult {
  status: string;
  message: string;
  txHash?: string;
  events?: any[];
  blockHeader?: Header;
  toast?: ToastType;
}
