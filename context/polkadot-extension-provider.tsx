"use client";

import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  usePolkadotExtension,
  UsePolkadotExtensionReturnType,
} from "@/hooks/use-polkadot-extension";
import { useAppStore } from "@/app/zustand";

const PolkadotExtensionContext = createContext<UsePolkadotExtensionReturnType>({
  extensionSetup: () => {},
  isExtensionReady: false,
});

export const usePolkadotExtensionWithContext = () =>
  useContext(PolkadotExtensionContext);

export const PolkadotExtensionContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { extensionSetup, isExtensionReady } = usePolkadotExtension();

  return (
    <PolkadotExtensionContext.Provider
      value={{ extensionSetup, isExtensionReady }}
    >
      {children}
    </PolkadotExtensionContext.Provider>
  );
};
