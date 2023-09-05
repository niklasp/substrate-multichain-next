"use client";
import { useAppStore } from "@/app/zustand";
import { ChainConfig, SubstrateChain } from "@/types";
import { ApiPromise } from "@polkadot/api";
import { useQuery } from "react-query";

const getChainDetails = async (api: ApiPromise) => {
  const [chain, nodeName, nodeVersion, chainType, ss58Prefix, chainProperties] =
    await Promise.all([
      api.rpc.system.chain(),
      api.rpc.system.name(),
      api.rpc.system.version(),
      api.rpc.system.chainType(),
      api.consts.system.ss58Prefix,
      api.registry.getChainProperties(),
    ]);
  return {
    chain,
    nodeName,
    nodeVersion,
    chainType,
    ss58Prefix,
    chainProperties,
  };
};

export const useChainDetails = () => {
  const selectedChain = useAppStore((state) => state.chain);
  return useQuery(["chainDetails", selectedChain.name], async () => {
    if (selectedChain.api) {
      return getChainDetails(selectedChain.api);
    } else {
      throw new Error("api not ready");
    }
  });
};
