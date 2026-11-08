// Các sprite vẽ tay bằng code: nhân vật, villa, cây, cầu tàu, nền bãi biển, rạp phim, nhà hàng.
import type { Phase } from './content';
import { chibiSprite, type Held, type View } from './chibi';
import { makeSprite, mix, type Sprite } from './pixel';
import { seeded } from './rng';
import { SEA, SKY } from './sky';

/** Kích thước logic của một cảnh (pixel gốc, trước khi phóng to) */
export const W = 160;
export const H = 120;

// ───────── Nhân vật ─────────

export interface AvatarLook { skin?: number; hair?: number; hairColor?: number; shirt?: number; outfit?: number; acc?: number; gender?: "m" | "f"; glasses?: number; design?: import("./ranch").Design | null }
export { SKINS, HAIR_COLORS, SHIRTS } from './chibi';
export const HAIR_STYLES = ['Tóc ngắn', 'Tóc dài', 'Búi tó', 'Tóc xù', 'Hai bím', 'Đuôi ngựa', 'Tóc bob', 'Mái lệch', 'Tóc vuốt', 'Xoăn dài', 'Tóc tém', 'Hai búi'];
export const GLASSES = ['Không', 'Kính tròn', 'Kính vuông', 'Kính râm', 'Kính tim'];
export const OUTFITS = [
  'Áo thun', 'Váy xinh', 'Hoodie', 'Yếm', 'Vest lịch lãm', 'Váy dạ hội', 'Sơ mi & quần tây', 'Áo len',
  'Đồ ngủ', 'Đồ làm vườn', 'Đồ câu cá', 'Áo khoác mùa đông', 'Áo dài', 'Hanbok', 'Sườn xám', 'Áo choàng tắm',
  'Đồ thể thao', 'Váy công chúa', 'Đồ bơi',
];
export const ACCS = ['Không', 'Nơ', 'Hoa cài', 'Mũ len', 'Kính', 'Tai mèo', 'Mũ rơm', 'Mũ tai bèo', 'Vương miện', 'Kẹp sao', 'Khăn quàng', 'Mũ lưỡi trai', 'Khăn tắm'];
/** Gợi ý đồ theo hoạt động */
export const PRESETS: { name: string; outfit: number; acc: number }[] = [
  { name: '💐 Hẹn hò · vest', outfit: 4, acc: 0 },
  { name: '💐 Hẹn hò · váy dạ hội', outfit: 5, acc: 2 },
  { name: '👑 Dạ tiệc · váy công chúa', outfit: 17, acc: 8 },
  { name: '🌱 Làm vườn', outfit: 9, acc: 6 },
  { name: '🎣 Câu cá', outfit: 10, acc: 7 },
  { name: '🌙 Đi ngủ', outfit: 8, acc: 0 },
  { name: '🛁 Đi tắm', outfit: 15, acc: 12 },
  { name: '🏖️ Đi biển · đồ bơi', outfit: 18, acc: 0 },
  { name: '🏃 Thể thao', outfit: 16, acc: 11 },
  { name: '❄️ Mùa đông', outfit: 11, acc: 10 },
  { name: '🇻🇳 Áo dài', outfit: 12, acc: 2 },
  { name: '🇰🇷 Hanbok', outfit: 13, acc: 1 },
  { name: '🇹🇼 Sườn xám', outfit: 14, acc: 9 },
];

export type Frame = 'idle' | 'walk' | 'sit' | 'sleep' | 'dance' | 'act' | 'actsit';


export type { Held, View } from './chibi';

/** Nhân vật chibi (vẽ nét ×2): `view` hướng nhìn, `step` nhịp bước 0..3, `hold` đồ đang cầm */
export function characterSprite(look: AvatarLook, frame: Frame, hold?: Held, view: View = 'front', step = 0): Sprite {
  return chibiSprite(look, frame, view, step, hold);
}

// ───────── Đồ vật lớn trên bờ ─────────

