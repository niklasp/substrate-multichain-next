import type { PalletReferendaReferendumInfoConvictionVotingTally } from "@polkadot/types/lookup";
import { StorageKey, u32, Option } from "@polkadot/types";
import { NextResponse, NextRequest } from "next/server";
import { ConvictionDelegation, ConvictionVote, OpenGovReferendum, SubstrateChain } from "@/types/index";
import { getChainByName } from "@/config/chains";
import {
    decorateWithPolkassemblyInfo,
    transformReferendum,
    transformTrack,
    transformVote,
} from "@/app/vote/util";
import { ReferendumPolkadot, UIReferendum, UITrack, VotePolkadot } from "@/app/vote/types";
import { ApiPromise } from "@polkadot/api";
import { BN } from "@polkadot/util";

// const getDenom = async (api: ApiPromise): Promise<number> => {
//     if (!api.isConnected) {
//         console.log(`{Chaindata::API::Warn} API is not connected, returning...`);
//         return;
//     }
//     const chainType = await api.rpc.system.chain();
//     const denom =
//         chainType.toString() == "Polkadot" ? 10000000000 : 1000000000000;
//     return denom;
// };

const getApiAt = async (
    api: ApiPromise,
    blockNumber: number
): Promise<any> => {
    const blockHash = (await api.rpc.chain.getBlockHash(blockNumber)).toString()
    return await api.at(blockHash);
};

const getOpenGovReferenda = async (api: ApiPromise) => {
    let openGovRefs: [
        id: StorageKey<[u32]>,
        info: Option<PalletReferendaReferendumInfoConvictionVotingTally>
    ][]
    // const denom = await getDenom(api);

    const ongoingReferenda: ReferendumPolkadot[] = [];
    const finishedReferenda: ReferendumPolkadot[] = [];
    openGovRefs = await api.query.referenda.referendumInfoFor.entries();

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
            const referendumInfo = await apiAt.query.referenda.referendumInfoFor(
                referendum.index
            );

            const referendumInfoWhileOngoing = transformReferendum(referendumInfo)

            finishedReferenda.push(referendumInfoWhileOngoing);
        }
        else {
            ongoingReferenda.push(referendum)
        }
    }
    return {
        ongoingReferenda: ongoingReferenda,
        finishedReferenda: finishedReferenda,
    };
};

