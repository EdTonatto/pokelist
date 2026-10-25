export type ListType='collection'|'pokemon'|'theme';
export type CardStatus='wanted'|'acquired';
export interface WishlistItem {id:string;wishlistId:string;provider:'tcgdex';providerCardId:string;cardName:string;localId:string;setId:string;setName:string;setOfficialTotal:number;imageUrl:string|null;language:string;status:CardStatus;notes?:string;createdAt:string;updatedAt:string;acquiredAt?:string}
export interface Wishlist {id:string;name:string;description?:string;type:ListType;setId?:string;pokemonName?:string;createdAt:string;updatedAt:string;items:WishlistItem[]}
export interface ApiCardSummary {id:string;localId:string;name:string;image?:string}
export interface ApiCard {id:string;localId:string;name:string;image?:string;set:{id:string;name:string;cardCount?:{official?:number;total?:number}};category?:string;illustrator?:string;rarity?:string}
export interface ApiSet {id:string;name:string;logo?:string;symbol?:string;cardCount:{official:number;total:number};releaseDate?:string}
