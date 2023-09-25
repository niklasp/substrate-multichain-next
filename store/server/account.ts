import Keyring from "@polkadot/keyring";
import { KeyringPair } from "@polkadot/keyring/types";

export const initAccount = (): KeyringPair => {
  if (!process.env.MNEMONIC) {
    throw new Error("No MNEMONIC provided in .env");
  }
  const keyring = new Keyring({ type: "sr25519" });
  const account = keyring.addFromUri(process.env.MNEMONIC);
  return account;
};
