"use client";

import { chain } from "lodash";
import { UIReferendum } from "../types";
import { SubstrateChain } from "@/types";
import { useReferenda } from "../referenda-context";
import { useSubstrateChain } from "@/context/substrate-chain-context";
import { ChainSwitch } from "@/components/chain-switch";
import { Skeleton } from "@nextui-org/skeleton";
import { ReferendumDetail, ReferendumDetailLoading } from "./referendum-detail";
import ReferendumTracksFilter from "./referendum-tracks-filter";
import { useState } from "react";
import { useUserVotes } from "@/hooks/vote/use-user-votes";

export const revalidate = 3600;

interface Props {
  chain: string;
}

const Loading = ({ isLoaded }: { isLoaded: boolean }) => {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <ReferendumDetailLoading key={i} isLoaded={isLoaded} />
      ))}
    </>
  );
};

export default function ReferendumList() {
  const { referenda, tracks, isLoading } = useReferenda();
  const { activeChain } = useSubstrateChain();
  const { data: userVotes, isLoading: isLoadingUserVotes } = useUserVotes(
    activeChain?.name,
    "DT7kRjGFvRKxGSx5CPUCA1pazj6gzJ6Db11xmkX4yYSNK7m"
  );

  const [trackFilter, setTrackFilter] = useState<string>("-1");

  if (isLoading) {
    return <Loading isLoaded={!isLoading} />;
  }

  // -1 = all, -2 = voted, -3 = unvoted
  const filteredReferenda =
    trackFilter === "-1"
      ? referenda
      : !["-2", "-3"].includes(trackFilter)
      ? referenda?.filter((ref) => ref.track === trackFilter)
      : referenda;

  return (
    <div className="referendum-list">
      {referenda && referenda.length > 0 ? (
        <div>
          {/* <pre>{JSON.stringify(userVotes, null, 2)}</pre> */}
          <ReferendumTracksFilter
            tracks={tracks}
            referenda={referenda}
            trackFilter={trackFilter}
            setTrackFilter={setTrackFilter}
          />
          {filteredReferenda?.map((ref) => {
            const track = tracks?.find(
              (track) => track.id.toString() === ref.track
            );
            return (
              <ReferendumDetail
                key={ref.index}
                referendum={ref}
                track={track}
                isExpanded={false}
              />
            );
          })}
        </div>
      ) : (
        <div>no referenda</div>
      )}
    </div>
  );
}