// OpenGov Conviction Voting
const getConvictionVoting = async (api: ApiPromise) => {
    try {
        console.log(`Querying conviction voting.....`, { label: "Democracy" });

        const finishedVotes: ConvictionVote[] = [];
        const ongoingVotes: ConvictionVote[] = [];
        const allDelegations: ConvictionDelegation[] = [];

        // const denom = await getDenom(api);

        // Create a map to more easily check the status of a referenda, is it ongoing or finished
        const referendaMap = new Map();
        console.log(`Querying referenda.....`, { label: "Democracy" });
        const { ongoingReferenda, finishedReferenda } =
            await getOpenGovReferenda(api);
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

        // Query the keys and storage of all the entries of `votingFor`
        // These are all the accounts voting, for which tracks, for which referenda
        // And whether they are delegating or not.
        console.log(`Querying conviction voting from the chain...`, {
            label: "Democracy",
        });
        const openGovVotes =
            await api.query.convictionVoting.votingFor.entries();
            
        const votingFor: VotePolkadot[] = openGovVotes?.map(transformVote)

        // console.log(`Got voting for ${votingFor.length} entries`, {
        //     label: "Democracy",
        // });

        // // Lists of accounts that are either voting themselves, or delegating to another account
        // const casting = [];
        // const delegating = [];

        // // Go through the list of all the accounts that are voting and add their entries to the casting or delegating list
        // for (const [key, entry] of votingFor) {
        //     //@ts-ignore
        //     if (entry.isCasting) {
        //         casting.push([key, entry]);
        //     } else {
        //         delegating.push([key, entry]);
        //     }
        // }

        // console.log(`${casting.length} casting entries`, {
        //     label: "Democracy",
        // });
        // console.log(`${delegating.length} delegating entries`, {
        //     label: "Democracy",
        // });
        // for (const [i, [key, entry]] of casting.entries()) {
        //     const [address, track] = key.toHuman();

        //     // For each given track, these are the invididual votes for that track,
        //     //     as well as the total delegation amounts for that particular track
        //     const { votes, delegations } = entry.toHuman()["Casting"];

        //     // The total delegation amounts.
        //     //     delegationVotes - the _total_ amount of tokens applied in voting. This takes the conviction into account
        //     //     delegationCapital - the base level of tokens delegated to this address
        //     const { votes: delegationVotes, capital: delegationCapital } =
        //         delegations;

        //     // The list of votes for that track
        //     for (const [index, referendumVote] of votes.entries()) {
        //         // The vote for each referendum - this is the referendum index,the conviction, the vote type (aye,nay), and the balance
        //         const [referendumIndex, voteType] = referendumVote;

        //         const isReferendumFinished =
        //             referendaMap.get(parseInt(referendumIndex))?.currentStatus !=
        //             "Ongoing";
        //         const isReferendumOngoing =
        //             referendaMap.get(parseInt(referendumIndex))?.currentStatus ==
        //             "Ongoing";

        //         if (isReferendumOngoing) {
        //             if (voteType["Standard"]) {
        //                 const { vote: refVote, balance: balanceString } =
        //                     voteType["Standard"];
        //                 const { conviction, vote: voteDirection } = refVote;

        //                 const balance =
        //                     parseFloat(balanceString.replace(/,/g, "")) / denom;

        //                 // The formatted vote
        //                 const v = {
        //                     // The particular governance track
        //                     track: track,
        //                     // The account that is voting
        //                     address: address,
        //                     // The index of the referendum
        //                     referendumIndex: Number(referendumIndex.toString()),
        //                     // The conviction being voted with, ie `None`, `Locked1x`, `Locked5x`, etc
        //                     conviction: conviction.toString(),
        //                     // The balance they are voting with themselves, sans delegated balance
        //                     balance: {
        //                         aye: voteDirection.toString() == "Aye" ? balance : 0,
        //                         nay: voteDirection.toString() == "Nay" ? balance : 0,
        //                         abstain: 0,
        //                     },
        //                     // The total amount of tokens that were delegated to them (including conviction)
        //                     delegatedConvictionBalance: parseFloat(delegationVotes),
        //                     // the total amount of tokens that were delegated to them (without conviction)
        //                     delegatedBalance: parseFloat(delegationCapital),
        //                     // The vote type, either 'aye', or 'nay'
        //                     voteDirection: voteDirection,
        //                     // The vote direction type, either "Standard", "Split", or "SplitAbstain"
        //                     voteDirectionType: "Standard",
        //                     // Whether the person is voting themselves or delegating
        //                     voteType: "Casting",
        //                     // Who the person is delegating to
        //                     delegatedTo: null,
        //                 };
        //                 ongoingVotes.push(v);
        //             } else if (voteType["Split"]) {
        //                 const { aye, nay } = voteType["Split"];

        //                 // The formatted vote
        //                 const v = {
        //                     // The particular governance track
        //                     track: track,
        //                     // The account that is voting
        //                     address: address,
        //                     // The index of the referendum
        //                     referendumIndex: Number(referendumIndex.toString()),
        //                     // The conviction being voted with, ie `None`, `Locked1x`, `Locked5x`, etc
        //                     conviction: "Locked1x",
        //                     // The balance they are voting with themselves, sans delegated balance
        //                     balance: {
        //                         aye: parseFloat(aye),
        //                         nay: parseFloat(nay),
        //                         abstain: 0,
        //                     },
        //                     // The total amount of tokens that were delegated to them (including conviction)
        //                     delegatedConvictionBalance: parseFloat(delegationVotes),
        //                     // the total amount of tokens that were delegated to them (without conviction)
        //                     delegatedBalance: parseFloat(delegationCapital),
        //                     // The vote type, either 'aye', or 'nay'
        //                     voteDirection: aye >= nay ? "Aye" : "Nay",
        //                     // The vote direction type, either "Standard", "Split", or "SplitAbstain"
        //                     voteDirectionType: "Split",
        //                     // Whether the person is voting themselves or delegating
        //                     voteType: "Casting",
        //                     // Who the person is delegating to
        //                     delegatedTo: null,
        //                 };
        //                 ongoingVotes.push(v);
        //             } else if (voteType["SplitAbstain"]) {
        //                 const { aye, nay, abstain } = voteType["SplitAbstain"];
        //                 // The formatted vote
        //                 const v = {
        //                     // The particular governance track
        //                     track: track,
        //                     // The account that is voting
        //                     address: address.toString(),
        //                     // The index of the referendum
        //                     referendumIndex: Number(referendumIndex.toString()),
        //                     // The conviction being voted with, ie `None`, `Locked1x`, `Locked5x`, etc
        //                     conviction: "Locked1x",
        //                     // The balance they are voting with themselves, sans delegated balance
        //                     balance: {
        //                         aye: parseFloat(aye),
        //                         nay: parseFloat(nay),
        //                         abstain: parseFloat(abstain),
        //                     },
        //                     // The total amount of tokens that were delegated to them (including conviction)
        //                     delegatedConvictionBalance: parseFloat(delegationVotes),
        //                     // the total amount of tokens that were delegated to them (without conviction)
        //                     delegatedBalance: parseFloat(delegationCapital),
        //                     // The vote type, either 'aye', or 'nay'
        //                     voteDirection:
        //                         abstain >= aye && abstain >= nay
        //                             ? "Abstain"
        //                             : aye > +nay
        //                                 ? "Aye"
        //                                 : "Nay",
        //                     // The vote direction type, either "Standard", "Split", or "SplitAbstain"
        //                     voteDirectionType: "SplitAbstain",
        //                     // Whether the person is voting themselves or delegating
        //                     voteType: "Casting",
        //                     // Who the person is delegating to
        //                     delegatedTo: null,
        //                 };
        //                 ongoingVotes.push(v);
        //             } else {
        //                 console.log(`Vote type is unknown`, { label: "Democracy" });
        //                 console.log(`Vote type: ${JSON.stringify(voteType)}`, {
        //                     label: "Democracy",
        //                 });
        //             }
        //         }
        //     }
        // }

        // console.log(`Added ${ongoingVotes.length} ongoing casting votes`, {
        //     label: "Democracy",
        // });

        // for (const [key, entry] of delegating) {
        //     const [address, track] = key.toHuman();

        //     // The address is delegating to another address for this particular track
        //     const {
        //         balance: balanceString,
        //         target,
        //         conviction,
        //         delegations: { votes: delegationVotes, capital: delegationCapital },
        //         prior,
        //     } = entry.toHuman()["Delegating"];
        //     const balance = parseFloat(balanceString.replace(/,/g, "")) / denom;
        //     let effectiveBalance = 0;
        //     switch (conviction) {
        //         case "None":
        //             {
        //                 effectiveBalance = balance * 0.1;
        //             }
        //             break;
        //         case "Locked1x":
        //             {
        //                 effectiveBalance = balance;
        //             }
        //             break;
        //         case "Locked2x":
        //             {
        //                 effectiveBalance = balance * 2;
        //             }
        //             break;
        //         case "Locked3x":
        //             {
        //                 effectiveBalance = balance * 3;
        //             }
        //             break;
        //         case "Locked4x":
        //             {
        //                 effectiveBalance = balance * 4;
        //             }
        //             break;
        //         case "Locked5x":
        //             {
        //                 effectiveBalance = balance * 5;
        //             }
        //             break;
        //         case "Locked6x":
        //             {
        //                 effectiveBalance = balance * 6;
        //             }
        //             break;
        //     }
        //     const delegation: ConvictionDelegation = {
        //         track: track,
        //         address: address.toString(),
        //         target: target.toString(),
        //         balance: balance,
        //         effectiveBalance: effectiveBalance,
        //         conviction: conviction.toString(),
        //         // The total amount of tokens that were delegated to them (including conviction)
        //         delegatedConvictionBalance:
        //             parseFloat(delegationVotes.replace(/,/g, "")) / denom,
        //         // the total amount of tokens that were delegated to them (without conviction)
        //         delegatedBalance:
        //             parseFloat(delegationCapital.replace(/,/g, "")) / denom,
        //         prior: prior,
        //     };
        //     allDelegations.push(delegation);
        // }

        // console.log(`Added ${allDelegations.length} delegations`, {
        //     label: "Democracy",
        // });

        // // ONGOING REFERENDA DELEGATIONS
        // for (const [index, delegation] of allDelegations.entries()) {
        //     // Find the vote of the person they are delegating to for a given track
        //     const v = ongoingVotes.filter((vote) => {
        //         return (
        //             vote &&
        //             vote.address == delegation.target &&
        //             vote.track == delegation.track
        //         );
        //     });

        //     if (v.length > 0) {
        //         // There are votes for a given track that a person delegating will have votes for.
        //         for (const vote of v) {
        //             const voteDirectionType = vote.voteDirectionType;
        //             const voteDirection = vote.voteDirection;
        //             let balance;

        //             switch (voteDirectionType) {
        //                 case "Standard":
        //                     balance = {
        //                         aye:
        //                             voteDirection == "Aye"
        //                                 ? Number(delegation.balance)
        //                                 : Number(0),
        //                         nay:
        //                             voteDirection == "Nay"
        //                                 ? Number(delegation.balance)
        //                                 : Number(0),
        //                         abstain: Number(0),
        //                     };
        //                     break;
        //                 case "Split":
        //                     balance = {
        //                         aye:
        //                             Number(delegation.balance) *
        //                             (vote.balance.aye / (vote.balance.aye + vote.balance.nay)),
        //                         nay:
        //                             Number(delegation.balance) *
        //                             (vote.balance.nay / (vote.balance.aye + vote.balance.nay)),
        //                         abstain: Number(0),
        //                     };
        //                     break;
        //                 case "SplitAbstain":
        //                     const ayePercentage =
        //                         vote.balance.aye /
        //                         (vote.balance.aye + vote.balance.nay + vote.balance.abstain);
        //                     const nayPercentage =
        //                         vote.balance.nay /
        //                         (vote.balance.aye + vote.balance.nay + vote.balance.abstain);
        //                     const abstainPercentage =
        //                         vote.balance.abstain /
        //                         (vote.balance.aye + vote.balance.nay + vote.balance.abstain);
        //                     balance = {
        //                         aye: Number(delegation.balance) * ayePercentage,
        //                         nay: Number(delegation.balance) * nayPercentage,
        //                         abstain: Number(delegation.balance) * abstainPercentage,
        //                     };
        //                     break;
        //             }

        //             const delegatedVote: ConvictionVote = {
        //                 // The particular governance track
        //                 track: vote.track,
        //                 // The account that is voting
        //                 address: delegation.address,
        //                 // The index of the referendum
        //                 referendumIndex: vote.referendumIndex,
        //                 // The conviction being voted with, ie `None`, `Locked1x`, `Locked5x`, etc
        //                 conviction: delegation.conviction,
        //                 // The balance they are voting with themselves, sans delegated balance
        //                 balance: balance,
        //                 // The total amount of tokens that were delegated to them (including conviction)
        //                 delegatedConvictionBalance: delegation.delegatedConvictionBalance,
        //                 // the total amount of tokens that were delegated to them (without conviction)
        //                 delegatedBalance: delegation.delegatedBalance,
        //                 // The vote type, either 'aye', or 'nay'
        //                 voteDirection: vote.voteDirection,
        //                 // Whether the person is voting themselves or delegating
        //                 voteType: "Delegating",
        //                 voteDirectionType: voteDirectionType,
        //                 // Who the person is delegating to
        //                 delegatedTo: vote.address,
        //             };
        //             ongoingVotes.push(delegatedVote);
        //         }
        //     } else if (v.length == 0) {
        //         // There are no direct votes from the person the delegator is delegating to,
        //         // but that person may also be delegating, so search for nested delegations

        //         let found = false;
        //         // The end vote of the chain of delegations
        //         let delegatedVote;

        //         delegatedVote = delegation;
        //         let counter = 0;
        //         while (!found && delegatedVote && counter <= 5) {
        //             counter++;

        //             //Find the delegation of the person who is delegating to
        //             const d = allDelegations.filter((del) => {
        //                 return (
        //                     del.address == delegatedVote?.target &&
        //                     del.track == delegatedVote?.track
        //                 );
        //             });
        //             if (d.length == 1) {
        //                 delegatedVote = d[0];
        //                 found = false;
        //             } else if (d.length == 0) {
        //                 // There are no additional delegations, try to find if there are any votes
        //                 const v = ongoingVotes.filter((vote) => {
        //                     return (
        //                         vote.address == delegatedVote.target &&
        //                         vote.track == delegatedVote.track
        //                     );
        //                 });
        //                 if (v.length > 0) {
        //                     // There are votes, ascribe them to the delegator
        //                     for (const vote of v) {
        //                         const voteDirectionType = vote.voteDirectionType;
        //                         const voteDirection = vote.voteDirection;
        //                         let balance;
        //                         switch (voteDirectionType) {
        //                             case "Standard":
        //                                 balance = {
        //                                     aye:
        //                                         voteDirection == "Aye"
        //                                             ? Number(delegation.balance)
        //                                             : Number(0),
        //                                     nay:
        //                                         voteDirection == "Nay"
        //                                             ? Number(delegation.balance)
        //                                             : Number(0),
        //                                     abstain: Number(0),
        //                                 };
        //                                 break;
        //                             case "Split":
        //                                 balance = {
        //                                     aye:
        //                                         Number(delegation.balance) *
        //                                         (vote.balance.aye /
        //                                             (vote.balance.aye + vote.balance.nay)),
        //                                     nay:
        //                                         Number(delegation.balance) *
        //                                         (vote.balance.nay /
        //                                             (vote.balance.aye + vote.balance.nay)),
        //                                     abstain: Number(0),
        //                                 };
        //                                 break;
        //                             case "SplitAbstain":
        //                                 const ayePercentage =
        //                                     vote.balance.aye /
        //                                     (vote.balance.aye +
        //                                         vote.balance.nay +
        //                                         vote.balance.abstain);
        //                                 const nayPercentage =
        //                                     vote.balance.nay /
        //                                     (vote.balance.aye +
        //                                         vote.balance.nay +
        //                                         vote.balance.abstain);
        //                                 const abstainPercentage =
        //                                     vote.balance.nay /
        //                                     (vote.balance.aye +
        //                                         vote.balance.nay +
        //                                         vote.balance.abstain);
        //                                 balance = {
        //                                     aye: Number(delegation.balance) * ayePercentage,
        //                                     nay: Number(delegation.balance) * nayPercentage,
        //                                     abstain: Number(delegation.balance) * abstainPercentage,
        //                                 };
        //                                 break;
        //                             default:
        //                                 break;
        //                         }

        //                         const delegatedVote: ConvictionVote = {
        //                             // The particular governance track
        //                             track: vote.track,
        //                             // The account that is voting
        //                             address: delegation.address,
        //                             // The index of the referendum
        //                             referendumIndex: vote.referendumIndex,
        //                             // The conviction being voted with, ie `None`, `Locked1x`, `Locked5x`, etc
        //                             conviction: delegation.conviction,
        //                             // The balance they are voting with themselves, sans delegated balance
        //                             balance: balance,
        //                             // The total amount of tokens that were delegated to them (including conviction)
        //                             delegatedConvictionBalance:
        //                                 delegation.delegatedConvictionBalance,
        //                             // the total amount of tokens that were delegated to them (without conviction)
        //                             delegatedBalance: delegation.delegatedBalance,
        //                             // The vote type, either 'aye', or 'nay'
        //                             voteDirection: vote.voteDirection,
        //                             // Whether the person is voting themselves or delegating
        //                             voteType: "Delegating",
        //                             voteDirectionType: voteDirectionType,
        //                             // Who the person is delegating to
        //                             delegatedTo: vote.address,
        //                         };
        //                         ongoingVotes.push(delegatedVote);
        //                     }
        //                 } else {
        //                     // The person they are delegating to does not have any votes.
        //                 }
        //                 found = true;
        //             }
        //         }
        //     }
        // }

        // // Create a vote entry for everyone that is delegating for current ongoing referenda
        // console.log(`Finished querying ongoing delegations`, {
        //     label: "Democracy",
        // });

        // // FINISHED REFERENDA
        // // Query the delegations for finished referenda at previous block heights
        // // - Iterate through each previous finished referendum
        // // - For each finished referendum, querying the state of voting at the block height of one block before the referendum was confirmed
        // // -
        // for (const [
        //     finishedRefIndex,
        //     referendum,
        // ] of finishedReferenda.entries()) {
        //     console.log(
        //         `Querying delegations for referenda #${referendum.index} [${finishedRefIndex}/${finishedReferenda.length}]`,
        //         {
        //             label: "Democracy",
        //         }
        //     );

        //     const apiAt = await getApiAt(
        //         api,
        //         referendum.confirmationBlockNumber - 1
        //     );

        //     // The list of accounts in the network that have votes.
        //     const votingFor =
        //         await apiAt.query.convictionVoting.votingFor.entries();

        //     // All the votes for the given referendum (casted and delegated)
        //     const refVotes = [];
        //     // Direct delegated votes for the referendum
        //     const delegationsAt = [];
        //     // Nested Delegated votes for the referendum
        //     const nestedDelegations = [];

        //     // Iterate through the list of accounts in the network that are voting and make a list of regular, casted, non-delegated votes (`refVotes`)
        //     for (const [key, entry] of votingFor) {
        //         // Each of these is the votingFor for an account for a given governance track
        //         // @ts-ignore
        //         const [address, track] = key.toHuman();
        //         if (entry.isCasting) {
        //             // For each given track, these are the invididual votes for that track,
        //             //     as well as the total delegation amounts for that particular track
        //             // @ts-ignore
        //             const { votes, delegations } = entry.asCasting;

        //             // The total delegation amounts.
        //             //     delegationVotes - the _total_ amount of tokens applied in voting. This takes the conviction into account
        //             //     delegationCapital - the base level of tokens delegated to this address
        //             const { votes: delegationVotes, capital: delegationCapital } =
        //                 delegations;

        //             // push the given referendum votes to refVotes
        //             for (const referendumVote of votes) {
        //                 // The vote for each referendum - this is the referendum index,the conviction, the vote type (aye,nay), and the balance
        //                 const [referendumIndex, voteType] = referendumVote;
        //                 if (referendumIndex == referendum.index) {
        //                     let v: ConvictionVote;
        //                     if (voteType.isStandard) {
        //                         const { vote: refVote, balance } = voteType.asStandard;
        //                         const { conviction, vote: voteDirection } = refVote.toHuman();

        //                         // The formatted vote
        //                         v = {
        //                             // The particular governance track
        //                             track: Number(track.toString()),
        //                             // The account that is voting
        //                             address: address.toString(),
        //                             // The index of the referendum
        //                             referendumIndex: Number(referendumIndex.toString()),
        //                             // The conviction being voted with, ie `None`, `Locked1x`, `Locked5x`, etc
        //                             conviction: conviction.toString(),
        //                             // The balance they are voting with themselves, sans delegated balance
        //                             balance: {
        //                                 aye:
        //                                     voteDirection.toString() == "Aye"
        //                                         ? Number(balance.toJSON()) / denom
        //                                         : 0,
        //                                 nay:
        //                                     voteDirection.toString() == "Nay"
        //                                         ? Number(balance.toJSON()) / denom
        //                                         : 0,
        //                                 abstain: 0,
        //                             },
        //                             // The total amount of tokens that were delegated to them (including conviction)
        //                             delegatedConvictionBalance:
        //                                 Number(delegationVotes.toString()) / denom,
        //                             // the total amount of tokens that were delegated to them (without conviction)
        //                             delegatedBalance:
        //                                 Number(delegationCapital.toString()) / denom,
        //                             // The vote type, either 'aye', or 'nay'
        //                             voteDirection: voteDirection.toString(),
        //                             // The vote direction type, either "Standard", "Split", or "SplitAbstain"
        //                             voteDirectionType: "Standard",
        //                             // Whether the person is voting themselves or delegating
        //                             voteType: "Casting",
        //                             // Who the person is delegating to
        //                             delegatedTo: null,
        //                         };
        //                     } else if (voteType.isSplit) {
        //                         const { aye, nay } = voteType.asSplit;

        //                         // The formatted vote
        //                         v = {
        //                             // The particular governance track
        //                             track: Number(track.toString()),
        //                             // The account that is voting
        //                             address: address.toString(),
        //                             // The index of the referendum
        //                             referendumIndex: Number(referendumIndex.toString()),
        //                             // The conviction being voted with, ie `None`, `Locked1x`, `Locked5x`, etc
        //                             conviction: "Locked1x",
        //                             // The balance they are voting with themselves, sans delegated balance
        //                             balance: {
        //                                 aye: Number(aye) / denom,
        //                                 nay: Number(nay) / denom,
        //                                 abstain: 0,
        //                             },
        //                             // The total amount of tokens that were delegated to them (including conviction)
        //                             delegatedConvictionBalance:
        //                                 Number(delegationVotes.toString()) / denom,
        //                             // the total amount of tokens that were delegated to them (without conviction)
        //                             delegatedBalance:
        //                                 Number(delegationCapital.toString()) / denom,
        //                             // The vote type, either 'aye', or 'nay'
        //                             voteDirection: aye >= nay ? "Aye" : "Nay",
        //                             // The vote direction type, either "Standard", "Split", or "SplitAbstain"
        //                             voteDirectionType: "Split",
        //                             // Whether the person is voting themselves or delegating
        //                             voteType: "Casting",
        //                             // Who the person is delegating to
        //                             delegatedTo: null,
        //                         };
        //                     } else {
        //                         const voteJSON = voteType.toJSON();

        //                         if (voteJSON["splitAbstain"]) {
        //                             const { aye, nay, abstain } = voteJSON["splitAbstain"];
        //                             // The formatted vote
        //                             v = {
        //                                 // The particular governance track
        //                                 track: Number(track.toString()),
        //                                 // The account that is voting
        //                                 address: address.toString(),
        //                                 // The index of the referendum
        //                                 referendumIndex: Number(referendumIndex.toString()),
        //                                 // The conviction being voted with, ie `None`, `Locked1x`, `Locked5x`, etc
        //                                 conviction: "Locked1x",
        //                                 // The balance they are voting with themselves, sans delegated balance
        //                                 balance: {
        //                                     aye: Number(aye) / denom,
        //                                     nay: Number(nay) / denom,
        //                                     abstain: Number(abstain) / denom,
        //                                 },
        //                                 // The total amount of tokens that were delegated to them (including conviction)
        //                                 delegatedConvictionBalance:
        //                                     Number(delegationVotes.toString()) / denom,
        //                                 // the total amount of tokens that were delegated to them (without conviction)
        //                                 delegatedBalance:
        //                                     Number(delegationCapital.toString()) / denom,
        //                                 // The vote type, either 'aye', or 'nay'
        //                                 voteDirection:
        //                                     abstain >= aye && abstain >= nay
        //                                         ? "Abstain"
        //                                         : aye > +nay
        //                                             ? "Aye"
        //                                             : "Nay",
        //                                 // The vote direction type, either "Standard", "Split", or "SplitAbstain"
        //                                 voteDirectionType: "SplitAbstain",
        //                                 // Whether the person is voting themselves or delegating
        //                                 voteType: "Casting",
        //                                 // Who the person is delegating to
        //                                 delegatedTo: null,
        //                             };
        //                         }
        //                     }
        //                     finishedVotes.push(v);
        //                     refVotes.push(v);
        //                 }
        //             }
        //         }
        //     }
        //     console.log(
        //         `Finished adding ${finishedVotes.length} finished votes for referendum #${referendum.index}`,
        //         {
        //             label: "Democracy",
        //         }
        //     );

        //     // Make a list of the delegations there were at this previous block height
        //     for (const [key, entry] of votingFor) {
        //         // Each of these is the votingFor for an account for a given governance track
        //         // @ts-ignore
        //         const [address, track] = key.toHuman();
        //         // @ts-ignore
        //         if (entry.isDelegating && track == referendum.track) {
        //             // The address is delegating to another address for this particular track
        //             const {
        //                 balance,
        //                 target,
        //                 conviction,
        //                 delegations: {
        //                     votes: delegationVotes,
        //                     capital: delegationCapital,
        //                 },
        //                 prior,
        //                 // @ts-ignore
        //             } = entry.asDelegating;
        //             let effectiveBalance = 0;
        //             switch (conviction) {
        //                 case "None":
        //                     {
        //                         effectiveBalance = (balance / denom) * 0.1;
        //                     }
        //                     break;
        //                 case "Locked1x":
        //                     {
        //                         effectiveBalance = balance / denom;
        //                     }
        //                     break;
        //                 case "Locked2x":
        //                     {
        //                         effectiveBalance = (balance / denom) * 2;
        //                     }
        //                     break;
        //                 case "Locked3x":
        //                     {
        //                         effectiveBalance = (balance / denom) * 3;
        //                     }
        //                     break;
        //                 case "Locked4x":
        //                     {
        //                         effectiveBalance = (balance / denom) * 4;
        //                     }
        //                     break;
        //                 case "Locked5x":
        //                     {
        //                         effectiveBalance = (balance / denom) * 5;
        //                     }
        //                     break;
        //                 case "Locked6x":
        //                     {
        //                         effectiveBalance = (balance / denom) * 6;
        //                     }
        //                     break;
        //             }
        //             const delegation: ConvictionDelegation = {
        //                 track: track,
        //                 address: address.toString(),
        //                 target: target.toString(),
        //                 balance: balance.toString() / denom,
        //                 effectiveBalance: effectiveBalance,
        //                 conviction: conviction.toString(),
        //                 // The total amount of tokens that were delegated to them (including conviction)
        //                 delegatedConvictionBalance: delegationVotes.toString() / denom,
        //                 // the total amount of tokens that were delegated to them (without conviction)
        //                 delegatedBalance: delegationCapital.toString() / denom,
        //                 prior: prior,
        //             };
        //             delegationsAt.push(delegation);
        //         }
        //     }

        //     // Go through the list of delegations and try to find any immediate corresponding direct votes, if there are no immediate delegations, add it to the list of nested delegations.
        //     for (const delegation of delegationsAt) {
        //         // Try and find the delegated vote from the existing votes
        //         const v = refVotes.filter((vote) => {
        //             return (
        //                 vote.referendumIndex == referendum.index &&
        //                 vote.address == delegation.target &&
        //                 vote.track == delegation.track
        //             );
        //         });
        //         if (v.length > 0) {
        //             // There are votes for a given track that a person delegating will have votes for.
        //             for (const vote of v) {
        //                 const voteDirectionType = vote.voteDirectionType;
        //                 const voteDirection = vote.voteDirection;
        //                 let balance;
        //                 switch (voteDirectionType) {
        //                     case "Standard":
        //                         balance = {
        //                             aye:
        //                                 voteDirection == "Aye"
        //                                     ? Number(delegation.balance)
        //                                     : Number(0),
        //                             nay:
        //                                 voteDirection == "Nay"
        //                                     ? Number(delegation.balance)
        //                                     : Number(0),
        //                             abstain: Number(0),
        //                         };
        //                         break;
        //                     case "Split":
        //                         balance = {
        //                             aye:
        //                                 Number(delegation.balance) *
        //                                 (vote.balance.aye /
        //                                     (vote.balance.aye + vote.balance.nay)),
        //                             nay:
        //                                 Number(delegation.balance) *
        //                                 (vote.balance.nay /
        //                                     (vote.balance.aye + vote.balance.nay)),
        //                             abstain: Number(0),
        //                         };
        //                         break;
        //                     case "SplitAbstain":
        //                         const ayePercentage =
        //                             vote.balance.aye /
        //                             (vote.balance.aye +
        //                                 vote.balance.nay +
        //                                 vote.balance.abstain);
        //                         const nayPercentage =
        //                             vote.balance.nay /
        //                             (vote.balance.aye +
        //                                 vote.balance.nay +
        //                                 vote.balance.abstain);
        //                         const abstainPercentage =
        //                             vote.balance.nay /
        //                             (vote.balance.aye +
        //                                 vote.balance.nay +
        //                                 vote.balance.abstain);
        //                         balance = {
        //                             aye: Number(delegation.balance) * ayePercentage,
        //                             nay: Number(delegation.balance) * nayPercentage,
        //                             abstain: Number(delegation.balance) * abstainPercentage,
        //                         };
        //                         break;
        //                 }

        //                 const delegatedVote: ConvictionVote = {
        //                     // The particular governance track
        //                     track: vote.track,
        //                     // The account that is voting
        //                     address: delegation.address,
        //                     // The index of the referendum
        //                     referendumIndex: vote.referendumIndex,
        //                     // The conviction being voted with, ie `None`, `Locked1x`, `Locked5x`, etc
        //                     conviction: delegation.conviction,
        //                     // The balance they are voting with themselves, sans delegated balance
        //                     balance: balance,
        //                     // The total amount of tokens that were delegated to them (including conviction)
        //                     delegatedConvictionBalance:
        //                         delegation.delegatedConvictionBalance,
        //                     // the total amount of tokens that were delegated to them (without conviction)
        //                     delegatedBalance: delegation.delegatedBalance,
        //                     // The vote type, either 'aye', or 'nay'
        //                     voteDirection: vote.voteDirection,
        //                     // Whether the person is voting themselves or delegating
        //                     voteType: "Delegating",
        //                     voteDirectionType: voteDirectionType,
        //                     // Who the person is delegating to
        //                     delegatedTo: vote.address,
        //                 };
        //                 finishedVotes.push(delegatedVote);
        //             }
        //         } else {
        //             // There are no direct delegations, though there may be a nested delegation
        //             nestedDelegations.push(delegation);
        //         }
        //     }

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
            finishedVotes: finishedVotes,
            ongoingVotes: ongoingVotes,
            delegations: allDelegations,
        };
        return convictionVoting;
    } catch (e) {
        console.log(`Error in getConvictionVoting: ${JSON.stringify(e)}`, {
            label: "Democracy",
        });
    }
};

export async function POST(req: NextRequest) {
    let { chain }: { chain: SubstrateChain; refId: string } = await req.json();

    const chainConfig = await getChainByName(chain);
    const { api } = chainConfig;

    if (typeof api === "undefined") {
        throw `can not get api of ${chain}`;
    }

    getConvictionVoting(api)



    // and return here as serializable json (aka strings, numbers, booleans, plain objects, arrays, etc.)
    return NextResponse.json({});
}
