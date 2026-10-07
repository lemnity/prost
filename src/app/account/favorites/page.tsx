import type { Metadata } from "next";
import { AccountShell } from "@/components/account/account-shell";
import { FavoritesView } from "@/components/favorites/favorites-view";

export const metadata: Metadata = {
  title: "Избранное — ProStyle",
  description: "Сохранённые товары: корпоративные подарки и сувенирная продукция ProStyle.",
  robots: { index: false },
};

export default function FavoritesPage() {
  return (
    <AccountShell section="favorites" guest>
      <FavoritesView embedded />
    </AccountShell>
  );
}
