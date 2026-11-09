// Khách thú ghé làng vẽ bằng pixel, mỗi con 2 khung (bước chân / vỗ cánh / nhảy) để đi lang thang thật.
import { ellipse } from './iso';
import { makeSprite, mix, type Pen } from './pixel';
import { horseSprite } from './ranchArt';

type Four = { kind: 'four'; body: string; light: string; dark: string; ear: 'point' | 'flop' | 'long' | 'round' | 'antler' | 'none'; tail: 'curl' | 'wag' | 'puff' | 'long' | 'none'; spiky?: boolean; long?: boolean; spots?: string; big?: boolean; beard?: boolean; fluffy?: boolean };
type Bird = { kind: 'bird'; body: string; wing: string; belly: string; beak: string; legs: string; tall?: boolean; head?: string; round?: boolean; comb?: boolean };
type Other = { kind: 'crab' | 'turtle' | 'frog' | 'butterfly' | 'fish' | 'octopus' | 'seal' };
type Spec = Four | Bird | Other;

const SPECS: Record<string, Spec> = {
  cat: { kind: 'four', body: '#f6b26b', light: '#fff1d6', dark: '#d88a4a', ear: 'point', tail: 'curl' },
  dog: { kind: 'four', body: '#c98a52', light: '#f6e0c0', dark: '#8a5a3c', ear: 'flop', tail: 'wag' },
  fox: { kind: 'four', body: '#f07a3a', light: '#fff6ea', dark: '#c8582a', ear: 'point', tail: 'puff' },
  rabbit: { kind: 'four', body: '#ece4dc', light: '#ffffff', dark: '#c8b8b0', ear: 'long', tail: 'puff' },
  deer: { kind: 'four', body: '#b8804a', light: '#f2dcb8', dark: '#8a5a34', ear: 'antler', tail: 'puff', long: true },
  otter: { kind: 'four', body: '#8a5a3c', light: '#d8b890', dark: '#6a4028', ear: 'round', tail: 'long', long: true },
  hedgehog: { kind: 'four', body: '#8a6a4a', light: '#f2d8b8', dark: '#5a4030', ear: 'none', tail: 'none', spiky: true },
  monkey: { kind: 'four', body: '#a8703f', light: '#f2d0a8', dark: '#7a4a28', ear: 'round', tail: 'curl' },
  gull: { kind: 'bird', body: '#ffffff', wing: '#b8c0cc', belly: '#ffffff', beak: '#f6c64e', legs: '#f6a03a' },
  duck: { kind: 'bird', body: '#fffaf0', wing: '#e8e0d0', belly: '#ffffff', beak: '#f6a03a', legs: '#f6a03a', head: '#fffaf0' },
  penguin: { kind: 'bird', body: '#2a2a3a', wing: '#1a1a28', belly: '#ffffff', beak: '#f6a03a', legs: '#f6a03a', round: true },
  parrot: { kind: 'bird', body: '#e8403a', wing: '#3a9ae8', belly: '#f6d84a', beak: '#3a3a3a', legs: '#8a8098' },
  flamingo: { kind: 'bird', body: '#f59ab3', wing: '#f07a9a', belly: '#ffc0d0', beak: '#3a2a2a', legs: '#f07a9a', tall: true },
  owl: { kind: 'bird', body: '#a8784a', wing: '#8a5a34', belly: '#f2dcc0', beak: '#f6a03a', legs: '#f6a03a', round: true },
  chicken: { kind: 'bird', body: '#fffaf0', wing: '#e8dcc8', belly: '#ffffff', beak: '#f6a03a', legs: '#f6a03a', head: '#fffaf0', comb: true },
  cow: { kind: 'four', body: '#fffaf0', light: '#ffe0e8', dark: '#3a3448', ear: 'round', tail: 'long', long: true, spots: '#3a3448', big: true },
  goat: { kind: 'four', body: '#e8e0d4', light: '#fffaf0', dark: '#8a7a6a', ear: 'antler', tail: 'puff', beard: true },
  horse: { kind: 'four', body: '#a8693f', light: '#d8a878', dark: '#5a3a2a', ear: 'point', tail: 'long', long: true, big: true },
  sheep: { kind: 'four', body: '#fffaf0', light: '#ffffff', dark: '#5a4a4a', ear: 'flop', tail: 'puff', fluffy: true },
  crab: { kind: 'crab' }, turtle: { kind: 'turtle' }, frog: { kind: 'frog' }, butterfly: { kind: 'butterfly' },
  fish: { kind: 'fish' }, octopus: { kind: 'octopus' }, seal: { kind: 'seal' },
};
/** Con nào bơi trong đài phun nước thay vì đi trên cỏ */
export const SWIMMERS = new Set(['fish', 'octopus']);
/** Con nào bay (đi lượn cao hơn mặt đất, nhịp cánh nhanh) */
export const FLIERS = new Set(['butterfly']);

