// Lặn biển ngắm rạn san hô: nền dưới nước (ánh sáng theo giờ thật), san hô nhiều loại, và các loài cá/sinh vật biển.
import type { Phase } from './content';
import { makeSprite, mix, type Pen, type Sprite } from './pixel';
import { seeded } from './rng';

export const REEF = {
  sand: 120,                          // mặt cát đáy biển
  anemone: { x: 58, y: 116 },         // hải quỳ có cá hề
  chest: { x: 156, y: 130 },          // rương báu nửa vùi trong cát
  eel: { x: 24, y: 104 },             // hang cá chình trong khối đá
};

function ell(p: Pen, cx: number, cy: number, rx: number, ry: number, c: string) {
  for (let y = Math.ceil(cy - ry); y <= Math.floor(cy + ry); y++) {
    const w = rx * Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2));
    if (w >= 0.5) p.rect(Math.round(cx - w), y, Math.round(w * 2), 1, c);
  }
}

const WATER: Record<Phase, [string, string]> = {
  day: ['#5ad6f2', '#0a3a7a'],
  dawn: ['#7ac8e8', '#123a72'],
  sunset: ['#e8a890', '#1a2a6a'],
  night: ['#12306a', '#020a24'],
};

/** Nền dưới nước: mặt nước lấp lánh phía trên, rạn xa mờ, đáy cát gợn, đá và san hô */
export function reefBackground(phase: Phase) {
  return makeSprite(`reef:v1:${phase}`, 192, 144, p => {
    const [top, deep] = WATER[phase], night = phase === 'night';
    const dim = (c: string) => (night ? mix(c, '#0a1838', 0.55) : c);
    const rand = seeded('reef');
    for (let y = 0; y < 144; y++) {
      const c = mix(top, deep, Math.min(1, (y / 130) ** 0.9));
      p.rect(0, y, 192, 1, c);
      if (y % 5 === 2) for (let x = (y * 3) % 4; x < 192; x += 4) p.px(x, y, mix(c, deep, 0.12));
    }
    // mặt nước nhìn từ dưới lên: dải sáng gợn sóng
    for (let x = 0; x < 192; x++) { const y = Math.round(3 + Math.sin(x / 7) * 1.5); p.rect(x, 0, 1, y, mix(top, '#ffffff', night ? 0.15 : 0.45)); p.px(x, y, mix(top, '#ffffff', night ? 0.25 : 0.7)); }
    // rạn san hô xa mờ trong làn nước
    const far = mix(deep, top, 0.35);
    for (let x = 0; x < 192; x++) { const h = 22 + Math.round(Math.sin(x / 13) * 6 + Math.sin(x / 5.3) * 3); p.rect(x, 106 - h, 1, h + 14, far); }
    for (let i = 0; i < 9; i++) { const x = Math.floor(rand() * 180) + 6, h = 6 + Math.floor(rand() * 10); for (let k = 0; k < h; k++) p.px(x + Math.round(Math.sin(k / 2) * 1.2), 86 - k, mix(far, top, 0.15)); }
    // đáy cát gợn
    const sand = dim('#e8d6a8'), sandD = dim('#c8b080');
    for (let y = REEF.sand; y < 144; y++) for (let x = 0; x < 192; x++) {
      const edge = REEF.sand + Math.round(Math.sin(x / 9) * 2);
      if (y >= edge) p.px(x, y, (Math.round(x / 3 + Math.sin(y / 2) * 2) % 7 === 0) ? sandD : mix(sand, deep, Math.max(0, 0.25 - (y - REEF.sand) * 0.01)));
    }
    for (let i = 0; i < 40; i++) p.px(Math.floor(rand() * 192), REEF.sand + 4 + Math.floor(rand() * 20), rand() < 0.5 ? dim('#ffffff') : sandD);
    // khối đá bên trái có hang cá chình
    const rock = dim('#5a5a72'), rockL = dim('#7a7a92'), rockD = dim('#3a3a52');
    ell(p, 22, 110, 24, 18, rock); ell(p, 16, 100, 14, 10, rockL); ell(p, 40, 118, 14, 8, rock);
    ell(p, REEF.eel.x, REEF.eel.y, 5, 4, rockD); ell(p, REEF.eel.x, REEF.eel.y + 1, 4, 3, '#140c1c');
    // đá phải
    ell(p, 182, 116, 16, 12, rock); ell(p, 186, 108, 9, 7, rockL);

    // ── San hô ──
    // san hô não (tròn hồng, vân mê cung)
    for (const [cx, cy, r, c] of [[96, 118, 12, '#f28aa8'], [138, 120, 8, '#f6b07a'], [176, 106, 6, '#e8a0d8']] as const) {
      ell(p, cx, cy - r * 0.6, r, r * 0.75, dim(c));
      for (let y = Math.round(cy - r * 1.2); y < cy; y += 2) for (let x = cx - r + 2; x < cx + r - 1; x++) if (((x * 3 + y * 5) % 9) < 2 && ((x - cx) / r) ** 2 + ((y - (cy - r * 0.6)) / (r * 0.75)) ** 2 < 0.8) p.px(x, y, dim(mix(c, '#7a2a4a', 0.4)));
    }
    // san hô sừng hươu (cành cam)
    const branch = (x0: number, y0: number, len: number, ang: number, c: string, depth: number) => {
      let x = x0, y = y0;
      for (let i = 0; i < len; i++) { x += Math.cos(ang); y += Math.sin(ang); p.rect(Math.round(x), Math.round(y), 2, 1, dim(c)); }
      p.px(Math.round(x), Math.round(y) - 1, dim(mix(c, '#ffffff', 0.5)));
      if (depth > 0) { branch(x, y, len * 0.7, ang - 0.5, c, depth - 1); branch(x, y, len * 0.7, ang + 0.45, c, depth - 1); }
    };
    branch(118, 122, 8, -Math.PI / 2, '#f7894a', 3); branch(122, 122, 6, -Math.PI / 2 + 0.4, '#f6a04a', 2);
    branch(30, 96, 6, -Math.PI / 2 - 0.2, '#f6c64e', 2);
    // quạt biển tím (lưới)
    for (const [cx, base, h, c] of [[76, 112, 22, '#b07ae0'], [164, 100, 16, '#e05a8a']] as const) {
      for (let y = 0; y < h; y++) { const w = Math.round(Math.sin((y / h) * Math.PI * 0.9 + 0.3) * h * 0.55); for (let x = -w; x <= w; x++) if ((x + y) % 3 === 0 || (x - y) % 3 === 0) p.px(cx + x, base - y, dim(c)); }
      p.rect(cx, base - 2, 1, 6, dim(mix(c, '#3a2a4a', 0.4)));
    }
    // san hô bàn xanh (tán phẳng)
    for (const [cx, y, w] of [[146, 104, 14], [8, 82, 9]] as const) { p.rect(cx - w, y, w * 2, 2, dim('#7ac87a')); p.rect(cx - w + 2, y - 1, w * 2 - 4, 1, dim('#a8e8a0')); p.rect(cx - 1, y + 2, 3, 10, dim('#5a9a5a')); }
    // bọt biển ống vàng
    for (const [x, h] of [[104, 10], [108, 14], [112, 8]] as const) { p.rect(x, 122 - h, 3, h, dim('#f6d84a')); p.rect(x, 122 - h, 3, 1, dim('#c8a020')); }
    // hải quỳ (cá hề ở đây)
    const { x: ax, y: ay } = REEF.anemone;
    ell(p, ax, ay, 8, 3, dim('#c84a7a'));
    for (let i = -7; i <= 7; i += 2) for (let k = 0; k < 7; k++) p.px(ax + i + Math.round(Math.sin(k * 0.8 + i) * 1.2), ay - 2 - k, dim(k > 4 ? '#ffd0e8' : '#f088c0'));
    // sao biển + vỏ ốc trên cát
    for (const [x, y, c] of [[70, 132, '#ff7a5a'], [128, 138, '#f6c64e']] as const) { p.rect(x - 2, y, 5, 1, dim(c)); p.rect(x, y - 2, 1, 5, dim(c)); p.px(x - 1, y + 1, dim(c)); p.px(x + 1, y + 1, dim(c)); }
    for (const [x, y] of [[44, 136], [100, 140], [186, 132]]) { p.rect(x, y, 3, 2, dim('#ffe0e8')); p.px(x + 1, y - 1, dim('#ffe0e8')); }
  }, null);
}

