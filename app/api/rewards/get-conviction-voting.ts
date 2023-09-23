import {
  PalletConvictionVotingVoteCasting,
  PalletConvictionVotingVoteVoting,
  PalletReferendaReferendumInfoConvictionVotingTally,
} from "@polkadot/types/lookup";
import { ConvictionDelegation, ConvictionVote, VotePolkadot } from "@/types";
import { ApiPromise } from "@polkadot/api";
import { getOpenGovReferendum } from "./get-open-gov-referendum";
import { StorageKey, u32, Option } from "@polkadot/types";

import { BN } from "@polkadot/util";
import { getApiAt, getDenom } from "./util";
import { transformReferendum, transformVote } from "@/app/[chain]/vote/util";
import { ReferendumPolkadot } from "@/app/[chain]/vote/types";

const getOpenGovReferenda = async (api: ApiPromise | undefined, referendumIndex?: string) => {
  if (!api) {
    throw "no api";
  }
  let openGovRefs: [
    id: StorageKey<[u32]> | string,
    info: Option<PalletReferendaReferendumInfoConvictionVotingTally>
  ][]

  let totalIssuance: string | undefined;

  const ongoingReferenda: ReferendumPolkadot[] = [];
  const finishedReferenda: ReferendumPolkadot[] = [];
  if (referendumIndex) {
    openGovRefs = [[
      referendumIndex.toString(),
      await api?.query.referenda.referendumInfoFor(referendumIndex)
    ]];
  }
  //get all referenda
  else {
    openGovRefs = await api?.query.referenda.referendumInfoFor.entries();
  }

  const referenda: ReferendumPolkadot[] = openGovRefs?.map(transformReferendum)
  let i = 0
  for (const referendum of referenda) {
    console.log(
      `Got referendum info for index ${referendum.index} [${i++}/${referenda.length}]`,
      { label: "Democracy" }
    );
    if (
      (referendum.status === "approved" ||
        referendum.status === "cancelled" ||
        referendum.status === "rejected" ||
        referendum.status === "timedOut")
      && referendum.endedAt !== undefined
    ) {
      const apiAt = await getApiAt(api, new BN(referendum.endedAt).subn(1).toNumber());
      // Get the info at the last block before it closed.
      const referendumInfo: [StorageKey<[u32]> | string, Option<PalletReferendaReferendumInfoConvictionVotingTally>] = [
        referendum.index as StorageKey<[u32]> | string,
        await apiAt.query.referenda.referendumInfoFor(referendum.index)
      ];
      const referendumInfoWhileOngoing = transformReferendum(referendumInfo)

      if (referendumIndex) {
        totalIssuance =
          (await apiAt?.query.balances.totalIssuance()).toString() || {}.toString();
      }
      referendumInfoWhileOngoing.endedAt = referendum.endedAt
      referendumInfoWhileOngoing.status = referendum.status
      finishedReferenda.push(referendumInfoWhileOngoing);
    }
    else {
      ongoingReferenda.push(referendum)
    }
  }
  return {
    ongoingReferenda: ongoingReferenda,
    finishedReferenda: finishedReferenda,
    totalIssuance
  };
};

