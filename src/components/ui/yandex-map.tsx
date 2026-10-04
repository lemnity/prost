import { site } from "@/content/site";

// Координаты адреса (геокодированы один раз), чтобы виджет показал метку.
const MAP_POINT = "65.535297,57.128887";
const embedUrl = `https://yandex.ru/map-widget/v1/?ll=${MAP_POINT}&z=16&pt=${MAP_POINT},pm2rdm`;

export const yandexMapUrl = `https://yandex.ru/maps/?text=${encodeURIComponent(site.address)}`;

export function YandexMap({ className = "", height }: { className?: string; height?: number }) {
  return (
    <div
      className={`overflow-hidden rounded-[12px] bg-[#E9ECEF] ${className}`.trim()}
      style={height ? { height } : undefined}
    >
      <iframe
        src={embedUrl}
        title={`Карта: ${site.address}`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        className="size-full border-0"
      />
    </div>
  );
}

const [lon, lat] = MAP_POINT.split(",");
export const yandexRouteUrl = `https://yandex.ru/maps/?rtext=~${lat},${lon}&rtt=auto`;
