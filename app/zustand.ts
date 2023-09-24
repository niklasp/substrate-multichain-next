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
import { Modal, type ModalProps } from "@nextui-org/modal";
import { Signer } from "@polkadot/api/types";
import { rewardsConfig } from "@/config/rewards";

interface AppState {
  chain: ChainConfig;
  isChainApiReady: boolean;
  setIsChainApiReady: (isReady: boolean) => void;

  filters: {
    trackFilter: string;
  };
  setTrackFilter: (trackFilter: string) => void;

  confetti: boolean;

  user: {
    extensionInjectedPromise?: Promise<InjectedExtension[]>; // promise of injected extension
    extensions: InjectedExtension[]; // injected extension
    accounts: InjectedAccountWithMeta[]; // injected accounts
    actingAccountIdx: number; // acting account index
    actingAccount?: InjectedAccountWithMeta; // acting account
    actingAccountSigner?: Signer;
    isExtensionReady: boolean; // is extension ready
    voteStates: any[]; // vote states
    wantsConnection: boolean; // wants connection
  };

  modals: {
    isOpen: boolean;
    view: React.ReactNode;
    modalProps?: ModalProps;
  };
  openModal: (view: React.ReactNode, modalProps?: ModalProps) => void;
  closeModal: () => void;

  setExtensions: (extension: InjectedExtension[]) => void;
  setIsExtensionReady: (isReady: boolean) => void;
  setUserWantsConnection: (wantsConnection: boolean) => void;

  setAccounts: (accounts: InjectedAccountWithMeta[]) => void;
  setAccountIdx: (idx: number) => void;
  setActingAccountSigner: (signer: Signer) => void;
  disconnect: () => void;

  updateVoteState: (referendumId: string, vote: any) => void;
  removeVoteState: (referendumId: string) => void;
  clearVoteState: () => void;

  explode: (boolean) => void;

  rewards: {
    form: {
      values: any;
    };
  };
  setRewardFormValues: (values: any) => void;
}

const emptyUser = {
  extensions: [],
  accounts: [],
  actingAccountIdx: 0,
  actingAccount: undefined,
  actingAccountSigner: undefined,
  isExtensionReady: false,
  voteStates: [],
  wantsConnection: false,
};

export const useAppStore = create<AppState>()(
  devtools((set, get) => ({
    chain: kusama,
    isChainApiReady: false,
    user: emptyUser,
    filters: {
      trackFilter: "all",
    },
    modals: {
      isOpen: false,
      view: null,
    },
    rewards: {
      form: {
        values: rewardsConfig.DEFAULT_REWARDS_CONFIG,
      },
    },
    confetti: false,
    explode: (show) => {
      set({
        confetti: show,
      });
    },
    setRewardFormValues: (values) => {
      const { rewards } = get();
      set({
        rewards: {
          ...rewards,
          form: {
            ...rewards.form,
            values: {
              ...rewards.form.values,
              ...values,
            },
          },
        },
      });
    },

    openModal: (view, modalProps) => {
      const { modals } = get();
      set({
        modals: {
          ...modals,
          modalProps,
          isOpen: true,
          view,
        },
      });
    },
    closeModal: () => {
      const { modals } = get();
      set({
        modals: {
          ...modals,
          isOpen: false,
        },
      });
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
    setUserWantsConnection: (wantsConnection) => {
      const { user } = get();
      set({
        user: {
          ...user,
          wantsConnection,
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
          actingAccount: user.accounts[idx],
        },
      });
    },
    setActingAccountSigner: (signer) => {
      const { user } = get();
      set({
        user: {
          ...user,
          actingAccountSigner: signer,
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
    updateVoteState: (referendumId: string, vote: any) => {
      // set((state) => ({
      //   user: {
      //     ...state.user,
      //     voteStates: {
      //       ...state.user.voteStates,
      //       [`${referendumId}`]: {
      //         ...state.user.voteStates?.[`${referendumId}`],
      //         vote,
      //       },
      //     },
      //   },
      // }));
    },
    removeVoteState: (referendumId: string) => {
      // set((state) => {
      //   const newVoteStates = { ...state.user.voteStates };
      //   delete newVoteStates[`${referendumId}`];
      //   return {
      //     user: {
      //       ...state.user,
      //       voteStates: newVoteStates,
      //     },
      //   };
      // });
    },
    clearVoteState: () => {
      // set((state) => ({
      //   user: {
      //     ...state.user,
      //     voteStates: [],
      //   },
      // }));
    },

    setTrackFilter: (trackFilter) => {
      set((state) => ({
        filters: {
          ...state.filters,
          trackFilter,
        },
      }));
    },
  }))
);