export function villaSprite(lit: boolean) {
  return makeSprite(`villa:${lit}`, 42, 38, p => {
    p.rect(26, 3, 4, 8, '#c9a47e');                       // ống khói
    for (let i = 0; i < 15; i++) {                         // mái ngói sọc
      const half = 5 + i * 1.25;
      p.rect(21 - half, 2 + i, half * 2, 1, i % 3 === 0 ? '#d9707c' : '#ee9aa0');
    }
    p.rect(4, 17, 34, 18, '#fbead4');                      // tường
    p.rect(4, 33, 34, 2, '#e5c9a6');
    for (let x = 6; x < 38; x += 6) p.rect(x, 18, 1, 15, '#f1dcc0');
    const win = lit ? '#ffd86b' : '#a9bbd3';
    for (const wx of [7, 28]) {                            // cửa sổ
      p.rect(wx, 21, 7, 6, win);
      p.rect(wx + 3, 21, 1, 6, '#c99f78');
      p.rect(wx, 24, 7, 1, '#c99f78');
      p.rect(wx - 1, 27, 9, 1, '#c99f78');
    }
    p.rect(17, 23, 8, 12, '#a8693f');                      // cửa
    p.rect(18, 24, 6, 5, '#b97a4c');
    p.px(23, 29, '#ffd86b');
    p.rect(15, 35, 12, 2, '#d8b58c');                      // bậc thềm
  });
}

export function palmSprite(variant = 0) {
  return makeSprite(`palm:${variant}`, 22, 30, p => {
    const lean = variant ? -1 : 1;
    for (let i = 0; i < 20; i++) {                         // thân cong
      const x = 10 + Math.round(Math.sin(i / 7) * 2.5 * lean);
      p.rect(x, 9 + i, 3, 1, i % 3 === 0 ? '#9a6a43' : '#b8834f');
    }
    p.map([
      '.....GG.....GG.......',
      '...GGGGGG.GGGGGG.....',
      '.GGGGLLGGGGGLLGGGG...',
      'GGG...GGGGGGG...GGG..',
      'GG...GGG.N.GGG....GG.',
      'G...GG..NNN..GG....G.',
      '....G...N.N...G......',
    ], { G: '#4fae6a', L: '#7fd18c', N: '#8a5a2c' }, 0, 3);
  });
}

export function dockSprite() {
  return makeSprite('dock', 30, 16, p => {
    for (let x = 0; x < 30; x += 5) {
      p.rect(x, 0, 4, 6, x % 10 === 0 ? '#c99366' : '#b98256');
      p.rect(x, 5, 4, 1, '#94603a');
    }
    for (const x of [2, 14, 26]) p.rect(x, 6, 2, 10, '#7a4e30');
  });
}

export function plotSprite(wet: boolean) {
  return makeSprite(`plot:${wet}`, 14, 9, p => {
    p.rect(0, 0, 14, 9, wet ? '#6e4a33' : '#9a6a47');
    for (let y = 1; y < 9; y += 3) p.rect(1, y, 12, 1, wet ? '#5a3a27' : '#83583a');
  });
}

export function sproutSprite(big: boolean) {
  return makeSprite(`sprout:${big}`, 9, 8, p => big
    ? p.map(['.G.....G.', 'GGG...GGG', '.GGG.GGG.', '...GGG...', '....G....', '....G....', '...LGL...', '....G....'], { G: '#4fae6a', L: '#7fd18c' })
    : p.map(['.........', '.........', '.........', '...G.G...', '....G....', '....G....', '...LGL...', '.........'], { G: '#4fae6a', L: '#7fd18c' }));
}

export function cloudSprite(grey: boolean) {
  return makeSprite(`cloud:${grey}`, 24, 9, p => p.map([
    '.......XXXX.............',
    '.....XXXXXXXX..XXX......',
    '...XXXXXXXXXXXXXXXXX....',
    '.XXXXXXXXXXXXXXXXXXXXX..',
    'XXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXX',
    '.YYYYYYYYYYYYYYYYYYYYYY.',
  ], { X: grey ? '#c9cbd8' : '#ffffff', Y: grey ? '#adb0c2' : '#e3ecf7' }), null);
}

