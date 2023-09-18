import { UIReferendum, UITrack } from "../../vote/types";
import { SubstrateChain } from "@/types";

import { AnimatePresence } from "framer-motion";
// import { motion } from "framer-motion";
import { ReferendumDetail } from "./referendum-detail-test";
import { TrackFilter } from "./track-filter";

interface Props {
  referenda?: UIReferendum[];
  tracks?: UITrack[];
  trackFilter?: string;
  chain: SubstrateChain;
}

export default function ReferendumList(props: Props) {
  const { referenda, tracks, trackFilter = "all", chain } = props;

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
          {/* <AnimatePresence> */}
          {filteredReferenda?.map((ref) => {
            const track = tracks?.find(
              (track) => track.id.toString() === ref.track
            );
            return (
              // <motion.div
              //   key={ref.index}
              //   initial={{ opacity: 0 }}
              //   animate={{ opacity: 1 }}
              //   exit={{ opacity: 0 }}
              //   transition={{ duration: 0.35 }}
              // >
              <ReferendumDetail
                key={ref.index}
                referendum={ref}
                track={track}
                isExpanded={false}
              />
            );
          })}
          {/* </AnimatePresence> */}
        </div>
      ) : (
        <div>no referenda</div>
      )}
    </div>
  );
}
