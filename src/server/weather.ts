/** Погода для Виктории: Open-Meteo (бесплатно, без ключа). По умолчанию — Тюмень, где офис компании. */
const WMO: Record<number, string> = {
  0: "ясно", 1: "в основном ясно", 2: "переменная облачность", 3: "пасмурно", 45: "туман", 48: "туман с изморозью",
  51: "слабая морось", 53: "морось", 55: "сильная морось", 56: "ледяная морось", 57: "сильная ледяная морось",
  61: "небольшой дождь", 63: "дождь", 65: "сильный дождь", 66: "ледяной дождь", 67: "сильный ледяной дождь",
  71: "небольшой снег", 73: "снег", 75: "сильный снег", 77: "снежные зёрна",
  80: "ливневый дождь", 81: "ливень", 82: "сильный ливень", 85: "снегопад", 86: "сильный снегопад",
  95: "гроза", 96: "гроза с градом", 99: "сильная гроза с градом",
};

const cache = new Map<string, { at: number; value: unknown }>();

export async function weather(city = "Тюмень"): Promise<unknown> {
  const name = city.trim().slice(0, 60) || "Тюмень";
  const hit = cache.get(name.toLowerCase());
  if (hit && Date.now() - hit.at < 20 * 60_000) return hit.value;
  const geo = (await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=ru`, { signal: AbortSignal.timeout(10_000) })).json()) as {
    results?: { name: string; latitude: number; longitude: number; country?: string }[];
  };
  const place = geo.results?.[0];
  if (!place) return { error: `Город «${name}» не найден` };
  const q = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: "temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code",
    timezone: "auto",
    forecast_days: "2",
  });
  const f = (await (await fetch(`https://api.open-meteo.com/v1/forecast?${q}`, { signal: AbortSignal.timeout(10_000) })).json()) as {
    current?: { temperature_2m: number; apparent_temperature: number; precipitation: number; weather_code: number; wind_speed_10m: number };
    daily?: { temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_probability_max: number[]; weather_code: number[] };
  };
  const c = f.current, d = f.daily;
  if (!c || !d) return { error: "Погода сейчас недоступна" };
  const day = (i: number) => ({
    погода: WMO[d.weather_code[i]] ?? "без описания",
    температура: `от ${Math.round(d.temperature_2m_min[i])} до ${Math.round(d.temperature_2m_max[i])} °C`,
    вероятность_осадков: `${d.precipitation_probability_max[i] ?? 0}%`,
  });
  const value = {
    город: place.name,
    сейчас: {
      погода: WMO[c.weather_code] ?? "без описания",
      температура: `${Math.round(c.temperature_2m)} °C, ощущается как ${Math.round(c.apparent_temperature)} °C`,
      осадки_мм: c.precipitation,
      ветер: `${Math.round(c.wind_speed_10m / 3.6)} м/с`,
    },
    сегодня: day(0),
    завтра: day(1),
  };
  cache.set(name.toLowerCase(), { at: Date.now(), value });
  if (cache.size > 200) cache.clear();
  return value;
}
