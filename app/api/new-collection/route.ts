// import formidable, { errors as formidableErrors } from "formidable";
// import fs from "fs";
// import { getTxCollectionCreate } from "./nft_sendout_script/src/createCollection";
// import { getApiKusamaAssetHub } from "../../data/getApi";
import { NextRequest, NextResponse } from "next/server";

/**
 * Handler for the /api/create-new-collection endpoint. It will only create the collection, not add the metadata.
 * The metadata will be added in the next step (see /api/create-reward-calls.ts)
 * @param req The request object encoded as URLSearchParams
 * @param res
 */
export async function POST(req: NextRequest) {
  const data = await req.json();

  console.log(data);

  return NextResponse.json({ data });

  const form = formidable({});
  let fields;
  let files;
  try {
    [fields, files] = await form.parse(req);

    // all the config that came from the frontend
    config = JSON.parse(fields.data);

    const apiKusamaAssetHub = await getApiKusamaAssetHub();

    const createCollectionTx = await getTxCollectionCreate(
      apiKusamaAssetHub,
      config
    );

    res.status(200).json({
      tx: createCollectionTx,
    });
  } catch (err) {
    // console.log("error parsing form", err)
    res.status(400).json({
      name: err.name,
      message: err.message,
    });
  }
}
