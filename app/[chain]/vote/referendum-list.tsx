import { UIReferendum, UITrack } from "../../vote/types";
import { SubstrateChain } from "@/types";

import { AnimatePresence } from "framer-motion";
// import { motion } from "framer-motion";
import {
  ReferendumDetail,
  ReferendumDetailLoading,
} from "./referendum-detail-test";
import { TrackFilter } from "./track-filter";
import { Suspense } from "react";
import { getChainInfo } from "./get-chain-info";

interface Props {
  referenda?: UIReferendum[];
  tracks?: UITrack[];
  trackFilter?: string;
  chain: SubstrateChain;
}

export default async function ReferendumList(props: Props) {
  const { referenda, tracks, trackFilter = "all", chain } = props;

  const chainInfo = await getChainInfo(chain);
  const { symbol, decimals } = chainInfo;

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
              <Suspense
                fallback={
                  <ReferendumDetailLoading
                    referendum={ref}
                    track={track}
                    tokenSymbol={symbol}
                  />
                }
              >
                <ReferendumDetail
                  chain={chain}
                  key={ref.index}
                  referendum={ref}
                  track={track}
                  isExpanded={false}
                  chainInfo={chainInfo}
                />
              </Suspense>
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
