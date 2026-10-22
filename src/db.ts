import {openDB} from 'idb';
import type {Wishlist} from './types';
const database=openDB('pokemon-tcg-wishlist',1,{upgrade(db){db.createObjectStore('lists',{keyPath:'id'});}});
export async function getLists():Promise<Wishlist[]>{return (await database).getAll('lists') as Promise<Wishlist[]>}
export async function saveList(list:Wishlist){await (await database).put('lists',list)}
export async function deleteList(id:string){await (await database).delete('lists',id)}
export async function replaceLists(lists:Wishlist[]){const db=await database;const tx=db.transaction('lists','readwrite');await tx.store.clear();for(const l of lists)await tx.store.put(l);await tx.done}