/** Rương báu nửa vùi trong cát */
export const chestSprite = (open: boolean) => makeSprite(`reef-chest:${open}`, 16, 12, p => {
  p.rect(1, 5, 14, 7, '#8a5a3c'); p.rect(1, 7, 14, 1, '#c8a050'); p.rect(7, 6, 2, 3, '#f6c64e');
  if (open) { p.rect(1, 0, 14, 3, '#6a4028'); p.rect(2, 3, 12, 2, '#3a2418'); p.px(5, 4, '#ffffff'); p.px(9, 3, '#e8f0ff'); p.px(11, 4, '#f6c64e'); }
  else { p.rect(1, 2, 14, 4, '#a8703f'); p.rect(1, 2, 14, 1, '#c8905a'); p.rect(1, 4, 14, 1, '#c8a050'); }
});

/** Tảo bẹ đung đưa (CSS) */
export const kelpSprite = (h: number) => makeSprite(`kelp:${h}`, 7, h, p => {
  for (let y = 0; y < h; y++) { const x = 3 + Math.round(Math.sin(y / 3) * 1.5); p.rect(x, y, 2, 1, y % 4 === 0 ? '#5aa85a' : '#3a8a4a'); if (y % 5 === 2) p.rect(x + (y % 2 ? 2 : -2), y, 2, 1, '#6ac86a'); }
});

