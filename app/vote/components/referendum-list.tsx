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
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Vote",
  description: "Vote on OpenGov Referenda on Polkadot and Kusama",
};

const getReferenda = async () => {
  let selectedChain = "kusama";

  const cookieStore = cookies();
  if (cookieStore.has("chain")) {
    const value = cookieStore.get("chain")?.value;
    if (value && Object.values(SubstrateChain).includes(value as any)) {
      selectedChain = value;
    }
  }

  console.log("selected chain is", selectedChain);
  const { api } = await getChainByName(selectedChain as SubstrateChain);
  const openGovRefs = await api?.query.referenda.referendumInfoFor.entries();
  const referenda = openGovRefs
    ?.map(transformReferendum)
    ?.filter((ref) => ref?.status === "ongoing");

  return referenda;

  // const decoratedRefs = Promise.all(
  //   referenda?.map((ref) =>
  //     decorateWithPolkassemblyInfo(ref, selectedChain as SubstrateChain)
  //   ) ?? []
  // );
  // return decoratedRefs;
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
