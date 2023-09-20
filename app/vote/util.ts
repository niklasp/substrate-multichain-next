import type { StorageKey, u16, u32, Option } from "@polkadot/types";
import type { ApiPromise } from "@polkadot/api";
import type {
  PalletConvictionVotingTally,
  PalletRankedCollectiveTally,
  PalletReferendaCurve,
  PalletReferendaReferendumInfoConvictionVotingTally,
  PalletReferendaReferendumInfoRankedCollectiveTally,
  PalletReferendaTrackInfo,
  PalletConvictionVotingVoteVoting
} from "@polkadot/types/lookup";
import type {
  CurveGraph,
  ReferendumPolkadot,
  TrackDescription,
  TrackInfoExt,
  UIReferendum,
  UITrack,
  VotePolkadot,
} from "./types.js";
import { AccountId32 } from '@polkadot/types/interfaces';

import { getGovernanceTracks } from "@polkadot/apps-config";
import { ReferendumPolkassembly, VoteChoice } from "./types";
import { create } from "zustand";
import { SubstrateChain } from "../../types/index";
import {
  BN,
  BN_BILLION,
  BN_ONE,
  BN_ZERO,
  bnMax,
  bnMin,
  bnToBn,
  formatNumber,
  hexToString,
  objectSpread,
  stringPascalCase,
} from "@polkadot/util";
import { Codec } from '@polkadot/types/types';

const CURVE_LENGTH = 500;

export function getTrackName(
  trackId: BN,
  { name }: PalletReferendaTrackInfo
): string {
  return `${formatNumber(trackId)} / ${name
    .replace(/_/g, " ")
    .split(" ")
    .map(stringPascalCase)
    .join(" ")}`;
}

export function getTrackInfo(
  api: ApiPromise,
  specName: string,
  palletReferenda: string,
  tracks: TrackDescription[],
  trackId?: number
): TrackInfoExt | undefined {
  let info: TrackInfoExt | undefined;

  if (tracks && trackId !== undefined && trackId !== -1) {
    const originMap = getGovernanceTracks(api, specName, palletReferenda);
    const track = tracks.find(({ id }) => id.eqn(trackId));

    if (track && originMap) {
      const trackName = track.info.name.toString();
      const base = originMap.find(
        ({ id, name }) => id === trackId && name === trackName
      );

      if (base) {
        info = objectSpread<TrackInfoExt>(
          {
            track,
            trackName: getTrackName(track.id, track.info),
          },
          base
        );
      }
    }
  }

  return info;
}

export function isConvictionTally(
  tally: PalletRankedCollectiveTally | PalletConvictionVotingTally
): tally is PalletConvictionVotingTally {
  return (
    !!(tally as PalletConvictionVotingTally).support &&
    !(tally as PalletRankedCollectiveTally).bareAyes
  );
}

export function isConvictionVote(
  info:
    | PalletReferendaReferendumInfoConvictionVotingTally
    | PalletReferendaReferendumInfoRankedCollectiveTally
): info is PalletReferendaReferendumInfoConvictionVotingTally {
  return info.isOngoing && isConvictionTally(info.asOngoing.tally);
}

export function curveThreshold(
  curve: PalletReferendaCurve,
  input: BN,
  div: BN
): BN {
  // if divisor is zero, we return the max
  if (div.isZero()) {
    return BN_BILLION;
  }

  const x = input.mul(BN_BILLION).div(div);

  if (curve.isLinearDecreasing) {
    const { ceil, floor, length } = curve.asLinearDecreasing;

    // *ceil - (x.min(*length).saturating_div(*length, Down) * (*ceil - *floor))
    // NOTE: We first multiply, then divide (since we work with fractions)
    return ceil.sub(bnMin(x, length).mul(ceil.sub(floor)).div(length));
  } else if (curve.isSteppedDecreasing) {
    const { begin, end, period, step } = curve.asSteppedDecreasing;

    // (*begin - (step.int_mul(x.int_div(*period))).min(*begin)).max(*end)
    return bnMax(end, begin.sub(bnMin(begin, step.mul(x).div(period))));
  } else if (curve.asReciprocal) {
    const { factor, xOffset, yOffset } = curve.asReciprocal;
    const div = x.add(xOffset);

    if (div.isZero()) {
      return BN_BILLION;
    }

    // factor
    //   .checked_rounding_div(FixedI64::from(x) + *x_offset, Low)
    //   .map(|yp| (yp + *y_offset).into_clamped_perthing())
    //   .unwrap_or_else(Perbill::one)
    return bnMin(BN_BILLION, factor.mul(BN_BILLION).div(div).add(yOffset));
  }

  throw new Error(`Unknown curve found ${curve.type}`);
}

