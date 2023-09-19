import { ApiPromise, WsProvider } from "@polkadot/api";
import {
  InjectedAccountWithMeta,
  InjectedExtension,
} from "@polkadot/extension-inject/types";
import { ReactNode, ReactSVGElement, SVGProps } from "react";
import { Header } from "@polkadot/types/interfaces";

export enum SubstrateChain {
  Kusama = "Kusama",
  Polkadot = "Polkadot",
  Westend = "Westend",
  Rococo = "Rococo",
  Local = "Local",
}

export type ChainConfig = {
  name: SubstrateChain;
  symbol: string;
  decimals: number;
  ss58Format: number;
  blockTime: number;
  endpoints: Endpoint[];
  tracks: any[];
  icon: React.FC<IconSvgProps>;
  provider?: WsProvider;
  api?: ApiPromise;
};

export type PolkadotExtensionType = {
  isReady: boolean;
  accounts?: InjectedAccountWithMeta[];
  injector?: InjectedExtension;
  actingAccountIdx: number;
  error?: Error;
};

export type Endpoint = {
  name: string;
  url: string;
};

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export interface SendAndFinalizeResult {
  status: string;
  message: string;
  txHash?: string;
  events?: any[];
  blockHeader?: Header;
  toast?: ToastType;
}

export type ToastType =
  | undefined
  | {
      title: string;
      messages?: string[];
    };
export type ConvictionVote = {
  // The particular governance track
  track: number;
  // The account that is voting
  address: string;
  // The index of the referendum
  referendumIndex: number;
  // The conviction being voted with, ie `None`, `Locked1x`, `Locked5x`, etc
  conviction: string;
  // The balance they are voting with themselves, sans delegated balance
  balance: {
    aye: number;
    nay: number;
    abstain: number;
  };
  // The total amount of tokens that were delegated to them (including conviction)
  delegatedConvictionBalance: number;
  // the total amount of tokens that were delegated to them (without conviction)
  delegatedBalance: number;
  // The vote type, either 'aye', or 'nay'
  voteDirection: string;
  // Either "Standard", "Split", or "SplitAbstain",
  voteDirectionType: string;
  // Whether the person is voting themselves or delegating
  voteType: string;
  // Who the person is delegating to
  delegatedTo: string | null;
};

export type ConvictionDelegation = {
  track: number;
  address: string;
  target: string;
  balance: number;
  // The balance times the conviction
  effectiveBalance: number;
  conviction: string;
  // The total amount of tokens that were delegated to them (including conviction)
  delegatedConvictionBalance: number;
  // the total amount of tokens that were delegated to them (without conviction)
  delegatedBalance: number;
  prior: any;
};

export type OpenGovReferendum = {
  index: number;
  track: number;
  origin: string;
  proposalHash: string;
  enactmentAfter: number;
  submitted: number;
  submissionWho: string | null;
  submissionIdentity: string | null;
  submissionAmount: number | null;
  decisionDepositWho: string | null;
  decisionDepositAmount: number | null;
  decidingSince: number | null;
  decidingConfirming: boolean | null;
  ayes: number;
  nays: number;
  support: number;
  inQueue: boolean;
  currentStatus: string;
  confirmationBlockNumber: number | null;
  // alarm
};
