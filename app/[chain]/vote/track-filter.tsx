import { UIReferendum, UITrack } from "@/app/vote/types";
import { titleCase } from "@/components/util";
import { SubstrateChain } from "@/types";
import { Button, ButtonGroup } from "@nextui-org/button";
import Link from "next/link";

export function TrackFilter({
  trackFilter,
  tracks,
  referenda,
  chain,
}: {
  trackFilter: string;
  referenda?: UIReferendum[];
  tracks?: UITrack[];
  chain?: SubstrateChain;
}) {
  const safeChain = chain || SubstrateChain.Kusama;

  // get the count of referenda for each track
  const referendaCountPerTrack = tracks?.map((track) => {
    const count = referenda?.filter(
      (ref) => ref.track === track.id.toString()
    ).length;
    return { trackId: track.id, count };
  });

  const totalCount = referenda?.length;

  referendaCountPerTrack?.push({
    trackId: "-1",
    count: totalCount,
  });

  const distinctReferendaTrackIds = referenda
    ?.map((ref) => ref.track)
    .filter((value, index, self) => self.indexOf(value) === index);

  const distinctTracks = tracks?.filter((track) =>
    distinctReferendaTrackIds?.includes(track.id.toString())
  );

  // we add a new track called "all" to the tracks array and some trakcks for filtereing voted and unvoted referenda
  const moreTracks = [
    { id: "all", name: "all", text: "All" },
    ...(distinctTracks || []),
    { id: "voted", name: "voted", text: "Voted" },
    { id: "unvoted", name: "unvoted", text: "Unvoted" },
  ];

  return (
    <div className="flex flex-col items-start">
      <span className="text-sm">Filter Referenda</span>
      <ButtonGroup
        radius="sm"
        size="sm"
        className="mt-1 flex-wrap justify-start"
        variant="flat"
      >
        {moreTracks?.map((track) => {
          const referendaCount = referendaCountPerTrack?.find(
            (item) => item.trackId === track.id.toString()
          )?.count;
          return (
            <Button
              key={track.id}
              radius="sm"
              color={
                trackFilter === track.id.toString() ? "primary" : "default"
              }
            >
              <Link href={`/${safeChain}/vote/${track.id}`}>
                {titleCase(track.name)}
                <span className="text-xs text-gray-500 ml-2">
                  {referendaCount}
                </span>
              </Link>
            </Button>
          );
        })}
      </ButtonGroup>
    </div>
  );
}
