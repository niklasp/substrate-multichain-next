import {
  InjectedAccountWithMeta,
  InjectedExtension,
} from "@polkadot/extension-inject/types";
import { useEffect, useState } from "react";
import { documentReadyPromise } from "./utils";
import { useAppStore } from "@/app/zustand";
import { stat } from "fs";

export interface UsePolkadotExtensionReturnType {
  extensionSetup: () => void;
}

export const usePolkadotExtension = () => {
  const user = useAppStore((state) => state.user);
  const { accounts, isExtensionReady } = user;
  const setIsExtensionReady = useAppStore((state) => state.setIsExtensionReady);
  const setAccounts = useAppStore((state) => state.setAccounts);

  const disconnect = () => {
    setAccounts([]);
    setIsExtensionReady(false);
  };

  const extensionSetup = async () => {
    const extensionDapp = await import("@polkadot/extension-dapp");
    const { web3AccountsSubscribe, web3Enable } = extensionDapp;

    const extensionInjectedPromise = documentReadyPromise(() =>
      web3Enable(process.env.NEXT_PUBLIC_APP_NAME || "Polkadot Multi Chain App")
    );

    const browserExtensions = await extensionInjectedPromise;
    if (browserExtensions.length === 0) {
      console.warn(
        "⚠️ No Polkadot compatible browser extension found, or the user did not accept the request"
      );
      return;
    }

    if (accounts.length > 0) {
      setIsExtensionReady(true);
    } else {
      let unsubscribe: () => void;

      // we subscribe to any account change

      const accountSubscriptionPromise = web3AccountsSubscribe(
        (injectedAccounts) => {
          console.log("accounts", injectedAccounts);
          setAccounts(injectedAccounts);
        }
      );
      // note that `web3AccountsSubscribe` returns the function to unsubscribe
      unsubscribe = await accountSubscriptionPromise;

      return () => unsubscribe && unsubscribe();
    }
  };

  return { extensionSetup, isExtensionReady, disconnect };
};
