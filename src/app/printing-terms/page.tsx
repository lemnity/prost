import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Требования к макетам — ProStyle",
  description: "Макет — файл, являющийся утвержденным дизайнерским решением, законченным в обработке и подготовленным к печати, не требующий каких-либо дальнейших…",
};

export default function Page() {
  return <LegalPage slug="printing-terms" />;
}
