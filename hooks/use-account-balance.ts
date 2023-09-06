import { useAppStore } from "@/app/zustand";
import { getChainByName } from "@/config/chains";
import { ApiPromise } from "@polkadot/api";
import { useQuery } from "react-query";

const getAccountBalance = async (
  api: ApiPromise | undefined,
  address: string
) => {
  const balance = await api?.query.system.account(address);
  return balance;
};

export const useAccountBalance = () => {
  const chain = useAppStore((state) => state.chain);
  const { api } = chain;
  const { address } =
    useAppStore(
      (state) => state.user?.accounts?.[state.user.actingAccountIdx]
    ) || {};
  return useQuery([chain.name, address, "accountBalance"], async () =>
    getAccountBalance(api, address)
  );
};
