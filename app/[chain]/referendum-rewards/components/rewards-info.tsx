"use client";

import { useSubstrateChain } from "@/context/substrate-chain-context";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Link, LinkIcon } from "@nextui-org/link";
import { titleCase } from "../../../../components/util";

export function RewardsInfo() {
  const { activeChain } = useSubstrateChain();
  const { icon } = activeChain || {};
  return (
    <Card className="border border-2 border-secondary text-tiny mb-8 items-center align-center text-center">
      <CardBody className="flex-none inline text-center">
        NFTs will be minted on{" "}
        <span className="text-warning">
          {titleCase(activeChain?.name)}&nbsp;Asset Hub
        </span>
        , so fees are also payed on Asset Hub, make sure you understand and have
        enough funds.
      </CardBody>
    </Card>
  );
}
