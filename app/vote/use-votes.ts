import { ApiPromise } from "@polkadot/api";
import { useQuery } from "react-query";
import { useAppStore } from "../zustand";
import { some } from "lodash";

async function getTitleAndContentForRefs(referendumIds: string[]) {
  const promises = referendumIds.map((id) => getTitleAndContentForRef(id));
  return Promise.all(promises).then((values) => {
    return values;
  });
}

async function getTitleAndContentForRef(refId: string) {
  return new Promise(async (resolve, reject) => {
    var headers = new Headers();
    headers.append("x-network", "kusama");

    var requestOptions: RequestInit = {
      method: "GET",
      headers,
      redirect: "follow",
    };

    fetch(
      `https://api.polkassembly.io/api/v1/posts/on-chain-post?proposalType=referendums_v2&postId=${refId}`,
      requestOptions
    )
      .then((response) => response.json())
      .then((result) => resolve(result))
      .catch((error) => reject(error));
  });
}

export const openGovReferendumFetcher = async (
  api: ApiPromise,
  refId: string
) => {
  let openGovRefs;

  if (typeof refId === "undefined") {
    return [];
  }

  if (refId === "all") {
    openGovRefs = await api.query.referenda.referendumInfoFor.entries();
  } else if (isFinite(parseInt(refId))) {
    openGovRefs = await api.query.referenda.referendumInfoFor(refId);
    openGovRefs = [[refId, openGovRefs]];
  } else {
    return [];
  }

  console.log("OPENGOV refs", openGovRefs);

  //   openGovRefs = openGovRefs.map(([key, referendum]) => {
  //     let refjson = referendum.toJSON();
  //     try {
  //       if (refjson.ongoing) {
  //         let {
  //           tally: { ayes, nays, support },
  //         } = refjson.ongoing;
  //         return {
  //           ...refjson.ongoing,
  //           gov2: true,
  //           index: key?.args?.[0]
  //             ? parseInt(key.args[0].toHuman())
  //             : parseInt(refId),
  //           tally: {
  //             ayes: parseInt(ayes),
  //             nays: parseInt(nays),
  //             support: support,
  //           },
  //           voted_amount_aye: microToKSM(parseInt(ayes)),
  //           voted_amount_nay: microToKSM(parseInt(nays)),
  //           voted_amount_total: microToKSM(parseInt(ayes) + parseInt(nays)),
  //           //todo this wil change
  //           ended_at: null,
  //           ends_at: refjson.ongoing.enactment?.after,
  //         };
  //       } else {
  //         return referendum.toJSON();
  //       }
  //     } catch (e) {
  //       console.error(e);
  //     }
  //   });

  //all ref ids in array of strings
  const indexes = openGovRefs.map((ref) => ref[1]);
  const notnullids = indexes.filter((index) => typeof index !== "undefined");

  //   //attach title and content fields to each ref from polkassembly refDetails
  //   let refDetails = await getTitleAndContentForRefs(notnullids);
  //   const merged = openGovRefs.map((ref) => {
  //     const polkassemblyRef = refDetails.find((refDetail) => {
  //       return parseInt(refDetail.post_id) === ref.index;
  //     });
  //     return Object.assign(ref, {
  //       title: polkassemblyRef?.title,
  //       content: polkassemblyRef?.content,
  //     });
  //   });

  //   const onlyActiveRefs = merged.filter(
  //     (ref) =>
  //       typeof ref.index !== "undefined" &&
  //       !some([ref.approved, ref.rejected, ref.cancelled])
  //   );
  //   return onlyActiveRefs.sort((a, b) => a.index - b.index);
};

export const useGov2Referendums = () => {
  const { name: chainName, api } = useAppStore((state) => state.chain);
  return useQuery({
    queryKey: ["gov2-referendums", chainName],
    queryFn: async () => openGovReferendumFetcher(api, "all"),
  });
};
