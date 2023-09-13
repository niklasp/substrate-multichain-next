"use client";

import { chain } from "lodash";
import { UIReferendum } from "../types";
import { SubstrateChain } from "@/types";
import { useReferenda } from "../referenda-context";
import { useSubstrateChain } from "@/context/substrate-chain-context";
import { ChainSwitch } from "@/components/chain-switch";
import { Skeleton } from "@nextui-org/skeleton";
import { ReferendumDetail, ReferendumDetailLoading } from "./referendum-detail";

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

  if (isLoading) {
    return <Loading isLoaded={!isLoading} />;
  }

  return (
    <div className="referendum-list">
      {referenda && referenda.length > 0 ? (
        <div>
          {referenda?.map((ref) => {
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
