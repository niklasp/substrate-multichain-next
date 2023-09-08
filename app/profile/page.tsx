import { subtitle, title } from "@/components/primitives";
import clsx from "clsx";

export default function AboutPage() {
  return (
    <div>
      <h1 className={title({ siteTitle: true })}>Profile</h1>
      <p className={clsx(subtitle(), "text-center")}>
        Here you will soon see your NFts, and can manage user specific settings
      </p>
    </div>
  );
}
