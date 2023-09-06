import { useAppStore } from "@/app/zustand";
import { getChainByName } from "@/config/chains";
import { ApiPromise } from "@polkadot/api";
import { InjectedExtension } from "@polkadot/extension-inject/types";
import { useQuery } from "react-query";

const getAccountBalance = async (
  api: ApiPromise | undefined,
  address: string,
  extensionInjectedPromise?: Promise<InjectedExtension[]>
) => {
  let userAddress = address;
  console.log(
    `get account balance waiting for user extension injected promise ${address}`
  );
  await extensionInjectedPromise;
  const balance = await api?.query.system.account(userAddress);
  return balance;
};

export const useAccountBalance = () => {
  const chain = useAppStore((state) => state.chain);
  const { api } = chain;
  const user = useAppStore((state) => state.user);
  const { extensionInjectedPromise } = user;
  const { address } = user?.accounts?.[user.actingAccountIdx] || {};

  return useQuery([chain.name, address, "accountBalance"], async () =>
    getAccountBalance(api, address, extensionInjectedPromise)
  );
};
