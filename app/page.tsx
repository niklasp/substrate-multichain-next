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
import { LinkIcon } from "@nextui-org/link";

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
              color="secondary"
              variant="shadow"
              className="hover:-translate-y-0.5 w-full md:w-1/3"
            >
              <ChainLink href="/vote">Vote Now →</ChainLink>
            </Button>
            <Button
              size="lg"
              variant="shadow"
              className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg hover:-translate-y-0.5 w-full md:w-1/3"
            >
              <ChainLink href="/referendum-rewards">
                Create Voting Rewards 🎁
              </ChainLink>
            </Button>
          </div>
        </div>
        <NFTSnippets />
      </section>
      <section
        className="relative flex flex-col items-center justify-center gap-4 py-8 md:py-10"
        style={{ height: "70vh" }}
      >
        <h2 className="font-bold text-gray-500 tracking-wide">NUMBERS</h2>
        <div className="w-full text-center flex flex-wrap md:flex-nowrap gap-4 max-w-5xl ">
          <div className="w-full md:w-1/3 bg-slate-100 dark:bg-slate-900 p-4 rounded-md">
            <p className="pb-3">NFTs sent</p>
            <span className="text-2xl">74,395</span>
          </div>
          <div className="w-full md:w-1/3 bg-slate-100 dark:bg-slate-900 p-4 rounded-md">
            <p className="pb-3">Unique Holders</p>
            <span className="text-2xl">2,868 </span>
          </div>
          <div className="w-full md:w-1/3 bg-slate-100 dark:bg-slate-900 p-4 rounded-md">
            <p className="pb-3">Total Trade Volume</p>
            <span className="text-2xl">876.2 KSM</span>
          </div>
        </div>
      </section>
      <section className="relative flex flex-col items-center justify-center">
        <div className="flex flex-col md:flex-row max-w-5xl">
          <div className="w-1/3 flex justify-center p-4">
            <h3 className="text-3xl font-bold leading-7">Our mission</h3>
          </div>
          <div className="w-full mt-5 md:mt-0 md:w-2/3 p-4">
            <p className="text-base font-normal ">
              Through increased participation in our governance systems, we are
              making the network more secure and resilient to attacks. We have
              designed a system that incentivises token holders to participate
              in governance.
            </p>
            <Link href="/about">
              <Button color="primary" className="mt-4">
                Read more →
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
