import { describe, expect, it } from 'vitest';
import { content, item } from './content';
import {
  sellPrice, activeCombos, canCook, catchFish, needsWater, plotStage, averageStars, beachPickups, guestFarewell, guestWeights, islandPickup,
  questionFor, rollGuest, unlockedIslands,
} from './game';
import { localTime, phaseOf } from './time';
import { codeToType } from './weather';

describe('content.json', () => {
  it('mọi id được tham chiếu đều tồn tại', () => {
    const ids = new Set(content.items.map(i => i.id));
    const refs = [
      ...content.starterKit.map(g => g.id),
      ...content.animals.flatMap(a => [...a.gifts, ...Object.keys(a.attracts)]),
      ...Object.values(content.weatherPools).flat().map(w => w.id),
      ...content.combos.map(c => c.reward),
      ...content.seasons.flatMap(s => s.pool.map(w => w.id)),
      ...content.islands.flatMap(i => i.pool.map(w => w.id)),
      content.meetup.keepsake,
      ...content.fishing.fish.map(f => f.id),
      ...content.garden.crops.map(c => c.id),
      ...content.recipes.flatMap(r => [r.id, ...r.needs.map(n => n.id)]),
      ...content.shop.map(x => x.id),
    ];
    expect(refs.filter(id => !ids.has(id))).toEqual([]);
    expect(ids.size).toBe(content.items.length); // không trùng id
  });
  it('món lạ trả về icon dự phòng', () => {
    expect(item('khong-co').icon).toBe('❔');
  });
});

describe('roll hằng ngày ổn định', () => {
  it('nhặt đồ: cùng user + ngày → cùng kết quả', () => {
    const a = beachPickups('u1', '2026-11-05', 'clear', 11);
    expect(beachPickups('u1', '2026-11-05', 'clear', 11)).toEqual(a);
    expect(a).toHaveLength(3);
    expect(new Set(a.map(p => p.key)).size).toBe(3);
  });
  it('nhặt đồ: bể đồ theo thời tiết', () => {
    const snowIds = new Set([...content.weatherPools.snow, ...content.seasons.find(s => s.id === 'winter')!.pool].map(w => w.id));
    for (let d = 1; d <= 20; d++) {
      for (const p of beachPickups('u1', `2026-11-${String(d).padStart(2, '0')}`, 'snow', 11)) expect(snowIds.has(p.itemId)).toBe(true);
    }
  });
  it('đảo: 1 món/ngày từ bể của đảo', () => {
    const p = islandPickup('u1', '2026-11-05', 'coral')!;
    expect(['pearl', 'coral', 'trident']).toContain(p.itemId);
    expect(p.key).toBe('island:coral:2026-11-05');
  });
  it('khách: ổn định và bị đồ trang trí hấp dẫn', () => {
    const w = guestWeights(['sandcastle', 'sandcastle', 'bucket'], {}, []);
    expect(rollGuest('u1', '2026-11-05', w).id).toBe(rollGuest('u1', '2026-11-05', w).id);
    const counts: Record<string, number> = {};
    for (let d = 0; d < 300; d++) {
      const id = rollGuest('u' + d, '2026-11-05', w).id;
      counts[id] = (counts[id] ?? 0) + 1;
    }
    expect(counts.crab).toBeGreaterThan(150); // 2 lâu đài + xô → cua chiếm đa số
    expect(counts.penguin).toBeUndefined();   // base 0, không có đồ hấp dẫn
  });
  it('khách đảo chỉ đến khi đảo đã mở', () => {
    expect(guestWeights([], {}, []).some(w => w.id === 'monkey')).toBe(false);
    expect(guestWeights([], {}, ['middle']).some(w => w.id === 'monkey')).toBe(true);
  });
  it('lời chia tay ổn định theo id khách', () => {
    const crab = content.animals.find(a => a.id === 'crab')!;
    expect(guestFarewell('g1', crab, 3)).toEqual(guestFarewell('g1', crab, 3));
    expect(crab.gifts).toContain(guestFarewell('g1', crab, 3).gift); // tháng 3 không có mùa
  });
});

