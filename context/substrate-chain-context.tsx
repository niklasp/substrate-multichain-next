"use client";

import React, { useState, useEffect, createContext } from "react";
import { ChainConfig, SubstrateChain } from "../types/index";
import { useSubstrateChain as useSubstrateChainHook } from "@/hooks/use-substrate-chain";

type SubstrateChainContextType = {
  activeChain: ChainConfig | undefined;
  setActiveChainName: React.Dispatch<React.SetStateAction<SubstrateChain>>;
  isConnecting: boolean;
};

const SubstrateChainContext = createContext<
  SubstrateChainContextType | undefined
>(undefined);

export function SubstrateChainProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeChainName, setActiveChainName] = useState<SubstrateChain>(
    SubstrateChain.Kusama
  );

  const { data: chainConfig, isLoading } =
    useSubstrateChainHook(activeChainName);

  return (
    <SubstrateChainContext.Provider
      value={{
        activeChain: chainConfig,
        setActiveChainName,
        isConnecting: isLoading,
      }}
    >
      {children}
    </SubstrateChainContext.Provider>
  );
}

export function useSubstrateChain() {
  const context = React.useContext(SubstrateChainContext);
  if (context === undefined) {
    throw new Error(
      "useSubstrateChain must be used within a SubstrateChainProvider"
    );
  }
  return context;
}
