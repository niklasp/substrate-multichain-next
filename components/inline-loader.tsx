import styles from "./inline-loader.module.scss";

export function InlineLoader() {
  return (
    <div className={styles.inlineLoader}>
      <span>.</span>
      <span>.</span>
      <span>.</span>
    </div>
  );
}
