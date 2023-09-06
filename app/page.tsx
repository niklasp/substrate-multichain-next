"use client";

import { title, subtitle } from "@/components/primitives";

import { ChainSwitch } from "@/components/chain-switch";
import { useChainDetails } from "@/store/server/chain/queries";
import { useAppStore } from "./zustand";
import { useAccountBalance } from "@/hooks/use-account-balance";
import { formatBalance } from "@polkadot/util";

export default function Home() {
  const { data: chainDetails, isLoading } = useChainDetails();
  const user = useAppStore((state) => state.user);
  const { data: accountBalance } = useAccountBalance();

  if (isLoading) return <div>Loading...</div>;

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-lg text-center justify-center">
        <h1 className={title()}>Make&nbsp;</h1>
        <h1 className={title({ color: "violet" })}>beautiful&nbsp;</h1>
        <br />
        <h1 className={title()}>
          websites regardless of your design experience.
        </h1>
        <h2 className={subtitle({ class: "mt-4" })}>
          Beautiful, fast and modern React UI library.
        </h2>
      </div>
      <div className="text-xs">
        Free Account Balance:{" "}
        {formatBalance(accountBalance?.data?.free, {
          decimals: 12,
          forceUnit: "-",
          withSi: true,
          withUnit: chainDetails?.chainProperties?.tokenSymbol,
        })}
      </div>
      <div className="items-stretch max-w-lg w-full">
        <p>Api connected to:</p>
        <pre className="text-xs">{JSON.stringify(chainDetails, null, 2)}</pre>
      </div>
      <div className="items-stretch max-w-lg w-full">
        <p>User:</p>
        <pre className="text-xs">{JSON.stringify(user, null, 2)}</pre>
      </div>
    </section>
  );
}
