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
