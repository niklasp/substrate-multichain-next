"use client";

import { chain } from "lodash";
import { UIReferendum, UITrack } from "../../vote/types";
import { SubstrateChain } from "@/types";
import { useSubstrateChain } from "@/context/substrate-chain-context";
import { ChainSwitch } from "@/components/chain-switch";
import { Skeleton } from "@nextui-org/skeleton";

import { useState } from "react";
import { useUserVotes } from "@/hooks/vote/use-user-votes";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import { useReferenda } from "@/hooks/vote/use-referenda";
import { ReferendumDetail } from "./referendum-detail-test";
import { TrackFilter } from "./track-filter";

interface Props {
  referenda?: UIReferendum[];
  tracks?: UITrack[];
  trackFilter?: string;
}

export default function ReferendumList(props: Props) {
  const { referenda, tracks, trackFilter = "all" } = props;

  //   const [trackFilter, setTrackFilter] = useState<string>("-1");

  // -1 = all, -2 = voted, -3 = unvoted
  const filteredReferenda =
    trackFilter === "all"
      ? referenda
      : trackFilter !== "voted" && trackFilter !== "unvoted"
      ? referenda?.filter((ref) => ref.track === trackFilter)
      : //TODO
        referenda;

  return (
    <div className="referendum-list">
      {referenda && referenda.length > 0 ? (
        <div>
          {/* <pre>{JSON.stringify(userVotes, null, 2)}</pre> */}
          <TrackFilter
            tracks={tracks}
            referenda={referenda}
            trackFilter={trackFilter}
          />
          <AnimatePresence>
            {filteredReferenda?.map((ref) => {
              const track = tracks?.find(
                (track) => track.id.toString() === ref.track
              );
              return (
                <motion.div
                  key={ref.index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <ReferendumDetail
                    referendum={ref}
                    track={track}
                    isExpanded={false}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div>no referenda</div>
      )}
    </div>
  );
}
