import { NextApiRequest, NextApiResponse } from "next";
import { mergeWithDefaultConfig, setupPinata } from "../rewards/util";
import { createConfigNFT } from "@/app/[chain]/referendum-rewards/util";
import { NextRequest, NextResponse } from "next/server";
import { SendAndFinalizeResult, SubstrateChain } from "@/types";
import { DEFAULT_CHAIN, getChainInfo } from "@/config/chains";

type CreateConfigNFTResult = {
  data: SendAndFinalizeResult;
};

export async function POST(req: NextRequest) {
  const res = NextResponse<CreateConfigNFTResult>;
  try {
    const config = await req.json();
    const selectedChain = (config.chain as SubstrateChain) || DEFAULT_CHAIN;
    const selectedChainConfig = getChainInfo(selectedChain);
    const apiPinata = await setupPinata();

    const newConfig = mergeWithDefaultConfig(config);
    const result = await createConfigNFT(
      selectedChainConfig,
      apiPinata,
      newConfig
    );

    // TODO make this secure, by checking that the txs on chain were really those we gave the user
    console.log("create-confing-nft result", result);
    res.json({
      result,
    });
  } catch (error) {
    console.error(error);
    res.json({ error: "Invalid JSON", message: error });
  }
}
