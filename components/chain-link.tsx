"use client";

import clsx from "clsx";
import NextLink from "next/link";
import { link as linkStyles } from "@nextui-org/theme";
import { usePathname } from "next/navigation";
import { SubstrateChain } from "@/types";
import { LinkProps } from "@nextui-org/link";
import { useSubstrateChain } from "@/context/substrate-chain-context";
import { DEFAULT_CHAIN } from "@/config/chains";

export function ChainLink(props: LinkProps) {
  const { href, children } = props;

  const { activeChain } = useSubstrateChain();
  const name = activeChain ? activeChain.name : DEFAULT_CHAIN;
  const chainLinkHref = `/${name}${href}`;

  return (
    <NextLink
      className={clsx(
        linkStyles({ color: "foreground" }),
        "text-lg data-[active=true]:text-primary data-[active=true]:font-bold"
      )}
      color="foreground"
      href={chainLinkHref ?? ""}
    >
      {children}
    </NextLink>
  );
}
