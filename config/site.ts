export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Proof of Chaos",
  description: "Incentivizing voting on Polkadot and Kusama",
  navItems: [
    {
      label: "About",
      href: "/about",
    },
    {
      label: "NFTs",
      href: "/nfts",
    },
    {
      label: "Vote",
      href: "/vote/all",
      chainLink: true,
    },
    {
      label: "Rewards",
      href: "/referendum-rewards",
      chainLink: true,
    },
  ],
  navMenuItems: [
    {
      label: "Profile",
      href: "/profile",
    },
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Projects",
      href: "/projects",
    },
    {
      label: "Team",
      href: "/team",
    },
    {
      label: "Calendar",
      href: "/calendar",
    },
    {
      label: "Settings",
      href: "/settings",
    },
    {
      label: "Help & Feedback",
      href: "/help-feedback",
    },
    {
      label: "Logout",
      href: "/logout",
    },
  ],
  links: {
    github: "https://github.com/Proof-Of-Chaos/website",
    twitter: "https://twitter.com/GovPartRewKSM",
    discord: "https://discord.gg/raMucevj",
  },
};
