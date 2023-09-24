import type { Option } from "@polkadot/types";
import {
  PalletConvictionVotingVoteCasting,
  PalletConvictionVotingVoteVoting,
  PalletReferendaReferendumInfoConvictionVotingTally,
} from "@polkadot/types/lookup";
import {
  RarityDistribution,
  RewardConfiguration,
} from "@/app/[chain]/referendum-rewards/types";
import {
  ConvictionVote,
  DecoratedConvictionVote,
  DirectVoteLock,
  VotePolkadot,
} from "@/types";
import PinataClient from "@pinata/sdk";
import pinataSDK from "@pinata/sdk";
import { BN, BN_ZERO } from "@polkadot/util";
import { getConvictionVoting } from "./get-conviction-voting";
import { ApiDecoration } from "@polkadot/api/types";
import { Lock, PalletReferenda, PalletVote, ReferendumPolkadot } from "@/app/[chain]/vote/types";
import { Decorate } from "@polkadot/api/base/Decorate";
import seedrandom from "seedrandom";
import { rewardsConfig } from "@/config/rewards";
import { ApiPromise } from "@polkadot/api";
import { transformVote } from "@/app/[chain]/vote/util";

const EXPONENT_CONSTANTS = [3, 0.4];

/**
 * Setup Pinata client
 * @returns a Promise<PinataClient> of the Pinata client
 */
export const setupPinata = async (): Promise<PinataClient | null> => {
  const pinata = new pinataSDK(
    process.env.PINATA_API,
    process.env.PINATA_SECRET
  );
  try {
    const result = await pinata.testAuthentication();
    console.info("🤖 Successfully authenticated with Pinata");
    return pinata;
  } catch (err) {
    console.info("🤖 pinata error", err);
    throw new Error("Pinata setup failed");
  }
};

/**
 * Given a referendum index, gets all the votes for that referendum. Also adds annotations that are relevant for the sendout script like the luckbonus and the finally received nft rarity.
 * @param referendumIndex
 * @returns
 */