export function heartSprite() {
  return makeSprite('heart', 7, 6, p => p.map(['.RR.RR.', 'RWRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'], { R: '#f06283', W: '#ffc2d1' }));
}

export function bobberSprite(dip: boolean) {
  return makeSprite(`bobber:${dip}`, 4, 5, p => p.map(dip ? ['....', '....', 'RRRR', 'WWWW', '....'] : ['.RR.', 'RRRR', 'WWWW', '.WW.', '....'], { R: '#e8505b', W: '#ffffff' }));
}

// ───────── Nền các cảnh ─────────

const SAND: Record<Phase, string> = { dawn: '#f1d4b0', day: '#f4ddb0', sunset: '#ecc49f', night: '#9a8fb0' };

/** Vị trí các vùng trên bờ (đơn vị pixel logic) */
export const SHORE = {
  horizon: 40,
  sandTop: 46,
  grid: { x: 56, y: 52, cw: 16, ch: 12 },
  wet: 100,
  water: 108,
  villa: { x: 24, y: 52 },
  door: { x: 25, y: 56 },
  plots: [{ x: 13, y: 74 }, { x: 29, y: 74 }, { x: 45, y: 74 }],
  dock: { x: 144, y: 116, stand: { x: 150, y: 106 } },
  guest: { x: 22, y: 98 },
  home: { x: 34, y: 62 },
};

export function shoreBackground(phase: Phase) {
  return makeSprite(`shore-bg:${phase}`, W, H, p => {
    const [top, bottom] = SKY[phase];
    for (let i = 0; i < 8; i++) p.rect(0, i * 5, W, 5, mix(top, bottom, i / 7));     // trời theo dải
    p.rect(0, SHORE.horizon, W, 6, mix(SEA[phase], '#ffffff', 0.25));               // biển xa
    p.rect(0, SHORE.horizon, W, 1, mix(SEA[phase], '#ffffff', 0.5));
    const sand = SAND[phase];
    p.rect(0, SHORE.sandTop, W, SHORE.wet - SHORE.sandTop, sand);
    p.rect(0, SHORE.sandTop, W, 1, mix(sand, '#ffffff', 0.4));
    const rand = seeded('sand');
    for (let i = 0; i < 140; i++) {
      p.px(Math.floor(rand() * W), SHORE.sandTop + 2 + Math.floor(rand() * (SHORE.wet - SHORE.sandTop - 2)),
        rand() < 0.5 ? mix(sand, '#000000', 0.08) : mix(sand, '#ffffff', 0.3));
    }
    p.rect(0, SHORE.wet, W, SHORE.water - SHORE.wet, mix(sand, '#7a5a40', 0.22));     // cát ướt
    p.rect(0, SHORE.water, W, H - SHORE.water, SEA[phase]);                         // nước
    for (let x = 0; x < W; x += 6) p.rect(x + (x % 12 ? 2 : 0), SHORE.water, 4, 1, '#ffffff');
    for (let i = 0; i < 18; i++) p.rect(Math.floor(rand() * W), SHORE.water + 3 + Math.floor(rand() * 9), 3, 1, mix(SEA[phase], '#ffffff', 0.4));
  }, null);
}

export function waterTile(phase: Phase) {
  return makeSprite(`water:${phase}`, 16, 16, p => {
    p.rect(0, 0, 16, 16, SEA[phase]);
    const hi = mix(SEA[phase], '#ffffff', 0.35);
    p.rect(2, 3, 4, 1, hi);
    p.rect(10, 9, 4, 1, hi);
    p.rect(5, 13, 3, 1, mix(SEA[phase], '#ffffff', 0.2));
  }, null);
}

