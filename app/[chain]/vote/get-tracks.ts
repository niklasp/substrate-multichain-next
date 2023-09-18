import { UITrack } from "@/app/vote/types";
import { transformTrack } from "@/app/vote/util";
import { getChainByName } from "@/config/chains";
import { SubstrateChain } from "@/types";
import { cache } from "react";
import "server-only";

// revalidate once a day
export const revalidate = 86400;

export const preload = (chain: SubstrateChain) => {
  void getTracks(chain);
};

export const getTracks = cache(async (chain: SubstrateChain) => {
  const safeChain = (chain as SubstrateChain) || SubstrateChain.Kusama;
  const chainConfig = await getChainByName(safeChain);
  const { api, tracks: trackInfo } = chainConfig;

  let tracks: UITrack[] = [];

  if (typeof api === "undefined") {
    throw `can not get api of ${chain}`;
  }

  const tracksFromChain = await api?.consts.referenda.tracks;
  tracks = tracksFromChain?.map(transformTrack);
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
});
