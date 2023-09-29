"use client";

import React, { useEffect, useState } from "react";
import "@polkadot/api-augment";
import { NextUIProvider } from "@nextui-org/system";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProviderProps } from "next-themes/dist/types";
import { QueryClient, QueryClientProvider } from "react-query";
import { PolkadotExtensionContextProvider } from "@/providers/polkadot-extension-provider";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <NextUIProvider>
        <PolkadotExtensionContextProvider>
          <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>
        </PolkadotExtensionContextProvider>
      </NextUIProvider>
    </QueryClientProvider>
  );
}
