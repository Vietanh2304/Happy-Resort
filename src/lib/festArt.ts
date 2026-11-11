// Đồ trang trí lễ hội vẽ pixel (thay emoji): mai, đào, câu đối, đèn lồng, đèn ông sao, cây thông đèn nháy,
// người tuyết, bí ngô, ma, mạng nhện, tim, bóng bay… cùng bộ "thứ rơi" (cánh hoa, lì xì, tuyết, pháo giấy).
import type { Theme } from './festivals';
import { makeSprite, type Pen, type Sprite } from './pixel';

const blob = (p: Pen, cx: number, cy: number, r: number, c: string) => { for (let dy = -r; dy <= r; dy++) { const w = Math.round(Math.sqrt(r * r - dy * dy)); p.rect(cx - w, cy + dy, w * 2 + 1, 1, c); } };
const pot = (p: Pen, x: number, y: number, w: number) => { p.rect(x, y, w, 6, '#c8603a'); p.rect(x - 1, y, w + 2, 2, '#e07a4a'); p.rect(x + 1, y + 6, w - 2, 1, '#8a3a22'); p.rect(x + 2, y + 2, w - 4, 1, '#f6c445'); };
const blossomTree = (p: Pen, c1: string, c2: string, c3: string) => {
  pot(p, 6, 26, 12);
  p.rect(11, 12, 2, 14, '#5a3a2a'); p.rect(7, 14, 4, 1, '#5a3a2a'); p.rect(13, 10, 5, 1, '#5a3a2a'); p.rect(6, 8, 2, 6, '#5a3a2a'); p.rect(16, 6, 2, 5, '#5a3a2a');
  const spots = [[7, 7], [5, 11], [10, 9], [14, 5], [18, 8], [16, 12], [9, 14], [12, 4], [3, 8], [20, 5], [14, 14], [6, 4]];
  spots.forEach(([x, y], i) => { p.rect(x, y, 2, 2, i % 3 ? c1 : c2); p.px(x + (i % 2), y, c3); });
};

