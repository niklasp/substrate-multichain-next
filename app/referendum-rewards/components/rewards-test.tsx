"use client";

import { useReferenda } from "@/hooks/vote/use-referenda";
import { Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import { useEffect, useState } from "react";
import { ReferendumDetail } from "../../vote/components/referendum-detail";
import { useReferendumDetail } from "@/hooks/vote/use-referendum-detail";
import { Spinner } from "@nextui-org/spinner";
import { InlineLoader } from "@/components/inline-loader";

export default function TestRewards() {
  const [formStep, setFormStep] = useState(0);
  const nextFormStep = () => setFormStep((currentStep) => currentStep + 1);
  const prevFormStep = () => setFormStep((currentStep) => currentStep - 1);

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
      <h3 className="mb-4">What should be rewarded?</h3>
      <div className="flex mb-4">
        <div className="hidden md:flex md:w-1/3 text-xs pr-8">
          At the moment we support rewarding participation in OpenGov Referenda.
          All participants of your selected referendum will receive 1 of the
          NFTs you set below.
        </div>
        <div className="w-full md:w-2/3">
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

      <h3 className="mb-4">Where should royalties go?</h3>
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
    </div>
  );
}
