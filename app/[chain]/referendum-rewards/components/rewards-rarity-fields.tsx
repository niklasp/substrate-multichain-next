import { Input, Textarea } from "@nextui-org/input";
import { Switch } from "@nextui-org/switch";
import { useState } from "react";
import { rewardsConfig } from "@/config/rewards";
import { RewardConfiguration } from "../types";
import { Card } from "@nextui-org/card";

export function RewardsCreationRarityFields({
  rarity,
  rewardConfig,
  register,
  errors,
}: {
  rarity: string;
  rewardConfig: RewardConfiguration;
  register?: any;
  errors?: any;
}) {
  const { acceptedNftFormats } = rewardsConfig;
  const [isUploadSelected, setIsUploadSelected] = useState(true);

  let optionIndex = rewardConfig.options.findIndex(
    (opt) => opt.rarity === rarity
  );

  return (
    <Card
      shadow="sm"
      radius="sm"
      className={`flex flex-col p-1 form-fields-${rarity} 
      gap-4 w-1/3`}
    >
      <div className="h-full p-1 bg-white rounded shadow-md gap-4 flex flex-col p-3">
        <h3 className="text-xl mb-2">{rarity}</h3>
        <div className="text-sm flex justify-end items-center">
          <span className="mr-2">upload file</span>
          <Switch
            size="sm"
            color="secondary"
            onChange={() => setIsUploadSelected(!isUploadSelected)}
          >
            ipfs cid
          </Switch>
        </div>
        <div className="">
          {isUploadSelected ? (
            <>
              <label className="block font-medium text-foreground-600 text-tiny cursor-text will-change-auto origin-top-left transition-all !duration-200 !ease-out motion-reduce:transition-none mb-0 pb-0">
                Upload {rarity} Image (max 1.5MB)
              </label>

              <input
                id={`file-${rarity}`}
                required
                accept={acceptedNftFormats.join(",")}
                type="file"
                className="mt-0"
                // {...register(`options[${optionIndex}].file`, {
                //   validate: {
                //     noFile: (files) =>
                //       files?.length > 0 || "Please upload a file",
                //     lessThan15MB: (files) => {
                //       return files[0].size < 1.5 * 1024 * 1024 || "Max 1.5MB";
                //     },
                //     acceptedFormats: (files) =>
                //       websiteConfig.accepted_nft_formats.includes(
                //         files[0]?.type
                //       ) || "please upload a valid image or video file",
                //   },
                // })}
              />
              {errors?.options?.[optionIndex]?.file && (
                <span className="w-full text-sm text-red-500">
                  <>{errors?.options?.[optionIndex]?.file.message}</>
                </span>
              )}
            </>
          ) : (
            <>
              <Input
                isRequired
                id={`imageCid-${rarity}`}
                label={`IPFS Image CID of ${rarity} NFT`}
                placeholder={`Enter Image CID of ${rarity} NFT`}
                type="text"
                // {...register(`options[${optionIndex}].imageCid`, {
                //   validate: {},
                // })}
              />
            </>
          )}
        </div>
        <Input
          isRequired
          id={`name-${rarity}`}
          label={`Name of ${rarity} NFT`}
          placeholder={`Enter name of ${rarity} NFT`}
          type="text"
          // {...register(`options[${optionIndex}].itemName`, {
          //   validate: {},
          // })}
        />
        <Textarea
          id={`description-${rarity}`}
          label={`Description of ${rarity} NFT (1000 chars)`}
          placeholder={`Enter description of ${rarity} NFT`}
          maxLength={1000}
          // {...register(`options[${optionIndex}].description`, {
          //   validate: {},
          // })}
        />
        <Input
          id={`artist-${rarity}`}
          label={`Artist of ${rarity} NFT`}
          placeholder={`Enter artist of ${rarity} NFT`}
          type="text"
          // {...register(`options[${optionIndex}].artist`, {
          //   validate: {},
          // })}
        />
      </div>
    </Card>
  );
}