const ART: Record<string, [number, number, (p: Pen) => void]> = {
  mai: [24, 33, p => blossomTree(p, '#f6d030', '#f0a020', '#fff4a0')],
  dao: [24, 33, p => blossomTree(p, '#f8a0c0', '#e870a0', '#ffe0ea')],
  caudoi: [7, 30, p => { p.rect(0, 0, 7, 2, '#8a5a2a'); p.rect(1, 2, 5, 26, '#d8302a'); p.rect(1, 2, 1, 26, '#f05040'); for (let y = 5; y < 26; y += 5) { p.rect(2, y, 3, 1, '#f6d040'); p.px(3, y + 1, '#f6d040'); p.px(2, y + 2, '#f6d040'); } p.rect(2, 28, 3, 2, '#f6d040'); }],
  lantern: [10, 15, p => { p.rect(4, 0, 2, 2, '#3a2a1a'); p.rect(2, 2, 6, 1, '#f6c445'); blob(p, 5, 7, 4, '#e8302a'); p.rect(1, 5, 1, 4, '#ff6a50'); p.rect(3, 4, 1, 6, '#b81818'); p.rect(6, 4, 1, 6, '#b81818'); p.rect(2, 11, 6, 1, '#f6c445'); p.rect(4, 12, 2, 3, '#f6c445'); }],
  star: [15, 18, p => { const S = ['......Y......', '.....YYY.....', '....YRRRY....', 'YYYYRRRRRYYYY', '.YRRRRRRRRRY.', '..YRRRRRRRY..', '...YRRRRRY...', '..YRRRYRRRY..', '.YRRY...YRRY.', 'YRY.......YRY', 'Y...........Y']; p.map(S, { Y: '#f6c445', R: '#e8302a' }, 1, 0); p.rect(7, 11, 1, 7, '#8a5a2a'); }],
  mooncake: [16, 10, p => { p.rect(0, 7, 16, 3, '#c83a2a'); p.rect(1, 6, 14, 1, '#e8583a'); blob(p, 4, 4, 3, '#d89a4a'); blob(p, 11, 4, 3, '#c88a3a'); p.px(4, 4, '#f0c070'); p.px(11, 4, '#e0b060'); }],
  rabbit: [10, 12, p => { p.rect(2, 0, 2, 5, '#ffffff'); p.rect(6, 0, 2, 5, '#ffffff'); p.px(3, 2, '#f8a8c0'); p.px(7, 2, '#f8a8c0'); blob(p, 5, 8, 3, '#ffffff'); p.px(4, 7, '#2a2a2a'); p.px(6, 7, '#2a2a2a'); p.px(5, 8, '#f8a8c0'); }],
  xmastree: [22, 32, p => { for (let i = 0; i < 24; i++) { const w = Math.round(i * 0.42) + 1 + (i % 6 < 2 ? 1 : 0); p.rect(11 - w, 4 + i, w * 2, 1, i % 6 < 3 ? '#2a7a3a' : '#3a9a4a'); } p.rect(9, 28, 4, 4, '#6a4a2a'); [[11, 9, '#f6c445'], [8, 14, '#e8443a'], [14, 16, '#4a9ae8'], [6, 21, '#f6c445'], [12, 22, '#e8443a'], [16, 25, '#f6c445'], [9, 26, '#4a9ae8']].forEach(([x, y, c]) => p.rect(x as number, y as number, 2, 2, c as string)); for (let i = 6; i < 26; i += 4) p.rect(11 - Math.round(i * 0.42), i, Math.round(i * 0.84), 1, '#f0e8c0'); const st = ['..Y..', 'YYYYY', '.YYY.', 'Y...Y']; p.map(st, { Y: '#f6d040' }, 9, 0); }],
  gift: [11, 11, p => { p.rect(0, 3, 11, 8, '#e8443a'); p.rect(0, 3, 11, 1, '#f86a5a'); p.rect(5, 3, 2, 8, '#f6d040'); p.rect(0, 6, 11, 1, '#f6d040'); p.rect(2, 0, 3, 3, '#f6d040'); p.rect(7, 0, 3, 3, '#f6d040'); }],
  snowman: [14, 20, p => { blob(p, 7, 14, 5, '#f4f8ff'); blob(p, 7, 6, 4, '#ffffff'); p.px(5, 5, '#2a2a2a'); p.px(8, 5, '#2a2a2a'); p.rect(7, 6, 3, 1, '#f08a3a'); p.rect(3, 9, 9, 2, '#d8302a'); p.rect(4, 0, 7, 2, '#2a2a3a'); p.rect(3, 2, 9, 1, '#2a2a3a'); p.px(7, 13, '#2a2a2a'); p.px(7, 15, '#2a2a2a'); }],
  wreath: [14, 14, p => { for (let a = 0; a < 24; a++) { const x = 7 + Math.round(Math.cos(a / 24 * Math.PI * 2) * 5), y = 7 + Math.round(Math.sin(a / 24 * Math.PI * 2) * 5); p.rect(x - 1, y - 1, 2, 2, a % 3 ? '#2a7a3a' : '#3a9a4a'); if (a % 5 === 0) p.px(x, y, '#e8302a'); } p.rect(5, 11, 4, 3, '#e8302a'); }],
  pumpkin: [14, 12, p => { p.rect(6, 0, 2, 3, '#4a6a2a'); blob(p, 7, 7, 5, '#f08a20'); p.rect(4, 3, 1, 8, '#c86a10'); p.rect(9, 3, 1, 8, '#c86a10'); p.rect(4, 5, 2, 2, '#ffe060'); p.rect(8, 5, 2, 2, '#ffe060'); p.rect(4, 9, 6, 1, '#ffe060'); p.px(5, 8, '#ffe060'); p.px(8, 8, '#ffe060'); }],
  ghost: [12, 14, p => { blob(p, 6, 5, 5, '#f4f4ff'); p.rect(1, 5, 11, 7, '#f4f4ff'); for (let x = 1; x < 12; x += 3) p.rect(x, 12, 2, 2, '#f4f4ff'); p.rect(3, 4, 2, 3, '#2a2a3a'); p.rect(7, 4, 2, 3, '#2a2a3a'); p.rect(5, 8, 2, 2, '#2a2a3a'); }],
  web: [16, 16, p => { const c = '#e8e8f0'; for (let i = 0; i < 16; i++) { p.px(i, i, c); p.px(i, 0, c); p.px(0, i, c); p.px(i, Math.round(i / 2), c); p.px(Math.round(i / 2), i, c); } for (const r of [4, 8, 12]) for (let a = 0; a <= r; a++) p.px(a, r - a, c); p.rect(9, 9, 2, 2, '#2a2a2a'); }],
  bat: [12, 6, p => { p.map(['B....B.B....', 'BB..BBBB..BB', 'BBBBBBBBBBBB', '.BBBB..BBBB.', '..B......B..', '............'], { B: '#2a1a3a' }); }],
  heart: [9, 8, p => { p.map(['.RR.RR.', 'RRPRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'], { R: '#e84a7a', P: '#ffc0d0' }, 1, 1); }],
  rose: [10, 16, p => { p.rect(4, 6, 1, 10, '#3a8a3a'); p.rect(5, 10, 3, 1, '#4aa84a'); blob(p, 4, 4, 3, '#d8203a'); p.px(3, 3, '#f05060'); p.px(5, 4, '#a81028'); }],
  balloon: [8, 18, p => { blob(p, 4, 4, 3, '#e8443a'); p.px(3, 2, '#ffa0a0'); p.rect(3, 8, 2, 1, '#c82a2a'); for (let y = 9; y < 18; y++) p.px(4 + (y % 2), y, '#8a8a8a'); }],
  balloon2: [8, 18, p => { blob(p, 4, 4, 3, '#4a9ae8'); p.px(3, 2, '#b0d8ff'); p.rect(3, 8, 2, 1, '#2a6ac8'); for (let y = 9; y < 18; y++) p.px(4 + (y % 2), y, '#8a8a8a'); }],
  cake: [16, 14, p => { p.rect(1, 7, 14, 6, '#f8d8e0'); p.rect(1, 7, 14, 2, '#f8a0b8'); p.rect(0, 13, 16, 1, '#c8c8d0'); for (let x = 3; x < 14; x += 4) { p.rect(x, 3, 1, 4, '#8ac0f0'); p.px(x, 2, '#f6c445'); } p.px(5, 10, '#e8443a'); p.px(10, 11, '#e8443a'); }],
  flowers: [14, 12, p => { pot(p, 2, 6, 10); [[3, 3, '#f8a0c0'], [7, 1, '#f6e04a'], [10, 3, '#b08ae0'], [5, 5, '#ffffff']].forEach(([x, y, c]) => { p.rect(x as number, y as number, 3, 3, c as string); p.px((x as number) + 1, (y as number) + 1, '#f6c445'); }); }],
  bulb: [3, 4, p => { p.rect(1, 0, 1, 1, '#3a3a3a'); p.rect(0, 1, 3, 3, '#ffe060'); }],
};
export const festSprite = (name: string): Sprite => { const a = ART[name] ?? ART.heart; return makeSprite(`fest:${name}`, a[0], a[1], a[2]); };

