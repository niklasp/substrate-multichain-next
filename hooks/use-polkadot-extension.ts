import {
  InjectedAccountWithMeta,
  InjectedExtension,
} from "@polkadot/extension-inject/types";
import { useEffect, useState } from "react";
import { documentReadyPromise } from "./utils";
import { useAppStore } from "@/app/zustand";

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

    const injectedPromise = documentReadyPromise(() =>
      web3Enable(process.env.NEXT_PUBLIC_APP_NAME || "Polkadot Multi Chain App")
    );

    const browserExtensions = await injectedPromise;
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
      // note that `web3AccountsSubscribe` returns the function to unsubscribe
      unsubscribe = await web3AccountsSubscribe((injectedAccounts) => {
        console.log("accounts", injectedAccounts);
        setAccounts(injectedAccounts);
      });

      return () => unsubscribe && unsubscribe();
    }
  };

  return { extensionSetup, isExtensionReady, disconnect };
};

// export const usePolkadotExtension = (): UsePolkadotExtensionReturnType => {
//   const [isReady, setIsReady] = useState(false);
//   const [accounts, setAccounts] = useState<InjectedAccountWithMeta[] | null>(
//     null
//   );
//   const [extensions, setExtensions] = useState<InjectedExtension[] | null>(
//     null
//   );
//   const [actingAccountIdx, setActingAccountIdx] = useState<number>(0);
//   const [error, setError] = useState<Error | null>(null);
//   const [injector, setInjector] = useState<InjectedExtension | null>(null);

//   const actingAccount = accounts && accounts[actingAccountIdx];

//   useEffect(() => {
//     // This effect is used to setup the browser extension
//     const extensionSetup = async () => {
//       const extensionDapp = await import("@polkadot/extension-dapp");
//       const { web3AccountsSubscribe, web3Enable } = extensionDapp;

//       const injectedPromise = documentReadyPromise(() =>
//         web3Enable("Polkadot Tokengated Website Demo")
//       );
//       const extensions = await injectedPromise;

//       setExtensions(extensions);

//       if (extensions.length === 0) {
//         console.log("no extension");
//         return;
//       }

//       if (accounts) {
//         setIsReady(true);
//       } else {
//         let unsubscribe: () => void;

//         // we subscribe to any account change
//         // note that `web3AccountsSubscribe` returns the function to unsubscribe
//         unsubscribe = await web3AccountsSubscribe((injectedAccounts) => {
//           setAccounts(injectedAccounts);
//         });

//         return () => unsubscribe && unsubscribe();
//       }
//     };

//     if (!isReady) {
//       extensionSetup();
//     }
//   }, [extensions]);

//   useEffect(() => {
//     // This effect is used to get the injector from the selected account
//     // and is triggered when the accounts or the actingAccountIdx change
//     const getInjector = async () => {
//       const { web3FromSource } = await import("@polkadot/extension-dapp");
//       const actingAccount =
//         accounts && actingAccountIdx !== undefined
//           ? accounts[actingAccountIdx]
//           : undefined;
//       if (actingAccount?.meta.source) {
//         try {
//           const injector = await web3FromSource(actingAccount?.meta.source);
//           setInjector(injector);
//         } catch (e: any) {
//           setError(e);
//         }
//       }
//     };

//     getInjector();
//   }, [actingAccountIdx, accounts]);

//   return {
//     accounts,
//     actingAccount,
//     setActingAccountIdx,
//     isReady,
//     error,
//     injector,
//   };
// };
