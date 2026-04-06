/** Hook: filters vault_items to passwords, supports category + search. */
import { useMemo, useState } from "react";
import type { VaultItemRow } from "@/hooks/useVaultItems";
import type { PasswordCategory } from "@/lib/passwordVaultService";

export type CategoryFilter = PasswordCategory | "all";

export function usePasswordVault(items: VaultItemRow[]) {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [search, setSearch] = useState("");

  const passwordItems = useMemo(
    () => items.filter((i) => (i as any).item_type === "password"),
    [items]
  );

  const filtered = useMemo(() => {
    let result = passwordItems;

    if (category !== "all") {
      result = result.filter((i) => (i as any).category === category);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((i) => {
        const title = (i.title ?? "").toLowerCase();
        const url = ((i as any).website_url ?? "").toLowerCase();
        return title.includes(q) || url.includes(q);
      });
    }

    return result;
  }, [passwordItems, category, search]);

  const counts = useMemo(() => {
    const c = { all: passwordItems.length, social: 0, work: 0, shopping: 0, finance: 0, other: 0 };
    for (const item of passwordItems) {
      const cat = ((item as any).category ?? "other") as PasswordCategory;
      if (cat in c) c[cat]++;
    }
    return c;
  }, [passwordItems]);

  return {
    passwordItems,
    filtered,
    category,
    setCategory,
    search,
    setSearch,
    counts,
  };
}
