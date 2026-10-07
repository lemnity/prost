import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountShell } from "@/components/account/account-shell";
import { ChatView } from "@/components/account/chat-view";

export const metadata: Metadata = {
  title: "Чат с менеджером — ProStyle",
  description: "Чат с персональным менеджером ProStyle по вашей заявке.",
  robots: { index: false },
};

export default function ChatPage() {
  return (
    <AccountShell section="chat" guest>
      <Suspense fallback={<div aria-busy="true" className="h-[480px] animate-pulse rounded-[14px] bg-surface motion-reduce:animate-none" />}>
        <ChatView />
      </Suspense>
    </AccountShell>
  );
}
