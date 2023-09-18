import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Slider, SliderTypeMap } from "@mui/material";
import { useAccountBalance } from "@/hooks/use-account-balance";
import { Button, ButtonGroup } from "@nextui-org/button";
import { VoteChoice } from "../types";
import clsx from "clsx";
import { useAppStore } from "@/app/zustand";
import { formatBalance, bnToBn, BN_ZERO } from "@polkadot/util";
import { useSubstrateChain } from "@/context/substrate-chain-context";
import { Spinner } from "@nextui-org/spinner";
import { Input } from "@nextui-org/input";
import { getVoteTx } from "../util";
import { sendAndFinalize } from "@/components/util-client";
import { web3FromAddress } from "@polkadot/extension-dapp";
import { vividButtonClasses } from "@/components/primitives";

const VOTE_LOCK_OPTIONS = [
  {
    value: 0.1,
    label: "No lockup",
  },
  {
    value: 1,
    label: "Locked for 1 enactment period (8 days)",
  },
  {
    value: 2,
    label: "Locked for 2 enactment periods (16 days)",
  },
  {
    value: 3,
    label: "Locked for 4 enactment periods (32 days)",
  },
  {
    value: 4,
    label: "Locked for 8 enactment periods (64 days)",
  },
  {
    value: 5,
    label: "Locked for 16 enactment periods (128 days)",
  },
  {
    value: 6,
    label: "Locked for 32 enactment periods (256 days)",
  },
];

const marks = [
  {
    value: 0,
    label: "0.1x",
  },
  {
    value: 1,
    label: "1x",
  },
  {
    value: 2,
    label: "2x",
  },
  {
    value: 3,
    label: "3x",
  },
  {
    value: 4,
    label: "4x",
  },
  {
    value: 5,
    label: "5x",
  },
  {
    value: 6,
    label: "6x",
  },
];

