import { title } from "@/components/primitives";
import { Metadata } from "next";
import TestRewards from "./components/rewards-test";

export const metadata: Metadata = {
  title: "Rewards",
  description:
    "Create NFT Rewards for OpenGov Referenda on Polkadot and Kusama",
};

export default function DocsPage() {
  return (
    <div>
      <h1 className={title({ siteTitle: true })}>
        Rewards
        <span className="text-lg pl-4 bg-clip-text text-transparent bg-gradient-to-tr from-purple-600 to-blue-300">
          beta
        </span>
      </h1>
      <TestRewards />
    </div>
  );
}
