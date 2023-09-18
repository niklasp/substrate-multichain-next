import clsx from "clsx";
import styles from "./inline-loader.module.scss";
import React from "react";

export function InlineLoader(props: React.HTMLAttributes<HTMLDivElement>) {
  const className = clsx(styles.inlineLoader, props.className);
  return (
    <div className={className} {...props}>
      <span>.</span>
      <span>.</span>
      <span>.</span>
    </div>
  );
}
