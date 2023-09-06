"use client";

import { useAppStore } from "@/app/zustand";
import { SubstrateChain } from "@/types";

import { Select, SelectItem } from "@nextui-org/select";
import { PolkadotIcon } from "./icons";
import { chains } from "@/config/chains";
import clsx from "clsx";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@nextui-org/dropdown";
import { Button } from "@nextui-org/button";
import { Key } from "react";

export const ChainSwitch = ({ className }: { className?: string }) => {
  const selectedChain = useAppStore((state) => state.chain);
  const switchChain = useAppStore((state) => state.switchChain);

  const handleChange = (key: Key) => {
    switchChain(key as SubstrateChain);
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
            <selectedChain.icon />
            <span className="hidden md:flex">{selectedChain.name}</span>
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
