"use client";

import { ModalBody, ModalHeader } from "@nextui-org/modal";
import { UIReferendum } from "../types";
import { useReferendumDetail } from "@/hooks/vote/use-referendum-detail";
import { useSubstrateChain } from "@/context/substrate-chain-context";
import { useAccountBalance } from "@/hooks/use-account-balance";
import { ReferendumVoteForm } from "./referendum-vote-form";

export default function ReferendumVoteModal({
  referendum,
}: {
  referendum: UIReferendum;
}) {
  const { index, title } = referendum;
  const { activeChain } = useSubstrateChain();
  const { data: balance } = useAccountBalance();
  return (
    <>
      <ModalHeader>
        <h1 className="text-xl flex items-center">
          <span className="mr-2">
            {activeChain && <activeChain.icon width={50} height={50} />}
          </span>
          Vote on Referendum {index}
        </h1>
      </ModalHeader>
      <ModalBody>
        <div className="mt-2">{title}</div>
        <ReferendumVoteForm referendumId={index} />
      </ModalBody>
    </>
  );
}
