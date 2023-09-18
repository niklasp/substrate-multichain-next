"use client";

import clsx from "clsx";
import { bnToBn, formatBalance } from "@polkadot/util";
import PaperMoney from "@w3f/polkadot-icons/keyline/PaperMoney";

import { ScrollShadow } from "@nextui-org/scroll-shadow";
import { Skeleton } from "@nextui-org/skeleton";
import { Chip } from "@nextui-org/chip";

import { ReferendumBadges } from "./referendum-badges";
import { Referendum, UIReferendum, UITrack } from "../types";

import styles from "./style.module.scss";
import { SubstrateChain } from "@/types";
import { InlineLoader } from "@/components/inline-loader";
import { getChainInfo } from "@/config/chains";
import { useReferendumDetail } from "@/hooks/vote/use-referendum-detail";
import { ReferendumLinks } from "./referendum-links";
import { ReferendumUserInfoCard } from "./referendum-user-info";
import ReferendumVoteButtons from "./referendum-vote-buttons";
import ReferendumCountdownCard from "./referendum-countdown-card";
import { useEndDate } from "@/hooks/vote/use-end-date";

export type ReferendumDetailType = {
  chain: string;
  referendum: UIReferendum;
  track?: UITrack;
  isExpanded: boolean;
};

export const ReferendumDetailLoading = ({
  chain,
  referendum,
  track,
}: {
  chain: SubstrateChain;
  referendum: UIReferendum;
  track?: UITrack;
}) => {
  const safeChain = chain || SubstrateChain.Kusama;
  const { symbol: tokenSymbol } = getChainInfo(safeChain);
  const { index } = referendum ?? {};
  return (
    <div className="referendum-detail relative w-full rounded-sm border border-dashed border-gray-300 p-3 sm:p-4 md:p-6 lg:p-10 xl:p-12 my-4 mb-0 hover:shadow-lg dark:shadow-gray-700 transition-all">
      <div className="w-full flex flex-wrap">
        <div className="flex flex-col left w-full sm:w-7/12 md:w-8/12 pb-6 sm:pb-0 sm:pr-6 border-dashed sm:border-r border-b sm:border-b-0">
          <div className="referendum-heading text-2xl mb-3 font-bold flex w-full items-center justify-between">
            <div>Referendum {index}</div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              <Chip
                variant="flat"
                color="secondary"
                startContent={
                  <PaperMoney
                    stroke="currentColor"
                    width={18}
                    className="ml-2"
                  />
                }
              >
                <InlineLoader /> {tokenSymbol}
              </Chip>
            </span>
          </div>
          <Skeleton className="mb-6">
            <div className="w-full h-6 rounded-lg"></div>
          </Skeleton>
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="mb-2">
              <div className="w-full h-4 rounded-lg"></div>
            </Skeleton>
          ))}
          <ReferendumLinks referendumId={index} />
        </div>
        <div className="right text-center w-full sm:w-5/12 md:w-4/12 pt-6 sm:pt-0 sticky self-start top-24 sm:pl-4 md:pl-6">
          <ReferendumBadges
            referendum={referendum}
            track={track}
            decidingPercentage={0}
            confirmingPercentage={0}
          />
          {/* <ReferendumCountdownCard endDate={endDate} referendum={referendum} /> */}
          <ReferendumUserInfoCard referendum={referendum} />
          <ReferendumVoteButtons referendum={{ ...referendum }} userVote={{}} />
        </div>
      </div>
    </div>
  );
};