export function curveDelay(
  curve: PalletReferendaCurve,
  input: BN,
  div: BN
): BN {
  try {
    // if divisor is zero, we return the max
    if (div.isZero()) {
      return BN_BILLION;
    }

    const y = input.mul(BN_BILLION).div(div);

    if (curve.isLinearDecreasing) {
      const { ceil, floor, length } = curve.asLinearDecreasing;

      // if y < *floor {
      //   Perbill::one()
      // } else if y > *ceil {
      //   Perbill::zero()
      // } else {
      //   (*ceil - y).saturating_div(*ceil - *floor, Up).saturating_mul(*length)
      // }
      return y.lt(floor)
        ? BN_BILLION
        : y.gt(ceil)
          ? BN_ZERO
          : bnMin(
            BN_BILLION,
            bnMax(BN_ZERO, ceil.sub(y).mul(length).div(ceil.sub(floor)))
          );
    } else if (curve.isSteppedDecreasing) {
      const { begin, end, period, step } = curve.asSteppedDecreasing;

      // if y < *end {
      //   Perbill::one()
      // } else {
      //   period.int_mul((*begin - y.min(*begin) + step.less_epsilon()).int_div(*step))
      // }
      return y.lt(end)
        ? BN_BILLION
        : bnMin(
          BN_BILLION,
          bnMax(
            BN_ZERO,
            period
              .mul(
                begin
                  .sub(bnMin(y, begin))
                  .add(step.isZero() ? step : step.sub(BN_ONE))
              )
              .div(step)
          )
        );
    } else if (curve.asReciprocal) {
      const { factor, xOffset, yOffset } = curve.asReciprocal;
      const div = y.sub(yOffset);

      if (div.isZero()) {
        return BN_BILLION;
      }

      // let y = FixedI64::from(y);
      // let maybe_term = factor.checked_rounding_div(y - *y_offset, High);
      // maybe_term
      //   .and_then(|term| (term - *x_offset).try_into_perthing().ok())
      //   .unwrap_or_else(Perbill::one)
      return bnMin(
        BN_BILLION,
        bnMax(BN_ZERO, factor.mul(BN_BILLION).div(div).sub(xOffset))
      );
    }
  } catch (error) {
    console.error(`Failed on curve ${curve.type}:`, curve.inner.toHuman());

    throw error;
  }

  throw new Error(`Unknown curve found ${curve.type}`);
}

export function calcDecidingEnd(
  totalEligible: BN,
  tally: PalletRankedCollectiveTally | PalletConvictionVotingTally,
  { decisionPeriod, minApproval, minSupport }: PalletReferendaTrackInfo,
  since: BN
): BN | undefined {
  const support = isConvictionTally(tally) ? tally.support : tally.bareAyes;

  return since.add(
    decisionPeriod
      .mul(
        bnMax(
          curveDelay(minApproval, tally.ayes, tally.ayes.add(tally.nays)),
          curveDelay(minSupport, support, totalEligible)
        )
      )
      .div(BN_BILLION)
  );
}

