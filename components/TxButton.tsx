"use client";

import { useAppStore } from "@/app/zustand";
import { DEFAULT_CHAIN, getChainInfo } from "@/config/chains";
import { kusama } from "@/config/chains/kusama";
import { useSubstrateChain } from "@/context/substrate-chain-context";
import { useAccountBalance } from "@/hooks/use-account-balance";
import { SubstrateChain } from "@/types";
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
import { useEffect, useState } from "react";
import { useTxCost } from "@/hooks/use-tx-cost";
import { Deposit, useDeposits } from "@/hooks/use-deposit";
import { UseDepositsType } from "../hooks/use-deposit";
import { Tooltip } from "@nextui-org/tooltip";

type DepositCountType = {
  type: Deposit;
  amount?: number;
};

type TxButtonProps = ButtonProps & {
  extrinsic: TxTypes;
  requiredBalance?: string;
  deposits?: DepositCountType[];
};

export function TxButton(props: TxButtonProps) {
  const { requiredBalance, extrinsic, deposits, children, ...rest } = props;
  const user = useAppStore((state) => state.user);
  const { actingAccount } = user;
  const { data: accountBalance, isLoading: isAccountBalanceLoading } =
    useAccountBalance();

  const { activeChain } = useSubstrateChain();
  const { symbol, decimals } = getChainInfo(activeChain?.name || DEFAULT_CHAIN);

  const { data: txCost, isLoading: isTxCostLoading } = useTxCost(extrinsic);
  const { data: depositCosts, isLoading: isDepositCostLoading } = useDeposits();

  console.log("depositCosts", depositCosts);

  const totalDeposit = deposits
    ?.map((deposit) =>
      bnToBn(depositCosts?.[`${deposit.type}`]).muln(deposit.amount || 1)
    )
    .reduce((a, b) => a.add(b), BN_ZERO);

  const isLoading =
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

  const requiredBalanceBn = requiredBalance
    ? bnToBn(requiredBalance)
    : BN_MAX_INTEGER;
  const availableBalanceBn = accountBalance?.data?.free
    ? bnToBn(accountBalance?.data?.free)
    : BN_ZERO;
  const hasEnough =
    isAccountBalanceLoading || isDepositCostLoading
      ? false
      : availableBalanceBn.gte(bnToBn(requiredBalanceCalculated));

  return (
    <div className="flex flex-col text-tiny w-full">
      {hasEnough ? (
        <Button {...rest} isLoading={isLoading}>
          {children}
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
