import { useQuery } from "react-query";
import { request, gql } from "graphql-request";
import { websiteConfig } from "@/data/website-config";
import { GET_REFERENDUM_NFTS } from "@/data/queries";

async function fetchReferendumNFTsDistinct(): Promise<any> {
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

export function useNFTs(queryOptions: any) {
  return useQuery(
    ["NFTs"],
    async () => {
      const { nfts } = await fetchReferendumNFTsDistinct();
      const transformedNFTs = await Promise.all(
        //TODO type
        nfts.map(async (item: any) => {
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
    },
    queryOptions
  );
}
