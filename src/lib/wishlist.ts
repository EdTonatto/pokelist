import type { ListType, Wishlist, WishlistItem } from "../types";

export const now = () => new Date().toISOString(),
  uid = () => crypto.randomUUID(),
  quantity = (item: WishlistItem) =>
    Math.max(1, Math.floor(Number(item.quantity) || 1)),
  acquiredQuantity = (item: WishlistItem) =>
    item.status === "acquired"
      ? quantity(item)
      : Math.max(
          0,
          Math.min(
            quantity(item),
            Math.floor(Number(item.acquiredQuantity) || 0),
          ),
        ),
  missingQuantity = (item: WishlistItem) =>
    quantity(item) - acquiredQuantity(item);
export const labels: Record<ListType, string> = {
  collection: "Coleção",
  pokemon: "Pokémon",
  theme: "Tema livre",
};
export const availableQuantity = (item: WishlistItem) =>
  item.availableQuantity === undefined
    ? quantity(item)
    : Math.max(0, Math.floor(Number(item.availableQuantity) || 0));
export const listLabel = (list: Wishlist) =>
  list.purpose === "trade" ? "Troca/Venda" : labels[list.type];
export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );
export function whatsappListText(list: Wishlist) {
  if (list.purpose === "trade") {
    const lines = list.items
      .filter((item) => availableQuantity(item) > 0)
      .map(
        (item) =>
          `- ${item.cardName} (${item.localId}/${item.setOfficialTotal || "?"}) - ${availableQuantity(item)} un${item.salePrice !== undefined ? ` - ${formatCurrency(item.salePrice)}` : ""}`,
      );
    return `*${list.name}*\nCartas disponíveis para troca/venda\n${lines.length ? lines.join("\n") : "Nenhuma carta disponível."}`;
  }
  const missing = list.items.filter((item) => missingQuantity(item) > 0);
  const lines = missing.map(
    (item) =>
      `- ${item.cardName} (${item.localId}/${item.setOfficialTotal || "?"})${missingQuantity(item) > 1 ? ` - ${missingQuantity(item)} un` : ""}`,
  );
  return `*${list.name}*\nCartas faltantes pra coleção\n${lines.length ? lines.join("\n") : "Nenhuma carta faltante 🎉"}`;
}
