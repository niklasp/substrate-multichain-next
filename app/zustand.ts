import { getChainByName } from "@/config/chains";
import { kusama } from "@/config/chains/kusama";
import { ChainConfig, SubstrateChain } from "@/types";
import { ApiPromise, WsProvider } from "@polkadot/api";
import {
  InjectedAccountWithMeta,
  InjectedExtension,
} from "@polkadot/extension-inject/types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface AppState {
  chain: ChainConfig;
  user: {
    extensions: InjectedExtension[];
    accounts: InjectedAccountWithMeta[];
    actingAccountIdx: number;
    isExtensionReady: boolean;
  };
  setExtensions: (extension: InjectedExtension[]) => void;
  setIsExtensionReady: (isReady: boolean) => void;
  setAccounts: (accounts: InjectedAccountWithMeta[]) => void;
  setAccountIdx: (idx: number) => void;
  switchChain: (chain: SubstrateChain) => void;
}

export const useAppStore = create<AppState>()(
  devtools((set, get) => ({
    chain: kusama,
    user: {
      extensions: [],
      accounts: [],
      actingAccountIdx: 0,
      isExtensionReady: false,
    },
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
    switchChain: async (newChain) => {
      const chain = await getChainByName(newChain);
      set({ chain });
    },
  }))
);

getChainByName(SubstrateChain.Kusama).then((chain) => {
  console.log("async get chain ready");
  useAppStore.setState({ chain });
});
