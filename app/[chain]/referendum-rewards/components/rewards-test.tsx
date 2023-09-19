"use client";

import { useReferenda } from "@/hooks/vote/use-referenda";
import { Input } from "@nextui-org/input";
import { Select, SelectItem, SelectSection } from "@nextui-org/select";
import { useEffect, useState } from "react";
import { ReferendumDetail } from "../../vote/components/referendum-detail";
import { useReferendumDetail } from "@/hooks/vote/use-referendum-detail";
import { Spinner } from "@nextui-org/spinner";
import { InlineLoader } from "@/components/inline-loader";
import { Button } from "@nextui-org/button";
import { RewardsCreationRarityFields } from "./rewards-rarity-fields";
import { rewardsConfig } from "@/config/rewards";
import { defaultReferendumRewardsConfig } from "../../../../config/default-rewards-config";
import { vividButtonClasses } from "@/components/primitives";
import clsx from "clsx";
import {
  FieldValue,
  FieldValues,
  FormProvider,
  useForm,
} from "react-hook-form";
import { validate } from "graphql";
import { validateAddress } from "../util";
import { SubstrateChain } from "@/types";
import { getChainInfo } from "@/config/chains";
import { watch } from "fs";
import { titleCase } from "@/components/util";
import { ZodType, z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSubstrateChain } from "@/context/substrate-chain-context";

export const rewardsSchema = (chain: SubstrateChain, ss58Format: number) =>
  z.object({
    criteria: z.string().min(1, "Please select reward criteria"),
    refIndex: z.string().min(1, "Please select a referendum"),
    royaltyAddress: z.custom<string>(
      (value) => validateAddress(value as string, ss58Format),
      `Not a valid ${titleCase(chain)} address`
    ),
    options: z.array(
      z.object({
        rarity: z.string(),
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        artist: z.string().optional(),
        file: z
          .custom<File[]>()
          .transform((file) => file[0])
          .refine((file: File) => {
            console.log("filetype", file?.type, "filesize", file?.size);
            return file && rewardsConfig.acceptedNftFormats.includes(file.type);
          }, "File Format not supported")
          .refine(
            (file: File) => !file || (!!file && file.size <= 2 * 1024 * 1024),
            {
              message: "The medium must be a maximum of 2MB.",
            }
          ),
      })
    ),
  });

export default function TestRewards({ chain }: { chain: SubstrateChain }) {
  const { ss58Format, name } = getChainInfo(chain);

  const chainRewardsSchema = rewardsSchema(SubstrateChain.Kusama, 2);
  type TypeRewardsSchema = z.infer<typeof chainRewardsSchema>;

  const [formStep, setFormStep] = useState(0);
  const nextFormStep = () => setFormStep((currentStep) => currentStep + 1);
  const prevFormStep = () => setFormStep((currentStep) => currentStep - 1);

  const formMethods = useForm<TypeRewardsSchema>({
    resolver: zodResolver(chainRewardsSchema),
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    getValues,
    watch,
  } = formMethods;
  const { activeChain } = useSubstrateChain();

  useEffect(() => {
    console.log(errors);
  }, [errors]);

  const { defaultReferendumRewardsConfig } = rewardsConfig;
  const {
    data: { referenda: pastReferenda } = {
      referenda: [],
    },
    isLoading: isPastReferendaLoading,
  } = useReferenda("past", false);

  const [refIndex, setRefIndex] = useState<number>(-1);
  const { data: referendumDetail, isLoading: isReferendumDetailLoading } =
    useReferendumDetail(refIndex.toString());

  async function onSubmit(data: TypeRewardsSchema) {
    console.log(data);
    await new Promise((resolve) => setTimeout(resolve, 1000));
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
              value={"all"}
              placeholder={"Select Reward Criteria"}
              disabledKeys={["criteria", "aye", "first", "reputable"]}
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
                  Votes meeting threshold (e.g. &gt; 5 KSM, locked x3)
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
              classNames={{
                label: "after:content-['*'] after:text-danger after:ml-0.5",
              }}
              // errorMessage={errors.collectionConfig?.id?.message}
              description="Select a collection that you are the owner of. NFTs will be minted to this collection."
              // disabled={isNewCollectionLoading}
              // validationState={errors.collectionConfig?.id ? "invalid" : "valid"}
              // {...formMethods.register("collectionConfig.id", {
              //   validate: {
              //     isNumber: (value) => !isNaN(value) || "Not a valid number",
              //     isNotCollectionOwner: () =>
              //       collectionOwnerIsWallet ||
              //       "You are not the owner of the collection",
              //   },
              // })}
            />
            {/* <p>{errors?.["collectionConfig.id"]?.message}</p> */}
            <div className="flex h-100">or</div>
            <Button
              className="w-full"
              // onClick={createNewCollection}
              color="secondary"
              // isLoading={isNewCollectionLoading}
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

        <pre className="text-xs">{JSON.stringify(watch(), null, 2)}</pre>
      </form>
    </FormProvider>
  );
}
