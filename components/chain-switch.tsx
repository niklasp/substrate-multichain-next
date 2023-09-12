"use client";

import { useAppStore } from "@/app/zustand";
import { ChainConfig, SubstrateChain } from "@/types";
import { chains, getChainByName } from "@/config/chains";
import clsx from "clsx";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@nextui-org/dropdown";
import { Spinner } from "@nextui-org/spinner";
import { Button } from "@nextui-org/button";
import { Key, useEffect, useState, useTransition } from "react";
import { cookies } from "next/headers";
import { storeChain } from "@/app/vote/server-actions/switch-chain";
import { getChain } from "@/app/vote/server-actions/get-chain";
import { usePathname, useRouter } from "next/navigation";

//TODO init chain from server
export const ChainSwitch = ({ className }: { className?: string }) => {
  const [selectedChainConfig, setSelectedChainConfig] = useState<ChainConfig>();
  // const [isPending, startTransition] = useTransition();
  const [isChainApiLoading, setIsChainApiLoading] = useState<boolean>(false);

  const pathname = usePathname();
  const router = useRouter();

  const handleChange = async (key: Key) => {
    console.log(
      "pathname",
      pathname,
      selectedChainConfig?.name?.toLowerCase() as string,
      key as string
    );
    const newPath = pathname.replace(
      selectedChainConfig?.name?.toLowerCase() as string,
      key as string
    );
    console.log("newPath", newPath);
    router.push(newPath);
    setIsChainApiLoading(true);
    // const switched = await switchChain(key as SubstrateChain);
    // startTransition(() => {
    //   storeChain(key as SubstrateChain);
    // });
    const chainConfig = await getChainByName(key as SubstrateChain);
    setSelectedChainConfig(chainConfig);
    setIsChainApiLoading(false);
  };

  return (
    <div className={className}>
      <Dropdown
        placeholder="Select your Chain"
        className="md:max-w-xs"
        size="sm"
      >
        <DropdownTrigger>
          <Button
            variant="bordered"
            size="lg"
            isIconOnly={false}
            className="min-w-unit-12 px-unit-1 md:px-unit-4"
          >
            {isChainApiLoading || typeof selectedChainConfig === "undefined" ? (
              <Spinner size="sm" color="secondary" />
            ) : (
              <selectedChainConfig.icon />
            )}
            <span className="hidden md:flex">{selectedChainConfig?.name}</span>
          </Button>
        </DropdownTrigger>
        <DropdownMenu onAction={handleChange} aria-label="Select Chain">
          {Object.values(chains).map((chain) => (
            <DropdownItem
              key={chain.name}
              value={chain.name}
              startContent={<chain.icon />}
            >
              {chain.name}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};
