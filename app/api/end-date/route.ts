import { NextResponse } from "next/server";
import { SubstrateChain } from "@/types/index";
import { getChainByName } from "@/config/chains";
import { bnToBn } from "@polkadot/util";

export async function POST(req: Request) {
  const { chain, endBlock }: { chain: SubstrateChain; endBlock: string } =
    await req.json();

  const chainConfig = await getChainByName(chain);
  const { api, blockTime, name } = chainConfig;

  if (!api) {
    return;
  }

  await api.isReady;

  const { hash, number: latestBlockNumber } =
    (await api?.rpc.chain.getHeader()) || {};

  if (!hash || !latestBlockNumber) {
    return;
  }

  const endBlockBN = bnToBn(endBlock);

  const currentBlockTimestamp = await (
    await api?.at(hash)
  )?.query.timestamp.now();

  if (!currentBlockTimestamp) {
    return;
  }

  const endBlockTimestamp = currentBlockTimestamp.add(
    endBlockBN.sub(bnToBn(latestBlockNumber)).mul(bnToBn(blockTime))
  );

  const endDate = new Date(endBlockTimestamp.toNumber());

  return NextResponse.json({ endDate });
}