// ───────── Sinh vật biển ─────────

export interface Creature {
  id: string; name: string; icon: string; fact: string;
  sprite: () => Sprite;
  /** cách nó di chuyển: 'swim' bơi ngang qua lại, 'hover' lượn tại chỗ, 'drift' trôi lên xuống, 'still' nằm yên */
  move: 'swim' | 'hover' | 'drift' | 'still' | 'peek';
  y: number; x?: number; speed?: number; school?: number;
}

const fish = (key: string, w: number, h: number, body: string, belly: string, fin: string, extra?: (p: Pen) => void) => makeSprite(`fish:${key}`, w, h, p => {
  const cy = h / 2;
  for (let x = 2; x < w - 1; x++) { const t = (x - 2) / (w - 3), r = Math.max(0.6, Math.sin(Math.PI * Math.min(1, t * 1.15)) * (h / 2 - 0.5)); p.rect(x, Math.round(cy - r), 1, Math.max(1, Math.round(r * 2)), body); if (r > 1.2) p.px(x, Math.round(cy + r) - 1, belly); }
  p.rect(0, Math.round(cy - h / 3), 2, Math.max(2, Math.round((h * 2) / 3)), fin);
  p.px(w - 4, Math.round(cy - 1), '#1a1428');
  extra?.(p);
});