export const getDecoratedVotesWithInfo = async (
  api: ApiPromise | undefined, // with referenda pallet
  config: RewardConfiguration,
  chainDecimals: BN
): Promise<{
  decoratedVotes: DecoratedConvictionVote[];
  distribution: RarityDistribution;
}> => {
  console.info(`↪ Getting referendum details and all voting wallets`);


  const convictionVoting = await getConvictionVoting(
    api,
    config.refIndex
  );

  let votes: DecoratedConvictionVote[] = [];
  let totalIssuance: string | undefined;
  let referendum: ReferendumPolkadot | undefined;

  if (convictionVoting) {
    ({ referendum, totalIssuance, referendaVotes: votes } = convictionVoting)
  }

  // start decorating the votes with additional information
  // TODO rename all below to decorateWith...

  console.info(
    `↪ Getting locks for referendum ${config.refIndex} with ${votes.length} votes.`
  );


  if (!referendum?.endedAt) {
    throw new Error("No endedAt Block on Referendum");
  }
  if (!referendum?.track) {
    throw new Error("No track on Referendum");
  }
  if (!totalIssuance) {
    throw new Error("No Total Issuance");
  }
  // 1. decorate `lockedWithConviction` - relevant info we consider instead of the vote * locked
  votes = await retrieveAccountLocks(
    api,
    votes,
    parseInt(referendum?.endedAt),
    parseInt(referendum?.track)
  );

  // logger.info(`↪ Applying bonuses for referendum ${config.refIndex}.`)

  // 2. decorate with bonuses
  votes = applyBonusesFor("encointer", votes);
  votes = applyBonusesFor("dragon", votes);
  votes = applyBonusesFor("quiz", votes);

  console.info(
    `↪ Checking for votes meeting requirements for referendum ${config.refIndex} with ${votes.length} votes.`
  );

  // 3. decorate `meetsRequirements` - whether vote > threshold
  votes = await checkVotesMeetingRequirements(
    votes,
    totalIssuance,
    config,
    chainDecimals
  );

  console.info(
    `↪ calculating distribution for referendum ${config.refIndex} with ${votes.length} votes.`
  );

  // 4. get global min, max, median values for calculating the final rarity
  const {
    votesMeetingRequirements,
    votesNotMeetingRequirements,
    lowerLimitOfCurve,
    upperLimitOfCurve,
    medianOfCurve,
    minLockedWithConviction,
    maxLockedWithConviction,
  } = getVoteInfo(votes, config);

  console.info(
    `📊 Total votes: ${votes.length}, votes meeting requirements: ${votesMeetingRequirements.length}, votes not meeting requirements: ${votesNotMeetingRequirements.length}`
  );
  console.info(
    `📊 Max locked with conviction meeting requirements: ${maxLockedWithConviction}KSM, min locked with conviction meeting requirements: ${minLockedWithConviction}KSM`
  );
  console.info(
    `📊 This is the range of values used to compute the median as well as lower and upper limits of the 'luck' curve`
  );
  console.info(
    `📊 Computed lower limit of curve: ${lowerLimitOfCurve}KSM, upper limit of curve: ${upperLimitOfCurve}KSM, median of curve: ${medianOfCurve}KSM`
  );

  // 5. decorate with chances. E.g. chances: { common: 0.5, rare: 0.3, epic 0.2}
  console.info(`🎲 Calculating NFT probabilities and distribution`);
  const decoratedWithChancesVotes = decorateWithChances(
    votes,
    config,
    lowerLimitOfCurve,
    upperLimitOfCurve,
    medianOfCurve
    // logger
  );
  votes = decoratedWithChancesVotes.votesWithChances;

  if (rewardsConfig.rewardsFilter.length > 0) {
    votes = votes.filter((vote) =>
      rewardsConfig.rewardsFilter.includes(vote.address.toString())
    );

    console.warn(
      `🚨🚨🚨  TESTING, filtered votes to only send to ${votes.length} votes for referendum ${config.refIndex}`
    );
  }

  return {
    decoratedVotes: votes,
    distribution: decoratedWithChancesVotes.distribution,
  };
};

// Helper function to get locks
const getLocks = (
  api: ApiDecoration<"promise">,
  palletVote: PalletVote,
  votes: [
    classId: BN,
    refIds: BN[],
    casting: PalletConvictionVotingVoteCasting
  ][],
  referenda: [BN, PalletReferendaReferendumInfoConvictionVotingTally][]
): DirectVoteLock[] => {
  const lockPeriod = api.consts[palletVote].voteLockingPeriod as unknown as BN;
  const locks: DirectVoteLock[] = [];

  votes.forEach(([classId, , casting]) => {
    casting.votes.forEach(([refId, accountVote]) => {
      const refInfo = referenda.find(([id]) => id.eq(refId));

      if (refInfo) {
        const [, tally] = refInfo;
        let total: BN | undefined;
        let endBlock: BN | undefined;
        let conviction = 0;
        let locked = "None";

        // Process account vote based on its type
        if (accountVote.isStandard) {
          const { balance, vote } = accountVote.asStandard;
          total = balance;
          if (
            (tally.isApproved && vote.isAye) ||
            (tally.isRejected && vote.isNay)
          ) {
            conviction = vote.conviction.index;
            locked = vote.conviction.type;
          }
        } else if (accountVote.isSplit) {
          const { aye, nay } = accountVote.asSplit;
          total = aye.add(nay);
        } else if (accountVote.isSplitAbstain) {
          const { abstain, aye, nay } = accountVote.asSplitAbstain;
          total = aye.add(nay).add(abstain);
        } else {
          console.error(`Unable to handle ${accountVote.type}`);
        }

        // Calculate end block based on tally type
        if (tally.isOngoing) {
          endBlock = new BN(0);
        } else if (tally.isKilled) {
          endBlock = tally.asKilled;
        } else if (tally.isCancelled || tally.isTimedOut) {
          endBlock = tally.isCancelled
            ? tally.asCancelled[0]
            : tally.asTimedOut[0];
        } else if (tally.isApproved || tally.isRejected) {
          endBlock = lockPeriod
            .muln(conviction)
            .add(tally.isApproved ? tally.asApproved[0] : tally.asRejected[0]);
        } else {
          console.error(`Unable to handle ${tally.type}`);
        }

        if (total && endBlock) {
          // @ts-ignore
          locks.push({ classId, endBlock, locked, refId, total });
        }
      }
    });
  });

  return locks;
};

