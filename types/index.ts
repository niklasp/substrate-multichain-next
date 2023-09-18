import { ApiPromise, WsProvider } from "@polkadot/api";
import {
  InjectedAccountWithMeta,
  InjectedExtension,
} from "@polkadot/extension-inject/types";
import { ReactNode, ReactSVGElement, SVGProps } from "react";
import { Header } from "@polkadot/types/interfaces";

export enum SubstrateChain {
  Kusama = "kusama",
  Polkadot = "polkadot",
  Westend = "westend",
  Rococo = "rococo",
  Local = "local",
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
