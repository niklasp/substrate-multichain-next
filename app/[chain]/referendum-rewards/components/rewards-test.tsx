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

export default function TestRewards() {
  const [formStep, setFormStep] = useState(0);
  const nextFormStep = () => setFormStep((currentStep) => currentStep + 1);
  const prevFormStep = () => setFormStep((currentStep) => currentStep - 1);

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

  return (
    <div className="test">
      <h3 className="mb-4 text-lg">What should be rewarded?</h3>
      <div className="flex mb-4">
        <div className="hidden md:flex md:w-1/3 text-xs pr-8">
          At the moment we support rewarding participation in OpenGov Referenda.
          All participants of your selected referendum will receive 1 of the
          NFTs you set below.
        </div>
        <div className="w-full md:w-2/3 flex gap-4 flex-wrap md:flex-nowrap">
          <Select
            className="w-full md:w-1/2"
            isRequired
            label="Reward Criteria"
            value={"all"}
            isLoading={isPastReferendaLoading}
            placeholder={"Select Reward Criteria"}
            disabledKeys={["criteria", "aye", "first", "reputable"]}
            // {...formMethods.register("refIndex", {
            //   validate: {},
            // })}
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
              isRequired
              label="Referendum Index"
              value={refIndex}
              isLoading={isPastReferendaLoading}
              onChange={(e) => setRefIndex(parseInt(e.target.value))}
              placeholder={"Select any past referendum"}
              // {...formMethods.register("refIndex", {
              //   validate: {},
              // })}
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
      <div className="flex mb-4">
        <div className="hidden md:flex md:w-1/3 text-xs pr-8">
          Trading NFTs Asset Hub will generate royalties for arbitrary parties.
          Select, who those royalties should go to.
        </div>
        <div className="w-full md:w-2/3">
          <Input
            isRequired
            label="Royalty Address"
            type="text"
            placeholder="Enter the address of the royalty receiver"
            description="Where trading royalties should go to (Kusama / Asset Hub).
                  80% will go to the entered address, 20% to the Proof of Chaos multisig: Go8NpTvzdpfpK1rprXW1tE4TFTHtd2NDJCqZLw5V77GR8r4."
            // {...formMethods.register("royaltyAddress", {
            //   validate: {},
            // })}
          />
        </div>
      </div>

      <h3 className="mb-4 text-lg">Where should NFTs be collected?</h3>
      <div className="flex mb-4">
        <div className="hidden md:flex md:w-1/3 text-xs pr-8">
          You can either choose any existing collection, that you have the
          rights to mint NFTs into, or create a new collection.
        </div>
        <div className="w-full md:w-2/3 flex gap-4 items-center flex-wrap md:flex-nowrap justify-center">
          <Input
            isRequired
            label="Collection Id"
            placeholder="The id of your existing collection"
            type="text"
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

      <h3 className="mb-4 text-lg">NFTs</h3>
      <div className="flex mb-4">
        <div className="w-full">
          {["common", "rare", "epic"].map((rarity) => (
            <RewardsCreationRarityFields
              key={rarity}
              rarity={rarity}
              rewardConfig={defaultReferendumRewardsConfig}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
