import { decodeAddress, encodeAddress } from "@polkadot/keyring";

export function validateAddress(address: string, ss58Format: number) {
  try {
    decodeAddress(address, false, ss58Format);
  } catch (error) {
    return false;
  }

  return true;
}
