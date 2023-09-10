import { DM_Mono as FontMono, Inter as FontSans } from "next/font/google";

export const fontSans = FontMono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-mono",
  display: "swap",
  adjustFontFallback: false,
});
export const fontMono = FontMono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-mono",
  display: "swap",
  adjustFontFallback: false,
});