export function plankSprite(empty: boolean) {
  return makeSprite(`plank:${empty}`, 12, 6, p => {
    if (empty) {
      for (let x = 0; x < 12; x += 3) { p.rect(x, 0, 2, 1, '#ffffffaa'); p.rect(x, 5, 2, 1, '#ffffffaa'); }
      return;
    }
    p.rect(0, 0, 12, 6, '#c99366');
    p.rect(0, 5, 12, 1, '#94603a');
    p.px(3, 2, '#a8734c');
    p.px(8, 3, '#a8734c');
  }, empty ? null : '#6b4630');
}

export function islandSprite(locked: boolean) {
  return makeSprite(`island:${locked}`, 28, 12, p => {
    p.rect(2, 4, 24, 7, locked ? '#b8b4bd' : '#f4ddb0');
    p.rect(5, 2, 18, 3, locked ? '#c9c5ce' : '#f8e7c5');
    p.rect(0, 10, 28, 2, '#ffffff99');
  }, null);
}

export function cinemaBackground() {
  return makeSprite('bg:cinema', W, H, p => {
    p.rect(0, 0, W, H, '#2a1f3a');
    for (let x = 0; x < W; x += 8) p.rect(x, 0, 1, 84, '#33264a');
    p.rect(12, 6, 136, 70, '#c9a24a');                      // khung màn hình
    p.rect(14, 8, 132, 66, '#0d0b14');
    for (const side of [0, 1]) {                            // rèm
      const x0 = side ? 146 : 0;
      p.rect(x0, 0, 14, 84, '#a8324a');
      for (let x = x0 + 2; x < x0 + 14; x += 4) p.rect(x, 0, 1, 84, '#7e2238');
    }
    p.rect(0, 0, W, 5, '#7e2238');
    p.rect(0, 84, W, 36, '#3a2a4f');                        // sàn
    for (let row = 0; row < 3; row++) {                     // hàng ghế
      const y = 90 + row * 10;
      for (let x = 6 + (row % 2) * 6; x < W - 10; x += 14) {
        p.rect(x, y, 11, 7, '#c0394f');
        p.rect(x, y, 11, 2, '#d9576a');
      }
    }
  }, null);
}

export function restaurantBackground() {
  return makeSprite('bg:restaurant', W, H, p => {
    p.rect(0, 0, W, 78, '#f4dcc2');
    for (let x = 0; x < W; x += 10) p.rect(x, 0, 4, 78, '#efd0b0');
    p.rect(50, 8, 60, 38, '#8a5a3c');                       // cửa sổ đêm
    p.rect(52, 10, 56, 34, '#25305c');
    const rand = seeded('stars');
    for (let i = 0; i < 18; i++) p.px(52 + Math.floor(rand() * 56), 10 + Math.floor(rand() * 34), '#fff6d0');
    p.rect(92, 14, 6, 6, '#fff3c4');
    p.rect(79, 10, 2, 34, '#8a5a3c');
    p.rect(52, 26, 56, 2, '#8a5a3c');
    for (const lx of [24, 136]) {                           // đèn treo
      p.rect(lx, 0, 1, 14, '#5a4030');
      p.rect(lx - 4, 14, 9, 4, '#f6c25a');
      p.rect(lx - 2, 18, 5, 1, '#fff1b8');
    }
    p.rect(0, 78, W, 42, '#b07a4f');                        // sàn gỗ
    for (let y = 82; y < H; y += 6) p.rect(0, y, W, 1, '#9a6842');
    p.rect(44, 66, 72, 8, '#ffffff');                       // bàn
    p.rect(44, 74, 72, 3, '#e8dcd0');
    p.rect(60, 77, 4, 20, '#7a4e30');
    p.rect(96, 77, 4, 20, '#7a4e30');
    p.rect(78, 58, 4, 8, '#fff6e0');                        // nến
    p.rect(79, 55, 2, 3, '#ffb347');
  }, null);
}
