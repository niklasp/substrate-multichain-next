import clsx from "clsx";
import styles from "./inline-loader.module.scss";
import React from "react";

type InlineLoaderProps = React.HTMLAttributes<HTMLDivElement> & {
  afterContent?: React.ReactNode;
};

export function InlineLoader(props: InlineLoaderProps) {
  const { afterContent, ...rest } = props;
  const className = clsx(styles.inlineLoader, props.className);
  return (
    <div className={className} {...rest}>
      <span>.</span>
      <span>.</span>
      <span>.</span>
      {afterContent && <span>{afterContent}</span>}
    </div>
  );
}
