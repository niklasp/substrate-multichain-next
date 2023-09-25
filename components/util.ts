import {
  RewardConfiguration,
  RewardOption,
} from "@/app/[chain]/referendum-rewards/types";
import { rewardsConfig } from "../config/rewards";

export const trimAddress = (address: string, amount: number = 3) => {
  if (!address) {
    return "";
  }
  return `${address.slice(0, amount)}...${address.slice(-amount)}`;
};

export const titleCase = (s: string | undefined) =>
  s &&
  s.replace(/^_*(.)|_+(.)/g, (_, c, d) =>
    c ? c.toUpperCase() : " " + d.toUpperCase()
  );

export function mergeWithDefaultConfig(config: any): RewardConfiguration {
  return {
    ...rewardsConfig.DEFAULT_REWARDS_CONFIG,
    ...config,
    collectionConfig: {
      ...rewardsConfig.DEFAULT_REWARDS_CONFIG.collectionConfig,
      ...config.collectionConfig,
    },
    options: rewardsConfig.DEFAULT_REWARDS_CONFIG.options.map(
      (defaultOption: RewardOption) => {
        const overrideOption = config.options?.find(
          (option: any) => option.rarity === defaultOption.rarity
        );

        return {
          ...defaultOption,
          ...(overrideOption || {}),
        };
      }
    ),
  };
}
