import { ApiPromise, WsProvider } from "@polkadot/api";
import {
  InjectedAccountWithMeta,
  InjectedExtension,
} from "@polkadot/extension-inject/types";
import { ReactNode, ReactSVGElement, SVGProps } from "react";

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