// Helper function to calculate bonuses for wallets that meet the requirements
const applyBonusesFor = (
  bonusName: String,
  votes: DecoratedConvictionVote[]
): DecoratedConvictionVote[] => {
  //TODO this is a stub
  return votes;
};

/**
 * Check if votes meet the specified requirements.
 * @param votes Array of VoteConvictionDragon objects.
 * @param totalIssuance Total issuance as a string.
 * @param config Configuration object with min, max, directOnly, and first properties.
 * @returns Array of VoteCheckResult objects containing meetsRequirements property.
 */
export const checkVotesMeetingRequirements = async (
  votes: DecoratedConvictionVote[],
  totalIssuance: string,
  config: RewardConfiguration,
  chainDecimals: BN
): Promise<DecoratedConvictionVote[]> => {
  console.log("totalIssuance", totalIssuance)
  console.log("chain", chainDecimals.toString())
  console.log(config.min)
  console.log(config.max)
  const minRequiredLockedWithConvicition = BN.max(
    new BN(config.min),
    new BN("0")
  );
  const maxAllowedLockedWithConvicition = BN.min(
    new BN(config.max),
    new BN(totalIssuance)
  );

  config.minRequiredLockedWithConviction = getDecimal(
    minRequiredLockedWithConvicition.toString(),
    chainDecimals
  );
  console.log("min", config.minRequiredLockedWithConviction)
  config.maxAllowedLockedWithConviction = getDecimal(
    maxAllowedLockedWithConvicition.toString(),
    chainDecimals
  );
  console.log("max", config.maxAllowedLockedWithConviction)


  const filtered: DecoratedConvictionVote[] = votes.map((vote, i) => {
    const meetsRequirements = !(
      vote.lockedWithConviction?.lt(minRequiredLockedWithConvicition) ||
      vote.lockedWithConviction?.gt(maxAllowedLockedWithConvicition) ||
      (config.directOnly && vote.voteType === "Delegating") ||
      (config.first !== null && i > config.first)
    );

    const lockedWithConvictionDecimal = getDecimal(
      vote.lockedWithConviction?.toString(),
      chainDecimals
    );

    return { ...vote, meetsRequirements, lockedWithConvictionDecimal };
  });

  return filtered;
};

export const getDecimal = (bigNum: string | undefined, chainDecimals: BN) => {
  if (!bigNum) return 0;
  const base = new BN(10);
  return new BN(bigNum).div(base.pow(chainDecimals)).toNumber();
};

/**
 * Retrieve account locks for the given votes and endBlock.
 * @param votes Array of ConvictionVote objects.
 * @param endBlock The block number to calculate locked balances.
 * @returns Array of VoteWithLock objects containing lockedWithConviction property.
 */
