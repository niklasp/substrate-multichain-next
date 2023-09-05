"use client";

import { useAppStore } from "@/app/zustand";
import { useChainDetails } from "@/store/server/chain/queries";
import { Select, SelectItem } from "@nextui-org/select";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
} from "@nextui-org/dropdown";
import Identicon from "@polkadot/react-identicon";
import { Button } from "@nextui-org/button";
import { trimAddress } from "./util";
import { Key } from "react";
import UseCases from "@w3f/polkadot-icons/keyline/UseCases";
import Users from "@w3f/polkadot-icons/keyline/Users";
import { encodeAddress } from "@polkadot/keyring";

export const WalletConnect = () => {
  const selectedChain = useAppStore((state) => state.chain);
  const user = useAppStore((state) => state.user);
  const { accounts, actingAccountIdx, isExtensionReady } = user;
  const selectedAccount = accounts && accounts[actingAccountIdx];
  const setAccountIdx = useAppStore((state) => state.setAccountIdx);
  const { data: chainDetails, isLoading } = useChainDetails();
  const { ss58Prefix } = chainDetails || {};

  const handleChange = (address: Key) => {
    const accountIdx =
      accounts?.findIndex((account) => account.address === address) || 0;

    setAccountIdx(accountIdx);
  };

  return (
    <div className="max-w-xs">
      <Dropdown>
        <DropdownTrigger>
          <Button variant="bordered" size="lg" isIconOnly={true}>
            <Identicon
              value={selectedAccount?.address}
              size={30}
              theme="polkadot"
              className="hover:cursor-pointer"
              // prefix={ss58Prefix}
            />
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          variant="faded"
          aria-label="Account Select"
          onAction={handleChange}
        >
          <DropdownSection title="Accounts" showDivider>
            {user.accounts?.map((account) => (
              <DropdownItem
                key={account.address}
                value={account.address}
                description={trimAddress(
                  encodeAddress(account.address, ss58Prefix?.toNumber())
                )}
                startContent={
                  <Identicon
                    value={account.address}
                    size={30}
                    theme="polkadot"
                    className="hover:cursor-pointer"
                    // prefix={ss58Prefix}
                  />
                }
                aria-label={account.address}
              >
                {account.meta?.name || trimAddress(account.address)}
              </DropdownItem>
            ))}
          </DropdownSection>
          <DropdownSection title="Actions">
            <DropdownItem
              startContent={
                <Users width={20} height={20} stroke="currentColor" />
              }
              key={"logout"}
              value={"logout"}
              aria-label={"logout"}
            >
              Profile
            </DropdownItem>
            <DropdownItem
              startContent={
                <UseCases width={20} height={20} stroke="currentColor" />
              }
              key={"logout"}
              value={"logout"}
              aria-label={"logout"}
            >
              Logout
            </DropdownItem>
          </DropdownSection>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};