// OpenGov Conviction Voting
export const getConvictionVoting = async (api: ApiPromise | undefined, referendumIndex?: string) => {
  try {
    console.log(`Querying conviction voting.....`, { label: "Democracy" });
    if (!api) {
      throw "no api";
    }
    const finishedVotes: ConvictionVote[] = [];
    const ongoingVotes: ConvictionVote[] = [];
    const allDelegations: ConvictionDelegation[] = [];

    const denom = await getDenom(api);

    // Create a map to more easily check the status of a referenda, is it ongoing or finished
    const referendaMap = new Map();
    console.log(`Querying referenda.....`, { label: "Democracy" });
    const { ongoingReferenda, finishedReferenda, totalIssuance } =
      await getOpenGovReferenda(api, referendumIndex);
    console.log(
      `Got ${ongoingReferenda.length} ongoing referenda, ${finishedReferenda.length} finished referenda`,
      { label: "Democracy" }
    );
    for (const ref of ongoingReferenda) {
      referendaMap.set(ref.index, ref);
    }
    for (const ref of finishedReferenda) {
      referendaMap.set(ref.index, ref);
    }
    let queriedReferendum: ReferendumPolkadot | undefined;

    if (referendumIndex) {
      queriedReferendum = referendaMap.get(referendumIndex);
    }

    // Query the keys and storage of all the entries of `votingFor`
    // These are all the accounts voting, for which tracks, for which referenda
    // And whether they are delegating or not.
    console.log(`Querying conviction voting from the chain...`, {
      label: "Democracy",
    });
    const openGovVotesTillNow =
      await api?.query.convictionVoting.votingFor.entries();


    const votingForTillNow: VotePolkadot[] = openGovVotesTillNow?.map(transformVote)
    console.log(`Got voting for ${votingForTillNow.length} entries`, {
      label: "Democracy",
    });

    // Lists of accounts that are either voting themselves, or delegating to another account
    const casting: VotePolkadot[] = [];
    const delegating: VotePolkadot[] = [];

    // Go through the list of all the accounts that are voting and add their entries to the casting or delegating list
    for (const vote of votingForTillNow) {
      if (vote.voteData.isCasting) {
        casting.push(vote);
      } else {
        delegating.push(vote);
      }
    }

    console.log(`${casting.length} casting entries`, {
      label: "Democracy",
    });
    console.log(`${delegating.length} delegating entries`, {
      label: "Democracy",
    });
    for (const vote of casting) {
      const { track, accountId } = vote

      // For each given track, these are the invididual votes for that track,
      //     as well as the total delegation amounts for that particular track
      const { votes,
        delegations: {
          votes: delegationVotes,
          capital: delegationCapital
        }
      } = vote.voteData.asCasting;

      // The total delegation amounts.
      //     delegationVotes - the _total_ amount of tokens applied in voting. This takes the conviction into account
      //     delegationCapital - the base level of tokens delegated to this address


      // The list of votes for that track
      for (const [index, referendumVote] of votes) {
        // The vote for each referendum - this is the referendum index,the conviction, the vote type (aye,nay), and the balance
        const { type } = referendumVote;

        const isReferendumOngoing =
          referendaMap.get(referendumVote.index)?.endedAt == undefined;

        if (isReferendumOngoing) {
          let v;
          v = {
            // The particular governance track
            track,
            // The account that is voting
            address: accountId,
            // The index of the referendum
            referendumIndex: index.toString(),
            // The total amount of tokens that were delegated to them (including conviction)
            delegatedConvictionBalance: delegationVotes.toString(),
            // the total amount of tokens that were delegated to them (without conviction)
            delegatedBalance: delegationCapital.toString(),
            // Whether the person is voting themselves or delegating
            voteType: "Casting",
            // Who the person is delegating to
            delegatedTo: null,
            // The vote direction type, either "Standard", "Split", or "SplitAbstain"
            voteDirectionType: type,
          };
          if (type == "Standard") {
            const { vote, balance } = referendumVote.asStandard
            const { conviction, isAye, isNay } = vote;

            // const balanceHuman = balance.isZero() ? 0 : balance.divn(denom).toNumber();

            // The formatted vote
            v = {
              ...v,
              // The conviction being voted with, ie `None`, `Locked1x`, `Locked5x`, etc
              conviction: conviction.type,
              // The balance they are voting with themselves, sans delegated balance
              balance: {
                aye: isAye ? balance.toString() : "0",
                nay: isNay ? balance.toString() : "0",
                abstain: "0",
              },
              // The vote type, either 'aye', or 'nay'
              voteDirection: isAye ? "Aye" : "Nay",
            };
            ongoingVotes.push(v);
          } else if (type == "Split") {
            const { aye, nay } = referendumVote.asSplit;

            // const ayeHuman = aye.isZero() ? 0 : aye.divn(denom).toNumber();
            // const nayHuman = nay.isZero() ? 0 : nay.divn(denom).toNumber();

            // The formatted vote
            v = {
              ...v,
              // The conviction being voted with, ie `None`, `Locked1x`, `Locked5x`, etc
              conviction: "Locked1x",
              // The balance they are voting with themselves, sans delegated balance
              balance: {
                aye: aye.toString(),
                nay: nay.toString(),
                abstain: "0",
              },
              // The vote type, either 'aye', or 'nay'
              voteDirection: aye.gte(nay) ? "Aye" : "Nay",
            };
            ongoingVotes.push(v);
          } else if (type == "SplitAbstain") {
            const { aye, nay, abstain } = referendumVote.asSplitAbstain;
            // const ayeHuman = aye.isZero() ? 0 : aye.divn(denom).toNumber();
            // const nayHuman = nay.isZero() ? 0 : nay.divn(denom).toNumber();
            // const abstainHuman = abstain.isZero() ? 0 : abstain.divn(denom).toNumber()
            // The formatted vote
            v = {
              ...v,
              // The conviction being voted with, ie `None`, `Locked1x`, `Locked5x`, etc
              conviction: "Locked1x",
              // The balance they are voting with themselves, sans delegated balance
              balance: {
                aye: aye.toString(),
                nay: nay.toString(),
                abstain: abstain.toString(),
              },
              // The vote type, either 'aye', or 'nay'
              voteDirection:
                abstain.gte(aye) && abstain.gte(nay)
                  ? "Abstain"
                  : aye.gte(nay.abs())
                    ? "Aye"
                    : "Nay",
            };
            ongoingVotes.push(v);
          } else {
            console.log(`Vote type is unknown`, { label: "Democracy" });
            console.log(`Vote type: ${JSON.stringify(referendumVote.type)}`, {
              label: "Democracy",
            });
          }
        }
      }
    }

    console.log(`Added ${ongoingVotes.length} ongoing casting votes`, {
      label: "Democracy",
    });

    for (const del of delegating) {
      const { track, accountId } = del;

      // The address is delegating to another address for this particular track
      const {
        balance,
        target,
        conviction,
        delegations: { votes: delegationVotes, capital: delegationCapital },
        prior,
      } = del.voteData.asDelegating
      // const balanceHuman = balance.isZero() ? 0 : balance.divn(denom).toNumber();
      let effectiveBalance;
      switch (conviction.type) {
        case "None":
          {
            effectiveBalance = balance.divn(10);
          }
          break;
        case "Locked1x":
          {
            effectiveBalance = balance;
          }
          break;
        case "Locked2x":
          {
            effectiveBalance = balance.muln(2);
          }
          break;
        case "Locked3x":
          {
            effectiveBalance = balance.muln(3);
          }
          break;
        case "Locked4x":
          {
            effectiveBalance = balance.muln(4);
          }
          break;
        case "Locked5x":
          {
            effectiveBalance = balance.muln(5);
          }
          break;
        case "Locked6x":
          {
            effectiveBalance = balance.muln(6);
          }
          break;
      }
      const delegation: ConvictionDelegation = {
        track: track,
        address: accountId,
        target: target.toString(),
        balance: balance.toString(),
        effectiveBalance: effectiveBalance.toString(),
        conviction: conviction.type,
        // The total amount of tokens that were delegated to them (including conviction)
        delegatedConvictionBalance: delegationVotes.toString(),
        // the total amount of tokens that were delegated to them (without conviction)
        delegatedBalance: delegationCapital.toString(),
        prior: prior,
      };
      allDelegations.push(delegation);
    }

    console.log(`Added ${allDelegations.length} delegations`, {
      label: "Democracy",
    });

    // ONGOING REFERENDA DELEGATIONS
    for (const delegation of allDelegations) {
      // Find the vote of the person they are delegating to for a given track
      const v = ongoingVotes.filter((vote) => {
        //only consider direct/casting votes. No nested delegations
        return (
          vote &&
          vote.voteType == "Casting" &&
          vote.address == delegation.target &&
          vote.track == delegation.track
        );
      });

      if (v.length > 0) {
        // There are votes for a given track that a person delegating will have votes for.
        for (const vote of v) {
          const voteDirectionType = vote.voteDirectionType;
          const voteDirection = vote.voteDirection;
          let balance;

          switch (voteDirectionType) {
            case "Standard":
              balance = {
                aye:
                  voteDirection == "Aye"
                    ? delegation.balance
                    : "0",
                nay:
                  voteDirection == "Nay"
                    ? delegation.balance
                    : "0",
                abstain: "0",
              };
              break;
            case "Split":
              balance = {
                aye:
                  (new BN(delegation.balance).mul(new BN(vote.balance.aye).div(new BN(vote.balance.aye).add(new BN(vote.balance.nay))))).toString(),
                nay:
                  (new BN(delegation.balance).mul(new BN(vote.balance.nay).div(new BN(vote.balance.aye).add(new BN(vote.balance.nay))))).toString(),
                abstain: "0",
              };
              break;
            case "SplitAbstain":
              const ayePercentage =
                new BN(vote.balance.aye).div(new BN(vote.balance.aye).add(new BN(vote.balance.nay)).add(new BN(vote.balance.abstain)));
              const nayPercentage =
                new BN(vote.balance.nay).div(new BN(vote.balance.aye).add(new BN(vote.balance.nay)).add(new BN(vote.balance.abstain)));
              const abstainPercentage =
                new BN(vote.balance.abstain).div(new BN(vote.balance.aye).add(new BN(vote.balance.nay)).add(new BN(vote.balance.abstain)));
              balance = {
                aye: new BN(delegation.balance).mul(ayePercentage).toString(),
                nay: new BN(delegation.balance).mul(nayPercentage).toString(),
                abstain: new BN(delegation.balance).mul(abstainPercentage).toString(),
              };
              break;

            default:
              balance = { aye: "0", nay: "0", abstain: "0" };
              break;
          }
          const delegatedVote: ConvictionVote = {
            // The particular governance track
            track: vote.track,
            // The account that is voting
            address: delegation.address,
            // The index of the referendum
            referendumIndex: vote.referendumIndex,
            // The conviction being voted with, ie `None`, `Locked1x`, `Locked5x`, etc
            conviction: delegation.conviction,
            // The balance they are voting with themselves, sans delegated balance
            balance,
            // The total amount of tokens that were delegated to them (including conviction)
            delegatedConvictionBalance: delegation.delegatedConvictionBalance,
            // the total amount of tokens that were delegated to them (without conviction)
            delegatedBalance: delegation.delegatedBalance,
            // The vote type, either 'aye', or 'nay'
            voteDirection: vote.voteDirection,
            // Whether the person is voting themselves or delegating
            voteType: "Delegating",
            voteDirectionType: voteDirectionType,
            // Who the person is delegating to
            delegatedTo: vote.address,
          };
          // console.log(delegatedVote)
          ongoingVotes.push(delegatedVote);
        }
      }
      // else if (v.length == 0) {
      //   // There are no direct votes from the person the delegator is delegating to,
      //   // but that person may also be delegating, so search for nested delegations

      //   let found = false;
      //   // The end vote of the chain of delegations
      //   let delegatedVote: ConvictionDelegation;

      //   delegatedVote = delegation;
      //   let counter = 0;
      //   while (!found && delegatedVote && counter <= 5) {
      //     counter++;

      //     //Find the delegation of the person who is delegating to
      //     const d = allDelegations.filter((del) => {
      //       return (
      //         del.address == delegatedVote?.target &&
      //         del.track == delegatedVote?.track
      //       );
      //     });
      //     if (d.length == 1) {
      //       delegatedVote = d[0];
      //       found = false;
      //     } else if (d.length == 0) {
      //       // There are no additional delegations, try to find if there are any votes
      //       const v = ongoingVotes.filter((vote) => {
      //         return (
      //           vote.address == delegatedVote.target &&
      //           vote.track == delegatedVote.track
      //         );
      //       });
      //       if (v.length > 0) {
      //         // There are votes, ascribe them to the delegator
      //         for (const vote of v) {
      //           const voteDirectionType = vote.voteDirectionType;
      //           const voteDirection = vote.voteDirection;
      //           let balance;
      //           switch (voteDirectionType) {
      //             case "Standard":
      //               balance = {
      //                 aye:
      //                   voteDirection == "Aye"
      //                     ? delegation.balance
      //                     : "0",
      //                 nay:
      //                   voteDirection == "Nay"
      //                     ? delegation.balance
      //                     : "0",
      //                 abstain: "0",
      //               };
      //               break;
      //             case "Split":
      //               balance = {
      //                 aye:
      //                   (new BN(delegation.balance).mul(new BN(vote.balance.aye)).div(new BN(vote.balance.aye).add(new BN(vote.balance.nay)))).toString(),
      //                 nay:
      //                   (new BN(delegation.balance).mul(new BN(vote.balance.nay)).div(new BN(vote.balance.aye).add(new BN(vote.balance.nay)))).toString(),
      //                 abstain: "0",
      //               };
      //               break;
      //             case "SplitAbstain":
      //               const ayePercentage =
      //                 new BN(vote.balance.aye).div(new BN(vote.balance.aye).add(new BN(vote.balance.nay)).add(new BN(vote.balance.abstain)));
      //               const nayPercentage =
      //                 new BN(vote.balance.nay).div(new BN(vote.balance.aye).add(new BN(vote.balance.nay)).add(new BN(vote.balance.abstain)));
      //               const abstainPercentage =
      //                 new BN(vote.balance.abstain).div(new BN(vote.balance.aye).add(new BN(vote.balance.nay)).add(new BN(vote.balance.abstain)));
      //               balance = {
      //                 aye: new BN(delegation.balance).mul(ayePercentage).toString(),
      //                 nay: new BN(delegation.balance).mul(nayPercentage).toString(),
      //                 abstain: new BN(delegation.balance).mul(abstainPercentage).toString(),
      //               };
      //               break;
      //             default:
      //               balance = { aye: "0", nay: "0", abstain: "0" };
      //               break;
      //           }

      //           const delegatedVote: ConvictionVote = {
      //             // The particular governance track
      //             track: vote.track,
      //             // The account that is voting
      //             address: delegation.address,
      //             // The index of the referendum
      //             referendumIndex: vote.referendumIndex,
      //             // The conviction being voted with, ie `None`, `Locked1x`, `Locked5x`, etc
      //             conviction: delegation.conviction,
      //             // The balance they are voting with themselves, sans delegated balance
      //             balance: balance,
      //             // The total amount of tokens that were delegated to them (including conviction)
      //             delegatedConvictionBalance:
      //               delegation.delegatedConvictionBalance,
      //             // the total amount of tokens that were delegated to them (without conviction)
      //             delegatedBalance: delegation.delegatedBalance,
      //             // The vote type, either 'aye', or 'nay'
      //             voteDirection: vote.voteDirection,
      //             // Whether the person is voting themselves or delegating
      //             voteType: "Delegating",
      //             voteDirectionType: voteDirectionType,
      //             // Who the person is delegating to
      //             delegatedTo: vote.address,
      //           };
      //           ongoingVotes.push(delegatedVote);
      //         }
      //       } 
      //     else {
      //         // The person they are delegating to does not have any votes.
      //       }
      //       found = true;
      //     }
      //   }
      // }
    }

    // Create a vote entry for everyone that is delegating for current ongoing referenda
    console.log(`Finished querying ongoing delegations`, {
      label: "Democracy",
    });

    // FINISHED REFERENDA
    // Query the delegations for finished referenda at previous block heights
    // - Iterate through each previous finished referendum
    // - For each finished referendum, querying the state of voting at the block height of one block before the referendum was confirmed
    // -
    for (const referendum of finishedReferenda) {
      console.log(
        `Querying delegations for referenda #${referendum.index} [${referendum.index}/${finishedReferenda.length}]`,
        {
          label: "Democracy",
        }
      );
      if (!referendum.endedAt){
        throw new Error("endedAt is undefined for a past referendum");
      }
      const apiAt = await getApiAt(
        api,
        new BN(referendum.endedAt).subn(1).toNumber()
      );

      // The list of accounts in the network that have votes.
      const openGovVotesTillRefEnd =
        await apiAt.query.convictionVoting.votingFor.entries();

      const votingForTillRefEnd: VotePolkadot[] = openGovVotesTillRefEnd?.map(transformVote)

      console.log(`Got voting until ref end ${votingForTillRefEnd.length} entries`, {
        label: "Democracy",
      });

      // All the votes for the given referendum (casted and delegated)
      const refVotes = [];
      // Direct delegated votes for the referendum
      const delegationsAt = [];
      // Nested Delegated votes for the referendum
      const nestedDelegations = [];

      // Iterate through the list of accounts in the network that are voting and make a list of regular, casted, non-delegated votes (`refVotes`)
      for (const vote of votingForTillRefEnd) {
        // Each of these is the votingFor for an account for a given governance track
        const { accountId, track } = vote;

        if (vote.voteData.isCasting) {
          // For each given track, these are the invididual votes for that track,
          //     as well as the total delegation amounts for that particular track

          // The total delegation amounts.
          //     delegationVotes - the _total_ amount of tokens applied in voting. This takes the conviction into account
          //     delegationCapital - the base level of tokens delegated to this address
          const { votes,
            delegations: {
              votes: delegationVotes,
              capital: delegationCapital
            }
          } = vote.voteData.asCasting;


          // push the given referendum votes to refVotes
          for (const [index, referendumVote] of votes) {
            // The vote for each referendum - this is the referendum index,the conviction, the vote type (aye,nay), and the balance
            const { type } = referendumVote;
            if (index.toString() == referendum.index) {
              let v;
              v = {
                // The particular governance track
                track,
                // The account that is voting
                address: accountId,
                // The index of the referendum
                referendumIndex: index.toString(),
                // The total amount of tokens that were delegated to them (including conviction)
                delegatedConvictionBalance: delegationVotes.toString(),
                // the total amount of tokens that were delegated to them (without conviction)
                delegatedBalance: delegationCapital.toString(),
                // Whether the person is voting themselves or delegating
                voteType: "Casting",
                // Who the person is delegating to
                delegatedTo: null,
                // The vote direction type, either "Standard", "Split", or "SplitAbstain"
                voteDirectionType: type,
              };
              if (type === "Standard") {
                const { vote, balance } = referendumVote.asStandard
                const { conviction, isAye, isNay } = vote;

                // const balanceHuman = balance.isZero() ? 0 : balance.divn(denom).toNumber();

                // The formatted vote
                v = {
                  ...v,
                  // The conviction being voted with, ie `None`, `Locked1x`, `Locked5x`, etc
                  conviction: conviction.type,
                  // The balance they are voting with themselves, sans delegated balance
                  balance: {
                    aye: isAye ? balance.toString() : "0",
                    nay: isNay ? balance.toString() : "0",
                    abstain: "0",
                  },
                  // The vote type, either 'aye', or 'nay'
                  voteDirection: isAye ? "Aye" : "Nay",
                };
                finishedVotes.push(v);
                refVotes.push(v);
              } else if (type === "Split") {
                const { aye, nay } = referendumVote.asSplit;

                // const ayeHuman = aye.isZero() ? 0 : aye.divn(denom).toNumber();
                // const nayHuman = nay.isZero() ? 0 : nay.divn(denom).toNumber();

                // The formatted vote
                v = {
                  ...v,
                  // The conviction being voted with, ie `None`, `Locked1x`, `Locked5x`, etc
                  conviction: "Locked1x",
                  // The balance they are voting with themselves, sans delegated balance
                  balance: {
                    aye: aye.toString(),
                    nay: nay.toString(),
                    abstain: "0",
                  },
                  // The vote type, either 'aye', or 'nay'
                  voteDirection: aye.gte(nay) ? "Aye" : "Nay",
                };
                finishedVotes.push(v);
                refVotes.push(v);
              } else if (type === "SplitAbstain") {
                const { aye, nay, abstain } = referendumVote.asSplitAbstain;
                // const ayeHuman = aye.isZero() ? 0 : aye.divn(denom).toNumber();
                // const nayHuman = nay.isZero() ? 0 : nay.divn(denom).toNumber();
                // const abstainHuman = abstain.isZero() ? 0 : abstain.divn(denom).toNumber()
                // The formatted vote
                v = {
                  ...v,
                  // The conviction being voted with, ie `None`, `Locked1x`, `Locked5x`, etc
                  conviction: "Locked1x",
                  // The balance they are voting with themselves, sans delegated balance
                  balance: {
                    aye: aye.toString(),
                    nay: nay.toString(),
                    abstain: abstain.toString(),
                  },
                  // The vote type, either 'aye', or 'nay'
                  voteDirection:
                    abstain.gte(aye) && abstain.gte(nay)
                      ? "Abstain"
                      : aye.gte(nay.abs())
                        ? "Aye"
                        : "Nay",
                };
                finishedVotes.push(v);
                refVotes.push(v);
              } else {
                console.log(`Vote type is unknown`, { label: "Democracy" });
                console.log(`Vote type: ${JSON.stringify(referendumVote.type)}`, {
                  label: "Democracy",
                });
              }
            }
          }
        }
      }
      console.log(
        `Finished adding ${finishedVotes.length} finished votes for referendum #${referendum.index}`,
        {
          label: "Democracy",
        }
      );

      // Make a list of the delegations there were at this previous block height
      for (const vote of votingForTillRefEnd) {
        // Each of these is the votingFor for an account for a given governance track
        const { accountId, track } = vote;
        if (vote.voteData.isDelegating && track == parseInt(referendum.track as string)) {
          // The address is delegating to another address for this particular track
          const {
            balance,
            target,
            conviction,
            delegations: {
              votes: delegationVotes,
              capital: delegationCapital,
            },
            prior,
          } = vote.voteData.asDelegating;
          // const balanceHuman = balance.isZero() ? 0 : balance.divn(denom).toNumber();
          let effectiveBalance;
          switch (conviction.type) {
            case "None":
              {
                effectiveBalance = balance.divn(10);
              }
              break;
            case "Locked1x":
              {
                effectiveBalance = balance;
              }
              break;
            case "Locked2x":
              {
                effectiveBalance = balance.muln(2);
              }
              break;
            case "Locked3x":
              {
                effectiveBalance = balance.muln(3);
              }
              break;
            case "Locked4x":
              {
                effectiveBalance = balance.muln(4);
              }
              break;
            case "Locked5x":
              {
                effectiveBalance = balance.muln(5);
              }
              break;
            case "Locked6x":
              {
                effectiveBalance = balance.muln(6);
              }
              break;
          }
          const delegation: ConvictionDelegation = {
            track: track,
            address: accountId,
            target: target.toString(),
            balance: balance.toString(),
            effectiveBalance: effectiveBalance.toString(),
            conviction: conviction.type,
            // The total amount of tokens that were delegated to them (including conviction)
            delegatedConvictionBalance: delegationVotes.toString(),
            // the total amount of tokens that were delegated to them (without conviction)
            delegatedBalance: delegationCapital.toString(),
            prior: prior,
          };
          delegationsAt.push(delegation);
        }
      }

      console.log(
        `Finished adding ${delegationsAt.length} delegations at expiry of referendum #${referendum.index}`,
        {
          label: "Democracy",
        }
      );

      // Go through the list of delegations and try to find any immediate corresponding direct votes, if there are no immediate delegations, add it to the list of nested delegations.
      for (const delegation of delegationsAt) {
        // Try and find the delegated vote from the existing votes
        const v = refVotes.filter((vote) => {
          return (
            vote.referendumIndex == referendum.index &&
            vote.address == delegation.target &&
            vote.track == delegation.track
          );
        });
        if (v.length > 0) {
          // There are votes for a given track that a person delegating will have votes for.
          for (const vote of v) {
            const voteDirectionType = vote.voteDirectionType;
            const voteDirection = vote.voteDirection;
            let balance;
            switch (voteDirectionType) {
              case "Standard":
                balance = {
                  aye:
                    voteDirection == "Aye"
                      ? delegation.balance
                      : "0",
                  nay:
                    voteDirection == "Nay"
                      ? delegation.balance
                      : "0",
                  abstain: "0",
                };
                break;
              case "Split":
                balance = {
                  aye:
                    (new BN(delegation.balance).mul(new BN(vote.balance.aye).div(new BN(vote.balance.aye).add(new BN(vote.balance.nay))))).toString(),
                  nay:
                    (new BN(delegation.balance).mul(new BN(vote.balance.nay).div(new BN(vote.balance.aye).add(new BN(vote.balance.nay))))).toString(),
                  abstain: "0",
                };
                break;
              case "SplitAbstain":
                const ayePercentage =
                  new BN(vote.balance.aye).div(new BN(vote.balance.aye).add(new BN(vote.balance.nay)).add(new BN(vote.balance.abstain)));
                const nayPercentage =
                  new BN(vote.balance.nay).div(new BN(vote.balance.aye).add(new BN(vote.balance.nay)).add(new BN(vote.balance.abstain)));
                const abstainPercentage =
                  new BN(vote.balance.abstain).div(new BN(vote.balance.aye).add(new BN(vote.balance.nay)).add(new BN(vote.balance.abstain)));
                balance = {
                  aye: new BN(delegation.balance).mul(ayePercentage).toString(),
                  nay: new BN(delegation.balance).mul(nayPercentage).toString(),
                  abstain: new BN(delegation.balance).mul(abstainPercentage).toString(),
                };
                break;
            }

            const delegatedVote: ConvictionVote = {
              // The particular governance track
              track: vote.track,
              // The account that is voting
              address: delegation.address,
              // The index of the referendum
              referendumIndex: vote.referendumIndex,
              // The conviction being voted with, ie `None`, `Locked1x`, `Locked5x`, etc
              conviction: delegation.conviction,
              // The balance they are voting with themselves, sans delegated balance
              balance: balance,
              // The total amount of tokens that were delegated to them (including conviction)
              delegatedConvictionBalance:
                delegation.delegatedConvictionBalance,
              // the total amount of tokens that were delegated to them (without conviction)
              delegatedBalance: delegation.delegatedBalance,
              // The vote type, either 'aye', or 'nay'
              voteDirection: vote.voteDirection,
              // Whether the person is voting themselves or delegating
              voteType: "Delegating",
              voteDirectionType: voteDirectionType,
              // Who the person is delegating to
              delegatedTo: vote.address,
            };
            finishedVotes.push(delegatedVote);
          }
        } else {
          // There are no direct delegations, though there may be a nested delegation
          nestedDelegations.push(delegation);
        }
      }
      console.log(
        `Finished adding ${finishedVotes.length} delegations to finishedVotes at expiry of referendum #${referendum.index}`,
        {
          label: "Democracy",
        }
      );

      //     // Go through the list of nested delegations and try to resolve any votes
      //     for (const delegation of nestedDelegations) {
      //         // Try and find the delegated vote from the existing votes
      //         const v = refVotes.filter((vote) => {
      //             return (
      //                 vote.referendumIndex == referendum.index &&
      //                 vote.address == delegation.target &&
      //                 vote.track == delegation.track
      //             );
      //         });
      //         if (v.length == 0) {
      //             // There are no direct votes from the person the delegator is delegating to,
      //             // but that person may also be delegating, so search for nested delegations

      //             let found = false;
      //             // The end vote of the chain of delegations
      //             let delegatedVote;

      //             delegatedVote = delegation;

      //             let i = 0;
      //             while (!found) {
      //                 // console.log(`i: ${i}`);
      //                 i++;

      //                 if (i > 15) {
      //                     console.log(`Too many iterations, bailed`, {
      //                         label: "Democracy",
      //                     });
      //                     found = true;
      //                 }
      //                 // Find the delegation of the person who is delegating to
      //                 const d = delegationsAt.filter((del) => {
      //                     return (
      //                         del.address == delegatedVote.target &&
      //                         del.track == delegatedVote.track
      //                     );
      //                 });

      //                 if (d.length == 0) {
      //                     // There are no additional delegations, try to find if there are any votes

      //                     found = true;
      //                     const v = refVotes.filter((vote) => {
      //                         return (
      //                             vote.referendumIndex == referendum.index &&
      //                             vote.address == delegatedVote.target &&
      //                             vote.track == delegatedVote.track
      //                         );
      //                     });
      //                     if (v.length > 0) {
      //                         // There are votes, ascribe them to the delegator
      //                         for (const vote of v) {
      //                             const voteDirectionType = vote.voteDirectionType;
      //                             const voteDirection = vote.voteDirection;
      //                             let balance;
      //                             switch (voteDirectionType) {
      //                                 case "Standard":
      //                                     balance = {
      //                                         aye:
      //                                             voteDirection == "Aye"
      //                                                 ? Number(delegation.balance)
      //                                                 : Number(0),
      //                                         nay:
      //                                             voteDirection == "Nay"
      //                                                 ? Number(delegation.balance)
      //                                                 : Number(0),
      //                                         abstain: Number(0),
      //                                     };
      //                                     break;
      //                                 case "Split":
      //                                     balance = {
      //                                         aye:
      //                                             Number(delegation.balance) *
      //                                             (vote.balance.aye /
      //                                                 (vote.balance.aye + vote.balance.nay)),
      //                                         nay:
      //                                             Number(delegation.balance) *
      //                                             (vote.balance.nay /
      //                                                 (vote.balance.aye + vote.balance.nay)),
      //                                         abstain: Number(0),
      //                                     };
      //                                     break;
      //                                 case "SplitAbstain":
      //                                     const ayePercentage =
      //                                         vote.balance.aye /
      //                                         (vote.balance.aye +
      //                                             vote.balance.nay +
      //                                             vote.balance.abstain);
      //                                     const nayPercentage =
      //                                         vote.balance.nay /
      //                                         (vote.balance.aye +
      //                                             vote.balance.nay +
      //                                             vote.balance.abstain);
      //                                     const abstainPercentage =
      //                                         vote.balance.nay /
      //                                         (vote.balance.aye +
      //                                             vote.balance.nay +
      //                                             vote.balance.abstain);
      //                                     balance = {
      //                                         aye: Number(delegation.balance) * ayePercentage,
      //                                         nay: Number(delegation.balance) * nayPercentage,
      //                                         abstain:
      //                                             Number(delegation.balance) * abstainPercentage,
      //                                     };
      //                                     break;
      //                             }

      //                             const delegatedVote: ConvictionVote = {
      //                                 // The particular governance track
      //                                 track: vote.track,
      //                                 // The account that is voting
      //                                 address: delegation.address,
      //                                 // The index of the referendum
      //                                 referendumIndex: vote.referendumIndex,
      //                                 // The conviction being voted with, ie `None`, `Locked1x`, `Locked5x`, etc
      //                                 conviction: delegation.conviction,
      //                                 // The balance they are voting with themselves, sans delegated balance
      //                                 balance: balance,
      //                                 // The total amount of tokens that were delegated to them (including conviction)
      //                                 delegatedConvictionBalance:
      //                                     delegation.delegatedConvictionBalance,
      //                                 // the total amount of tokens that were delegated to them (without conviction)
      //                                 delegatedBalance: delegation.delegatedBalance,
      //                                 // The vote type, either 'aye', or 'nay'
      //                                 voteDirection: vote.voteDirection,
      //                                 // Whether the person is voting themselves or delegating
      //                                 voteType: "Delegating",
      //                                 voteDirectionType: voteDirectionType,
      //                                 // Who the person is delegating to
      //                                 delegatedTo: vote.address,
      //                             };
      //                             finishedVotes.push(delegatedVote);
      //                         }
      //                     } else {
      //                         // The person they are delegating to does not have any votes.
      //                     }
      //                 } else if (d.length == 1) {
      //                     // There is a delegated delegation
      //                     delegatedVote = d[0];
      //                 }
      //             }
      //         }
      //     }
      // }

      const convictionVoting = {
        referendum: queriedReferendum ? queriedReferendum : undefined,
        totalIssuance,
        referendaVotes: [...finishedVotes, ...ongoingVotes]
      };
      return convictionVoting;
    }
  } catch (e) {
    console.log(`Error in getConvictionVoting: ${JSON.stringify(e)}`, {
      label: "Democracy",
    });
  }
};
