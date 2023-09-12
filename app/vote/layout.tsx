import { SubstrateChain } from "@/types";
import { cookies } from "next/headers";

export default function VoteLayout({
  children,
}: // votePolkadot,
// voteKusama,
{
  children: React.ReactNode;
  // voteKusama: React.ReactNode;
  // votePolkadot: React.ReactNode;
}) {
  let selectedChain = "kusama";

  const cookieStore = cookies();
  if (cookieStore.has("chain")) {
    const value = cookieStore.get("chain")?.value;
    if (value && Object.values(SubstrateChain).includes(value as any)) {
      selectedChain = value;
    }
  }

  // return selectedChain === SubstrateChain.Kusama ? voteKusama : votePolkadot;
  return children;
}
