import type {
  PalletReferendaReferendumInfoConvictionVotingTally,
  PalletReferendaReferendumInfoRankedCollectiveTally,
  PalletReferendaTrackInfo,
} from "@polkadot/types/lookup";
import type { BN } from "@polkadot/util";
import { u32 } from "@polkadot/types";

export type PalletReferenda =
  | "referenda"
  | "rankedPolls"
  | "fellowshipReferenda";

export type PalletVote =
  | "convictionVoting"
  | "rankedCollective"
  | "fellowshipCollective";

export interface ReferendaGroup {
  key: string;
  track?: PalletReferendaTrackInfo;
  trackGraph?: CurveGraph;
  trackId?: BN;
  trackName?: string;
  referenda?: Referendum[];
}

export interface ReferendaGroupKnown extends ReferendaGroup {
  referenda: Referendum[];
}

export interface Referendum {
  decidingEnd?: BN;
  id: BN;
  info:
    | PalletReferendaReferendumInfoConvictionVotingTally
    | PalletReferendaReferendumInfoRankedCollectiveTally;
  isConvictionVote: boolean;
  key: string;
  track?: PalletReferendaTrackInfo;
  trackId?: BN;
  trackGraph?: CurveGraph;
}

export interface ReferendumProps {
  className?: string;
  activeIssuance?: BN;
  isMember: boolean;
  members?: string[];
  onExpand?: () => void;
  palletReferenda: PalletReferenda;
  palletVote: PalletVote;
  ranks?: BN[];
  trackInfo?: TrackInfo;
  value: Referendum;
}

export interface Summary {
  deciding?: BN;
  refActive?: number;
  refCount?: BN;
}

export interface CurveGraph {
  approval: BN[];
  support: BN[];
  x: BN[];
}

export interface TrackDescription {
  graph: CurveGraph;
  id: BN;
  info: PalletReferendaTrackInfo;
}

export interface TrackInfo {
  compare?: (input: BN) => boolean;
  origin: Record<string, string> | Record<string, string>[];
  text?: string;
}

export interface TrackInfoExt extends TrackInfo {
  track: TrackDescription;
  trackName: string;
}

export interface Lock {
  classId: BN;
  endBlock: BN;
  locked: string;
  refId: BN;
  total: BN;
}

export type ReferendaStatus =
  | "ongoing"
  | "cancelled"
  | "approved"
  | "rejected"
  | "timedOut";

export interface ReferendumPolkadot {
  index: string;
  status: ReferendaStatus;
  endsAt?: string;
  endedAt?: string;
  track?: string;
  trackId?: string;
  tally?: {
    ayes: string;
    nays: string;
    support: string;
    total: string;
  };
  deciding: any;
  decisionDeposit: string;
  enactment: string;
  origin: any;
  proposal: string;
  submissionDeposit: any;
  submitted: string;
  createdAtHash: string;
}

export interface ReferendumPolkassembly {
  title?: string;
  content?: string;
  proposer?: string;
  requested?: string;
  tags?: string[];
  proposed_call?: {
    method: string;
    args: any;
    description: string;
    section: string;
  };
}

export interface UIReferendum
  extends ReferendumPolkadot,
    ReferendumPolkassembly {}

export interface UITrack {
  id: string;
  name: string;
  maxDeciding: string;
  decisionDeposit: string;
  preparePeriod: string;
  decisionPeriod: string;
  confirmPeriod: string;
  minEnactmentPeriod: string;
  minApproval: any;
  minSupport: any;
  text?: string;
}
