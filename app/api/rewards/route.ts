import fs from "fs";
import {
  rewardsSchema,
  zodSchemaObject,
} from "@/app/[chain]/referendum-rewards/util";
import { DEFAULT_CHAIN, getChainByName, getChainInfo } from "@/config/chains";
import { SubstrateChain } from "@/types";
import { NextRequest, NextResponse } from "next/server";
import formidable, { errors as formidableErrors } from "formidable";
import { RewardOption } from "@/app/[chain]/referendum-rewards/types";
import { zfd } from "zod-form-data";
import { type } from "os";
import { RewardConfiguration } from "../../[chain]/referendum-rewards/types";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  //   let { rewardsConfig }: { rewardsConfig: unknown } = await req.json();

  let zodErrors = {};

  try {
    // parse the form data that is coming from the client
    const formData = await req.formData();
    console.log("formData", formData);

    // get the form data as json so we can work with it
    const rewardConfigData = await formData.get("rewardConfig");
    let rewardConfig = JSON.parse(
      rewardConfigData as string
    ) as RewardConfiguration;

    // validate the incoming form data (without the files that were sent)
    const safeChain = (rewardConfig.chain as SubstrateChain) || DEFAULT_CHAIN;
    const { ss58Format } = getChainInfo(safeChain);

    // override the file of each option with a file from the parsed form data
    // this is needed because the file is not serializable
    rewardConfig.options.forEach((option) => {
      option.file = formData.get(`${option.rarity}File`);
    });

    console.log("rewardConfig after file transform", rewardConfig);

    const schemaObject = zodSchemaObject(safeChain, ss58Format);
    const schema = zfd.formData(schemaObject);

    console.info("validating form data", rewardConfig);
    const result = schema.safeParse(rewardConfig);
    console.log("result", result);

    if (!result.success) {
      result.error.issues.map((issue) => {
        zodErrors = {
          ...zodErrors,
          [issue.path[0]]: issue.message,
        };
      });
    }

    // add the Buffers instead of the files so we can work with it
    rewardConfig?.options?.forEach(async (option) => {
      const file: File | null = (await formData.get(
        `${option.rarity}File`
      )) as File;
      const bytes = await file?.arrayBuffer();
      option.file = Buffer.from(bytes);
    });
  } catch (error) {
    console.log("error", error);
    // return NextResponse.json({ error });
  }

  // and return here as serializable json (aka strings, numbers, booleans, plain objects, arrays, etc.)
  return NextResponse.json(
    Object.keys(zodErrors).length > 0
      ? { errors: zodErrors }
      : { success: true }
  );
}
