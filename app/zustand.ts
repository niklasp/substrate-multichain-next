import { getChainByName } from "@/config/chains";
import { kusama } from "@/config/chains/kusama";
import { usePolkadotExtension } from "@/hooks/use-polkadot-extension";
import { ChainConfig, SubstrateChain } from "@/types";
import { ApiPromise, WsProvider } from "@polkadot/api";
import {
  InjectedAccountWithMeta,
  InjectedExtension,
} from "@polkadot/extension-inject/types";
import { create } from "zustand";
import { persist, createJSONStorage, devtools } from "zustand/middleware";

interface AppState {
  chain: ChainConfig;
  isChainApiReady: boolean;
  setIsChainApiReady: (isReady: boolean) => void;
  user: {
    extensionInjectedPromise?: Promise<InjectedExtension[]>; // promise of injected extension
    extensions: InjectedExtension[]; // injected extension
    accounts: InjectedAccountWithMeta[]; // injected accounts
    actingAccountIdx: number; // acting account index
    isExtensionReady: boolean; // is extension ready
  };
  setExtensions: (extension: InjectedExtension[]) => void;
  setIsExtensionReady: (isReady: boolean) => void;
  setAccounts: (accounts: InjectedAccountWithMeta[]) => void;
  setAccountIdx: (idx: number) => void;
  disconnect: () => void;
}

const emptyUser = {
  extensions: [],
  accounts: [],
  actingAccountIdx: 0,
  isExtensionReady: false,
};

export const useAppStore = create<AppState>()(
  devtools((set, get) => ({
    chain: kusama,
    isChainApiReady: false,
    user: emptyUser,
    setExtensions: (extensions) => {
      const { user } = get();
      set({
        user: {
          ...user,
          extensions,
        },
      });
    },
    setIsExtensionReady: (isReady) => {
      const { user } = get();
      set({
        user: {
          ...user,
          isExtensionReady: isReady,
        },
      });
    },
    setAccounts: (accounts) => {
      const { user } = get();
      set({
        user: {
          ...user,
          accounts,
        },
      });
    },
    setAccountIdx: (idx) => {
      const { user } = get();
      set({
        user: {
          ...user,
          actingAccountIdx: idx,
        },
      });
    },
    disconnect: () => {
      set({
        user: emptyUser,
      });
    },
    setIsChainApiReady: (isReady) => {
      set({
        isChainApiReady: isReady,
      });
    },
  }))
);
