"use client";

import { UIReferendum, UITrack } from "@/app/[chain]/vote/types";
import { useAppStore } from "@/app/zustand";
import { titleCase } from "@/components/util";
import { SubstrateChain } from "@/types";
import { Button, ButtonGroup } from "@nextui-org/button";
import Link from "next/link";
import { Key } from "react";

export function TrackFilter({
  tracks,
  referenda,
  chain,
}: {
  referenda?: UIReferendum[];
  tracks?: UITrack[];
  chain?: SubstrateChain;
}) {
  const filters = useAppStore((state) => state.filters);
  const { trackFilter } = filters;
  const setTrackFilter = useAppStore((state) => state.setTrackFilter);
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
    trackId: "all",
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

  const handleChange = (key: Key) => {
    setTrackFilter(key as string);
  };

  return (
    <div className="flex flex-col items-center">
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
              onClick={() => handleChange(track.id)}
            >
              {/* <Link href={`?trackFilter=${track.id}`}> */}
              {titleCase(track.name)}
              <span className="text-xs text-gray-500 ml-1">
                {referendaCount}
              </span>
              {/* </Link> */}
            </Button>
          );
        })}
      </ButtonGroup>
    </div>
  );
}
