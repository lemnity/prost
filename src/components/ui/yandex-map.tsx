import { site } from "@/content/site";

const TYUMEN_POINT = "65.535297,57.128887";

const embedUrl = (point: string) =>
  `https://yandex.ru/map-widget/v1/?ll=${point}&z=16&pt=${point},pm2rdm`;

export const yandexMapUrl = `https://yandex.ru/maps/?text=${encodeURIComponent(site.address)}`;

export function yandexRouteUrl(point: string = TYUMEN_POINT) {
  const [lon, lat] = point.split(",");
  return `https://yandex.ru/maps/?rtext=~${lat},${lon}&rtt=auto`;
}

export function YandexMap({
  className = "",
  height,
  point = TYUMEN_POINT,
  title = `Карта: ${site.address}`,
}: {
  className?: string;
  height?: number;
  point?: string;
  title?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[12px] bg-[#E9ECEF] ${className}`.trim()}
      style={height ? { height } : undefined}
    >
      <iframe
        src={embedUrl(point)}
        title={title}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        className="size-full border-0"
      />
    </div>
  );
}
