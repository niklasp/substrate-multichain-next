"use client";

import { title, subtitle } from "@/components/primitives";

import { ChainSwitch } from "@/components/chain-switch";
import { useChainDetails } from "@/store/server/chain/queries";
import { useAppStore } from "./zustand";
import { useAccountBalance } from "@/hooks/use-account-balance";
import { formatBalance } from "@polkadot/util";
import { Button } from "@nextui-org/button";
import Link from "next/link";
import { NFTSnippets } from "@/components/nft-snippets";
import { usePolkadotExtension } from "@/providers/polkadot-extension-provider";

export default function Home() {
  // const { data: chainDetails, isLoading } = useChainDetails();
  // const user = useAppStore((state) => state.user);
  // console.log("user in home", user);
  // const { data: accountBalance, isLoading: isAccountBalanceLoading } =
  //   useAccountBalance();

  const { connect, disconnect } = usePolkadotExtension();

  return (
    <>
      <section
        className="relative flex flex-col items-center justify-center gap-4 py-8 md:py-10"
        style={{ height: "70vh" }}
      >
        <p className="font-bold text-3xl">
          <span className="border-4 border-pink-500 py-2 px-5 rounded-full">
            1
          </span>{" "}
          connect / disconnect flow
        </p>
        <p className="text-tiny">
          Connection a wallet browser extension to your site
        </p>
        <ol className="list-outside text-tiny list-decimal text-left max-w-xl">
          <li>
            Do not ask the user to connect to the site without any user action.
          </li>
          <li>
            The user can browse the site without connecting their browser
            extension.
          </li>
          <li>
            Do not ask again on any subsequent visit after once connected.
          </li>
          <li>
            Let the user disconnect the browser extension from accessing the
            site.
          </li>
        </ol>
        <div className="flex gap-2 mt-4">
          <Button variant="bordered" color="success" onClick={connect}>
            connect
          </Button>
          <Button variant="bordered" color="danger" onClick={disconnect}>
            disconnect
          </Button>
        </div>
      </section>
    </>
  );
}
