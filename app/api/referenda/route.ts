import { NextResponse } from "next/server";
import { SubstrateChain } from "@/types/index";
import { getChainByName } from "@/config/chains";

export async function POST(req: Request) {
  const { chain, refId }: { chain: SubstrateChain; refId: string } =
    await req.json();
  const chainConfig = await getChainByName(chain);

  console.log("got", chain, refId);

  // let openGovRefs;

  // if (typeof refId === "undefined") {
  //   return [];
  // }

  // const { api } = chainConfig;

  // if (refId === "all") {
  //   openGovRefs = await api?.query.referenda.referendumInfoFor.entries();
  // } else if (isFinite(parseInt(refId))) {
  //   openGovRefs = await api?.query.referenda.referendumInfoFor(refId);
  //   openGovRefs = [[refId, openGovRefs]];
  // } else {
  //   return [];
  // }

  // console.log("OPENGOV refs", openGovRefs);

  return NextResponse.json({ hello: "kitty" });
}
