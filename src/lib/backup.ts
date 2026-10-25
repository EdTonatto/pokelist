import type { Wishlist, WishlistItem } from "../types";
import { now } from "./wishlist";

export function validateList(raw: unknown): Wishlist {
  if (!raw || typeof raw !== "object")
    throw Error("O backup contém uma lista inválida.");
  const l = raw as Record<string, unknown>;
  if (
    typeof l.id !== "string" ||
    typeof l.name !== "string" ||
    !["collection", "pokemon", "theme"].includes(String(l.type)) ||
    !Array.isArray(l.items)
  )
    throw Error("O backup contém dados inválidos.");
  const items = l.items.map((r: unknown) => {
    if (!r || typeof r !== "object")
      throw Error("O backup contém uma carta inválida.");
    const i = r as Record<string, unknown>;
    if (
      typeof i.id !== "string" ||
      typeof i.providerCardId !== "string" ||
      typeof i.cardName !== "string" ||
      typeof i.localId !== "string" ||
      typeof i.setId !== "string" ||
      typeof i.setName !== "string" ||
      !["wanted", "acquired"].includes(String(i.status))
    )
      throw Error("O backup contém uma carta inválida.");
    const desired = Math.max(
        1,
        Math.min(999, Math.floor(Number(i.quantity) || 1)),
      ),
      got =
        i.status === "acquired"
          ? desired
          : Math.max(
              0,
              Math.min(desired, Math.floor(Number(i.acquiredQuantity) || 0)),
            );
    return {
      ...i,
      wishlistId: l.id,
      provider: "tcgdex" as const,
      quantity: desired,
      acquiredQuantity: got,
      availableQuantity:
        l.purpose === "trade"
          ? Math.max(
              0,
              Math.min(
                999,
                Math.floor(Number(i.availableQuantity ?? i.quantity) || 0),
              ),
            )
          : undefined,
      salePrice:
        typeof i.salePrice === "number" &&
        Number.isFinite(i.salePrice) &&
        i.salePrice >= 0
          ? i.salePrice
          : undefined,
      status: got >= desired ? ("acquired" as const) : ("wanted" as const),
      setOfficialTotal: Number(i.setOfficialTotal) || 0,
      imageUrl: typeof i.imageUrl === "string" ? i.imageUrl : null,
      language: typeof i.language === "string" ? i.language : "en",
    } as WishlistItem;
  });
  return {
    ...l,
    purpose:
      l.purpose === "trade" ? ("trade" as const) : ("collection" as const),
    items,
    description: typeof l.description === "string" ? l.description : "",
    createdAt: typeof l.createdAt === "string" ? l.createdAt : now(),
    updatedAt: typeof l.updatedAt === "string" ? l.updatedAt : now(),
  } as Wishlist;
}
