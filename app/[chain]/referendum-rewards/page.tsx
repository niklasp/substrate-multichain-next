import { title } from "@/components/primitives";
import { Metadata } from "next";
import TestRewards from "./components/rewards-test";
import { DEFAULT_CHAIN } from "@/config/chains";
import { SubstrateChain } from "@/types";

export const metadata: Metadata = {
  title: "Rewards",
  description:
    "Create NFT Rewards for OpenGov Referenda on Polkadot and Kusama",
};

export default async function PageRewards({
  params: { chain },
}: {
  params: {
    chain: string;
  };
}) {
  const selectedChain = Object.values(SubstrateChain).includes(
    chain as SubstrateChain
  )
    ? (chain as SubstrateChain)
    : DEFAULT_CHAIN;

  return (
    <div>
      <h1 className={title({ siteTitle: true })}>
        Rewards
        <span className="text-lg pl-4 bg-clip-text text-transparent bg-gradient-to-tr from-purple-600 to-blue-300">
          beta
        </span>
      </h1>
      {/* {selectedChain === SubstrateChain.Polkadot ? (
        <p className="text-center w-full">
          Polkadot (Asset Hub) is not yet supported.{" "}
          <a href="#" className="text-secondary-500">
            Support our Referendum
          </a>{" "}
          to get it added.
        </p>
      ) : ( */}
      <TestRewards chain={selectedChain} />
      {/* )} */}
    </div>
  );
}
