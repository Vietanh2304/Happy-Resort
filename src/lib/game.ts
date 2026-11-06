// Luật chơi thuần (không gọi mạng). Mọi lượt "roll" hằng ngày dùng RNG có seed theo user + ngày,
// nên tải lại trang vẫn ra cùng kết quả.
import { animal, content, item, seasonOf, type Animal, type Combo, type Cond, type Phase, type WeatherType } from './content';
import { pick, pickWeighted, seeded } from './rng';
import { dayNumber } from './time';

export interface Pickup { key: string; itemId: string; x: number }
export interface ShoreState { weather: WeatherType; phase: Phase }

/** 3 món trên bãi biển hôm nay; bể đồ tùy thời tiết hiện tại + đồ theo mùa */
export function beachPickups(userId: string, date: string, weather: WeatherType, month: number): Pickup[] {
  const pool = [...content.weatherPools[weather], ...(seasonOf(month)?.pool ?? [])];
  return Array.from({ length: content.pickupsPerDay }, (_, slot) => {
    const rand = seeded(`${userId}:${date}:beach:${slot}`);
    return { key: `beach:${date}:${slot}`, itemId: pickWeighted(rand, pool)!.id, x: 36 + slot * 22 + rand() * 8 };
  });
}

/** Mỗi đảo cho mỗi người nhặt 1 món/ngày */
export function islandPickup(userId: string, date: string, islandId: string): Pickup | undefined {
  const island = content.islands.find(i => i.id === islandId);
  if (!island) return undefined;
  const rand = seeded(`${userId}:${date}:island:${islandId}`);
  return { key: `island:${islandId}:${date}`, itemId: pickWeighted(rand, island.pool)!.id, x: 50 };
}

export function unlockedIslands(planks: number) {
  return content.islands.filter(i => planks >= i.planks).map(i => i.id);
}

/**
 * Trọng số mỗi loài: base + điểm hấp dẫn của đồ đang đặt.
 * Thú bờ nhà nhìn đồ trên bờ mình; thú của đảo nhìn đồ trên đảo đó (đảo phải đã mở).
 */
export function guestWeights(homeItems: string[], islandItems: Record<string, string[]>, unlocked: string[]) {
  return content.animals
    .filter(a => !a.island || unlocked.includes(a.island))
    .map(a => {
      const placed = a.island ? islandItems[a.island] ?? [] : homeItems;
      return { id: a.id, w: a.base + placed.reduce((s, id) => s + (a.attracts[id] ?? 0), 0) };
    });
}

export function rollGuest(userId: string, date: string, weights: { id: string; w: number }[]): Animal {
  return animal(pickWeighted(seeded(`${userId}:${date}:guest`), weights)!.id)!;
}

/** Lúc khách rời đi: một lời nhận xét + một món quà (đôi khi là đồ theo mùa). Được vuốt ve thì khen hết lời. */
export function guestFarewell(guestId: string, a: Animal, month: number, petted = false) {
  const rand = seeded(`farewell:${guestId}`);
  const picked = pick(rand, a.reviews);
  const review = petted ? a.reviews.reduce((best, r) => (r.stars > best.stars ? r : best), picked) : picked;
  const season = seasonOf(month);
  const gift = season && rand() < content.seasonGiftChance ? pickWeighted(rand, season.pool)!.id : pick(rand, a.gifts);
  return { review, gift };
}

function matches(s: ShoreState, c: Cond) {
  return (!c.weather || c.weather.includes(s.weather)) && (!c.phase || c.phase.includes(s.phase));
}

/** Hiện tượng đặc biệt khi thời tiết/giờ hai bờ kết hợp */
export function activeCombos(a: ShoreState, b: ShoreState): Combo[] {
  return content.combos.filter(c => {
    if (c.both) return matches(a, c.both) && matches(b, c.both);
    if (c.pair) return (matches(a, c.pair[0]) && matches(b, c.pair[1])) || (matches(a, c.pair[1]) && matches(b, c.pair[0]));
    return false;
  });
}

/** Câu hỏi của một ngày — giống nhau cho cả hai người trong cặp */
export function questionFor(coupleId: string, date: string) {
  const qs = content.questions;
  const offset = Math.floor(seeded(coupleId)() * qs.length);
  return qs[(dayNumber(date) + offset) % qs.length];
}

export function averageStars(stars: number[]) {
  if (stars.length === 0) return null;
  return Math.round((stars.reduce((s, x) => s + x, 0) / stars.length) * 10) / 10;
}

export function daysUntil(from: string, to: string) {
  return dayNumber(to) - dayNumber(from);
}

/** Sao băng xuất hiện cùng lúc ở hai máy: mỗi 15 giây, sáng trong 4 giây */
export const STAR_PERIOD = 15_000;
export const STAR_VISIBLE = 4_000;
export const WISH_WINDOW = 3_000;
export function starVisible(now: number) {
  return now % STAR_PERIOD < STAR_VISIBLE;
}

// ───────── Câu cá, vườn ─────────

/** Con cá của lần thả câu thứ `cast` trong ngày — tùy thời tiết và giờ thật */
export function catchFish(userId: string, date: string, cast: number, shore: ShoreState) {
  const pool = content.fishing.fish.filter(f => matches(shore, f));
  return pickWeighted(seeded(`${userId}:${date}:fish:${cast}`), pool)!.id;
}

export interface Plot { plot?: number; crop_id: string; water_days: number; last_watered: string | null }

export function cropDays(cropId: string) {
  return content.garden.crops.find(c => c.id === cropId)?.days ?? 3;
}
export function plotStage(p: Plot): 'seed' | 'sprout' | 'ripe' {
  if (p.water_days >= cropDays(p.crop_id)) return 'ripe';
  return p.water_days === 0 ? 'seed' : 'sprout';
}
export function needsWater(p: Plot, today: string) {
  return plotStage(p) !== 'ripe' && p.last_watered !== today;
}

/** Món nấu được từ túi đồ hiện tại */
export function canCook(needs: { id: string; n: number }[], inventory: { item_id: string; qty: number }[]) {
  return needs.every(x => (inventory.find(r => r.item_id === x.id)?.qty ?? 0) >= x.n);
}

/** Giá bán một món cho hũ xu chung (đồ hiếm được giá gấp đôi) */
export function sellPrice(itemId: string) {
  const it = item(itemId);
  return content.economy.sell[it.kind] * (it.rarity === 'rare' ? 2 : 1);
}