describe('combo thời tiết', () => {
  const ids = (a: Parameters<typeof activeCombos>[0], b: Parameters<typeof activeCombos>[1]) => activeCombos(a, b).map(c => c.id);
  it('cả hai mưa → cầu vồng', () => expect(ids({ weather: 'rain', phase: 'day' }, { weather: 'rain', phase: 'day' })).toEqual(['rainbow']));
  it('một ngày một đêm → cá voi (hai chiều)', () => {
    expect(ids({ weather: 'cloudy', phase: 'day' }, { weather: 'fog', phase: 'night' })).toEqual(['whale']);
    expect(ids({ weather: 'cloudy', phase: 'night' }, { weather: 'fog', phase: 'sunset' })).toEqual(['whale']);
  });
  it('cả hai tuyết → biển băng', () => expect(ids({ weather: 'snow', phase: 'day' }, { weather: 'snow', phase: 'day' })).toEqual(['frozen']));
  it('cả hai đêm quang → sao băng', () => expect(ids({ weather: 'clear', phase: 'night' }, { weather: 'clear', phase: 'night' })).toEqual(['stars']));
  it('không có gì đặc biệt', () => expect(ids({ weather: 'clear', phase: 'day' }, { weather: 'rain', phase: 'day' })).toEqual([]));
});

describe('linh tinh', () => {
  it('câu hỏi giống nhau cho cả cặp, đổi theo ngày', () => {
    expect(questionFor('c1', '2026-11-05')).toEqual(questionFor('c1', '2026-11-05'));
    expect(questionFor('c1', '2026-11-05')).not.toEqual(questionFor('c1', '2026-11-06'));
  });
  it('mở đảo theo số ván', () => {
    expect(unlockedIslands(29)).toEqual([]);
    expect(unlockedIslands(60)).toEqual(['middle', 'coral']);
    expect(unlockedIslands(100)).toEqual(['middle', 'coral', 'firefly']);
  });
  it('điểm sao trung bình', () => {
    expect(averageStars([])).toBeNull();
    expect(averageStars([5, 4, 4])).toBe(4.3);
  });
  it('mã thời tiết WMO', () => {
    expect([0, 2, 45, 61, 73, 95].map(codeToType)).toEqual(['clear', 'cloudy', 'fog', 'rain', 'snow', 'rain']);
  });
  it('giờ địa phương theo múi giờ', () => {
    const at = new Date('2026-11-05T15:30:00Z');
    expect(localTime('Asia/Ho_Chi_Minh', at)).toMatchObject({ date: '2026-11-05', hour: 22, minute: 30, month: 11 });
    expect(localTime('America/Los_Angeles', at)).toMatchObject({ date: '2026-11-05', hour: 7 });
    expect(localTime('Pacific/Kiritimati', at).date).toBe('2026-11-06');
    expect(localTime('Không/Có', at).date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // tz hỏng → dùng giờ máy
  });
  it('buổi trong ngày', () => {
    expect([5, 8, 17, 19, 0].map(phaseOf)).toEqual(['dawn', 'day', 'sunset', 'night', 'night']);
  });
});

describe('câu cá, vườn, nấu ăn', () => {
  it('cá ổn định theo lượt và tùy giờ/thời tiết', () => {
    const night = { weather: 'clear' as const, phase: 'night' as const };
    expect(catchFish('u1', '2026-11-05', 0, night)).toBe(catchFish('u1', '2026-11-05', 0, night));
    const caught = new Set(Array.from({ length: 200 }, (_, i) => catchFish('u1', '2026-11-05', i, night)));
    expect(caught.has('jelly')).toBe(true);        // sứa chỉ có ban đêm
    expect(caught.has('fish_clown')).toBe(false);  // cá hề chỉ ban ngày
    expect(caught.has('lobster')).toBe(false);     // tôm hùm cần mưa/tuyết
  });
  it('cây lớn theo số ngày tưới', () => {
    const p = { plot: 0, crop_id: 'carrot', water_days: 0, last_watered: null };
    expect(plotStage(p)).toBe('seed');
    expect(plotStage({ ...p, water_days: 1 })).toBe('sprout');
    expect(plotStage({ ...p, water_days: 2 })).toBe('ripe');
    expect(needsWater({ ...p, water_days: 1, last_watered: '2026-11-05' }, '2026-11-05')).toBe(false);
    expect(needsWater({ ...p, water_days: 1, last_watered: '2026-11-04' }, '2026-11-05')).toBe(true);
    expect(needsWater({ ...p, water_days: 2, last_watered: '2026-11-04' }, '2026-11-05')).toBe(false);
  });
  it('giá bán theo loại, đồ hiếm gấp đôi', () => {
    const sell = content.economy.sell;
    expect(sellPrice('shell')).toBe(sell.trinket);
    expect(sellPrice('sushi')).toBe(sell.dish);
    expect(sellPrice('shark')).toBe(sell.fish * 2);
  });
  it('đủ nguyên liệu mới nấu được', () => {
    const needs = [{ id: 'rice', n: 1 }, { id: 'fish_goby', n: 1 }];
    expect(canCook(needs, [{ item_id: 'rice', qty: 1 }])).toBe(false);
    expect(canCook(needs, [{ item_id: 'rice', qty: 1 }, { item_id: 'fish_goby', qty: 2 }])).toBe(true);
  });
});
