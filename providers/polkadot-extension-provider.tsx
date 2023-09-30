"use client";

import { documentReadyPromise } from "@/hooks/utils";
import {
  InjectedAccountWithMeta,
  InjectedExtension,
} from "@polkadot/extension-inject/types";
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";

// 1 - create a context
export interface UsePolkadotExtensionReturnType {
  connect: () => void;
  disconnect: () => void;
  extensions: InjectedExtension[] | undefined;
  accounts: InjectedAccountWithMeta[] | undefined;
  selectedAccount: InjectedAccountWithMeta | undefined;
  setSelectedAccountIndex: (index: number) => void;
  web3EnablePromise: Promise<InjectedExtension[]> | null;
  isExtensionReady: boolean;
}

const defaultState: UsePolkadotExtensionReturnType = {
  connect: () => {},
  disconnect: () => {},
  extensions: [],
  accounts: [],
  selectedAccount: undefined,
  setSelectedAccountIndex: () => {},
  web3EnablePromise: null,
  isExtensionReady: false,
};

const PolkadotExtensionContext =
  createContext<UsePolkadotExtensionReturnType>(defaultState);

// 2 - create a provider
export const PolkadotExtensionContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  // the user has accepted the connection request for the site in their browser extension
  const [userWantsConnection, setUserWantsConnection] =
    useState<boolean>(false);
  // all found extensions in the browser (e.g. polkadot.js / talisman)
  const [extensions, setExtensions] = useState<InjectedExtension[]>();
  // await this to be sure the extension is ready to be used
  const [web3EnablePromise, setWeb3EnablePromise] = useState<Promise<
    InjectedExtension[]
  > | null>(null);
  // all found accounts in the browser extension
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>();

  // the selected account in the browser extension
  const [selectedAccountIndex, _setSelectedAccountIndex] = useState<number>(0);

  // true after the extension is ready to be used
  const [isExtensionReady, setIsExtensionReady] = useState<boolean>(false);

  useEffect(() => {
    const rawUserWantsConnection = localStorage.getItem("userWantsConnection");
    setUserWantsConnection(rawUserWantsConnection === "true");

    const rawSelectedAccountIndex = localStorage.getItem(
      "selectedAccountIndex"
    );

    console.log(
      "got selectedAccount index from localstorage",
      rawSelectedAccountIndex ? parseInt(rawSelectedAccountIndex) : 0
    );
    _setSelectedAccountIndex(
      rawSelectedAccountIndex ? parseInt(rawSelectedAccountIndex) : 0
    );
  }, []);

  useEffect(() => {
    const enable = async () => {
      // only import on the client side (useEffect hook), the package is not compatible with SSR
      // as it accesses the browser's `window` object
      const { web3Enable, web3AccountsSubscribe, web3EnablePromise } =
        await import("@polkadot/extension-dapp");

      await web3EnablePromise;
      setIsExtensionReady(true);

      const extensionInjectedPromise = documentReadyPromise(() =>
        web3Enable(
          process.env.NEXT_PUBLIC_APP_NAME ||
            "Polkadot Wallet Connect - next.js"
        )
      );

      const browserExtensions = await extensionInjectedPromise;
      setExtensions(browserExtensions);

      const accountSubscriptionPromise = web3AccountsSubscribe(
        (injectedAccounts) => {
          console.log("accounts", injectedAccounts);
          setAccounts(injectedAccounts);
        }
      );
      // note that `web3AccountsSubscribe` returns the function to unsubscribe
      const unsubscribe = await accountSubscriptionPromise;

      return () => unsubscribe && unsubscribe();
    };

    if (userWantsConnection) {
      enable();
    }
  }, [userWantsConnection]);

  const connect = async () => {
    localStorage.setItem("userWantsConnection", "true");
    setUserWantsConnection(true);
  };

  const disconnect = () => {
    localStorage.removeItem("userWantsConnection");
    setUserWantsConnection(false);
    setAccounts([]);
    setIsExtensionReady(false);
  };

  const setSelectedAccountIndex = (accountIdx: number) => {
    localStorage.setItem("selectedAccountIndex", accountIdx.toString());
    _setSelectedAccountIndex(accountIdx);
  };

  const selectedAccount = accounts?.[selectedAccountIndex];

  return (
    <PolkadotExtensionContext.Provider
      value={{
        connect,
        disconnect,
        accounts,
        extensions,
        selectedAccount,
        setSelectedAccountIndex,
        web3EnablePromise,
        isExtensionReady,
      }}
    >
      {children}
    </PolkadotExtensionContext.Provider>
  );
};

// 3 - create a hook to use the context
export const usePolkadotExtension = () => {
  const context = useContext(PolkadotExtensionContext);
  if (context === undefined) {
    throw new Error(
      "usePolkadotExtension must be used within a PolkadotExtensionContextProvider"
    );
  }
  return context;
};
