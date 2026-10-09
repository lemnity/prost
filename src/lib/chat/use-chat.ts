"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/account/store";
import type { ChatInfo, ChatMessage } from "./types";

const POLL_MS = 4000;

/** Чаты (по заявкам) текущего пользователя или гостя. */
export function useChatList() {
  const [state, setState] = useState<{ chats: ChatInfo[]; loaded: boolean }>({ chats: [], loaded: false });
  useEffect(() => {
    let alive = true;
    void api<{ chats: ChatInfo[] }>("/api/chats", { cache: "no-store" }).then((r) => {
      if (alive) setState({ chats: r.ok ? r.data.chats : [], loaded: true });
    });
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

/**
 * Переписка по заявке: загрузка, опрос новых сообщений, отправка (текст + файлы).
 * Время сообщений переводится в часы браузера (поправка на расхождение с сервером).
 */
export function useChat(number: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState("");
  const last = useRef(0);
  const skew = useRef(0);

  const pull = useCallback(async () => {
    const r = await api<{ messages: ChatMessage[]; now: number }>(`/api/chat/${encodeURIComponent(number)}?after=${last.current}`, { cache: "no-store" });
    if (!r.ok) return setError(r.status === 404 ? "Чат не найден" : "");
    setError("");
    skew.current = r.data.now - Date.now();
    if (!r.data.messages.length) return;
    const fix = (m: ChatMessage): ChatMessage => ({ ...m, at: m.at - skew.current, ...(m.typeAt ? { typeAt: m.typeAt - skew.current } : {}) });
    last.current = Math.max(last.current, ...r.data.messages.map((m) => m.id));
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      return [...prev, ...r.data.messages.filter((m) => !seen.has(m.id)).map(fix)];
    });
  }, [number]);

  useEffect(() => {
    void pull();
    const id = setInterval(() => document.visibilityState === "visible" && void pull(), POLL_MS);
    return () => clearInterval(id);
  }, [pull]);

  const send = useCallback(
    async (text: string, files: File[]) => {
      const body = new FormData();
      body.append("text", text);
      files.forEach((f) => body.append("files", f, f.name));
      const r = await api(`/api/chat/${encodeURIComponent(number)}`, { method: "POST", body });
      if (!r.ok) {
        setError(r.error);
        return false;
      }
      await pull();
      return true;
    },
    [number, pull],
  );

  return { messages, error, send };
}
