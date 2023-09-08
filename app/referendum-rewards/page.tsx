import { title } from "@/components/primitives";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rewards",
  description:
    "Create NFT Rewards for OpenGov Referenda on Polkadot and Kusama",
};

export default function DocsPage() {
  return (
    <div>
      <h1 className={title({ siteTitle: true })}>Rewards</h1>
    </div>
  );
}
