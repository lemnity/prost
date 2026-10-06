import type { Metadata } from "next";
import { AuthLayout } from "@/components/account/auth-layout";
import { RegisterForm } from "@/components/account/auth-forms";

export const metadata: Metadata = {
  title: "Регистрация — ProStyle",
  description: "Создайте личный кабинет ProStyle для быстрых заказов корпоративных подарков.",
  robots: { index: false },
};

export default function RegisterPage() {
  return (
    <AuthLayout title="Создать кабинет" lead="Регистрация займёт минуту. Реквизиты можно добавить позже.">
      <RegisterForm />
    </AuthLayout>
  );
}
