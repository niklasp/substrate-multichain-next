import { titleCase } from "@/components/util";
import { UIReferendum, UITrack } from "../types";
import { Tooltip } from "@nextui-org/tooltip";

export const ReferendumBadges = ({
  referendum,
  track,
  confirmingPercentage,
  decidingPercentage,
}: {
  referendum: UIReferendum;
  track: UITrack | undefined;
  confirmingPercentage: number;
  decidingPercentage: number;
}) => {
  const { status, deciding, origin } = referendum;

  const isConfirming = status === "ongoing" && deciding?.confirming;

  let percentage = isConfirming ? confirmingPercentage : decidingPercentage;
  const fromColor = status === "ongoing" ? "#86EFAC" : "#facc15";
  const toColor = status === "ongoing" ? "#4ade80" : "#eab308";
  const statusBadgeBg = `linear-gradient(90deg, ${fromColor} 0%, ${fromColor} ${
    percentage * 100
  }%, ${toColor} ${percentage * 100}%, ${toColor} 100%)`;

  return (
    <div className="referendum-badges mb-2 flex transition-none text-black">
      {track && (origin?.origins || track.id === "0") && (
        <Tooltip content={track.text}>
          <div className="text-sm bg-gray-200 py-1 px-2 rounded-sm flex-1 cursor-default mr-2 flex items-center justify-center">
            {track.id === "0" ? "Root" : titleCase(origin.origins)}
          </div>
        </Tooltip>
      )}
      <Tooltip
        content={`${(percentage * 100).toFixed(2)}% of the ${
          isConfirming ? "confirming" : "deciding"
        } period has passed`}
      >
        <div
          className="text-sm py-1 px-2 rounded-sm flex-1 cursor-default flex items-center justify-center"
          style={{ background: statusBadgeBg }}
        >
          {status === "ongoing"
            ? isConfirming
              ? "confirming"
              : "deciding"
            : status}
        </div>
      </Tooltip>
    </div>
  );
};
