"use client";

/** Отправка формы фильтров при смене значения (без JS — кнопкой «Показать»). */
export function AutoSubmitSelect(props: React.ComponentProps<"select">) {
  return <select {...props} onChange={(e) => e.currentTarget.form?.requestSubmit()} />;
}
