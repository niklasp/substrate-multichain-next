"use client";

import Image from "@/components/image-fade";
import { sampleSize } from "lodash";
import clsx from "clsx";
import { websiteConfig } from "@/data/website-config";
import { GET_REFERENDUM_NFTS } from "@/data/queries";
import request from "graphql-request";
import { useNFTs } from "@/hooks/use-nfts";

async function fetchReferendumNFTsDistinct() {
  return await request(
    websiteConfig.singular_graphql_endpoint,
    GET_REFERENDUM_NFTS,
    {
      where: {
        burned: {
          _eq: "",
        },
        collectionId: {
          _in: websiteConfig.singular_referendum_collections,
        },
        metadata_properties: {
          _contains: {
            rarity: {
              type: "string",
            },
          },
        },
      },
      orderBy: [
        {
          metadata: "desc",
          symbol: "desc",
        },
      ],
      distinctNftsDistinctOn2: ["metadata", "symbol"],
    }
  );
}

async function getNFTs() {
  const { nfts } = await fetchReferendumNFTsDistinct();
  const transformedNFTs = await Promise.all(
    nfts.map(async (item) => {
      let attr = item.metadata_properties;

      const regex = /\n+/;
      const descriptionSegments = item.metadata_description.split(regex);

      return {
        ref: item.metadata_name,
        symbol: item.symbol,
        rmrkId: item.id,
        thumb: item.resources[0].thumb.replace("ipfs://ipfs/", ""),
        amount: attr.total_supply?.value,
        artist: attr.artist?.value,
        rarity: attr.rarity?.value,
        title: descriptionSegments[0].replace(/'/g, ""),
        description: descriptionSegments[1] ?? item.metadata_description,
        url:
          "https://singular.app/collections/" +
          item.collectionId +
          "?search=" +
          encodeURIComponent(item.metadata_name),
      };
    })
  );
  return [...transformedNFTs, ...websiteConfig.classic_referendums];
}

export function NFTSnippets() {
  const { data: nfts } = useNFTs({});
  console.log("nfts are", nfts);
  const positions = [
    [10, 10],
    [12, 80],
    [28, 75],
    [70, 80],
    [77, 0],
    [84, 60],
  ];
  const animNames = ["One", "Two", "Three"];

  return (
    <div className="nft-snippets absolute top-0 left-0 right-0 bottom-0">
      {nfts &&
        sampleSize(Object.values(nfts), 6)?.map((nft, idx) => {
          const l = `${positions[idx][0]}%`;
          const t = `${positions[idx][1]}%`;

          return (
            <div
              key={idx}
              className={clsx("nft-snippet-item absolute shadow-lg", {
                "animate-floatingOne": idx % 3 === 0,
                "animate-floatingTwo": idx % 3 === 1,
                "animate-floatingThree": idx % 3 === 2,
              })}
              style={{
                left: l,
                top: t,
                width: 120,
                height: 120,
              }}
            >
              <Image
                src={`https://gateway.ipfs.io/ipfs/${nft.thumb}`}
                alt={`Kusama NFT for ${nft.ref}`}
                width={120}
                height={120}
              />
              <div className="nft-snippet-overlay absolute top-0 right-0 bottom-0 left-0 w-full h-full overflow-hidden bg-fixed transition duration-300 ease-in-out" />
            </div>
          );
        })}
    </div>
  );
}
