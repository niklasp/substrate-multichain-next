import { title, subtitle } from "@/components/primitives";

import { ChainSwitch } from "@/components/chain-switch";
import { useChainDetails } from "@/store/server/chain/queries";
import { useAppStore } from "./zustand";
import { useAccountBalance } from "@/hooks/use-account-balance";
import { formatBalance } from "@polkadot/util";
import { Button } from "@nextui-org/button";
import Link from "next/link";
import { NFTSnippets } from "@/components/nft-snippets";
import { ChainLink } from "@/components/chain-link";

export default function Home() {
  // const { data: chainDetails, isLoading } = useChainDetails();
  // const user = useAppStore((state) => state.user);
  // console.log("user in home", user);
  // const { data: accountBalance, isLoading: isAccountBalanceLoading } =
  //   useAccountBalance();

  return (
    <>
      <section
        className="relative flex flex-col items-center justify-center gap-4 py-8 md:py-10"
        style={{ height: "70vh" }}
      >
        <div className="w-full max-w-4xl text-center z-10">
          <h1 className={title({ size: "lg" })}>We&nbsp;</h1>
          <h1 className={title({ color: "greenPurple", size: "lg" })}>
            incentivize
          </h1>
          <h1 className={title({ size: "lg" })}>
            &nbsp;voting on Kusama and Polkadot
          </h1>
          <h2 className={subtitle({ class: "mt-4" })}>
            Send customizable NFTs to OpenGov voters with just a few clicks.
          </h2>
          <div className="flex gap-4 justify-center mt-10 flex-wrap md:flex-nowrap">
            <Button
              size="lg"
              variant="shadow"
              className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg hover:-translate-y-0.5 w-full md:w-1/3"
            >
              <Link href="/referendum-rewards">Create Voting Rewards 🎁</Link>
            </Button>
            <Button
              size="lg"
              color="secondary"
              variant="shadow"
              className="hover:-translate-y-0.5 w-full md:w-1/3"
            >
              <ChainLink href="/vote">Vote Now →</ChainLink>
            </Button>
          </div>
        </div>
        <NFTSnippets />
      </section>
    </>
  );
}