export function calcCurves({
  decisionPeriod,
  minApproval,
  minSupport,
}: PalletReferendaTrackInfo): CurveGraph {
  const approval = new Array<BN>(CURVE_LENGTH);
  const support = new Array<BN>(CURVE_LENGTH);
  const x = new Array<BN>(CURVE_LENGTH);
  const step = decisionPeriod.divn(CURVE_LENGTH);
  const last = CURVE_LENGTH - 1;
  let current = new BN(0);

  for (let i = 0; i < last; i++) {
    approval[i] = curveThreshold(minApproval, current, decisionPeriod);
    support[i] = curveThreshold(minSupport, current, decisionPeriod);
    x[i] = current;

    current = current.add(step);
  }

  // since we may be lossy with the step, we explicitly calc the final point at 100%
  approval[last] = curveThreshold(minApproval, decisionPeriod, decisionPeriod);
  support[last] = curveThreshold(minSupport, decisionPeriod, decisionPeriod);
  x[last] = decisionPeriod;

  return { approval, support, x };
}

/**
 * Transforms a referendum from PalletReferendaReferendumInfoConvictionVotingTally
 * to a type we want. It must be serializable https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#passing-props-from-server-to-client-components-serialization
 * @param param0
 * @returns
 */
export const transformReferendum = ([id, info]: [
  id: StorageKey<[u32]> | string,
  info: Option<PalletReferendaReferendumInfoConvictionVotingTally>
]): ReferendumPolkadot => {
  let refInfo = info.isSome ? info.unwrap() : null;

  // console.log("refInof", id.toHuman(), refInfo?.isOngoing);

  const status = refInfo?.isApproved
    ? "approved"
    : refInfo?.isRejected
      ? "rejected"
      : refInfo?.isOngoing
        ? "ongoing"
        : refInfo?.isCancelled
          ? "cancelled"
          : refInfo?.isTimedOut
            ? "timedOut"
            : "unknown";

  try {
    if (refInfo?.isOngoing) {
      let {
        tally: { ayes, nays, support },
        deciding,
        decisionDeposit,
        enactment,
        origin,
        proposal,
        submissionDeposit,
        submitted,
        track,
        createdAtHash,
      } = refInfo.asOngoing;

      // const decidingValue = deciding.unwrapOrDefault();
      // const endBlock = decidingValue.confirming
      //   ? decidingValue.confirming
      //   : decidingValue.since + track.info.decisionPeriod;

      return {
        index: typeof id === "string" ? id : id.toHuman()?.toString(),
        status,
        tally: {
          ayes: ayes.toHuman(),
          nays: nays.toHuman(),
          support: support.toHuman(),
          total: ayes.add(nays).toJSON(),
        },
        track: track.toString(),
        deciding: deciding.toJSON(),
        decisionDeposit: decisionDeposit.toJSON(),
        enactment: enactment.toJSON(),
        origin: origin.toJSON(),
        proposal: proposal.toJSON(),
        submissionDeposit: submissionDeposit.toJSON(),
        submitted: submitted.toString(),
        createdAtHash: createdAtHash?.toString(),
        // endBlock: endBlock.toNumber(),
      } as ReferendumPolkadot;
    } else {
      const endedAt = refInfo?.isApproved ?
        refInfo?.asApproved[0] : refInfo?.isRejected ?
          refInfo?.asRejected[0] : refInfo?.isCancelled ?
            refInfo?.asCancelled[0] : refInfo?.isTimedOut ?
              refInfo?.asTimedOut[0] : undefined
      return {
        index: typeof id === "string" ? id : id.toHuman()?.toString(),
        status,
        endedAt: endedAt?.toString(),
      } as ReferendumPolkadot;
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * Transforms a referendum from PalletReferendaReferendumInfoConvictionVotingTally
 * to a type we want. It must be serializable https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#passing-props-from-server-to-client-components-serialization
 * @param param0
 * @returns
 */
export const transformVote = ([storageKey, codec]: [StorageKey<[AccountId32, u16]>, Codec]): VotePolkadot => {

  // Extract data from storageKey
  const [accountId, track] = storageKey.args;

  // Cast Codec to the specific type PalletConvictionVotingVoteVoting and extract necessary fields
  const voteData = codec as PalletConvictionVotingVoteVoting;

  // Now, voteData should have properties defined in PalletConvictionVotingVoteVoting which you can use as needed

  return {
    accountId: accountId.toString(),
    track: track.toNumber(),
    voteData,
  };
};

export const decorateWithPolkassemblyInfo = async (
  ref: UIReferendum | undefined,
  chain: SubstrateChain = SubstrateChain.Kusama
) => {
  const refIndex = ref?.index;
  const decoratedRef = await getTitleAndContentForRef(refIndex, chain);

  const { title, content, proposer, requested, tags, proposed_call } =
    decoratedRef;

  return {
    ...ref,
    title,
    content,
    proposer,
    requested,
    tags,
    proposed_call,
  } as UIReferendum;
};

export async function getTitleAndContentForRefs(
  referendumIds: string[],
  chainName: SubstrateChain = SubstrateChain.Kusama
) {
  var myHeaders = new Headers();
  myHeaders.append("x-network", (chainName as SubstrateChain).toLowerCase());

  var requestOptions: RequestInit = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  const posts = await fetch(
    "https://api.polkassembly.io/api/v1/listing/on-chain-posts?page=1&proposalType=referendums_v2&listingLimit=100&trackNo=1&trackStatus=All&sortBy=newest",
    requestOptions
  );

  const postsJson = await posts.json();
  return postsJson;
}

export async function getTitleAndContentForRef(
  refId: string | undefined,
  chainName: SubstrateChain = SubstrateChain.Kusama
): Promise<UIReferendum> {
  return new Promise(async (resolve, reject) => {
    var headers = new Headers();
    headers.append("x-network", (chainName as SubstrateChain).toLowerCase());

    var requestOptions: RequestInit = {
      method: "GET",
      headers: headers,
      redirect: "follow",
    };

    console.log("getTitleAndContentForRef", refId, chainName);

    fetch(
      `https://api.polkassembly.io/api/v1/posts/on-chain-post?proposalType=referendums_v2&postId=${refId}`,
      requestOptions
    )
      .then((response) => response.json())
      .then((result) => resolve(result))
      .catch((error) => reject(error));
  });
}

export const transformTrack = ([id, info]: [
  id: u16,
  info: PalletReferendaTrackInfo
]): UITrack => {
  const {
    name,
    maxDeciding,
    decisionDeposit,
    preparePeriod,
    decisionPeriod,
    confirmPeriod,
    minEnactmentPeriod,
    minApproval,
    minSupport,
  } = info;
  return {
    id: id.toString(),
    name: name.toString(),
    maxDeciding: maxDeciding.toString(),
    decisionDeposit: decisionDeposit.toString(),
    preparePeriod: preparePeriod.toString(),
    decisionPeriod: decisionPeriod.toString(),
    confirmPeriod: confirmPeriod.toString(),
    minEnactmentPeriod: minEnactmentPeriod.toString(),
    minApproval: minApproval.toJSON(),
    minSupport: minSupport.toJSON(),
  };
};

export function getVoteTx(
  api: ApiPromise | undefined,
  voteChoice: VoteChoice,
  ref: number,
  balances: { aye: BN; nay: BN; abstain: BN },
  conviction: number
) {
  let vote: any = {};

  switch (voteChoice) {
    case VoteChoice.Aye:
    case VoteChoice.Nay:
      vote = {
        Standard: {
          vote: {
            aye: voteChoice === VoteChoice.Aye,
            conviction: conviction,
          },
          balance: voteChoice === VoteChoice.Aye ? balances.aye : balances.nay,
        },
      };
      break;
    case VoteChoice.Split:
      vote = {
        Split: {
          aye: balances.aye,
          nay: balances.nay,
        },
      };
      break;
    case VoteChoice.Abstain:
      vote = {
        SplitAbstain: {
          aye: balances.aye,
          nay: balances.nay,
          abstain: balances.abstain,
        },
      };
  }

  return api?.tx.convictionVoting.vote(ref, vote);
}
