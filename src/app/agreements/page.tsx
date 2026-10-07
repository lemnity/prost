import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Соглашение по использованию сервиса — ProStyle",
  description: "Настоящее Соглашение о конфиденциальности персональных данных (далее Соглашение) является официальным предложением (публичной офертой)",
};

export default function Page() {
  return <LegalPage slug="agreements" />;
}
