"use client";

/** Отправка формы фильтров при смене значения (без JS — кнопкой «Показать»). */
export function AutoSubmitSelect(props: React.ComponentProps<"select">) {
  return <select {...props} onChange={(e) => e.currentTarget.form?.requestSubmit()} />;
}

/** Чекбокс фильтра: применяется сразу (без JS — кнопкой «Показать»). */
export function AutoSubmitCheckbox(props: Omit<React.ComponentProps<"input">, "type">) {
  return <input {...props} type="checkbox" onChange={(e) => e.currentTarget.form?.requestSubmit()} />;
}
