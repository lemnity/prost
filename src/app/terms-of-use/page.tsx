import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Пользовательское соглашение — ProStyle",
  description: "Настоящее соглашение, являясь пользовательским соглашением (далее - Соглашение), заключенным между физическим лицом, действующим в своих интересах…",
};

export default function Page() {
  return <LegalPage slug="terms-of-use" />;
}