export const retrieveAccountLocks = async (
  api: ApiPromise | undefined,
  votes: ConvictionVote[],
  endBlock: number,
  track: number
): Promise<DecoratedConvictionVote[]> => {
  const apiAt = await getApiAt(api, endBlock);
  const locks = [1, 10, 20, 30, 40, 50, 60];
  const lockPeriods = [0, 1, 2, 4, 8, 16, 32];
  const convictionOptions: string[] = [
    "None",
    "Locked1x",
    "Locked2x",
    "Locked3x",
    "Locked4x",
    "Locked5x",
    "Locked6x",
  ];
  const sevenDaysBlocks: BN = apiAt.consts.convictionVoting.voteLockingPeriod;

  const endBlockBN = new BN(endBlock);
  const promises = votes.map(async (vote) => {
    let directLocks = await useAccountLocksImpl(
      apiAt,
      "referenda",
      "convictionVoting",
      vote.address.toString()
    );

    // get userDelegations for this track
    const convictionVotesAccount = await apiAt.query.convictionVoting?.votingFor(
      vote.address.toString(),
      track
    );

    const accountVote: VotePolkadot = transformVote(vote.address.toString(), track, convictionVotesAccount)
    let delegatedLock: Lock = { endBlock: new BN(0), total: new BN(0) };

    if (accountVote.voteData.isDelegating) {
      const delegating = accountVote?.voteData.asDelegating;

      // Find the lock period corresponding to the conviction
      const convictionIndex = convictionOptions.indexOf(delegating.conviction.type);
      const lockPeriod = lockPeriods[convictionIndex];
      // Calculate the end block
      const endBlock: BN = sevenDaysBlocks
        .mul(new BN(lockPeriod))
        .add(endBlockBN);

      // Check if the balance is in hexadecimal format and convert if necessary
      // let balanceValue = delegating.balance.toString();
      // if (balanceValue.startsWith("0x")) {
      //   balanceValue = parseInt(balanceValue, 16).toString();
      // }
      // const total: BN = new BN(balanceValue);

      delegatedLock = { endBlock, total: delegating.balance };
    }

    //add the delegationBalanceWithConviction
    const userLocks =
      delegatedLock?.endBlock.gtn(0)
        ? [...directLocks, delegatedLock]
        : directLocks;

    const userLockedBalancesWithConviction = userLocks
      .filter(
        (userVote) =>
          userVote.endBlock.sub(endBlockBN).gte(new BN(0)) ||
          userVote.endBlock.eqn(0)
      )
      .map((userVote) => {
        const userLockPeriods = userVote.endBlock.eqn(0)
          ? 0
          : Math.floor(
            userVote.endBlock
              .sub(endBlockBN)
              .muln(10)
              .div(sevenDaysBlocks)
              .toNumber() / 10
          );
        const matchingPeriod = lockPeriods.reduce(
          (acc, curr, index) => (userLockPeriods >= curr ? index : acc),
          0
        );
        return userVote.total.muln(locks[matchingPeriod]).div(new BN(10));
      });

    const maxLockedWithConviction =
      userLockedBalancesWithConviction.length > 0
        ? userLockedBalancesWithConviction.reduce((max, current) =>
          BN.max(max, current)
        )
        : new BN(0);

    return { ...vote, lockedWithConviction: maxLockedWithConviction };
  });

  return await Promise.all(promises);
};

const getVoteInfo = (
  votes: DecoratedConvictionVote[],
  config: RewardConfiguration
): {
  votesMeetingRequirements: DecoratedConvictionVote[];
  votesNotMeetingRequirements: DecoratedConvictionVote[];
  lowerLimitOfCurve: number;
  upperLimitOfCurve: number;
  medianOfCurve: number;
  minLockedWithConviction: number;
  maxLockedWithConviction: number;
} => {
  const votesMeetingRequirements = votes.filter((vote) => {
    return vote.meetsRequirements;
  });

  const votesNotMeetingRequirements = votes.filter((vote) => {
    return !vote.meetsRequirements;
  });

  // Get the median and normalize min vote to threshold
  const threshold = config.minAmount;
  const consideredVotes = votesMeetingRequirements
    .filter((vote) => typeof vote.lockedWithConvictionDecimal !== "undefined")
    .map((vote) => vote.lockedWithConvictionDecimal as number);
  const {
    generatedLowerLimit: lowerLimitOfCurve,
    generatedUpperLimit: upperLimitOfCurve,
    median: medianOfCurve,
    min: minLockedWithConviction,
    max: maxLockedWithConviction,
  } = getLimitsAndMinMaxMedian(consideredVotes, threshold);

  return {
    votesMeetingRequirements,
    votesNotMeetingRequirements,
    lowerLimitOfCurve,
    upperLimitOfCurve,
    medianOfCurve,
    minLockedWithConviction,
    maxLockedWithConviction,
  };
};

