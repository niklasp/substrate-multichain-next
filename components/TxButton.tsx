"use client";

import { useAppStore } from "@/app/zustand";
import { DEFAULT_CHAIN, getChainInfo } from "@/config/chains";
import { kusama } from "@/config/chains/kusama";
import { useSubstrateChain } from "@/context/substrate-chain-context";
import { useAccountBalance } from "@/hooks/use-account-balance";
import { ChainType, SubstrateChain } from "@/types";
import { Button, ButtonProps } from "@nextui-org/button";
import {
  BN,
  BN_MAX_INTEGER,
  BN_ZERO,
  bnToBn,
  formatBalance,
} from "@polkadot/util";
import { InlineLoader } from "./inline-loader";
import { TxTypes, getTxCost } from "./util-client";
import { format } from "path";
import clsx from "clsx";
import React, { MouseEventHandler, useEffect, useState } from "react";
import { useTxCost } from "@/hooks/use-tx-cost";
import { Deposit, useDeposits } from "@/hooks/use-deposit";
import { UseDepositsType } from "../hooks/use-deposit";
import { Tooltip } from "@nextui-org/tooltip";
import { ApiPromise } from "@polkadot/api";
import { set } from "lodash";
import Check from "@w3f/polkadot-icons/keyline/Check";

type DepositCountType = {
  type: Deposit;
  amount?: number;
};

type TxButtonProps = ButtonProps & {
  extrinsic: TxTypes;
  requiredBalance?: string;
  deposits?: DepositCountType[];
  chainType?: ChainType;
  loadingText?: React.ReactNode;
  successText?: React.ReactNode;
  error?: { name: string; message: string };
  setError?: (error: { name: string; message: string }) => void;
  promise: (...args: any[]) => Promise<unknown>;
};

export function TxButton(props: TxButtonProps) {
  const {
    requiredBalance,
    extrinsic,
    deposits,
    children,
    chainType,
    successText,
    loadingText,
    promise,
    error: errorProp,
    setError: setErrorProp,
    ...rest
  } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState({
    message: "",
    name: "",
  });

  const user = useAppStore((state) => state.user);
  const { actingAccount } = user;
  const { data: accountBalance, isLoading: isAccountBalanceLoading } =
    useAccountBalance(chainType);

  const { activeChain } = useSubstrateChain();
  const { symbol, decimals } = getChainInfo(activeChain?.name || DEFAULT_CHAIN);

  const { data: txCost, isLoading: isTxCostLoading } = useTxCost(
    extrinsic,
    chainType
  );
  const { data: depositCosts, isLoading: isDepositCostLoading } =
    useDeposits(chainType);

  const totalDeposit = deposits
    ?.map((deposit) =>
      bnToBn(depositCosts?.[`${deposit.type}`]).muln(deposit.amount || 1)
    )
    .reduce((a, b) => a.add(b), BN_ZERO);

  const isLoadingProp =
    props.isLoading || isAccountBalanceLoading || isDepositCostLoading;

  const requiredBalanceCalculated = requiredBalance
    ? requiredBalance
    : isTxCostLoading || isDepositCostLoading
    ? BN_MAX_INTEGER
    : //@ts-ignore
      totalDeposit?.add(txCost?.partialFee);

  const humanRequiredBalance = formatBalance(requiredBalanceCalculated, {
    decimals,
    withUnit: symbol,
    forceUnit: "-",
    withSi: true,
  });

  const humanBalance =
    formatBalance(accountBalance?.data?.free, {
      decimals,
      withUnit: symbol,
      forceUnit: "-",
      withSi: true,
    }) || `0 ${symbol}`;

  const availableBalanceBn = accountBalance?.data?.free
    ? bnToBn(accountBalance?.data?.free)
    : BN_ZERO;
  const hasEnough =
    isAccountBalanceLoading || isDepositCostLoading
      ? false
      : availableBalanceBn.gte(bnToBn(requiredBalanceCalculated));

  const onSubmit = async (e: any) => {
    try {
      console.log("clicked button, awaiting propmise");

      if (promise) {
        setIsLoading(true);
        setIsSuccess(false);
        console.log("awaiting props.onClick");
        const res = await promise();
        console.log("after submit", res);
        setIsSuccess(true);
      }
    } catch (e: any) {
      setError({
        name: e.name,
        message: e.message,
      });
      setErrorProp?.({
        name: e.name,
        message: e.message,
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
    }
  };

  return (
    <div className="flex flex-col text-tiny w-full">
      {hasEnough ? (
        <Button
          {...rest}
          isLoading={isLoading}
          onClick={onSubmit}
          startContent={<>{isSuccess && <Check stroke="lime" />}</>}
          isDisabled={isSuccess}
        >
          {isLoading && loadingText
            ? loadingText
            : isSuccess && successText
            ? successText
            : children}
        </Button>
      ) : (
        <Tooltip content="Not enough funds to send tx">
          <Button {...rest} isLoading={isLoading} isDisabled>
            {children}
          </Button>
        </Tooltip>
      )}
      <span className="text-right text-tiny mt-1 text-warning">
        required: ~{humanRequiredBalance}
      </span>
      <span
        className={clsx("text-right text-tiny", {
          "text-success": hasEnough,
          "text-danger": !hasEnough,
          "text-default": isLoading,
        })}
      >
        available:{" "}
        {isAccountBalanceLoading ? (
          <InlineLoader afterContent=" KSM" />
        ) : (
          humanBalance
        )}
      </span>
    </div>
  );
}
