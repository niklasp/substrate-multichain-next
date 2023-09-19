import { titleCase } from "@/components/util";
import { rewardsConfig } from "@/config/rewards";
import { SubstrateChain } from "@/types";
import { decodeAddress, encodeAddress } from "@polkadot/keyring";
import { z } from "zod";

export function validateAddress(address: string, ss58Format: number) {
  try {
    decodeAddress(address, false, ss58Format);
  } catch (error) {
    return false;
  }
  return true;
}

export const zodSchemaObject = (chain: SubstrateChain, ss58Format: number) => {
  return {
    chain: z.string(),
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
        imageCid: z.string().optional(),
        file:
          typeof window === "undefined"
            ? z
                .any()
                .refine((file) => file, "Image is required.")
                .refine(
                  (file) => file?.size <= 2 * 1024 * 1024,
                  `Max file size is 5MB.`
                )
                .refine(
                  (file) =>
                    rewardsConfig.acceptedNftFormats.includes(file?.type),
                  "File Format not supported"
                )
            : z
                .any()
                .refine((files) => files?.length == 1, "Image is required.")
                .refine(
                  (files) => files?.[0]?.size <= 2 * 1024 * 1024,
                  `Max file size is 5MB.`
                )
                .refine(
                  (files) =>
                    rewardsConfig.acceptedNftFormats.includes(files?.[0]?.type),
                  "File Format not supported"
                ),
      })
    ),
  };
};

// validation schema for rewards form
export const rewardsSchema = (chain: SubstrateChain, ss58Format: number) => {
  const obj = zodSchemaObject(chain, ss58Format);
  return z.object(obj);
};
