"use client";

import { title } from "@/components/primitives";
import { SubstrateChain } from "@/types";
import { cache } from "react";
import { Metadata } from "next";
import { Button } from "@nextui-org/button";
import { useSubstrateChain } from "@/context/substrate-chain-context";
import { ApiPromise } from "@polkadot/api";

export const revalidate = 3600;

// const fetchApi = async () => {
//   const res = await fetch("/api/polkadot", {
//     method: "post",
//     body: JSON.stringify({ chain: SubstrateChain.Kusama }),
//   });
//   const result = await res.json();
//   console.log("Result from api ", result);
// };

// const getAccountBalance = cache(
//   async (address: string, chain: SubstrateChain) => {
//     const res = await fetch("/api/account-balance", {
//       method: "post",
//       body: JSON.stringify({
//         address,
//         chain,
//       }),
//     });

//     const result = await res.json();
//     console.log("Result from api ", result);
//   }
// );

// export const metadata: Metadata = {
//   title: "NFTs",
// };

export default function NFTPage() {
  const { activeChain } = useSubstrateChain();

  function apiDisconnect(api: ApiPromise | undefined) {
    console.log("disconnecting api");
    api?.disconnect();
  }

  return (
    <div>
      <h1 className={title({ siteTitle: true })}>NFTs</h1>
      <p className="text-center text-4xl">🔧</p>
      <p className="text-center py-8 px-4">
        The NFT page is currently under construction as we are preparing the
        transition from RMRK NFTs to nft pallet NFTs
      </p>
      <p className="text-center text-4xl">🔥</p>

      <Button onClick={() => apiDisconnect(activeChain?.api)}>
        disconnect api
      </Button>
    </div>
  );
}
