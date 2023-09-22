"use client";

import { useAppStore } from "@/app/zustand";

import { Modal, ModalContent, useDisclosure } from "@nextui-org/modal";

export default function ModalContainer() {
  const modals = useAppStore((state) => state.modals);
  const closeModal = useAppStore((state) => state.closeModal);
  const { view: modalView, isOpen, modalProps } = modals;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={closeModal}
      size="2xl"
      radius="sm"
      {...modalProps}
    >
      <ModalContent>{modalView}</ModalContent>
    </Modal>
  );
}
