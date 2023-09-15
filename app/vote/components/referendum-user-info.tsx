import { useAppStore } from "@/app/zustand";
import { UIReferendum } from "../types";
import { formatBalance } from "@polkadot/util";
import { Card } from "@nextui-org/card";

export function ReferendumUserInfoCard({
  referendum,
}: {
  referendum: UIReferendum;
}) {
  const { symbol, decimals } = useAppStore((state) => state.chain);

  const formatToChainDecimals = (value: number) => {
    return formatBalance(value, {
      decimals,
      forceUnit: "-",
      withSi: true,
      withUnit: symbol,
    });
  };

  //TODO
  let isUserVotesLoading = false;
  let decision = "yes";
  let balance = {
    value: 0,
    aye: 0,
    nay: 0,
    abstain: 0,
  };

  let lockPeriod = 0;

  return (
    <Card
      radius="sm"
      className="p-4 mb-2 text-sm bg-gray-100 dark:bg-slate-800"
      shadow="sm"
    >
      {!isUserVotesLoading && (
        <>
          <div className="flex-col w-full text-center">
            <div className="">
              <span>You voted</span>
              <b>
                {decision === "yes" && (
                  <span className="bg-green-400 text-black px-2 rounded-sm mx-1">
                    Aye
                  </span>
                )}
                {decision === "no" && (
                  <span className="bg-red-400 px-2 rounded-sm mx-1">Nay</span>
                )}
                {decision === "split" && (
                  <>
                    <span className="bg-green-400 text-black px-2 rounded-sm mx-1">
                      Aye
                    </span>
                    +
                    <span className="bg-red-400 px-2 rounded-sm mx-1">Nay</span>
                  </>
                )}
                {decision === "splitAbstain" && (
                  <>
                    <span className="bg-green-400 text-black px-2 rounded-sm mx-1">
                      Aye
                    </span>
                    +
                    <span className="bg-red-400 px-2 rounded-sm mx-1">Nay</span>
                    +
                    <span className="bg-gray-400 px-2 rounded-sm mx-1">
                      Abstain
                    </span>
                  </>
                )}
              </b>
            </div>
            {decision !== "split" && decision !== "splitAbstain" && (
              <>
                <div className="">
                  <span>
                    with <b>{formatToChainDecimals(balance.value)} KSM</b>
                  </span>
                </div>
                <div className="">
                  <span>
                    and conviction <b>{lockPeriod}</b>
                  </span>
                </div>
              </>
            )}
            {decision === "split" && (
              <div className="">
                <span>
                  with <b>{formatToChainDecimals(balance.aye ?? 0)}</b> +{" "}
                  <b>{formatToChainDecimals(balance.nay ?? 0)} KSM</b>
                </span>
              </div>
            )}
            {decision === "splitAbstain" && (
              <div className="">
                <span>
                  with <b>{formatToChainDecimals(balance.aye ?? 0)} KSM</b> +{" "}
                  <b>{formatToChainDecimals(balance.nay ?? 0)} KSM</b> +{" "}
                  <b>{formatToChainDecimals(balance.abstain ?? 0)} KSM </b>
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
