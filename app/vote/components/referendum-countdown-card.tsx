"use client";

import { Tooltip } from "@nextui-org/tooltip";
import { Card } from "@nextui-org/card";
import { ReactNode } from "react";
import { ReferendaStatus, UIReferendum } from "../types";
import ReferendumCountdown from "./referendum-countdown";
import { useEndDate } from "@/hooks/vote/use-end-date";
import { SubstrateChain } from "@/types";
export default function ReferendumCountdownCard({
  chain,
  endBlock,
  referendum,
}: {
  chain: SubstrateChain;
  endBlock: string;
  referendum: UIReferendum;
}) {
  const { status, deciding, index } = referendum;
  const { data: endDate } = useEndDate(chain, endBlock);

  console.log("endDate", endDate);

  const isConfirming = status === "ongoing" && !!deciding?.confirming;

  return (
    <Card
      radius="sm"
      className="p-4 mb-2 text-sm bg-gray-100 dark:bg-slate-800"
      shadow="sm"
    >
      <Tooltip
        content={
          "If the referendum does not enter the confirming state, it will automatically be rejected"
        }
        placement="bottom"
      >
        <h3 className="mb-2 text-md">
          {`Referendum ${index} will be ${
            isConfirming ? "confirmed" : "decided"
          } in`}
        </h3>
      </Tooltip>
      <ReferendumCountdown endDate={endDate} />
    </Card>
  );
}
