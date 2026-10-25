import { openDB } from "idb";
import { apiRequest } from "./lib/api";
import type { Wishlist } from "./types";

// Kept only to allow users to recover older lists created before cloud sync.
const legacyDatabase = openDB("pokemon-tcg-wishlist", 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("lists")) db.createObjectStore("lists", { keyPath: "id" });
  },
});
export async function getLegacyLists(): Promise<Wishlist[]> {
  return (await legacyDatabase).getAll("lists") as Promise<Wishlist[]>;
}
export async function getLists(): Promise<Wishlist[]> {
  return apiRequest<Wishlist[]>("/my-lists");
}
export async function saveList(list: Wishlist): Promise<void> {
  await apiRequest<Wishlist>(`/my-lists/${encodeURIComponent(list.id)}`, {
    method: "PUT", body: JSON.stringify(list),
  });
}
export async function deleteList(id: string): Promise<void> {
  await apiRequest(`/my-lists/${encodeURIComponent(id)}`, { method: "DELETE" });
}
export async function replaceLists(lists: Wishlist[]): Promise<void> {
  const current = await getLists();
  // Upload before removing anything: a failed upload must not erase existing lists.
  for (const list of lists) await saveList(list);
  const nextIds = new Set(lists.map(list => list.id));
  for (const list of current) if (!nextIds.has(list.id)) await deleteList(list.id);
}
