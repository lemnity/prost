import type { Metadata } from "next";
import { AuthLayout } from "@/components/account/auth-layout";
import { LoginForm } from "@/components/account/auth-forms";

export const metadata: Metadata = {
  title: "Вход в личный кабинет — ProStyle",
  description: "Вход в личный кабинет ProStyle: история заказов, избранное и данные компании.",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <AuthLayout title="Вход" lead="Войдите, чтобы оформлять заказы быстрее и видеть их историю.">
      <LoginForm />
    </AuthLayout>
  );
}