/** Dây trang trí giăng ngang (đèn lồng đỏ, đèn nháy, cờ dây, tim) */
export const garland = (kind: 'lantern' | 'lights' | 'bunting' | 'hearts' | 'stars', w: number) => makeSprite(`garland:${kind}:${w}`, w, 12, p => {
  for (let x = 0; x < w; x++) p.px(x, 1 + Math.round(Math.sin(x / w * Math.PI) * 4), '#4a3a2a');
  const step = kind === 'lights' ? 5 : 9;
  for (let x = 3, i = 0; x < w - 2; x += step, i++) {
    const y = 2 + Math.round(Math.sin(x / w * Math.PI) * 4);
    if (kind === 'lantern') { p.rect(x - 1, y, 4, 5, '#e8302a'); p.rect(x - 1, y, 4, 1, '#f6c445'); p.rect(x, y + 5, 2, 1, '#f6c445'); }
    if (kind === 'lights') p.rect(x, y, 2, 3, ['#ffe060', '#ff6a6a', '#6ad0ff', '#8aff6a'][i % 4]);
    if (kind === 'bunting') { const c = ['#e8443a', '#f6c445', '#4a9ae8', '#6ac86a', '#f59ab3'][i % 5]; p.rect(x - 2, y, 5, 1, c); p.rect(x - 1, y + 1, 3, 1, c); p.px(x, y + 2, c); }
    if (kind === 'hearts') p.map(['R.R', 'RRR', '.R.'], { R: '#e84a7a' }, x - 1, y);
    if (kind === 'stars') p.map(['.Y.', 'YYY', 'Y.Y'], { Y: '#f6d040' }, x - 1, y);
  }
});

/** Bộ trang trí theo chủ đề: treo cột đèn, đồ đặt đất, dây giăng, thứ rơi (màu hạt) */
export const FEST: Record<Theme | 'halloween', { hang: string; props: string[]; garland: 'lantern' | 'lights' | 'bunting' | 'hearts' | 'stars'; fall: string[]; big?: string }> = {
  tet: { hang: 'lantern', props: ['mai', 'dao', 'caudoi', 'mai', 'dao', 'lantern'], garland: 'lantern', fall: ['#f8a0c0', '#ffd0e0', '#d8302a', '#f6d030'], big: 'mai' },
  lantern: { hang: 'star', props: ['star', 'mooncake', 'rabbit', 'lantern', 'star', 'rabbit'], garland: 'stars', fall: ['#f6d040', '#fff4b0'], big: 'star' },
  winter: { hang: 'wreath', props: ['xmastree', 'gift', 'snowman', 'gift', 'snowman', 'xmastree'], garland: 'lights', fall: ['#ffffff', '#e8f4ff'], big: 'xmastree' },
  romantic: { hang: 'heart', props: ['rose', 'heart', 'rose', 'flowers', 'heart', 'rose'], garland: 'hearts', fall: ['#f8a0c0', '#e84a7a', '#ffd0e0'] },
  party: { hang: 'balloon', props: ['balloon', 'gift', 'cake', 'balloon2', 'gift', 'balloon'], garland: 'bunting', fall: ['#e8443a', '#f6c445', '#4a9ae8', '#6ac86a', '#f59ab3'], big: 'cake' },
  calm: { hang: 'flowers', props: ['flowers', 'flowers', 'flowers'], garland: 'bunting', fall: ['#f8c0d0', '#a8d870'] },
  halloween: { hang: 'bat', props: ['pumpkin', 'ghost', 'pumpkin', 'web', 'pumpkin', 'ghost'], garland: 'bunting', fall: ['#f08a20', '#6a3a8a', '#2a1a3a'], big: 'pumpkin' },
};