/**
 * Calculate the minimum, maximum, and median values of an array of vote amounts, considering only those above a critical value.
 * @param voteAmounts An array of vote amounts.
 * @param criticalValue The critical value to filter the vote amounts.
 * @returns An object containing the minimum, maximum, and median values.
 */
export const getLimitsAndMinMaxMedian = (
  voteAmounts: number[],
  criticalValue: number
): {
  generatedUpperLimit: number;
  generatedLowerLimit: number;
  min: number;
  max: number;
  median: number;
} => {
  const min = Math.min(...voteAmounts);
  const max = Math.max(...voteAmounts);
  if (voteAmounts.length < 4) {
    return {
      generatedUpperLimit: max,
      generatedLowerLimit: min,
      max,
      min,
      median: voteAmounts[Math.floor(voteAmounts.length / 2)],
    };
  }

  const filteredVotes = voteAmounts.filter((vote) => vote > criticalValue);

  let values, q1, q3, iqr, generatedLowerLimit, generatedUpperLimit, median;

  values = filteredVotes.slice().sort((a, b) => a - b); // Copy array and sort
  if ((values.length / 4) % 1 === 0) {
    // Find quartiles
    q1 = (1 / 2) * (values[values.length / 4] + values[values.length / 4 + 1]);
    q3 =
      (1 / 2) *
      (values[values.length * (3 / 4)] + values[values.length * (3 / 4) + 1]);
  } else {
    q1 = values[Math.floor(values.length / 4 + 1)];
    q3 = values[Math.ceil(values.length * (3 / 4) + 1)];
  }

  if ((values.length / 2) % 1 === 0) {
    // Find median
    median =
      (1 / 2) * (values[values.length / 2] + values[values.length / 2 + 1]);
  } else {
    median = values[Math.floor(values.length / 2 + 1)];
  }

  iqr = q3 - q1;
  generatedUpperLimit = q3 + iqr * 1.5;
  generatedLowerLimit = Math.max(q1 - iqr * 1.5, criticalValue);

  return { generatedLowerLimit, generatedUpperLimit, min, max, median };
};

/**
 * Decorates the votes with two additional properties:
 * `chances` which is an object with the rarity as key and the chance as value.
 * `chosenOption` which is the option (NFT option with rarity) that was chosen for the voter.
 * @param votes
 * @param config
 * @param minVoteValue
 * @param maxVoteValue
 * @param medianVoteValue
 * @param seed
 * @returns
 */
