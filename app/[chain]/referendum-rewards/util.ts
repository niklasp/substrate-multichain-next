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

// this is needed because on client side we have a FileList and on server side we have a File
// however next does not support FileList / File on server side so this workaround is needed
const fileUpload =
  typeof window === "undefined"
    ? z
        .any()
        .refine((file) => file, "Image is required.")
        .refine(
          (file) => file?.size <= 2 * 1024 * 1024,
          `Max file size is 2MB.`
        )
        .refine(
          (file) => rewardsConfig.acceptedNftFormats.includes(file?.type),
          "File Format not supported"
        )
    : z
        .any()
        .refine((files) => files?.length == 1, "Image is required.")
        .refine(
          (files) => files?.[0]?.size <= 2 * 1024 * 1024,
          `Max file size is 2MB.`
        )
        .refine(
          (files) =>
            rewardsConfig.acceptedNftFormats.includes(files?.[0]?.type),
          "File Format not supported"
        );

export const zodSchemaObject = (chain: SubstrateChain, ss58Format: number) => {
  return {
    chain: z.string(),
    criteria: z.string().min(1, "Please select reward criteria"),
    refIndex: z.string().min(1, "Please select a referendum"),
    royaltyAddress: z.custom<string>(
      (value) => validateAddress(value as string, ss58Format),
      `Not a valid ${titleCase(chain)} address`
    ),
    collectionConfig: z.object({
      id: z
        .any()
        .transform((id) => parseInt(id) || -1)
        .refine((id) => id >= 0, "Id must be a positive number"),
      name: z.string().optional(),
      description: z.string().optional(),
      // TODO
      // name: z.string().min(1, "Name is required"),
      // description: z.string().min(1, "Description is required"),
      isNew: z.boolean().default(false),
      file: fileUpload.optional(),
    }),
    options: z.array(
      z.object({
        rarity: z.string(),
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        artist: z.string().optional(),
        imageCid: z.string().optional(),
        //TODO
        file: fileUpload,
        // file: z.any().optional(),
      })
    ),
  };
};

// validation schema for rewards form
export const rewardsSchema = (chain: SubstrateChain, ss58Format: number) => {
  const obj = zodSchemaObject(chain, ss58Format);
  return z.object(obj);
};

export async function executeAsyncFunctionsInSequence<T>(
  asyncFunctions: Array<() => Promise<T>>
) {
  let results: T[] = [];

  for (const asyncFunction of asyncFunctions) {
    results.push(await asyncFunction());
  }

  return results;
}
