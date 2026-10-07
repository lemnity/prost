import type { Metadata } from "next";
import { DemoLogin } from "@/components/account/demo-login";

export const metadata: Metadata = {
  title: "Демо-доступ — ProStyle",
  robots: { index: false, follow: false },
};

export default function DemoPage() {
  return <DemoLogin />;
}
