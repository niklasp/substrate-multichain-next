"use client";

import { Button } from "@nextui-org/button";
import { ChangeEvent, Key } from "react";
import { Intro } from "@/components/intro";
import { AnotherComponent } from "@/components/another-compoonent";
import { usePolkadotExtension } from "@/providers/polkadot-extension-provider";

export default function Home() {
  const trimAddress = (address: string, amount: number = 3) => {
    if (!address) {
      return "";
    }
    return `${address.slice(0, amount)}...${address.slice(-amount)}`;
  };

  const {
    connect,
    disconnect,
    accounts,
    setSelectedAccountIndex,
    isExtensionReady,
  } = usePolkadotExtension();

  const onSelectAccount = (e: ChangeEvent<HTMLSelectElement>) => {
    const accountIdx = e.target.selectedIndex;
    setSelectedAccountIndex(accountIdx);
  };

  return (
    <>
      <section
        className="relative flex flex-col items-center gap-4 py-8 md:py-10"
        style={{ minHeight: "70vh" }}
      >
        <Intro />
        <div className="flex gap-2 mt-4">
          {accounts && accounts.length ? (
            <Button variant="bordered" color="danger" onClick={disconnect}>
              disconnect
            </Button>
          ) : (
            <Button variant="bordered" color="success" onClick={connect}>
              connect
            </Button>
          )}
        </div>
        {accounts && accounts.length > 0 && (
          <select
            id="select-polkadot-account"
            className="p-3 m-3"
            onChange={onSelectAccount}
          >
            {accounts?.map((acc, idx) => (
              <option key={idx} value={idx}>
                {trimAddress(acc.address)} [{acc.meta.name}]
              </option>
            ))}
          </select>
        )}
        <AnotherComponent />
      </section>
    </>
  );
}
