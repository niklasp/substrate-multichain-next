import { gql as agql } from "@apollo/client";

export const QUERY_QUIZZES = agql`
  query QuizzesQuery($where: QuizWhereInput) {
    quizzes(
      where: $where,
      orderBy: timestamp_DESC,
    ) {
      blockNumber
      creator
      id
      referendumIndex
      timestamp
      version
      questions {
        id
        quizId
        text
        indexCorrectAnswerHistory {
          blockNumber
          correctIndex
          id
          questionId
          submitter
          timestamp
          version
        }
        answerOptions {
          id
          questionId
          text
        }
      }
      submissions {
        answers {
          id
        }
        blockNumber
        id
        quizId
        referendumIndex
        timestamp
        version
        wallet
      }
    }
  }
`;

export const GET_GOV2_REF_TITLE_AND_CONTENT = agql`
  query Gov2RefTitleAndContent($limit: Int, $where: posts_bool_exp) {
    posts(limit: $limit, where: $where) {
      title
      content
      onchain_link {
        onchain_referendumv2_id
      }
    }
  }
`;

export const GET_REFERENDUM_NFTS = agql`
query PaginatedNFTQuery(
    $where: nfts_bool_exp, 
    $orderBy: [nfts_order_by!], 
    $distinctNftsDistinctOn2: [nfts_select_column!]
) {
    nfts(
        where: $where, 
        order_by: $orderBy, 
        distinct_on: $distinctNftsDistinctOn2
    ) {
      ...NFT
    }
}
  fragment NFT on nfts {
      id
      collectionId
      metadata_name
      metadata_properties
      metadata_description
      symbol
      resources {
        thumb
      }
  }
`;

export const GET_NFT_FLOOR = agql`
query Referendums($where: nfts_bool_exp, $orderBy: [nfts_order_by!], $limit: Int) {
  nfts(where: $where, order_by: $orderBy, limit: $limit) {
    symbol
    burned
    forsale
    properties
  }
}
`;

export const QUERY_REFERENDUMS = agql`
  query Referendums(
    $where: ReferendumWhereInput,
    $orderBy: [ReferendumOrderByInput!],
    $limit: Int
  ) {
    referendums(where: $where, orderBy: $orderBy, limit: $limit) {
      index
    }
    referendaStats {
      count_aye
      count_nay
      index
      passed_at
      not_passed_at
      executed_at
      cancelled_at
      voted_amount_aye
      voted_amount_nay
      voted_amount_total
      total_issuance
      vote_duration
      referendum_index
      threshold_type
      count_new
      count_total
      ended_at
      ends_at
      status
    }
  }
`;

export const QUERY_VOTES = agql`
  query Votes(
    $where: VoteWhereInput
  ) {
    votes(where: $where) {
      voter
      referendumIndex
      balance {
        ... on SplitVoteBalance {
          aye
          nay
        }
        ... on StandardVoteBalance {
          value
        }
      }
      decision
      lockPeriod
    }
  }
`;

export const QUERY_CONVICTION_VOTES = agql`
  query Query(
    $where: ConvictionVoteWhereInput
  ) {
    convictionVotes(where: $where) {
      referendumIndex
      voter
      balance {
        ... on SplitVoteBalance {
          aye
          nay
        }
        ... on SplitAbstainVoteBalance {
          abstain
          aye
          nay
        }
        ... on StandardVoteBalance {
          value
        }
      }
      lockPeriod
      decision
    }
  }
`;

export const QUERY_USER_VOTE_FOR_REF = agql`
  query Votes($where: VoteWhereInput, $orderBy: [VoteOrderByInput!]) {
    votes(where: $where, orderBy: $orderBy) {
      referendumIndex
      decision
      lockPeriod
      voter
      balance {
        ... on StandardVoteBalance {
          value
        }
        ... on SplitVoteBalance {
          aye
          nay
        }
      }
      timestamp
    }
  }
`;

/**
 * query configs, accept where with index
 * {
  "where": {
    "referendumIndex_eq": null
}
 */
export const QUERY_CONFIG = agql`
  query Configs($where: ConfigWhereInput) {
    configs(
      orderBy: timestamp_DESC,
      where: $where
    ) {
      referendumIndex
      blockNumber
      timestamp
      minValue
      minAmount
      maxValue
      median
      seed
      babyBonus
      toddlerBonus
      adolescentBonus
      adultBonus
      options {
        minProbability
        sweetspotProbability
        rarity
        configId
        id
        maxProbability
        resources(orderBy: id_DESC) {
          id
          itemName
          thumbCid
          metadataCidDirect
          metadataCidDelegated
        }
      }
    }
  }
`;

/**
 * expects
 *     {
      "where": {
        "referendumIndex_eq": refIndex,
        "wallet_eq": wallet
      }
    }
 */
export const QUERY_DISTRIBUTIONS = agql`
  query Distributions($where: DistributionWhereInput) {
    distributions(
      where: $where
      orderBy: distributionVersion_DESC
    ) {
      wallet
      distributionVersion
      referendumIndex
      amountConsidered
      dragonEquipped
      chancesAtItems
      indexItemReceived
    }
  }
`;
