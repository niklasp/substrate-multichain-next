import { title } from "@/components/primitives";
import { Metadata } from "next";
import { SubstrateChain } from "@/types";
import { getChainByName } from "@/config/chains";
import { Referendum, UIReferendum } from "../types";
import {
  isConvictionVote,
  transformReferendum,
  decorateWithPolkassemblyInfo,
  transformTrack,
} from "../util";
import { bnToBn, formatBalance } from "@polkadot/util";
import { ReferendumDetail } from "./referendum-detail";

export const metadata: Metadata = {
  title: "Vote",
  description: "Vote on OpenGov Referenda on Polkadot and Kusama",
};

const getReferenda = async () => {
  const { api } = await getChainByName(SubstrateChain.Kusama);
  const openGovRefs = await api?.query.referenda.referendumInfoFor.entries();
  const referenda = openGovRefs
    ?.map(transformReferendum)
    ?.filter((ref) => ref?.status === "ongoing");

  const decoratedRefs = Promise.all(
    referenda?.map(decorateWithPolkassemblyInfo) ?? []
  );
  return decoratedRefs;
};

const getTracks = async () => {
  const { api, tracks: trackInfo } = await getChainByName(
    SubstrateChain.Kusama
  );
  const tracksFromApi = await api?.consts.referenda.tracks;
  let tracks = tracksFromApi?.map(transformTrack);
  tracks = tracks?.map((track) => {
    const info = trackInfo?.find(
      (trackInfo) => trackInfo.id.toString() === track.id.toString()
    );
    return {
      ...track,
      text: info?.text,
    };
  });
  return tracks;
};

export default async function ReferendumList() {
  const referenda = await getReferenda();
  const tracks = await getTracks();

  // console.log("tracks", tracks);

  // console.log("Referenda", referenda);

  return (
    <div className="referendum-list">
      {referenda?.map((ref) => {
        const track = tracks?.find(
          (track) => track.id.toString() === ref.track
        );
        return (
          <ReferendumDetail referendum={ref} track={track} isExpanded={false} />
        );
      })}
    </div>
  );
}
