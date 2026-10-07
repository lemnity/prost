import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Процедура урегулирования претензий — ProStyle",
  description: "Строгий контроль качества – это основной принцип работы нашей компании.",
};

export default function Page() {
  return <LegalPage slug="claim-resolution-process" />;
}
