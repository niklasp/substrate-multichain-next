"use client";

import { useAppStore } from "@/app/zustand";
import { ChainConfig, SubstrateChain } from "@/types";
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
import { useSubstrateChain } from "@/context/substrate-chain-context";
import { usePathname, useRouter } from "next/navigation";
import path from "path";
import { CHAINS_ENABLED } from "@/config/chains";

export const ChainSwitch = ({ className }: { className?: string }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { activeChain, setActiveChainName, isConnecting } = useSubstrateChain();

  const pathContainsSubstrateChain = Object.values(SubstrateChain).some(
    (chain) => pathname.includes(`/${chain}/`)
  );

  const selectedChain = Object.values(SubstrateChain).find((substrateChain) =>
    pathname.includes(`/${substrateChain}/`)
  );

  useEffect(() => {
    if (selectedChain) {
      setActiveChainName(selectedChain);
    }
  }, [selectedChain]);

  const handleChainChange = (key: Key) => {
    console.log(
      "handleChainChange",
      key,
      pathname,
      pathContainsSubstrateChain,
      selectedChain
    );
    const newChain = key as SubstrateChain;

    if (pathContainsSubstrateChain) {
      // find selected chain from pathname that can contain any SubstrateChain

      if (selectedChain) {
        const newPathname = pathname.replace(
          `/${selectedChain}/`,
          `/${newChain}/`
        );
        setActiveChainName(newChain);
        router.replace(newPathname);
      }
    }
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
            {isConnecting || typeof activeChain === "undefined" ? (
              <span className="text-xs flex items-center">
                <Spinner size="sm" color="secondary" className="mr-2" />
                ...
              </span>
            ) : (
              <activeChain.icon />
            )}
            <span className="hidden md:flex">{activeChain?.name}</span>
          </Button>
        </DropdownTrigger>
        <DropdownMenu onAction={handleChainChange} aria-label="Select Chain">
          {Object.values(CHAINS_ENABLED).map((chain) => (
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