const decorateWithChances = (
  votes: DecoratedConvictionVote[],
  config: RewardConfiguration,
  lowerLimitOfCurve: number,
  upperLimitOfCurve: number,
  medianOfCurve: number,
  seed: number = 0
  // logger: Logger
): {
  votesWithChances: DecoratedConvictionVote[];
  distribution: RarityDistribution;
} => {
  //seed the randomizer
  const rng = seedrandom(seed.toString());

  config.lowerLimitOfCurve = lowerLimitOfCurve;
  config.upperLimitOfCurve = upperLimitOfCurve;
  config.medianOfCurve = medianOfCurve;

  const rarityDistribution: Record<string, number> = {};

  let votesWithChances = votes.map((vote) => {
    let chances = lucksForConfig(
      vote.lockedWithConvictionDecimal ?? 0,
      config,
      1.0
    );
    let chosenRarity = weightedRandom(
      rng,
      Object.keys(chances),
      Object.values(chances)
    );
    const chosenOption = config.options.find(
      (option) => option.rarity === chosenRarity
    );

    // Count the distribution
    rarityDistribution[chosenRarity] = rarityDistribution[chosenRarity]
      ? rarityDistribution[chosenRarity] + 1
      : 1;

    return { ...vote, chances, chosenOption };
  });

  //TODO this is not generic
  const invariantHolds =
    rarityDistribution["common"] > rarityDistribution["rare"] * 4 &&
    rarityDistribution["rare"] > rarityDistribution["epic"] * 2;

  if (invariantHolds) {
    console.log(
      `✅ Distribution invariant holds for ${JSON.stringify(
        rarityDistribution
      )} after ${seed} iterations.`
    );
    config.seed = seed.toString();
    return { votesWithChances, distribution: rarityDistribution };
  } else {
    return decorateWithChances(
      votes,
      config,
      lowerLimitOfCurve,
      upperLimitOfCurve,
      medianOfCurve,
      ++seed
      // logger
    );
  }
};

export const getApiAt = async (
  api: ApiPromise | undefined,
  blockNumber: number | undefined | null
): Promise<ApiDecoration<"promise">> => {
  if (!api) throw new Error("Api is not defined");
  if (!blockNumber) return api;
  const blockHash =
    (await api?.rpc.chain.getBlockHash(blockNumber)).toString() || {}.toString();
  return await api?.at(blockHash);
};

// Main function to get account locks
export async function useAccountLocksImpl(
  api: ApiDecoration<"promise">,
  palletReferenda: PalletReferenda,
  palletVote: PalletVote,
  accountId: string
): Promise<DirectVoteLock[]> {
  //@ts-ignore
  const locks: [BN, BN][] = await api.query[palletVote]?.classLocksFor(
    accountId
  );
  const lockClassesFormatted: BN[] = locks.map(([classId]) => classId);
  const voteParams = getVoteParams(accountId, lockClassesFormatted) || [[]];
  let [params]: [[string, BN][]] = voteParams;
  // TODO
  const votes: PalletConvictionVotingVoteVoting[] =
    await api?.query.convictionVoting?.votingFor.multi(params);
  const votesFormatted = votes
    .map((v, index): null | [BN, BN[], PalletConvictionVotingVoteCasting] => {
      if (!v.isCasting) {
        return null;
      }

      const casting = v.asCasting;

      return [params[index][1], casting.votes.map(([refId]) => refId), casting];
    })
    .filter((v): v is [BN, BN[], PalletConvictionVotingVoteCasting] => !!v);

  if (votesFormatted.length === 0) {
    return [];
  }
  const refParams: [BN[]] = getRefParams(votesFormatted) || [[]];
  if (!refParams) {
    return [];
  }

  const [paramsref]: [BN[]] = refParams;
  const optTally: Option<PalletReferendaReferendumInfoConvictionVotingTally>[] =
    await api.query.referenda?.referendumInfoFor.multi(paramsref);

  const referendaFormatted = optTally
    .map(
      (
        v,
        index
        // TODO
      ): null | [BN, PalletReferendaReferendumInfoConvictionVotingTally] =>
        v.isSome ? [paramsref[index], v.unwrap()] : null
    )
    .filter(
      (v): v is [BN, PalletReferendaReferendumInfoConvictionVotingTally] => !!v
    );

  // Combine the referenda outcomes and the votes into locks
  return getLocks(api, palletVote, votesFormatted, referendaFormatted);
}

/**
 * return the chances array
 */
