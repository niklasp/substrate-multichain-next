import { Button as NextUIButton } from "@nextui-org/button";
import { extendVariants } from "@nextui-org/system-rsc";

export const Button = extendVariants(NextUIButton, {
  variants: {
    color: {
      vivid: "text-white bg-gradient-to-r from-blue-400 to-purple-400",
    },
  },
});
