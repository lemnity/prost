import styles from "./brand-loader.module.css";

/*
 * Animation adapted from "Rectangle loading" by John Grishin
 * (https://codepen.io/exah/pen/VYLNJG), Copyright (c) 2026 John Grishin,
 * MIT License (full text in THIRD_PARTY_NOTICES.md).
 */

const BRACKET =
  "M159.666 66.2432V139.026C159.666 148.461 155.811 157.032 149.604 163.236C143.395 169.441 134.821 173.294 125.383 173.294H34.2833C24.8443 173.294 16.2701 169.442 10.0624 163.237C3.85384 157.032 0 148.462 0 139.026V47.9674C0 38.5323 3.85384 29.9622 10.0615 23.7563C16.2701 17.5511 24.8443 13.6992 34.2833 13.6992H107.099V36.5452H34.2833C31.1529 36.5452 28.2973 37.8336 26.2212 39.9088C24.1454 41.984 22.8561 44.8383 22.8561 47.9674V139.026C22.8561 142.155 24.1454 145.009 26.222 147.084C28.2981 149.159 31.1529 150.448 34.2833 150.448H125.383C128.513 150.448 131.368 149.158 133.444 147.083C135.52 145.008 136.81 142.155 136.81 139.026V66.2432H159.666Z";

export function BrandLoader({
  size = 56,
  label = "Загрузка…",
  hideVisibleLabel = false,
}: {
  size?: number;
  label?: string;
  /** Keep the label screen-reader only, even under reduced motion. */
  hideVisibleLabel?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="inline-flex flex-col items-center gap-1"
    >
      <svg
        width={size}
        height={size}
        viewBox="-6 -6 185.02 185.3"
        fill="none"
        aria-hidden="true"
      >
        <path d={BRACKET} fill="#444551" fillOpacity={0.12} />
        <path
          d={BRACKET}
          pathLength={100}
          fill="none"
          stroke="#444551"
          strokeWidth={9}
          strokeLinecap="butt"
          className={styles.dash}
        />
        <path
          className={styles.pulse}
          fillRule="evenodd"
          clipRule="evenodd"
          d="M129.59 0H166.16C169.931 0 173.016 3.08323 173.016 6.85281V43.4057C173.016 47.1755 169.931 50.2585 166.16 50.2585H129.59C125.819 50.2585 122.734 47.1755 122.734 43.4057V6.85281C122.734 3.08323 125.819 0 129.59 0Z"
          fill="#65B137"
        />
      </svg>
      <span
        className={
          hideVisibleLabel ? `${styles.label} ${styles.srOnly}` : styles.label
        }
      >{label}</span>
    </div>
  );
}
