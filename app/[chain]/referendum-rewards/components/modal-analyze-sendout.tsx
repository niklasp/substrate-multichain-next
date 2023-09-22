import { useAppStore } from "@/app/zustand";
import { useForm } from "react-hook-form";
import { CollectionConfiguration, GenerateRewardsResult } from "../types";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { TxTypes, sendAndFinalize } from "@/components/util-client";
import { useSubstrateChain } from "@/context/substrate-chain-context";
import { ChainType, SendAndFinalizeResult } from "@/types";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalProps,
} from "@nextui-org/modal";
import { Input } from "@nextui-org/input";
import { rewardsConfig } from "@/config/rewards";
import { TxButton } from "@/components/TxButton";
import Check from "@w3f/polkadot-icons/keyline/Check";
import { titleCase } from "@/components/util";
import { chain } from "lodash";
import { Button } from "@nextui-org/button";
import { Deposit } from "@/hooks/use-deposit";
import { getTxCollectionCreate } from "@/config/txs";

type PropType = Omit<ModalProps, "children"> & {
  sendoutData: GenerateRewardsResult;
};

export default function ModalAnalyzeSendout({
  sendoutData,
  ...props
}: PropType) {
  const { isOpen, onOpenChange } = props;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="top-center"
      size="2xl"
      radius="sm"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Analzye Reward Sendout
            </ModalHeader>

            <ModalBody>
              <pre className="text-tiny">
                {JSON.stringify(sendoutData, null, 2)}
              </pre>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onClose}>Close</Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
