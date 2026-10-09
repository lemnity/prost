"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Container } from "@/components/ui/container";
import { signInDemo } from "@/lib/account/store";

/** Создаёт демо-кабинет в этом браузере и открывает его. */
export function DemoLogin() {
  const router = useRouter();
  useEffect(() => {
    let alive = true;
    void signInDemo().then((r) => alive && r.ok && router.replace("/account"));
    return () => {
      alive = false;
    };
  }, [router]);
  return (
    <main id="main">
      <Container className="py-16 text-center">
        <p aria-live="polite" className="text-[18px] font-semibold">Готовим демо-кабинет…</p>
      </Container>
    </main>
  );
}
