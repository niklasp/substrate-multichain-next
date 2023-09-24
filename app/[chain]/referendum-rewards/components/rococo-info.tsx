import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Link, LinkIcon } from "@nextui-org/link";

export function RococoInfo() {
  return (
    <Card className="border border-2 border-warning-500 text-tiny mb-8">
      <CardBody className="flex-none inline">
        <h3 className="text-lg text-center mb-3">⚠️ Rococo Rewards ⚠️</h3>
        On rococo you can test your sendouts without spending money. But you
        need ROC tokens. On Rococo Asset Hub.
        <ol className="list-decimal list-inside">
          <li>
            <Link
              className="text-tiny"
              size="sm"
              underline="hover"
              isExternal
              href="https://paritytech.github.io/polkadot-testnet-faucet/"
            >
              Get ROC Test Tokens
            </Link>
          </li>
          <li>
            <Link
              className="text-tiny"
              size="sm"
              underline="hover"
              isExternal
              href="https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Frococo-rpc.polkadot.io#/explorer"
            >
              teleport some tokens to Rococo Asset Hub
            </Link>
          </li>
        </ol>
        You can then use the page, however the nfts will not appear in any
        frontend like Kodadot.
      </CardBody>
    </Card>
  );
}
