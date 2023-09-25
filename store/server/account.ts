import Keyring from "@polkadot/keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { KeyringPair } from "@polkadot/keyring/types";

export const initAccount = async (): Promise<KeyringPair> => {
  if (!process.env.MNEMONIC) {
    throw new Error("No MNEMONIC provided in .env");
  }
  const keyring = new Keyring({ type: "sr25519" });
  await cryptoWaitReady();
  const account = keyring.addFromUri(process.env.MNEMONIC);
  return account;
};
