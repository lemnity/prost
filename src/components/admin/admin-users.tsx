"use client";

import { useEffect, useState } from "react";
import { api, fullName, type Profile } from "@/lib/account/store";

type U = { id: number; email: string; role: string; profile: Profile; createdAt: string; orders: number; emailVerified: boolean };

export function AdminUsers() {
  const [users, setUsers] = useState<U[] | null>(null);
  const [error, setError] = useState("");
  const [issued, setIssued] = useState<{ id: number; password: string } | null>(null);
  async function resetPassword(u: U) {
    if (!window.confirm(`Задать новый пароль для ${u.email}? Старый перестанет работать.`)) return;
    const r = await api<{ password: string }>("/api/admin/users", { method: "PATCH", body: JSON.stringify({ id: u.id }) });
    if (r.ok) setIssued({ id: u.id, password: r.data.password });
    else setError(r.error);
  }
  useEffect(() => {
    void api<{ users: U[] }>("/api/admin/users", { cache: "no-store" }).then((r) => (r.ok ? setUsers(r.data.users) : setError(r.error)));
  }, []);
  if (error) return <p role="alert" className="text-brand">{error}</p>;
  if (!users) return <div aria-busy="true" className="h-[300px] animate-pulse rounded-[14px] bg-surface" />;
  return (
    <div className="overflow-x-auto rounded-[14px] border border-line">
      <table className="w-full min-w-[860px] text-left text-[14px]">
        <thead className="bg-surface text-[12px] uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-3 font-semibold">Клиент</th>
            <th className="px-4 py-3 font-semibold">Компания</th>
            <th className="px-4 py-3 font-semibold">Телефон</th>
            <th className="px-4 py-3 font-semibold">Заявок</th>
            <th className="px-4 py-3 font-semibold">Регистрация</th>
            <th className="px-4 py-3 font-semibold">Доступ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {users.map((u) => (
            <tr key={u.id}>
              <td className="px-4 py-3">
                {fullName(u.profile) || "—"}
                {u.role === "admin" ? <span className="ml-2 rounded-full bg-ink px-2 py-0.5 text-[11px] text-white">админ</span> : null}
                <span className="block text-[12px] text-muted">
                  {u.email} · {u.emailVerified ? <span className="text-new-text">почта подтверждена</span> : <span className="text-amber-700">не подтверждена</span>}
                </span>
              </td>
              <td className="px-4 py-3">{u.profile.company || "—"}{u.profile.inn ? <span className="block text-[12px] text-muted">ИНН {u.profile.inn}</span> : null}</td>
              <td className="px-4 py-3">{u.profile.phone || "—"}</td>
              <td className="px-4 py-3 tabular-nums">{u.orders}</td>
              <td className="px-4 py-3 text-[13px] text-muted">{new Date(u.createdAt).toLocaleDateString("ru-RU")}</td>
              <td className="px-4 py-3 text-[13px]">
                {issued?.id === u.id ? (
                  <span>
                    Новый пароль: <code className="rounded bg-surface px-1.5 py-0.5 font-mono font-semibold">{issued.password}</code>
                    <span className="block text-[11px] text-muted">Показан один раз — передайте клиенту</span>
                  </span>
                ) : u.role === "admin" ? (
                  "—"
                ) : (
                  <button type="button" onClick={() => void resetPassword(u)} className="font-medium text-brand underline hover:text-brand-hover">
                    Задать новый пароль
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
