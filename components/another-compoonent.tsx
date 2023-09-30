import { usePolkadotExtension } from "@/providers/polkadot-extension-provider";
import { trimAddress } from "./util";

export function AnotherComponent() {
  const { selectedAccount } = usePolkadotExtension();
  return (
    <>
      {selectedAccount && (
        <p>
          Hello{" "}
          {selectedAccount.meta?.name ?? trimAddress(selectedAccount.address)}{" "}
          👋{" "}
        </p>
      )}
    </>
  );
}
