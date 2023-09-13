"use client";

import { useAppStore } from "@/app/zustand";
import { ChainConfig, SubstrateChain } from "@/types";
import { chains } from "@/config/chains";
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

export const ChainSwitch = ({ className }: { className?: string }) => {
  const { activeChain, setActiveChainName, isConnecting } = useSubstrateChain();

  const handleChange = async (key: Key) => {
    setActiveChainName(key as SubstrateChain);
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
              <>
                <Spinner size="sm" color="secondary" />
                connecting
              </>
            ) : (
              <activeChain.icon />
            )}
            <span className="hidden md:flex">{activeChain?.name}</span>
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
