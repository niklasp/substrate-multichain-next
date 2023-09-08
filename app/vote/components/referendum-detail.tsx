"use client";

import { UIReferendum } from "../types";
import clsx from "clsx";
import { Button } from "@nextui-org/button";
import { ScrollShadow } from "@nextui-org/scroll-shadow";
import ChevronUp from "@w3f/polkadot-icons/keyline/ChevronUp";
import ChevronDown from "@w3f/polkadot-icons/keyline/ChevronDown";
import styles from "./style.module.scss";
import { useState } from "react";
// import { useState } from "react";

export const ReferendumDetail = ({
  referendum: { index, title, content },
  isExpanded,
}: {
  referendum: UIReferendum;
  isExpanded: boolean;
}) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] =
    useState<boolean>(isExpanded);

  return (
    <div className="referendum-detail relative w-full rounded-sm border border-dashed border-gray-300 p-3 sm:p-4 md:p-6 lg:p-10 xl:p-12 my-4 mb-0">
      <div className="flex flex-col left w-full sm:w-7/12 md:w-8/12 pb-6 sm:pb-0 sm:pr-6 border-dashed sm:border-r border-b sm:border-b-0">
        <div className="referendum-heading text-3xl mb-4 font-bold">
          <div>Referendum {index}</div>
        </div>
        <h3 className="cursor-pointer text-xl mb-4">{title}</h3>
        <div className="flex-1">
          <ScrollShadow className="w-full h-[250px]">
            <div
              className={clsx(
                styles.referendumDescription,
                "referendum-description break-words text-xs",
                {
                  [styles.descriptionOverflowHidden]: !isDescriptionExpanded,
                }
              )}
              dangerouslySetInnerHTML={{ __html: content ?? "" }}
            ></div>
          </ScrollShadow>
        </div>
        {/* <ReferendumLinks
          referendumId={referendum.index}
          className="referendum-links"
        /> */}
      </div>
      {/* <pre className="text-xs">{JSON.stringify(referendum, null, 2)}</pre> */}
    </div>
  );
};
