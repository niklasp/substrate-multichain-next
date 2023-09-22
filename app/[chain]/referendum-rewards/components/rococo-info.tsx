import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Link, LinkIcon } from "@nextui-org/link";

export function RococoInfo() {
  return (
    <Card className="border border-2 border-warning-500 text-sm mb-8">
      <CardHeader className="text-lg text-center w-full items-center justify-center">
        ⚠️ Rococo Rewards Notice
      </CardHeader>
      <CardBody className="flex-none inline">
        On rococo you can test your sendouts without spending money. But you
        need ROC tokens.
        <ol className="list-decimal list-inside">
          <li>
            <Link
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
              size="sm"
              underline="hover"
              isExternal
              href="https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Frococo-rpc.polkadot.io#/explorer"
            >
              teleport some tokens to Rococo Asset Hub
            </Link>
          </li>
        </ol>
        You can then use the page
      </CardBody>
    </Card>
  );
}
