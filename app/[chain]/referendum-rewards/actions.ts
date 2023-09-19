"use server";

import { NextResponse } from "next/server";

export async function createRewards(formData: FormData) {
  "use server";
  const data = await formData.get("rewardConfig");

  console.log(data);

  return NextResponse.json({ hello: "test" });
}
