"use client";

import { useReferenda } from "@/hooks/vote/use-referenda";
import { Input } from "@nextui-org/input";
import { Select, SelectItem, SelectSection } from "@nextui-org/select";
import { useEffect, useState } from "react";
import { useReferendumDetail } from "@/hooks/vote/use-referendum-detail";
import { InlineLoader } from "@/components/inline-loader";
import { Button } from "@nextui-org/button";
import { RewardsCreationRarityFields } from "./rewards-rarity-fields";
import { rewardsConfig } from "@/config/rewards";
import { vividButtonClasses } from "@/components/primitives";
import clsx from "clsx";
import { FormProvider, useForm } from "react-hook-form";
import { rewardsSchema, validateAddress } from "../util";
import { SubstrateChain } from "@/types";
import { getChainInfo } from "@/config/chains";
import { ZodType, z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSubstrateChain } from "@/context/substrate-chain-context";
import { useAppStore } from "@/app/zustand";
import CreateNFTCollectionModal from "./modal-new-collection";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@nextui-org/modal";
import ModalCreateNFTCollection from "./modal-new-collection";

export default function RewardsCreationForm({
  chain,
}: {
  chain: SubstrateChain;
}) {
  const { ss58Format, name } = getChainInfo(chain);
  const chainRewardsSchema = rewardsSchema(name, ss58Format);
  type TypeRewardsSchema = z.infer<typeof chainRewardsSchema>;
  const { defaultReferendumRewardsConfig } = rewardsConfig;

  // const openModal = useAppStore((state) => state.openModal);

  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const [isNewCollectionLoading, setIsNewCollectionLoading] = useState(false);
  // const [formStep, setFormStep] = useState(0);
  // const nextFormStep = () => setFormStep((currentStep) => currentStep + 1);
  // const prevFormStep = () => setFormStep((currentStep) => currentStep - 1);

  const formMethods = useForm<TypeRewardsSchema>({
    resolver: zodResolver(chainRewardsSchema),
    defaultValues: defaultReferendumRewardsConfig,
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    getValues,
    setValue,
    watch,
    setError,
  } = formMethods;
  const { activeChain } = useSubstrateChain();

  const watchFormFields = watch();

  useEffect(() => {
    console.log("errors", errors);
  }, [errors]);

  const {
    data: { referenda: pastReferenda } = {
      referenda: [],
    },
    isLoading: isPastReferendaLoading,
  } = useReferenda("past", false);

  const [refIndex, setRefIndex] = useState<number>(-1);
  const { data: referendumDetail, isLoading: isReferendumDetailLoading } =
    useReferendumDetail(refIndex.toString());

  // function is passed to the modal in order to change the state of the form fields
  function setCollectionConfig(collectionConfig: CollectionConfiguration) {
    setValue("collectionConfig", {
      ...watchFormFields.collectionConfig,
      ...collectionConfig,
    });
  }

  function onModalOpenChange(isOpen: boolean) {
    console.log("modalOpenChange", isOpen);
    onOpenChange(isOpen);
  }

  // function onModalClose(): void {
  //   console.log("modalClosed");
  //   setIsNewCollectionLoading(false);
  //   onClose();
  // }

  async function createNewCollection() {
    setIsNewCollectionLoading(true);
    onOpen();
    // openModal(
    //   <CreateNFTCollectionModal
    //     setCollectionConfig={setCollectionConfig}
    //     setIsNewCollectionLoading={setIsNewCollectionLoading}
    //   />,
    //   {

    //     children: <></>,
    //   }
    // );
  }

  async function onSubmit(data: TypeRewardsSchema) {
    // const result = await createRewards(data);
    // console.log("result", result);

    const formData = new FormData();
    formData.append("rewardConfig", JSON.stringify(data));
    formData.append("chain", chain);
    data.options?.forEach((option) => {
      if (!option.imageCid && option.file?.[0]) {
        console.log("option file", option.file[0]);
        formData.append(
          `${option.rarity}File`,
          option.file[0],
          option.file[0].name
        );
      }
    });
    const response = await fetch("/api/rewards", {
      method: "POST",
      body: formData,
    });
    const responseData = await response.json();
    console.log("responseData", responseData);

    // if (!response.ok) {
    //   console.log(responseData);
    //   return;
    // }
    // if (responseData.errors) {
    //   const errors = responseData.errors;
    //   if (errors.criteria) {
    //     setError("criteria", {
    //       type: "server",
    //       message: errors.criteria,
    //     });
    //   } else if (errors.refIndex) {
    //     setError("refIndex", {
    //       type: "server",
    //       message: errors.refIndex,
    //     });
    //   }
    //   //TODO expand
    //   console.log("errors form server", errors);
    // }
  }

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={handleSubmit(onSubmit)} className="test">
        <h3 className="mb-4 text-lg">What should be rewarded?</h3>
        <div className="flex mb-4 min-h-[100px]">
          <div className="hidden md:flex md:w-1/3 text-xs pr-8">
            At the moment we support rewarding participation in OpenGov
            Referenda. All participants of your selected referendum will receive
            1 of the NFTs you set below.
          </div>
          <div className="w-full md:w-2/3 flex gap-4 flex-wrap md:flex-nowrap">
            <Select
              classNames={{
                label: "after:content-['*'] after:text-danger after:ml-0.5",
              }}
              className="w-full md:w-1/2"
              label="Reward Criteria"
              placeholder={"Select Reward Criteria"}
              disabledKeys={[
                "criteria",
                "aye",
                "first",
                "reputable",
                "extrinsic",
              ]}
              isInvalid={!!errors.criteria}
              errorMessage={!!errors.criteria && `${errors.criteria?.message}`}
              {...register("criteria", {
                required: "Reward Criteria is required",
              })}
            >
              <SelectSection showDivider title="Available">
                <SelectItem key="all" value="all">
                  All Referendum Participants
                </SelectItem>
              </SelectSection>
              <SelectSection title="Coming Soon?">
                <SelectItem key="criteria" value="criteria">
                  Votes meeting threshold (e.g. &gt; 5 KSM)
                </SelectItem>
                <SelectItem key="first" value="first">
                  First N Voters
                </SelectItem>
                <SelectItem key="reputable" value="reputable">
                  Reputable Voters
                </SelectItem>
                <SelectItem key="aye" value="aye">
                  All Aye Voters
                </SelectItem>
                <SelectItem key="extrinsic" value="aye">
                  Any Aritrary Extrinsic Caller
                </SelectItem>
              </SelectSection>
            </Select>
            <div className="w-full md:w-1/2">
              <Select
                label="Referendum Index"
                classNames={{
                  label: "after:content-['*'] after:text-danger after:ml-0.5",
                }}
                value={refIndex}
                isLoading={isPastReferendaLoading}
                placeholder={"Select any past referendum"}
                isInvalid={!!errors.refIndex}
                errorMessage={
                  !!errors.refIndex && `${errors.refIndex?.message}`
                }
                {...register("refIndex", {
                  required: "Please select a referendum",
                })}
              >
                {pastReferenda?.map(({ index }) => (
                  <SelectItem key={index} value={index}>
                    {index}
                  </SelectItem>
                ))}
              </Select>

              {refIndex !== -1 && (
                <span className="text-xs flex items-start mt-1 ml-1 min-h-unit-10 align-top">
                  You selected Referendum {`${refIndex}`}&nbsp;
                  {isReferendumDetailLoading ? (
                    <InlineLoader />
                  ) : (
                    `: ${referendumDetail?.title}`
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        <h3 className="mb-4 text-lg">Where should royalties go?</h3>
        <div className="flex mb-4 min-h-[100px]">
          <div className="hidden md:flex md:w-1/3 text-xs pr-8">
            Trading NFTs Asset Hub will generate royalties for arbitrary
            parties. Select, who those royalties should go to.
          </div>
          <div className="w-full md:w-2/3">
            <Input
              label="Royalty Address"
              classNames={{
                label: "after:content-['*'] after:text-danger after:ml-0.5",
              }}
              type="text"
              placeholder="Enter the address of the royalty receiver"
              description="Where trading royalties should go to (Kusama / Asset Hub).
                  80% will go to the entered address, 20% to the Proof of Chaos multisig."
              isInvalid={!!errors.royaltyAddress}
              color={!!errors.royaltyAddress ? "danger" : "default"}
              errorMessage={
                !!errors.royaltyAddress && `${errors.royaltyAddress?.message}`
              }
              {...register("royaltyAddress")}
            />
          </div>
        </div>

        <h3 className="mb-4 text-lg">Where should NFTs be collected?</h3>
        <div className="flex mb-4 min-h-[100px]">
          <div className="hidden md:flex md:w-1/3 text-xs pr-8">
            You can either choose any existing collection, that you have the
            rights to mint NFTs into, or create a new collection.
          </div>
          <div className="w-full md:w-2/3 flex gap-4 items-center flex-wrap md:flex-nowrap justify-center">
            <Input
              label="Collection Id"
              placeholder="The id of your existing collection"
              type="number"
              step="1"
              classNames={{
                label: "after:content-['*'] after:text-danger after:ml-0.5",
              }}
              description="Select a collection that you are the owner of. NFTs will be minted to this collection."
              isInvalid={!!errors.collectionConfig?.id}
              isDisabled={isNewCollectionLoading}
              color={!!errors.collectionConfig?.id ? "danger" : "default"}
              errorMessage={
                !!errors.collectionConfig?.id &&
                `${errors.collectionConfig.id?.message}`
              }
              {...register("collectionConfig.id")}
            />
            {/* <p>{errors?.["collectionConfig.id"]?.message}</p> */}
            <div className="flex h-100">or</div>
            <Button
              className="w-full"
              onClick={createNewCollection}
              color="secondary"
              isLoading={isNewCollectionLoading}
              variant="bordered"
            >
              {/* {isNewCollectionLoading
              ? "Creating a new collection ..."
              : "Create A New Collection"} */}
              Create New Collection
            </Button>
          </div>
        </div>

        <h3 className="mb-4 text-lg">What are the rewards / NFTs?</h3>
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-2">
          {["common", "rare", "epic"].map((rarity) => (
            <RewardsCreationRarityFields
              key={rarity}
              rarity={rarity}
              rewardConfig={defaultReferendumRewardsConfig}
            />
          ))}
        </div>

        <Button
          type="submit"
          variant="shadow"
          isDisabled={isSubmitting}
          isLoading={isSubmitting}
          className={clsx("w-full mt-4 h-20", vividButtonClasses)}
        >
          Submit {activeChain && <activeChain.icon />} Referendum Rewards
        </Button>

        <Input
          type="text"
          className="hidden"
          value={chain as SubstrateChain}
          id={`chain`}
          {...register(`chain`)}
        />

        <pre className="text-xs">{JSON.stringify(watch(), null, 2)}</pre>
      </form>
      <ModalCreateNFTCollection
        setCollectionConfig={setCollectionConfig}
        setIsNewCollectionLoading={setIsNewCollectionLoading}
        onOpenChange={onModalOpenChange}
        isOpen={isOpen}
      />
    </FormProvider>
  );
}
