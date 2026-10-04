/* eslint-disable @next/next/no-img-element -- small static SVG logos */
import { site } from "@/content/site";
import { asset } from "@/lib/asset";

export function SocialLinks({
  size,
  className = "",
}: {
  size: 20 | 32;
  className?: string;
}) {
  const box = size === 20 ? "size-5" : "size-8";
  return (
    <ul className={`flex items-center ${className}`.trim()}>
      {site.socials.map((s) => {
        const img = (
          <img
            src={asset(`/images/social/${s.key}.svg`)}
            alt={s.label}
            width={size}
            height={size}
            className={`size-full object-cover ${s.key === "max" ? "scale-125" : ""}`}
          />
        );
        const cls = `block shrink-0 overflow-hidden rounded-full ${box}`;
        return (
          <li key={s.key}>
            {s.url ? (
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className={`${cls} motion-safe:transition motion-safe:duration-150 hover:-translate-y-0.5 hover:brightness-90`}
              >
                {img}
              </a>
            ) : (
              <span aria-hidden className={cls}>
                {img}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
