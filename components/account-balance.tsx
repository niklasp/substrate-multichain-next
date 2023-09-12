"use client";

import { useAppStore } from "@/app/zustand";
import { useAccountBalance } from "@/hooks/use-account-balance";

export const AccountBalance = () => {
  const chain = useAppStore((state) => state.chain);
  const user = useAppStore((state) => state.user);
  const { data: accountBalance } = useAccountBalance();

  return (
    <div className="text-xs">
      Free Account Balance: {JSON.stringify(accountBalance)}
    </div>
  );
};
