// Единый стиль кнопок: одинаковая высота у заполненных и контурных (border есть у обоих).
export type ButtonVariant = "primary" | "outline" | "plain";
export type ButtonSize = "sm" | "md" | "lg";

const SIZE: Record<ButtonSize, { h: string; px: string; text: string }> = {
  sm: { h: "h-9", px: "px-3", text: "text-[13px]" },
  md: { h: "h-11", px: "px-5", text: "text-[14px]" },
  lg: { h: "h-12", px: "px-6", text: "text-[15px]" },
};

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "border border-brand bg-brand text-white hover:border-brand-hover hover:bg-brand-hover disabled:cursor-not-allowed disabled:border-faint disabled:bg-faint disabled:hover:border-faint disabled:hover:bg-faint",
  outline: "border border-brand bg-white text-brand hover:bg-brand hover:text-white",
  // Цвет задаёт вызывающий код (border остаётся, чтобы высота совпадала).
  plain: "border border-transparent",
};

/** Классы кнопки/ссылки-кнопки. px — свой горизонтальный отступ вместо стандартного. */
export function buttonClass({
  variant = "primary",
  size = "md",
  full = false,
  px,
}: { variant?: ButtonVariant; size?: ButtonSize; full?: boolean; px?: string } = {}): string {
  const s = SIZE[size];
  return [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] font-semibold transition-colors",
    s.h,
    px ?? s.px,
    s.text,
    VARIANT[variant],
    full ? "w-full" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

// Шеврон — data URI (без файла, basePath не нужен).
const CHEVRON = "bg-[url(data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2716%27%20height=%2716%27%20viewBox=%270%200%2016%2016%27%20fill=%27none%27%20stroke=%27%236b6b78%27%20stroke-width=%271.6%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3E%3Cpath%20d=%27M4%206l4%204%204-4%27/%3E%3C/svg%3E)]";

/** Единый стиль нативного <select>: своя стрелка с отступом от края. */
export function selectClass({ size = "md" }: { size?: "sm" | "md" | "form" } = {}): string {
  const base =
    "appearance-none border border-line bg-white bg-no-repeat text-ink hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand";
  const pos = size === "md" || size === "form" ? "bg-[position:right_16px_center] pr-11" : "bg-[position:right_12px_center] pr-9";
  const dims =
    size === "form"
      ? "mt-1.5 block h-12 w-full rounded-lg pl-3.5 text-[15px]"
      : size === "md"
        ? "h-12 rounded-[10px] pl-4 text-[15px]"
        : "h-10 rounded-lg pl-3 text-[14px]";
  return [base, CHEVRON, pos, dims].join(" ");
}