export function critterSprite(id: string, f: 0 | 1) {
  if (id.startsWith('horse')) return horseSprite(id, f);
  const sp = SPECS[id] ?? SPECS.cat;
  return makeSprite(`critter:${id}:${f}`, 16, 14, p => draw(p, sp, f));
}

function draw(p: Pen, s: Spec, f: 0 | 1) {
  if (s.kind === 'four') {
    const by = 8, bx = s.long ? 3 : 4, bw = s.long ? 9 : 8;
    // đuôi
    if (s.tail === 'curl') { p.rect(1, by - 3, 2, 4, s.body); p.px(2, by - 4, s.dark); }
    if (s.tail === 'wag') p.rect(1, by - (f ? 3 : 1), 2, 3, s.dark);
    if (s.tail === 'puff') ellipse(p, 2.5, by, 2, 1.8, s.light);
    if (s.tail === 'long') p.rect(0, by + 1, 4, 2, s.dark);
    // thân + chân bước
    ellipse(p, bx + bw / 2, by + 1, bw / 2 + 0.5, 3, s.body);
    ellipse(p, bx + bw / 2, by + 2, bw / 2 - 1, 1.5, s.light);
    if (s.spiky) for (let x = bx; x < bx + bw; x += 2) { p.px(x, by - 2, s.dark); p.px(x + 1, by - 3, s.dark); }
    if (s.spots) for (const [dx, dy] of [[2, -1], [5, 1], [7, -1], [3, 2]]) p.rect(bx + dx, by + dy, 2, 2, s.spots);
    if (s.fluffy) for (let x = bx - 1; x <= bx + bw; x += 2) { ellipse(p, x + 0.5, by - 1, 1.6, 1.6, '#ffffff'); ellipse(p, x + 0.5, by + 3, 1.4, 1.2, '#f2ece4'); }
    const legs = f ? [bx + 1, bx + bw - 3] : [bx + 2, bx + bw - 2];
    for (const lx of legs) p.rect(lx, by + 3, 1, s.long ? 3 : 2, s.dark);
    for (const lx of (f ? [bx + 3, bx + bw - 1] : [bx, bx + bw - 4])) p.rect(lx, by + 3, 1, s.long ? 3 : 2, mix(s.dark, '#000000', 0.15));
    // đầu
    const hx = bx + bw + 1, hy = by - 2;
    ellipse(p, hx, hy, 3, 2.8, s.body); ellipse(p, hx + 1, hy + 1, 1.6, 1.2, s.light);
    p.px(hx + 1, hy - 1, '#2a2438'); p.px(hx + 3, hy + 1, '#3a2a2a');
    if (s.beard) p.rect(hx + 1, hy + 3, 1, 2, s.dark);
    if (s.big) { p.rect(hx + 1, hy + 1, 3, 2, '#f6b0c0'); p.px(hx + 2, hy + 1, '#c87a8a'); }
    if (s.fluffy) ellipse(p, hx - 1, hy - 2, 2.2, 1.4, '#ffffff');
    if (s.ear === 'point') { p.px(hx - 2, hy - 3, s.dark); p.px(hx, hy - 3, s.dark); p.px(hx - 2, hy - 2, s.body); p.px(hx, hy - 2, s.body); }
    if (s.ear === 'flop') { p.rect(hx - 3, hy - 1, 2, 3, s.dark); }
    if (s.ear === 'long') { p.rect(hx - 2, hy - 6, 1, 4, s.body); p.rect(hx, hy - 6, 1, 4, s.body); p.px(hx - 2, hy - 5, '#f6b0c0'); }
    if (s.ear === 'round') { p.px(hx - 2, hy - 2, s.dark); p.px(hx + 1, hy - 3, s.dark); }
    if (s.ear === 'antler') { p.rect(hx - 1, hy - 6, 1, 3, '#8a6a3a'); p.px(hx - 2, hy - 5, '#8a6a3a'); p.rect(hx + 1, hy - 6, 1, 3, '#8a6a3a'); p.px(hx + 2, hy - 5, '#8a6a3a'); for (const d of [[2, 9], [6, 7], [8, 9]]) p.px(bx + d[0], by + d[1] - 9, '#f2dcb8'); }
    return;
  }
  if (s.kind === 'bird') {
    const by = s.tall ? 5 : 8;
    ellipse(p, 7, by, s.round ? 4 : 4.5, s.round ? 4 : 3, s.body);
    ellipse(p, 7.5, by + 1, 2.5, 2, s.belly);
    // cánh: vỗ ở khung 1
    if (f) { p.rect(3, by - 4, 4, 2, s.wing); p.px(2, by - 5, s.wing); } else p.rect(4, by - 1, 5, 2, s.wing);
    const hx = s.round ? 7 : 10, hy = s.round ? by - 3 : by - 3;
    ellipse(p, hx, hy, 2.5, 2.3, s.head ?? s.body);
    if (s.round) { p.px(hx - 1, hy, '#ffffff'); p.px(hx + 1, hy, '#ffffff'); p.px(hx - 1, hy, '#2a2438'); p.px(hx + 1, hy, '#2a2438'); p.px(hx, hy + 1, s.beak); }
    else { p.px(hx + 1, hy - 1, '#2a2438'); p.rect(hx + 2, hy, 2, 1, s.beak); }
    if (s.comb) { p.rect(hx - 1, hy - 4, 3, 2, '#e8403a'); p.px(hx + 2, hy + 2, '#e8403a'); }
    // chân
    const ly = by + (s.round ? 4 : 3), lh = s.tall ? 7 : 2;
    p.rect(f ? 6 : 5, ly, 1, lh, s.legs); p.rect(f ? 8 : 9, ly, 1, lh, s.legs);
    return;
  }
  switch (s.kind) {
    case 'crab':
      p.rect(4, 7, 8, 4, '#e8604a'); p.rect(5, 6, 6, 1, '#ff8a6a'); p.px(6, 5, '#2a2438'); p.px(9, 5, '#2a2438');
      p.rect(2, f ? 5 : 6, 2, 2, '#e8604a'); p.rect(12, f ? 6 : 5, 2, 2, '#e8604a');
      for (const x of [4, 6, 9, 11]) p.px(x + (f ? 1 : 0), 11, '#c8483a');
      break;
    case 'turtle':
      ellipse(p, 7, 8, 5, 3.5, '#6a8a3a'); for (const [x, y] of [[5, 7], [8, 7], [6, 9], [9, 9]]) p.px(x, y, '#9aba5a');
      ellipse(p, 13, 9, 2, 1.6, '#8ab07a'); p.px(14, 8, '#2a2438');
      p.rect(f ? 3 : 4, 11, 2, 2, '#8ab07a'); p.rect(f ? 9 : 10, 11, 2, 2, '#8ab07a');
      break;
    case 'frog':
      ellipse(p, 8, f ? 7 : 9, 4.5, 3, '#6ac85a'); ellipse(p, 8, f ? 8 : 10, 3, 1.6, '#c8f0a0');
      for (const x of [5, 11]) { ellipse(p, x, f ? 4 : 6, 1.6, 1.6, '#6ac85a'); p.px(x, f ? 4 : 6, '#2a2438'); }
      if (f) { p.rect(3, 10, 2, 3, '#4aa83a'); p.rect(11, 10, 2, 3, '#4aa83a'); } else { p.rect(3, 11, 3, 1, '#4aa83a'); p.rect(10, 11, 3, 1, '#4aa83a'); }
      break;
    case 'butterfly': {
      const w = f ? 2 : 5;
      p.rect(7, 4, 2, 7, '#3a2a3a'); p.px(6, 3, '#3a2a3a'); p.px(9, 3, '#3a2a3a');
      ellipse(p, 8 - w / 2 - 1, 5, w / 2 + 0.5, 2.5, '#5aa8e0'); ellipse(p, 8 + w / 2 + 2, 5, w / 2 + 0.5, 2.5, '#5aa8e0');
      ellipse(p, 8 - w / 2, 9, w / 2, 1.8, '#f59ab3'); ellipse(p, 8 + w / 2 + 1, 9, w / 2, 1.8, '#f59ab3');
      break;
    }
    case 'fish':
      ellipse(p, 8, 8, 4.5, 2.6, '#ff8a2a'); p.rect(9, 6, 1, 5, '#ffffff'); p.rect(2, f ? 6 : 7, 2, 3, '#ff8a2a'); p.px(11, 7, '#2a2438');
      break;
    case 'octopus':
      ellipse(p, 8, 6, 4, 3.5, '#e86a9a'); p.px(6, 6, '#ffffff'); p.px(10, 6, '#ffffff'); p.px(6, 7, '#2a2438'); p.px(10, 7, '#2a2438');
      for (const x of [4, 6, 8, 10, 12]) p.rect(x + (f && x % 4 ? 1 : 0), 9, 1, 4, '#d8507a');
      break;
    case 'seal':
      ellipse(p, 7, 9, 6, 3, '#8a98a8'); ellipse(p, 7, 10, 4, 1.6, '#c8d0d8'); ellipse(p, 12, 6, 2.5, 2.3, '#8a98a8');
      p.px(13, 5, '#2a2438'); p.px(14, 7, '#3a2a2a'); p.rect(1, f ? 8 : 9, 2, 2, '#6a7888'); p.rect(6, 12, 3, 1, '#6a7888');
      break;
  }
}