export const CREATURES: Creature[] = [
  { id: 'clown', name: 'Cá hề', icon: '🐠', fact: 'Sống trong hải quỳ — lớp nhớt trên da giúp không bị xúc tu chích.', move: 'hover', x: REEF.anemone.x, y: REEF.anemone.y - 9,
    sprite: () => fish('clown', 9, 5, '#ff8a2a', '#ffb060', '#1a1428', p => { p.rect(5, 0, 1, 5, '#ffffff'); p.rect(2, 1, 1, 3, '#ffffff'); }) },
  { id: 'tang', name: 'Cá đuôi gai xanh', icon: '🐟', fact: 'Màu xanh hoàng gia, đuôi vàng; có "dao" sắc ở gốc đuôi để tự vệ.', move: 'swim', y: 52, speed: 22,
    sprite: () => fish('tang', 12, 7, '#2a6ae8', '#5a9af8', '#f6d84a', p => { p.rect(3, 2, 6, 1, '#10204a'); }) },
  { id: 'butterfly', name: 'Cá bướm', icon: '🐟', fact: 'Hay đi thành đôi suốt đời — một cặp đôi chung thủy của rạn san hô.', move: 'swim', y: 74, speed: 16, school: 2,
    sprite: () => makeSprite('fish:butterfly2', 11, 9, p => {
      ell(p, 6, 4.5, 4.5, 4, '#f6d84a'); ell(p, 6, 5.5, 3.5, 2.5, '#fff0a0');
      p.rect(0, 3, 2, 3, '#f6c64e'); p.rect(4, 0, 4, 1, '#f6c64e'); p.rect(4, 8, 4, 1, '#f6c64e');
      p.rect(8, 2, 1, 4, '#1a1428'); p.px(9, 3, '#1a1428'); p.px(4, 6, '#1a1428'); p.rect(10, 4, 1, 1, '#e8a040');
    }) },
  { id: 'angel', name: 'Cá thần tiên', icon: '🐠', fact: 'Thân dẹt sọc xanh vàng, bơi chậm rãi như đang dạo phố.', move: 'swim', y: 64, speed: 12,
    sprite: () => fish('angel', 11, 10, '#3a5ad0', '#f6c64e', '#f6d84a', p => { for (let x = 3; x < 9; x += 2) p.rect(x, 2, 1, 6, '#f6d84a'); }) },
  { id: 'parrot', name: 'Cá vẹt', icon: '🐟', fact: 'Gặm san hô rồi "thải" ra cát trắng — nhiều bãi cát trắng có công của nó!', move: 'swim', y: 88, speed: 14,
    sprite: () => fish('parrot', 15, 8, '#3ac8a0', '#8ae8c8', '#e85a9a', p => { p.rect(11, 3, 3, 2, '#f6a0c8'); p.rect(4, 2, 5, 1, '#2a9a7a'); }) },
  { id: 'school', name: 'Đàn cá cơm bạc', icon: '🐟', fact: 'Bơi thành đàn hàng nghìn con, cùng đổi hướng một lúc để làm rối kẻ săn mồi.', move: 'swim', y: 34, speed: 28, school: 9,
    sprite: () => fish('anchovy', 6, 3, '#c8d8e8', '#ffffff', '#a8b8c8') },
  { id: 'turtle', name: 'Rùa biển', icon: '🐢', fact: 'Có thể sống hơn 80 năm và nhớ đường về đúng bãi biển nơi mình nở ra.', move: 'swim', y: 46, speed: 7,
    sprite: () => makeSprite('turtle', 22, 12, p => {
      ell(p, 10, 6, 7, 4.5, '#7a6a3a'); for (const [x, y] of [[7, 4], [11, 4], [9, 7], [13, 7], [6, 7]]) p.rect(x, y, 2, 2, '#9a8a4a');
      ell(p, 19, 6, 2.5, 2, '#8ab07a'); p.px(20, 5, '#1a1428');
      p.rect(13, 1, 5, 2, '#8ab07a'); p.rect(14, 10, 4, 2, '#8ab07a'); p.rect(2, 2, 4, 2, '#8ab07a'); p.rect(2, 9, 4, 2, '#8ab07a');
    }) },
  { id: 'manta', name: 'Cá đuối manta', icon: '🦈', fact: 'Sải cánh tới 7 mét mà chỉ ăn sinh vật phù du bé tí.', move: 'swim', y: 20, speed: 9,
    sprite: () => makeSprite('manta', 26, 12, p => {
      for (let x = 0; x < 26; x++) { const t = Math.abs(x - 13) / 13, h = Math.round((1 - t * t) * 5) + 1; p.rect(x, 6 - Math.round(h * 0.4) - Math.round(t * 3), 1, h, '#3a4a6a'); }
      p.rect(11, 4, 5, 3, '#2a3a5a'); p.rect(15, 8, 6, 1, '#3a4a6a'); p.px(22, 9, '#3a4a6a'); p.px(16, 5, '#c8d8e8');
    }) },
  { id: 'jelly', name: 'Sứa', icon: '🪼', fact: 'Không có não, không có tim — 95% cơ thể là nước. Ban đêm có loài phát sáng.', move: 'drift', x: 150, y: 40,
    sprite: () => makeSprite('jelly', 10, 14, p => {
      ell(p, 5, 4, 5, 4, '#f0a8e8'); p.rect(0, 4, 10, 2, '#e890e0'); p.rect(2, 2, 3, 1, '#ffe0f8');
      for (const x of [1, 3, 5, 7, 9]) for (let y = 6; y < 13; y++) if ((y + x) % 3) p.px(x + Math.round(Math.sin(y + x)), y, '#f8c8f0');
    }, null) },
  { id: 'seahorse', name: 'Cá ngựa', icon: '🐉', fact: 'Cá ngựa bố mới là người mang thai và sinh con!', move: 'drift', x: 132, y: 92,
    sprite: () => makeSprite('seahorse', 7, 13, p => {
      p.rect(2, 0, 3, 3, '#f6b04a'); p.rect(5, 1, 2, 1, '#f6b04a'); p.px(3, 1, '#1a1428');
      for (let y = 3; y < 10; y++) p.rect(1 + (y > 6 ? 1 : 0), y, 3, 1, y % 2 ? '#f6a03a' : '#f6c64e');
      p.rect(3, 10, 2, 1, '#f6a03a'); p.rect(4, 11, 2, 1, '#f6a03a'); p.rect(3, 12, 2, 1, '#f6a03a'); p.px(0, 5, '#f6c64e');
    }) },
  { id: 'octopus', name: 'Bạch tuộc', icon: '🐙', fact: 'Có 3 trái tim, máu màu xanh, và đổi màu da trong nháy mắt để ngụy trang.', move: 'hover', x: 182, y: 100,
    sprite: () => makeSprite('octopus', 14, 12, p => {
      ell(p, 7, 4, 5, 4, '#e8604a'); p.px(5, 4, '#ffffff'); p.px(9, 4, '#ffffff'); p.px(5, 5, '#1a1428'); p.px(9, 5, '#1a1428');
      for (const x of [1, 3, 5, 8, 10, 12]) for (let y = 7; y < 12; y++) p.px(x + Math.round(Math.sin(y * 0.9 + x) * 0.8), y, '#d8503a');
    }) },
  { id: 'eel', name: 'Cá chình biển', icon: '🐍', fact: 'Há miệng liên tục không phải dọa ai đâu — đó là cách nó thở.', move: 'peek', x: REEF.eel.x, y: REEF.eel.y + 2,
    sprite: () => makeSprite('eel', 10, 6, p => { p.rect(0, 2, 8, 4, '#6a8a3a'); p.rect(6, 1, 4, 4, '#7a9a4a'); p.px(8, 2, '#f6e84a'); p.rect(8, 4, 2, 1, '#3a4a1a'); for (let x = 1; x < 7; x += 2) p.px(x, 3, '#4a6a2a'); }) },
  { id: 'shark', name: 'Cá mập rạn san hô', icon: '🦈', fact: 'Cá mập vây đen hiền lành, ngại người — gặp được là may mắn đó!', move: 'swim', y: 26, speed: 11,
    sprite: () => makeSprite('reefshark', 28, 9, p => {
      for (let x = 3; x < 26; x++) { const t = (x - 3) / 23, r = Math.max(1, Math.sin(Math.PI * Math.min(1, t * 1.1)) * 3); p.rect(x, Math.round(5 - r), 1, Math.round(r * 2), '#8a9aaa'); p.px(x, Math.round(5 + r) - 1, '#d8e0e8'); }
      p.rect(12, 0, 3, 3, '#8a9aaa'); p.px(13, 0, '#1a1428'); p.rect(0, 1, 3, 3, '#8a9aaa'); p.rect(0, 5, 3, 3, '#8a9aaa'); p.px(23, 4, '#1a1428'); p.rect(14, 7, 3, 2, '#8a9aaa');
    }) },
];
export const creature = (id: string) => CREATURES.find(c => c.id === id);

