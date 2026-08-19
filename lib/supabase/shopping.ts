import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseClient } from "./client";

export type ShoppingItem = {
  id: string;
  name: string;
  checked: boolean;
  createdAt: string;
};

export type ShoppingList = {
  id: string;
  name: string;
  sortOrder: number;
  items: ShoppingItem[];
};

type ShoppingListRow = {
  id: string;
  name: string;
  sort_order: number;
  shopping_items: Array<{
    id: string;
    name: string;
    is_checked: boolean;
    created_at: string;
  }> | null;
};

function requireSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase 尚未配置");
  return supabase;
}

export async function loadShoppingLists(householdId: string): Promise<ShoppingList[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("shopping_lists")
    .select("id, name, sort_order, shopping_items(id, name, is_checked, created_at)")
    .eq("household_id", householdId)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as unknown as ShoppingListRow[]).map((list) => ({
    id: list.id,
    name: list.name,
    sortOrder: list.sort_order,
    items: (list.shopping_items ?? [])
      .map((item) => ({
        id: item.id,
        name: item.name,
        checked: item.is_checked,
        createdAt: item.created_at,
      }))
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
  }));
}

export async function createShoppingListRecord(householdId: string, name: string, sortOrder: number) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("shopping_lists")
    .insert({ household_id: householdId, name: name.trim(), sort_order: sortOrder })
    .select("id, name, sort_order")
    .single();
  if (error) throw error;
  return data;
}

export async function createShoppingItemRecord(householdId: string, listId: string, name: string) {
  const supabase = requireSupabase();
  const { error } = await supabase.from("shopping_items").insert({
    household_id: householdId,
    list_id: listId,
    name: name.trim(),
  });
  if (error) throw error;
}

export async function setShoppingItemChecked(itemId: string, checked: boolean) {
  const supabase = requireSupabase();
  const { error } = await supabase
    .from("shopping_items")
    .update({ is_checked: checked, checked_at: checked ? new Date().toISOString() : null })
    .eq("id", itemId);
  if (error) throw error;
}

export async function deleteShoppingItemRecord(itemId: string) {
  const supabase = requireSupabase();
  const { error } = await supabase.from("shopping_items").delete().eq("id", itemId);
  if (error) throw error;
}

export async function clearShoppingListItems(listId: string) {
  const supabase = requireSupabase();
  const { error } = await supabase.from("shopping_items").delete().eq("list_id", listId);
  if (error) throw error;
}

export function subscribeToShoppingLists(
  householdId: string,
  onChange: () => void,
): RealtimeChannel | null {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  return supabase
    .channel(`shopping:${householdId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "shopping_lists", filter: `household_id=eq.${householdId}` },
      onChange,
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "shopping_items", filter: `household_id=eq.${householdId}` },
      onChange,
    )
    .subscribe();
}
