import { useAppStore } from "@/app/zustand";
import { useForm } from "react-hook-form";
import { CollectionConfiguration } from "../types";
import { useState } from "react";
import { TxTypes, sendAndFinalize } from "@/components/util-client";
import { useSubstrateChain } from "@/context/substrate-chain-context";
import { ChainType, SendAndFinalizeResult } from "@/types";
import { ModalBody, ModalFooter, ModalHeader } from "@nextui-org/modal";
import { Input } from "@nextui-org/input";
import { rewardsConfig } from "@/config/rewards";
import { TxButton } from "@/components/TxButton";
import Check from "@w3f/polkadot-icons/keyline/Check";
import { titleCase } from "@/components/util";
import { chain } from "lodash";
import { Button } from "@nextui-org/button";
import { Deposit } from "@/hooks/use-deposit";

type PropType = {
  setCollectionConfig: (config: CollectionConfiguration) => void;
  setIsNewCollectionLoading: (isLoading: boolean) => void;
};

export default function CreateNFTCollectionModal({
  setCollectionConfig,
  setIsNewCollectionLoading,
}: PropType) {
  const [error, setError] = useState({
    message: "",
    name: "",
  });
  const closeModal = useAppStore((state) => state.closeModal);
  const { activeChain } = useSubstrateChain();

  const connectedAccount = useAppStore((state) => state.user.actingAccount);
  const formMethods = useForm({
    defaultValues: {
      name: "",
      description: "",
      imageFile: null,
    },
  });

  const {
    watch,
    register,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = formMethods;

  const watchFormFields = watch();

  const onCancel = () => {
    setCollectionConfig({
      file: watchFormFields.imageFile,
      isNew: false,
    });

    closeModal();
  };

  const onSubmit = async (data: {}) => {
    const res = await new Promise((resolve) => setTimeout(resolve, 2000));
    return res;
    // console.table(data);
    // const formData = new FormData();
    // formData.append(
    //   "data",
    //   JSON.stringify({
    //     collectionName: data.collectionName,
    //     description: data.description,
    //     sender,
    //   })
    // );
    // formData.append("imageFile", data.imageFile?.[0]);
    // setIsLoading(true);
    // //sets in parent form
    // setIsNewCollectionLoading(true);
    // const res = await fetch("/api/create-new-collection/", {
    //   method: "POST",
    //   body: formData,
    // });
    // const { tx, name, message } = await res.json();
    // console.info(`result from create-new-collection:`, {
    //   tx,
    //   name,
    //   message,
    // });
    // if (name === "Error") {
    //   setError({ name, message });
    // }
    // try {
    //   const { status, events, blockHeader } = await signTx(tx);
    //   console.log("status of create collection", {
    //     status,
    //     events,
    //     blockHeader,
    //   });
    //   if (status === "success") {
    //     const newCollectionIdEvent = events.find(
    //       (e) => e.event.section === "nfts" && e.event.method === "Created"
    //     );
    //     const newCollectionId = newCollectionIdEvent?.event?.data[0];
    //     setCollectionConfig({
    //       id: newCollectionId.toPrimitive(),
    //       name: data.name,
    //       description: data.description,
    //       file: data.imageFile,
    //       isNew: true,
    //     });
    //     closeModal();
    //   }
    // } catch (error) {
    //   console.log("error signing transaction", error);
    //   setError({
    //     name: "Error",
    //     message: `Error signing transaction: ${error}`,
    //   });
    // }
    // setIsLoading(false);
    // setIsNewCollectionLoading(false);
  };

  async function signTx(
    tx: TxTypes
  ): Promise<SendAndFinalizeResult | undefined> {
    const user = useAppStore((state) => state.user);
    const { actingAccountSigner: signer, actingAccount } = user;
    const { address } = actingAccount || {};

    if (!address) {
      setError({
        message: "Please connect your wallet to continue.",
        name: "Wallet not connected",
      });
      throw new Error("Wallet not connected");
    }

    // const signatureRes = await sendAndFinalize(
    //   apiKusamaAssetHub,
    //   tx,
    //   signer,
    //   walletAddress,
    //   {
    //     title: "Creating NFT collection",
    //     messages: defaultToastMessages,
    //   }
    // );

    // return signatureRes;
    return;
  }

  return (
    <div className="">
      <ModalHeader className="flex flex-col gap-1">
        Create a new NFT collection on {titleCase(activeChain?.name)} Asset Hub
      </ModalHeader>

      <ModalBody>
        <p className="form-helper text-sm">
          Sending the form will create a new collection on{" "}
          {titleCase(activeChain?.name)} Asset Hub. The metadata of the
          collection (image, name, description) will be set in the next step
          when your rewards transactions are signed.
        </p>

        <form
          className="flex w-full flex-wrap gap-4"
          onSubmit={formMethods.handleSubmit(onSubmit)}
        >
          <Input
            isRequired
            label="Collection Name"
            placeholder="The name of your new collection"
            type="text"
            {...register("name")}
          />
          <Input
            isRequired
            label="Collection Description"
            placeholder="The description of your new collection"
            type="text"
            {...register("description")}
          />

          <div className="text-xs flex flex-col overflow-auto px-3">
            <label
              htmlFor={`imageFile`}
              className="block font-medium text-foreground-600 text-tiny cursor-text will-change-auto origin-top-left transition-all !duration-200 !ease-out motion-reduce:transition-none mb-0 pb-0"
            >
              Collection Image (max 3MB)
            </label>
            <input
              accept={rewardsConfig.acceptedNftFormats.join(",")}
              type="file"
              {...register(`imageFile`)}
            />
          </div>
          {errors.imageFile && (
            <span className="w-full text-sm text-red-500">
              <>{errors.imageFile.message}</>
            </span>
          )}
        </form>
        {error.message && (
          <div className="text-red-500 text-sm">{error.message}</div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button type="button" onClick={onCancel} className="w-full">
          Cancel
        </Button>
        <TxButton
          chainType={ChainType.AssetHub}
          promise={onSubmit}
          color="secondary"
          className="w-full"
          successText="Collection created!"
          extrinsic={[]}
          loadingText="Creating collection..."
          deposits={[
            {
              type: Deposit.Collection,
            },
          ]}
        >
          Create Collection
        </TxButton>
      </ModalFooter>
    </div>
  );
}