/** San hô và sinh vật đứng yên chạm được (vùng chạm theo pixel logic) */
export interface Touchable { id: string; name: string; icon: string; fact: string; x: number; y: number; w: number; h: number }
export const CORALS: Touchable[] = [
  { id: 'brain', name: 'San hô não', icon: '🪸', fact: 'Mỗi khối là hàng nghìn con polyp tí hon sống chung, lớn chừng 1cm mỗi năm.', x: 96, y: 108, w: 26, h: 16 },
  { id: 'staghorn', name: 'San hô sừng hươu', icon: '🪸', fact: 'Mọc nhanh nhất trong các loài san hô — nhà của rất nhiều cá con.', x: 120, y: 104, w: 18, h: 22 },
  { id: 'fan', name: 'Quạt biển', icon: '🪭', fact: 'Luôn quay mặt quạt vuông góc với dòng nước để lọc thức ăn.', x: 76, y: 100, w: 24, h: 24 },
  { id: 'anemone', name: 'Hải quỳ', icon: '🌸', fact: 'Trông như bông hoa nhưng là động vật! Xúc tu có độc, trừ cá hề là bạn thân.', x: REEF.anemone.x, y: REEF.anemone.y - 4, w: 18, h: 10 },
  { id: 'sponge', name: 'Bọt biển ống', icon: '🧽', fact: 'Một trong những động vật cổ nhất Trái Đất — không có não, không có cơ.', x: 108, y: 114, w: 12, h: 14 },
  { id: 'table', name: 'San hô bàn', icon: '🪸', fact: 'Tán phẳng rộng như cái bàn, che nắng cho cá nhỏ trú bên dưới.', x: 146, y: 106, w: 28, h: 10 },
  { id: 'star', name: 'Sao biển', icon: '⭐', fact: 'Không có máu, mất một cánh thì mọc lại cánh mới.', x: 70, y: 132, w: 10, h: 8 },
  { id: 'kelp', name: 'Tảo bẹ', icon: '🌿', fact: 'Có loài mọc tới nửa mét mỗi ngày, thành cả "rừng" dưới biển.', x: 48, y: 108, w: 10, h: 26 },
];
export const LOG_TOTAL = CREATURES.length + CORALS.length;
export const logName = (id: string) => CREATURES.find(c => c.id === id) ?? CORALS.find(c => c.id === id);