export function ReferendumDetail({
  referendum,
  track,
  isExpanded,
  chain,
}: ReferendumDetailType) {
  const { index, deciding, decisionDeposit, submitted } = referendum ?? {};
  const { decimals, symbol } = getChainInfo(chain as SubstrateChain);
  const { data: referendumDetail, isLoading: isDetailLoading } =
    useReferendumDetail(index);

  // await getReferendumDetail(
  //   chain as SubstrateChain,
  //   index
  // );
  // const [isDescriptionExpanded, setIsDescriptionExpanded] =
  // useState<boolean>(isExpanded);

  // const { name: chainName, decimals, symbol } = activeChain ?? {};

  // The block where the current period ends. May either be preparing, deciding, or confirming.
  const endBlock =
    decisionDeposit === null && track !== undefined
      ? bnToBn(submitted).add(bnToBn(track.preparePeriod)).toString()
      : deciding === null || deciding === undefined || track === undefined
      ? "0"
      : deciding.confirming !== null
      ? bnToBn(deciding.confirming).toString()
      : bnToBn(deciding.since).add(bnToBn(track.decisionPeriod)).toString();

  // const { data: endDate, isLoading: isEndDateLoading } = useEndDate(
  //   chain as SubstrateChain,
  //   endBlock
  // );

  // const { data: referendumDetail, isLoading: isReferendumDetailLoading } =
  //   useReferendumDetail(index);

  const { title, content, requested } = referendumDetail ?? {};

  return (
    <div className="referendum-detail relative w-full rounded-sm border border-dashed border-gray-300 p-3 sm:p-4 md:p-6 lg:p-10 xl:p-12 my-4 mb-0 hover:shadow-lg dark:shadow-gray-700 transition-all">
      <div className="w-full flex flex-wrap">
        <div className="flex flex-col left w-full sm:w-7/12 md:w-8/12 pb-6 sm:pb-0 sm:pr-6 border-dashed sm:border-r border-b sm:border-b-0">
          <div className="referendum-heading text-2xl mb-3 font-bold flex w-full items-center justify-between">
            <div>Referendum {index}</div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {requested && (
                <Chip
                  variant="flat"
                  color="secondary"
                  startContent={
                    <PaperMoney
                      stroke="currentColor"
                      width={18}
                      className="ml-2"
                    />
                  }
                >
                  {formatBalance(requested, {
                    decimals,
                    withUnit: symbol,
                    forceUnit: "-",
                  })}
                </Chip>
              )}
            </span>
          </div>
          <>
            <h3 className="cursor-pointer text-lg mb-4">{title}</h3>
            <div className="flex-1">
              {isDetailLoading ? (
                <>
                  <Skeleton className="mb-6">
                    <div className="w-full h-6 rounded-lg"></div>
                  </Skeleton>
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="mb-2">
                      <div className="w-full h-4 rounded-lg"></div>
                    </Skeleton>
                  ))}
                </>
              ) : (
                <ScrollShadow className="w-full h-[350px]">
                  <div
                    className={clsx(
                      styles.referendumDescription,
                      "referendum-description break-words text-sm"
                      // {
                      //   [styles.descriptionOverflowHidden]:
                      //     !isDescriptionExpanded,
                      // }
                    )}
                    dangerouslySetInnerHTML={{ __html: content ?? "" }}
                  ></div>
                </ScrollShadow>
              )}
            </div>
            <ReferendumLinks referendumId={index} />
          </>
        </div>
        <div className="right text-center w-full sm:w-5/12 md:w-4/12 pt-6 sm:pt-0 sticky self-start top-24 sm:pl-4 md:pl-6">
          <ReferendumBadges
            referendum={referendum}
            track={track}
            decidingPercentage={0}
            confirmingPercentage={0}
          />
          <ReferendumCountdownCard
            chain={chain as SubstrateChain}
            endBlock={endBlock}
            referendum={referendum}
          />
          <ReferendumUserInfoCard referendum={referendum} />
          <ReferendumVoteButtons referendum={{ ...referendum }} userVote={{}} />
        </div>
      </div>
      {/* <pre className="text-xs">
        <b>trackInfo:</b>
        {JSON.stringify(track, null, 2)}
      </pre>
      <pre className="text-xs">
        <b>refInfo:</b> {JSON.stringify(referendum, null, 2)}
      </pre> */}
    </div>
  );
}
