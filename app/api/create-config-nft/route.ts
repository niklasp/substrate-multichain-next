import { NextApiRequest, NextApiResponse } from "next";
import { setupPinata } from "../rewards/util";
import { NextRequest, NextResponse } from "next/server";
import { SendAndFinalizeResult, SubstrateChain } from "@/types";
import { DEFAULT_CHAIN, getChainInfo } from "@/config/chains";
import { createConfigNFT } from "@/components/util-server";
import { mergeWithDefaultConfig } from "@/components/util";

type CreateConfigNFTResult = {
  data: SendAndFinalizeResult;
};

export async function POST(req: NextRequest) {
  const res = NextResponse<CreateConfigNFTResult>;
  try {
    const config = await req.json();
    const selectedChain = (config.chain as SubstrateChain) || DEFAULT_CHAIN;
    const selectedChainConfig = getChainInfo(selectedChain);

    console.info(
      `🌄 Creating Config NFT for successful sendout on ${selectedChain}`
    );
    const apiPinata = await setupPinata();

    const newConfig = mergeWithDefaultConfig(config);
    const result = await createConfigNFT(
      selectedChainConfig,
      apiPinata,
      newConfig
    );

    // TODO make this secure, by checking that the txs on chain were really those we gave the user
    console.log("create-config-nft result", result);
    return res.json({
      result,
    });
  } catch (error) {
    console.error(error);
    return res.json({ error: "Invalid JSON", message: error });
  }
}
