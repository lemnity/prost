import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Согласие на обработку персональных данных — ProStyle",
  description: "Настоящим я проинформирован о том, что в соответствии с Федеральным законом от 27.07.2006 N 152-ФЗ \"О персональных данных\", предоставленная мною…",
};

export default function Page() {
  return <LegalPage slug="personal-data-processing" />;
}
