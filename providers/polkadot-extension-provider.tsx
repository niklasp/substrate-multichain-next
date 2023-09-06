"use client";

import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  usePolkadotExtension,
  UsePolkadotExtensionReturnType,
} from "@/hooks/use-polkadot-extension";
import { useAppStore } from "@/app/zustand";

const PolkadotExtensionContext = createContext<UsePolkadotExtensionReturnType>({
  extensionSetup: () => {},
});

export const usePolkadotExtensionWithContext = () =>
  useContext(PolkadotExtensionContext);

export const PolkadotExtensionContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { extensionSetup } = usePolkadotExtension();
  const isExtensionReady = useAppStore((state) => state.user?.isExtensionReady);

  useEffect(() => {
    if (!isExtensionReady) {
      console.log("initializing the polkadot extension ", isExtensionReady);
      extensionSetup();
    }
  }, [isExtensionReady]);

  return (
    <PolkadotExtensionContext.Provider value={{ extensionSetup }}>
      {children}
    </PolkadotExtensionContext.Provider>
  );
};
