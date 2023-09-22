import { ApiPromise } from "@polkadot/api";
import { getApiAt, getDenom } from "./util";
import { OpenGovReferendum } from "@/types";

export const getOpenGovReferendum = async (
  api: ApiPromise | undefined,
  referendumIndex: number
) => {
  const denom = await getDenom(api);

  if (!api) {
    throw "no api";
  }

  const referendum = await api.query.referenda.referendumInfoFor(
    referendumIndex
  ); //.entries()

  //TODO Type
  const trackJSON: any = referendum.toJSON();
  if (trackJSON["ongoing"]) {
    const {
      track,
      enactment: { after },
      submitted,
      submissionDeposit: { who: submissionWho, amount: submissionAmount },
      decisionDeposit,
      deciding,
      tally: { ayes, nays, support },
      inQueue,
      alarm,
    } = trackJSON["ongoing"];
    const origin = trackJSON["ongoing"]?.origin?.origins
      ? trackJSON["ongoing"]?.origin?.origins
      : "root";
    const hash = trackJSON["ongoing"]?.proposal?.lookup
      ? trackJSON["ongoing"]?.proposal?.lookup?.hash
      : trackJSON["ongoing"]?.proposal?.inline;
    let decisionDepositWho, decisionDepositAmount, since, confirming;
    if (decisionDeposit) {
      const { who: decisionDepositWho, amount: decisionDepositAmount } =
        decisionDeposit;
    }
    if (deciding) {
      const { since, confirming } = deciding;
    }

    // const identity = await getIdentity(submissionWho.toString());

    const r: OpenGovReferendum = {
      index: referendumIndex,
      track: track,
      origin: origin,
      proposalHash: hash,
      enactmentAfter: after,
      submitted: submitted,
      submissionWho: submissionWho,
      //   submissionIdentity: identity?.name ? identity?.name : submissionWho,
      submissionAmount: submissionAmount / denom,
      decisionDepositWho: decisionDepositWho ? decisionDepositWho : null,
      decisionDepositAmount: decisionDepositAmount
        ? decisionDepositAmount / denom
        : null,
      decidingSince: since ? since : null,
      decidingConfirming: confirming ? confirming : null,
      ayes: ayes / denom,
      nays: nays / denom,
      support: support / denom,
      inQueue: inQueue,
      currentStatus: "Ongoing",
      confirmationBlockNumber: null,
    };
    return r;
  } else if (
    trackJSON["approved"] ||
    trackJSON["cancelled"] ||
    trackJSON["rejected"] ||
    trackJSON["timedOut"]
  ) {
    let status, confirmationBlockNumber;
    if (trackJSON["approved"]) {
      confirmationBlockNumber = trackJSON["approved"][0];
      status = "Approved";
    } else if (trackJSON["cancelled"]) {
      confirmationBlockNumber = trackJSON["cancelled"][0];
      status = "Cancelled";
    } else if (trackJSON["rejected"]) {
      confirmationBlockNumber = trackJSON["rejected"][0];
      status = "Rejected";
    } else if (trackJSON["timedOut"]) {
      confirmationBlockNumber = trackJSON["timedOut"][0];
      status = "TimedOut";
    }

    const apiAt = await getApiAt(api, confirmationBlockNumber - 1);
    // Get the info at the last block before it closed.
    const referendumInfo = await apiAt.query.referenda.referendumInfoFor(
      referendumIndex
    );
    const referendumJSON = referendumInfo.toJSON();

    const {
      track,
      enactment: { after },
      submitted,
      submissionDeposit: { who: submissionWho, amount: submissionAmount },
      decisionDeposit,
      deciding,
      tally: { ayes, nays, support },
      inQueue,
      alarm,
      // @ts-ignore
    } = referendumJSON["ongoing"];
    // @ts-ignore
    const origin = referendumJSON["ongoing"]?.origin?.origins
      ? // @ts-ignore
        referendumJSON["ongoing"]?.origin?.origins
      : "root";
    // @ts-ignore
    const hash = referendumJSON["ongoing"]?.proposal?.lookup
      ? // @ts-ignore
        referendumJSON["ongoing"]?.proposal?.lookup?.hash
      : // @ts-ignore
        referendumJSON["ongoing"]?.proposal?.inline;
    let decisionDepositWho, decisionDepositAmount, since, confirming;
    if (decisionDeposit) {
      const { who: decisionDepositWho, amount: decisionDepositAmount } =
        decisionDeposit;
    }
    if (deciding) {
      const { since, confirming } = deciding;
    }

    // const identity = await this.getIdentity(submissionWho);

    const r: OpenGovReferendum = {
      index: referendumIndex,
      track: track,
      origin: origin,
      proposalHash: hash,
      enactmentAfter: after,
      submitted: submitted,
      submissionWho: submissionWho,
      //   submissionIdentity: identity?.name ? identity?.name : submissionWho,
      submissionAmount: submissionAmount / denom,
      decisionDepositWho: decisionDepositWho ? decisionDepositWho : null,
      decisionDepositAmount: decisionDepositAmount
        ? decisionDepositAmount / denom
        : null,
      decidingSince: since ? since : null,
      decidingConfirming: confirming ? confirming : null,
      ayes: ayes / denom,
      nays: nays / denom,
      support: support / denom,
      inQueue: inQueue,
      currentStatus: status || "Unknown",
      confirmationBlockNumber: confirmationBlockNumber,
    };

    return r;
  }
};
