"use client";

import React, { useState, createContext, useEffect } from "react";
import { UIReferendum, UITrack, Referendum } from "./types";
import { SubstrateChain } from "@/types";
import { useSubstrateChain } from "@/context/substrate-chain-context";
import { get } from "lodash";
import { useReferenda as useReferendaHook } from "@/hooks/vote/use-referenda";

type ReferendumContextType = {
  referenda: UIReferendum[] | undefined;
  tracks: UITrack[] | undefined;
  isLoading: boolean;
};

const ReferendaContext = createContext<ReferendumContextType | undefined>(
  undefined
);

export function ReferendaProvider({ children }: { children: React.ReactNode }) {
  const { activeChain } = useSubstrateChain();
  const { data, isLoading } = useReferendaHook(
    activeChain?.name || SubstrateChain.Kusama
  );
  const { referenda, tracks } = data || {};

  return (
    <ReferendaContext.Provider value={{ referenda, tracks, isLoading }}>
      {children}
    </ReferendaContext.Provider>
  );
}

export function useReferenda() {
  const context = React.useContext(ReferendaContext);
  if (context === undefined) {
    throw new Error("useReferenda must be used within a ReferendumProvider");
  }
  return context;
}
