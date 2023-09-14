import { Tooltip } from "@nextui-org/tooltip";
import { ReactNode } from "react";
import { ReferendaStatus, UIReferendum } from "../types";
import ReferendumCountdown from "./referendum-countdown";
export default function ReferendumCountdownCard({
  endDate,
  referendum,
}: {
  endDate: Date | undefined;
  referendum: UIReferendum;
}) {
  const { status, deciding, origin, index } = referendum;
  const isConfirming = status === "ongoing" && !!deciding?.confirming;

  return (
    <div className="referendum-countdown-card p-4 bg-gray-100 dark:bg-slate-800 rounded-sm mb-2 shadow-sm hover:shadow-md dark:shadow-gray-800 transition-shadow text-sm">
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
    </div>
  );
}
