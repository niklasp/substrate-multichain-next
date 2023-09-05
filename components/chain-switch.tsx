"use client";

import { useAppStore } from "@/app/zustand";
import { SubstrateChain } from "@/types";

import { Select, SelectItem } from "@nextui-org/select";
import { PolkadotIcon } from "./icons";
import { chains } from "@/config/chains";
import clsx from "clsx";

export const ChainSwitch = ({ className }: { className?: string }) => {
  const selectedChain = useAppStore((state) => state.chain);
  const switchChain = useAppStore((state) => state.switchChain);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    switchChain(event.target.value as SubstrateChain);
  };

  return (
    <div className={clsx("items-stretch max-w-xs w-36", className)}>
      <Select
        placeholder="Select your Chain"
        className="max-w-xs"
        selectedKeys={new Set([selectedChain.name])}
        onChange={handleChange}
        size="sm"
        startContent={<selectedChain.icon />}
        aria-label="Select your Chain"
      >
        {Object.values(chains).map((chain) => (
          <SelectItem
            key={chain.name}
            value={chain.name}
            startContent={<chain.icon />}
            aria-label={chain.name}
          >
            {chain.name}
          </SelectItem>
        ))}
      </Select>
    </div>
  );
};
