"use client";

import { Tooltip } from "@nextui-org/tooltip";
import { Card } from "@nextui-org/card";
import { ReactNode } from "react";
import { ReferendaStatus, UIReferendum } from "../types";
import ReferendumCountdown from "./referendum-countdown";
import { useEndDate } from "@/hooks/vote/use-end-date";
import { SubstrateChain } from "@/types";
import { useChainDetails } from "@/store/server/chain/queries";
import { Button } from "@nextui-org/button";
export default function ReferendumCountdownCard({
  chain,
  endBlock,
  referendum,
}: {
  chain: SubstrateChain;
  endBlock: string;
  referendum: UIReferendum;
}) {
  const { status, deciding, index, ongoingStatus } = referendum;
  const { data: endDate } = useEndDate(chain, endBlock);

  const info =
    ongoingStatus === "preparing"
      ? "Preparation Period ends in"
      : ongoingStatus === "deciding"
      ? "Deciding Period ends in"
      : ongoingStatus === "confirming"
      ? "Confirmation Period ends in"
      : ongoingStatus === "awaitingDecisionDeposit"
      ? "Awaiting Decision Deposit"
      : ongoingStatus === "awaitingSubmissionDeposit"
      ? "Awaiting Submission Deposit"
      : "🤔";

  return (
    <Card
      radius="sm"
      className="p-4 mb-2 text-sm bg-gray-100 dark:bg-slate-800"
      shadow="sm"
    >
      <p className="mb-2 text-md">{info}</p>
      {["preparing", "deciding", "confirming"].includes(ongoingStatus) ? (
        <ReferendumCountdown endDate={endDate} />
      ) : (
        <Button size="sm" disabled variant="shadow">
          {ongoingStatus === "awaitingDecisionDeposit"
            ? "Pay Decision Deposit"
            : "Pay Submission Deposit"}
        </Button>
      )}
    </Card>
  );
}