export function ReferendumVoteForm({ referendumId }: { referendumId: string }) {
  //   const hasUserSubmittedAnswers = useAppStore(
  //     (state) => state.user.quizAnswers?.[referendumId]?.submitted
  //   );

  //TODO
  const hasUserSubmittedAnswers = false;
  const latestUserVote = null;

  const [isVoteLoading, setIsVoteLoading] = useState<boolean>(false);
  const [voteChoice, setVoteChoice] = useState(VoteChoice.Aye);
  const [sliderValue, setSliderValue] = useState(VOTE_LOCK_OPTIONS[1]);
  const sliderRef = useRef<any>(undefined);
  //   const queryClient = useQueryClient();
  //   const { voteOnRef } = useVoteManager(queryClient);
  const closeModal = useAppStore((state) => state.closeModal);
  const { activeChain } = useSubstrateChain();
  const { decimals, symbol, api } = activeChain || {};
  const user = useAppStore((state) => state.user);
  const {
    accounts,
    actingAccountIdx,
    isExtensionReady,
    actingAccount,
    actingAccountSigner,
  } = user;

  //   const { data: latestUserVote } = useLatestUserVoteForRef(referendumId);
  const { data: accountBalance, isLoading: isBalanceLoading } =
    useAccountBalance();
  const availableBalance = formatBalance(accountBalance?.data?.free, {
    decimals,
    withSi: true,
    withUnit: symbol,
    forceUnit: "-",
  });

  const voteAmountLabel = (
    <>
      <span className="text-xs font-normal flex items-center">
        available balance:{" "}
        {isBalanceLoading ? (
          <Spinner size="sm" className="ml-2" />
        ) : (
          `${availableBalance}`
        )}
      </span>
    </>
  );

  function sliderValueText(value: any) {
    return `${value} KSM`;
  }

  async function onSubmit() {
    // voteOnRef(
    //   referendumId,
    //   voteChoice,
    //   {
    //     "vote-amount-aye": watchAyeVoteAmount,
    //     "vote-amount-nay": watchNayVoteAmount,
    //     "vote-amount-abstain": watchAbstainVoteAmount,
    //   },
    //   sliderValue.value
    // );

    const conviction = sliderValue.value;

    const voteInChainDecimalsMultiplier = bnToBn(10).pow(bnToBn(decimals));

    const voteBalances = {
      aye: bnToBn(watchAyeVoteAmount.toString()).mul(
        voteInChainDecimalsMultiplier
      ),
      nay: bnToBn(watchNayVoteAmount.toString()).mul(
        voteInChainDecimalsMultiplier
      ),
      abstain: bnToBn(watchAbstainVoteAmount.toString()).mul(
        voteInChainDecimalsMultiplier
      ),
    };

    const voteExtrinsic = getVoteTx(
      api,
      voteChoice,
      parseInt(referendumId),
      voteBalances,
      conviction < 1 ? 0 : sliderValue.value
    );

    setIsVoteLoading(true);
    await sendAndFinalize(
      api,
      voteExtrinsic,
      actingAccountSigner,
      actingAccount?.address,
      {
        title: `Vote on Referendum ${referendumId}`,
      }
    );
    setIsVoteLoading(false);

    // closeModal();
  }

  const handleSliderChange = (e: any) => {
    setSliderValue(VOTE_LOCK_OPTIONS[e.target.value]);
  };

  function valuetext(value: any) {
    return `${value}°C`;
  }

  function valueLabelFormat(value: any) {
    return marks[Math.floor(value)]?.label;
  }

  //   const voteAmountLabel = isBalanceLoading ? "Loading Balance ..." : "Balance";

  const {
    register,
    getValues,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      "vote-amount-aye": "1",
      "vote-amount-nay": "0",
      "vote-amount-abstain": "0",
    },
  });

  const watchAyeVoteAmount = watch<"vote-amount-aye">("vote-amount-aye", "0");
  const watchNayVoteAmount = watch<"vote-amount-nay">("vote-amount-nay", "0");
  const watchAbstainVoteAmount = watch<"vote-amount-abstain">(
    "vote-amount-abstain",
    "0"
  );

  const totalAyeVotes = !isNaN(parseFloat(watchAyeVoteAmount))
    ? voteChoice === VoteChoice.Aye
      ? (
          parseFloat(sliderValue.value.toString()) *
          parseFloat(watchAyeVoteAmount)
        )
          .toFixed(2)
          .replace(/[.,]00$/, "")
      : parseFloat(watchAyeVoteAmount)
          .toFixed(2)
          .replace(/[.,]00$/, "")
    : "-";

  const totalNayVotes = !isNaN(parseFloat(watchNayVoteAmount))
    ? voteChoice === VoteChoice.Nay
      ? (
          parseFloat(sliderValue.value.toString()) *
          parseFloat(watchNayVoteAmount)
        )
          .toFixed(2)
          .replace(/[.,]00$/, "")
      : parseFloat(watchNayVoteAmount)
          .toFixed(2)
          .replace(/[.,]00$/, "")
    : "-";

  const totalAbstainVotes = !isNaN(parseFloat(watchAbstainVoteAmount))
    ? parseFloat(watchAbstainVoteAmount)
        .toFixed(2)
        .replace(/[.,]00$/, "")
    : "-";

  return (
    <div>
      {hasUserSubmittedAnswers && (
        <div className="bg-emerald-600 text-white p-3 mt-4 rounded-lg text-sm">
          Thanks for answering those questions, your answers were successfully
          recorded. If you answered correctly, you will have a higher chance of
          receiving rare and epic Items for this Referendum.
        </div>
      )}
      {latestUserVote && (
        <div className="bg-amber-300 p-3 rounded-lg text-sm mt-3 mx-1">
          You already voted on this referendum. Voting again will replace your
          current vote.
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="my-5 mx-1">
        <ButtonGroup radius="sm" className="w-full px-4 mb-4">
          <Button
            className={clsx(
              "border-none",
              "aye vote-button h-10 rounded-none mr-0 w-1/4 bg-gradient-to-r border-y-2 border-l-2 text-black",
              { "scale-125 z-10": voteChoice === VoteChoice.Aye }
            )}
            color="success"
            onClick={async () => setVoteChoice(VoteChoice.Aye)}
          >
            Aye
          </Button>
          <Button
            className={clsx(
              "border-none",
              "nay vote-button h-10 rounded-none mr-0 w-1/4 border-y-2 text-black",
              { "scale-125 z-10": voteChoice === VoteChoice.Nay }
            )}
            color="danger"
            onClick={async () => setVoteChoice(VoteChoice.Nay)}
          >
            Nay
          </Button>
          <Button
            className={clsx(
              "border-none",
              "split vote-button h-10 rounded-none mr-0 w-1/4  border-y-2  text-black",
              { "scale-125 z-10": voteChoice === VoteChoice.Split }
            )}
            onClick={async () => setVoteChoice(VoteChoice.Split)}
            color="warning"
          >
            Split
          </Button>
          <Button
            className={clsx(
              "border-none",
              "abstain bg-gray-300 vote-button h-10 rounded-none mr-0 w-1/4 border-y-2 border-r-2 text-black",
              { "scale-125 z-10": voteChoice === VoteChoice.Abstain }
            )}
            onClick={async () => setVoteChoice(VoteChoice.Abstain)}
          >
            Abstain
          </Button>
        </ButtonGroup>
        <div className="flex"></div>

        {[VoteChoice.Aye, VoteChoice.Split, VoteChoice.Abstain].includes(
          voteChoice
        ) && (
          <>
            <Input
              isRequired
              className="mt-3"
              label="Aye Vote Value"
              placeholder="0"
              description={voteAmountLabel}
              type="number"
              min={0}
              step={0.01}
              {...register("vote-amount-aye", {
                validate: {
                  positiveNumber: (value) => parseFloat(value) >= 0,
                  hasEnoughFunds: (value) =>
                    availableBalance &&
                    parseFloat(value) <= parseFloat(availableBalance),
                },
              })}
            />

            {errors["vote-amount-aye"] &&
              errors["vote-amount-aye"].type === "positiveNumber" && (
                <p className="form-error">
                  Your vote amount must be a positive number
                </p>
              )}
            {errors["vote-amount-aye"] &&
              errors["vote-amount-aye"].type === "hasEnoughFunds" && (
                <p className="form-error text-red-600 text-sm">
                  {`You do not have enough available ${symbol}`}
                </p>
              )}
          </>
        )}

        {[VoteChoice.Nay, VoteChoice.Split, VoteChoice.Abstain].includes(
          voteChoice
        ) && (
          <>
            <Input
              isRequired
              className="mt-3"
              label="Nay Vote Value"
              placeholder="0"
              description={voteAmountLabel}
              type="number"
              min={0}
              step={0.01}
              {...register("vote-amount-nay", {
                validate: {
                  positiveNumber: (value) => parseFloat(value) >= 0,
                  hasEnoughFunds: (value) =>
                    availableBalance &&
                    parseFloat(value) <= parseFloat(availableBalance),
                },
              })}
            />
            {errors["vote-amount-nay"] &&
              errors["vote-amount-nay"].type === "positiveNumber" && (
                <p className="form-error">
                  Your vote amount must be a positive number
                </p>
              )}
            {errors["vote-amount-nay"] &&
              errors["vote-amount-nay"].type === "hasEnoughFunds" && (
                <p className="form-error">
                  {`You do not have enough available ${symbol}`}
                </p>
              )}
          </>
        )}

        {voteChoice === VoteChoice.Abstain && (
          <>
            <Input
              isRequired
              className="mt-3"
              label="Abstain Vote Value"
              placeholder="0"
              description={voteAmountLabel}
              type="number"
              min={0}
              step={0.01}
              {...register("vote-amount-abstain", {
                validate: {
                  positiveNumber: (value) => parseFloat(value) >= 0,
                  hasEnoughFunds: (value) =>
                    availableBalance &&
                    parseFloat(value) <= parseFloat(availableBalance),
                },
              })}
            />
            {errors["vote-amount-abstain"] &&
              errors["vote-amount-abstain"].type === "positiveNumber" && (
                <p className="form-error">
                  Your vote amount must be a positive number
                </p>
              )}
            {errors["vote-amount-abstain"] &&
              errors["vote-amount-abstain"].type === "hasEnoughFunds" && (
                <p className="form-error">
                  {`You do not have enough available ${symbol}`}
                </p>
              )}
          </>
        )}

        {![VoteChoice.Split, VoteChoice.Abstain].includes(voteChoice) && (
          <>
            <label
              htmlFor="conviction-slider"
              className={clsx(
                "mt-4 form-label block text-sm font-bold tracking-wider text-gray-900 dark:text-white",
                {
                  hidden: [VoteChoice.Split, VoteChoice.Abstain].includes(
                    voteChoice
                  ),
                }
              )}
            >
              Conviction
            </label>
            <div className="mx-3">
              <Slider
                aria-label="Conviction Slider"
                id="conviction-slider"
                className={clsx("conviction-slider")}
                defaultValue={1}
                min={0}
                max={6}
                marks={marks}
                value={sliderValue.value}
                valueLabelDisplay="auto"
                valueLabelFormat={valueLabelFormat}
                getAriaValueText={valuetext}
                onChange={handleSliderChange}
                ref={sliderRef}
              />
            </div>
            {sliderValue.value !== 0 && (
              <p className="text-xs text-foreground-400">{sliderValue.label}</p>
            )}
          </>
        )}

        <div className="mt-4 text-sm justify-around items-center rounded-lg form-status border-2 border-gray-500 p-3 px-4 flex flex-row">
          <span className="">Total Votes</span>
          <div className="text-right">
            <p>
              {[VoteChoice.Aye, VoteChoice.Split, VoteChoice.Abstain].includes(
                voteChoice
              ) && (
                <>
                  <span className="font-bold">{totalAyeVotes}</span> Aye Votes
                </>
              )}
            </p>
            <p>
              {[VoteChoice.Nay, VoteChoice.Split, VoteChoice.Abstain].includes(
                voteChoice
              ) && (
                <>
                  <span className="font-bold">{totalNayVotes}</span> Nay Votes{" "}
                </>
              )}
            </p>
            <p>
              {voteChoice === VoteChoice.Abstain && (
                <>
                  <span className="font-bold">{totalAbstainVotes}</span> Abstain
                  Votes{" "}
                </>
              )}
            </p>
          </div>
        </div>
        <Button
          type="submit"
          className={clsx("w-full mt-4 h-16", vividButtonClasses)}
          radius="sm"
          isLoading={isVoteLoading}
        >
          Cast Votes
        </Button>
      </form>
    </div>
  );
}