const lucksForConfig = (
  ksm: number,
  refConfig: RewardConfiguration,
  luckMultiplier: number
): Record<string, number> => {
  const lucks: Record<string, number> = {};

  if (ksm < (refConfig.lowerLimitOfCurve ?? 0)) {
    return {
      common: 100,
      rare: 0,
      epic: 0,
    };
  }

  //do not calc luck for the last to items (common, default)
  //will be done below
  //TODO will have to find a filter that will filter the correct items
  const optionsToConsider = refConfig?.options.filter(
    (opt) => opt.rarity !== "common"
  );

  optionsToConsider?.forEach((option) => {
    if (ksm < (refConfig.medianOfCurve || 0)) {
      lucks[`${option.rarity}`] = calculateLuck(
        ksm,
        refConfig.lowerLimitOfCurve ?? 0,
        refConfig.medianOfCurve ?? 0,
        option.minProbability ?? 0,
        //this was before the sweetspot probability
        (option.maxProbability ?? 0 + (option.minProbability ?? 0)) / 2,
        EXPONENT_CONSTANTS[0],
        luckMultiplier
      );
    } else {
      lucks[`${option.rarity}`] = calculateLuck(
        ksm,
        refConfig.medianOfCurve ?? 0,
        refConfig.upperLimitOfCurve ?? 0,
        option.maxProbability ?? 0 + (option.minProbability ?? 0) / 2,
        option.maxProbability ?? 0,
        EXPONENT_CONSTANTS[1],
        luckMultiplier
      );
    }
  });

  // // console.log("final lucks before normalization:", lucks)

  lucks.rare = ((100 - lucks.epic) / 100) * lucks.rare;
  lucks.common = 100 - lucks.rare - lucks.epic;

  return lucks;
};

/**
 * Calculate the chances for a given ksm vote value and given options
 * @param n the ksm vote value
 * @param minIn
 * @param maxIn
 * @param minOut
 * @param maxOut
 * @param exponent
 * @param luckMultiplier
 * @returns a probability between 0 and 100
 */
const calculateLuck = (
  n: number,
  minIn: number,
  maxIn: number,
  minOut: number,
  maxOut: number,
  exponent: number,
  luckMultiplier: number
): number => {
  if (n > maxIn) {
    n = maxOut;
  } else if (n < minIn) {
    n = minOut;
  } else {
    // unscale input
    n -= minIn;
    n /= maxIn - minIn;
    n = Math.pow(n, exponent);
    // scale output
    n *= maxOut - minOut;
    n += minOut;
  }
  return n * luckMultiplier;
};

/**
 * Get a random item from an array of items based on weights
 * @param {*} rng random number generator
 * @param {*} items array of items
 * @param {*} weights array of weights
 * @returns item
 */
function weightedRandom<T>(
  rng: seedrandom.PRNG,
  items: T[],
  weights: number[]
) {
  var i;

  for (i = 1; i < weights.length; i++) weights[i] += weights[i - 1];

  var random = rng() * weights[weights.length - 1];

  for (i = 0; i < weights.length; i++) if (weights[i] > random) break;

  return items[i];
}

// Helper function to get vote parameters
const getVoteParams = (
  accountId: string,
  lockClasses?: BN[]
): [[accountId: string, classId: BN][]] | undefined => {
  if (lockClasses) {
    return [lockClasses.map((classId) => [accountId, classId])];
  }
  return undefined;
};

// Helper function to get referendum parameters
const getRefParams = (
  votes?: [
    classId: BN,
    refIds: BN[],
    casting: PalletConvictionVotingVoteCasting
  ][]
): [BN[]] | undefined => {
  if (votes && votes.length) {
    const refIds = votes.reduce<BN[]>(
      (all, [, refIds]) => all.concat(refIds),
      []
    );
    if (refIds.length) {
      return [refIds];
    }
  }
  return undefined;
};

// Returns the denomination of the chain. Used for formatting planck denomianted amounts
export const getDenom = async (
  api: ApiPromise | undefined
): Promise<number> => {
  const base = new BN(10);
  const exponent = api?.registry.chainDecimals || 1;
  const denom = base.pow(new BN(exponent)).toNumber();
  return denom;
};
