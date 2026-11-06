// Trời chung của làng: random theo mùa thật, đổi mỗi 3 tiếng, hai máy thấy giống nhau.
// Thời tiết thật của từng thành phố chỉ hiện ở Đài quan sát.
import type { WeatherType } from './content';
import { pickWeighted, seeded } from './rng';
import { seasonOfMonth, type Season } from './places';
import type { Weather } from './weather';

const BLOCK_MS = 3 * 3600_000;

const POOL: Record<Season, { type: WeatherType; w: number }[]> = {
  spring: [{ type: 'clear', w: 45 }, { type: 'cloudy', w: 30 }, { type: 'rain', w: 20 }, { type: 'fog', w: 5 }],
  summer: [{ type: 'clear', w: 45 }, { type: 'cloudy', w: 20 }, { type: 'rain', w: 35 }],
  autumn: [{ type: 'clear', w: 55 }, { type: 'cloudy', w: 25 }, { type: 'rain', w: 12 }, { type: 'fog', w: 8 }],
  winter: [{ type: 'clear', w: 40 }, { type: 'cloudy', w: 25 }, { type: 'snow', w: 30 }, { type: 'fog', w: 5 }],
};
/** Khoảng nhiệt độ theo mùa [thấp, cao] */
const TEMP: Record<Season, [number, number]> = {
  spring: [9, 21], summer: [24, 34], autumn: [8, 22], winter: [-4, 8],
};

function roll(seed: string, block: number, season: Season) {
  const rand = seeded(`${seed}:village-wx:${block}`);
  return { type: pickWeighted(rand, POOL[season])!.type, r: rand() };
}

export function villageWeather(seed: string, now: number, month: number): Weather {
  const season = seasonOfMonth(month);
  const block = Math.floor(now / BLOCK_MS);
  // Trời hay kéo dài: một nửa số lần giữ nguyên trời của khung trước
  let { type, r } = roll(seed, block, season);
  if (seeded(`${seed}:village-keep:${block}`)() < 0.5) type = roll(seed, block - 1, season).type;
  const [lo, hi] = TEMP[season];
  let temp = Math.round(lo + r * (hi - lo));
  if (type === 'snow') temp = Math.min(temp, 1);
  if (type === 'rain') temp = Math.max(temp - 2, season === 'winter' ? 3 : lo);
  return { type, temp, code: 0 };
}
