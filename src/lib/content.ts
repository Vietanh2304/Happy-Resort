// Toàn bộ nội dung game nằm trong content.json — file này chỉ khai báo kiểu và vài hàm tra cứu.
import raw from '../content/content.json';

export type WeatherType = 'clear' | 'cloudy' | 'rain' | 'snow' | 'fog';
export type Phase = 'dawn' | 'day' | 'sunset' | 'night';

export interface Item {
  id: string;
  name: string;
  icon: string;
  kind: 'decor' | 'trinket' | 'fish' | 'crop' | 'dish';
  rarity?: 'rare';
}
export interface Weighted { id: string; w: number }
export interface Gift { id: string; n: number }
export interface Animal {
  id: string;
  name: string;
  icon: string;
  island?: string;             // không có = bờ nhà
  base: number;                // trọng số khi chưa có đồ hấp dẫn
  stayHours: number;
  attracts: Record<string, number>;
  gifts: string[];
  reviews: { text: string; stars: number }[];
}
export interface Cond { weather?: WeatherType[]; phase?: Phase[] }
export interface Combo {
  id: string;
  name: string;
  icon: string;
  desc: string;
  effect: 'rainbow' | 'whale' | 'frozen' | 'stars';
  reward: string;
  both?: Cond;                 // cả hai bờ cùng thỏa
  pair?: [Cond, Cond];         // một bờ thỏa vế này, bờ kia thỏa vế kia
}
export interface Season { id: string; name: string; icon: string; months: number[]; pool: Weighted[] }
export interface Island {
  id: string;
  name: string;
  icon: string;
  planks: number;
  cols: number;
  rows: number;
  pool: Weighted[];
}
export interface Question { id: string; text: string }
export interface FishOdds extends Weighted, Cond {}
export interface Crop { id: string; days: number; flower?: boolean }
export interface Recipe { id: string; needs: Gift[] }

export interface Content {
  grid: { cols: number; rows: number };
  pickupsPerDay: number;
  starterKit: Gift[];
  cozyKit: Gift[];
  farmKit: Gift[];
  homeKit: { id: string; island: string; x: number; y: number }[];
  items: Item[];
  animals: Animal[];
  weatherPools: Record<WeatherType, Weighted[]>;
  combos: Combo[];
  seasons: Season[];
  seasonGiftChance: number;
  islands: Island[];
  meetup: { keepsake: string };
  questions: Question[];
  fishing: { castsPerDay: number; fish: FishOdds[] };
  garden: { plots: number; harvest: number; crops: Crop[] };
  recipes: Recipe[];
  economy: { togetherBonus: number; sell: Record<Item['kind'], number>; welcome: number; daily: number; game: number; cook: number; smore: number };
  shop: { id: string; price: number; cat?: string }[];
  dinner: { menu: { cat: string; items: { name: string; icon: string; drink?: boolean }[] }[] };
  emotes: string[];
  petKit: Gift[];
  cafe: { cat: string; items: { name: string; icon: string }[] }[];
  beachBar: { cat: string; items: { name: string; icon: string }[] }[];
  books: { title: string; icon: string; pages: string[] }[];
  campfire: string[];
}

export const content = raw as unknown as Content;

const items = new Map(content.items.map(i => [i.id, i]));
const animals = new Map(content.animals.map(a => [a.id, a]));

export function item(id: string): Item {
  return items.get(id) ?? { id, name: id, icon: '❔', kind: 'trinket' };
}
export function animal(id: string): Animal | undefined {
  return animals.get(id);
}
export function seasonOf(month: number): Season | undefined {
  return content.seasons.find(s => s.months.includes(month));
}
/** id mùa của một món đồ giới hạn theo mùa, nếu có */
export function itemSeason(id: string): Season | undefined {
  return content.seasons.find(s => s.pool.some(p => p.id === id));
}
