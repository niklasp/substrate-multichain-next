"use client";

import { documentReadyPromise } from "@/hooks/utils";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export interface UsePolkadotExtensionReturnType {
  connect?: () => void;
  disconnect?: () => void;
  extensions?: any[];
  accounts?: any[];
}

const PolkadotExtensionContext = createContext<UsePolkadotExtensionReturnType>({
  connect: () => {},
  disconnect: () => {},
  extensions: [],
  accounts: [],
});

export const usePolkadotExtension = () => useContext(PolkadotExtensionContext);

export const PolkadotExtensionContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [userWantsConnection, setUserWantsConnection] =
    useState<boolean>(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [selectedExtension, setSelectedExtension] = useState<any>(null);

  useEffect(() => {
    const rawUserWantsConnection = localStorage.getItem("userWantsConnection");
    setUserWantsConnection(rawUserWantsConnection === "true");
  }, []);

  useEffect(() => {
    const enable = async () => {
      const { web3Enable } = await import("@polkadot/extension-dapp");

      const extensionInjectedPromise = documentReadyPromise(() =>
        web3Enable(
          process.env.NEXT_PUBLIC_APP_NAME || "Polkadot Multi Chain App"
        )
      );

      const browserExtensions = await extensionInjectedPromise;
      console.log("browserExtensions", browserExtensions);
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
  };

  useEffect(() => {
    const accountsRaw = localStorage.getItem("accounts") || "[]";
    const parsedAccounts = JSON.parse(accountsRaw);
    if (Array.isArray(parsedAccounts)) {
      setAccounts(parsedAccounts);
    }
  }, []);

  return (
    <PolkadotExtensionContext.Provider value={{ connect, disconnect }}>
      {children}
    </PolkadotExtensionContext.Provider>
  );
};
