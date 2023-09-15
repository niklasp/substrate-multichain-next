import { Button, ButtonGroup } from "@nextui-org/button";
import { Radio } from "@nextui-org/radio";
import { RadioGroup } from "@nextui-org/radio";
import { UIReferendum, UITrack } from "../types";
import { titleCase } from "../../../components/util";

export default function ReferendumTracksFilter({
  tracks,
  referenda,
  trackFilter,
  setTrackFilter,
}: {
  tracks: UITrack[] | undefined;
  referenda: UIReferendum[] | undefined;
  trackFilter: string;
  setTrackFilter: (track: string) => void;
}) {
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
    { id: -1, name: "all", text: "All" },
    ...(distinctTracks || []),
    { id: -2, name: "voted", text: "Voted" },
    { id: -3, name: "unvoted", text: "Unvoted" },
  ];

  return (
    <div className="flex flex-col items-start">
      <span className="text-sm">Filter Referenda</span>
      <ButtonGroup radius="sm" size="sm" className="mt-1" variant="flat">
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
              onClick={() => setTrackFilter(track.id.toString())}
            >
              {titleCase(track.name)}
              <span className="text-xs text-gray-500">{referendaCount}</span>
            </Button>
          );
        })}
      </ButtonGroup>
    </div>
  );
}
