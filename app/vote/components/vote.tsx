"use client";

import { chain } from "lodash";
import { UIReferendum } from "../types";
import { SubstrateChain } from "@/types";
import { useSubstrateChain } from "@/context/substrate-chain-context";
import { ChainSwitch } from "@/components/chain-switch";
import { Skeleton } from "@nextui-org/skeleton";
import { ReferendumDetail, ReferendumDetailLoading } from "./referendum-detail";
import ReferendumTracksFilter from "./referendum-tracks-filter";
import { useState } from "react";
import { useUserVotes } from "@/hooks/vote/use-user-votes";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import { useReferenda } from "@/hooks/vote/use-referenda";
import { useVotes } from "@/hooks/vote/use-votes";

export const revalidate = 3600;

interface Props {
    chain: string;
}

const Loading = ({ isLoaded }: { isLoaded: boolean }) => {
    return (
        <>
            {[1, 2, 3, 4, 5].map((i) => (
                <ReferendumDetailLoading key={i} isLoaded={isLoaded} />
            ))}
        </>
    );
};

export default function Votes() {
    const { data: votesAndOtherData, isLoading } = useVotes();
    const { votes } = votesAndOtherData || {};
    const { activeChain } = useSubstrateChain();

    if (isLoading) {
        return <Loading isLoaded={!isLoading} />;
    }

    return (
        <div className="votes-list">
            {votes && votes.length > 0 ? (
                
                <div>
                    <div>no votes</div>
                    {<pre>{JSON.stringify(votes, null, 2)}</pre>}
                </div>
            ) : (
                <div>no votes</div>
            )}
        </div>
    );
}
