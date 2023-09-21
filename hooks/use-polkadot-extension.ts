"use client";

import {
  InjectedAccountWithMeta,
  InjectedExtension,
  InjectedWindow,
} from "@polkadot/extension-inject/types";
import { useEffect, useState } from "react";
import { documentReadyPromise } from "./utils";
import { useAppStore } from "@/app/zustand";
import { stat } from "fs";

export interface UsePolkadotExtensionReturnType {
  extensionSetup: () => void;
  isExtensionReady: boolean;
}

export const usePolkadotExtension = () => {
  const chain = useAppStore((state) => state.chain);
  const user = useAppStore((state) => state.user);
  const { accounts, actingAccountIdx, isExtensionReady, wantsConnection } =
    user;
  const setExtensions = useAppStore((state) => state.setExtensions);
  const setIsExtensionReady = useAppStore((state) => state.setIsExtensionReady);
  const setAccounts = useAppStore((state) => state.setAccounts);
  const setActingAccountSigner = useAppStore(
    (state) => state.setActingAccountSigner
  );
  const setAccountIdx = useAppStore((state) => state.setAccountIdx);
  const actingAccount = accounts && accounts[actingAccountIdx];
  const [isChainApiLoading, setIsChainApiLoading] = useState<boolean>(false);
  const [web3EnablePromise, setWeb3EnablePromise] = useState<Promise<any>>();

  const extensionSetup = async () => {
    const extensionDapp = await import("@polkadot/extension-dapp");
    const {
      web3AccountsSubscribe,
      web3Enable,
      isWeb3Injected,
      web3FromAddress,
      web3Accounts,
    } = extensionDapp;

    console.log("isWeb3Injected", isWeb3Injected);

    // just a helper (otherwise we cast all-over, so shorter and more readable)
    const win = window as Window & InjectedWindow;

    // don't clobber the existing object, but ensure non-undefined
    win.injectedWeb3 = win.injectedWeb3 || {};

    // true when anything has been injected and is available
    // function web3IsInjected(): boolean {
    //   return Object.keys(win.injectedWeb3).length !== 0;
    // }

    if (!web3EnablePromise) {
      const web3EnablePromise = documentReadyPromise(async () => {
        // console.log(
        //   web3IsInjected() ? "web3IsInjected" : "web3IsNotInjected",
        //   win.injectedWeb3
        // );

        return web3Enable(
          process.env.NEXT_PUBLIC_APP_NAME || "Polkadot Multi Chain App"
        );
      });
      setWeb3EnablePromise(web3EnablePromise);
    }

    let browserExtensions: InjectedExtension[] = [];

    try {
      browserExtensions = await web3EnablePromise;
    } catch (error) {
      console.error("GRRR 🦁 r", error);
    }

    console.log("extensions", browserExtensions);

    setExtensions(browserExtensions);

    if (browserExtensions?.length === 0) {
      console.warn(
        "⚠️ No Polkadot compatible browser extension found, or the user did not accept the request"
      );
      return;
    }

    if (accounts?.length > 0) {
      setIsExtensionReady(true);
    } else {
      let unsubscribe: () => void;

      // we subscribe to any account change
      // note that `web3AccountsSubscribe` returns the function to unsubscribe
      unsubscribe = await web3AccountsSubscribe((injectedAccounts) => {
        console.log("accounts", injectedAccounts);
        setIsExtensionReady(true);
        setAccounts(injectedAccounts);
        setAccountIdx(0);
      });

      return () => unsubscribe && unsubscribe();
    }
  };

  useEffect(() => {
    const asyncEffect = async () => {
      const extensionDapp = await import("@polkadot/extension-dapp");
      const { web3FromAddress } = extensionDapp;

      if (actingAccount && actingAccount.address) {
        const { signer } = await web3FromAddress(actingAccount.address);
        setActingAccountSigner(signer);
      }
    };
    asyncEffect();
  }, [actingAccountIdx, accounts]);

  useEffect(() => {
    if (!isExtensionReady) {
      console.log("initializing the polkadot extension ", isExtensionReady);
      extensionSetup();
    }
  }, [isExtensionReady, wantsConnection]);

  return { extensionSetup, isExtensionReady };
};
