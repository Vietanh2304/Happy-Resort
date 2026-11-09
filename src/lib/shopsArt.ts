// Phố tiệm nhỏ (bản đồ riêng, đi từ làng): tiệm hoa của Hy + tiệm bánh, có cửa vào; bên trong mỗi tiệm là một phòng.
import { ellipse } from './iso';
import { makeSprite, mix, type Pen } from './pixel';
import { seeded } from './rng';

export const STREET = {
  florist: { x: 70, door: { x: 70, y: 102 } },
  bakery: { x: 186, door: { x: 186, y: 102 } },
  toTown: { x: 128, y: 180 },
};
export const FLORIST = { counter: { x: 96, y: 84, stand: { x: 96, y: 100 } }, bench: { x: 150, y: 96, stand: { x: 150, y: 110 } }, door: { x: 96, y: 140 } };
export const BAKERY = { fridge: { x: 176, y: 64, stand: { x: 168, y: 104 } }, deco: { x: 166, y: 112, stand: { x: 150, y: 124 } }, prep: { x: 44, y: 94, stand: { x: 44, y: 106 } }, oven: { x: 44, y: 76, stand: { x: 50, y: 100 } }, case: { x: 120, y: 92, stand: { x: 120, y: 108 } }, door: { x: 96, y: 140 } };

const win = (p: Pen, x: number, y: number, w: number, h: number, glass: string) => {
  p.rect(x, y, w, h, '#ffffff'); p.rect(x + 1, y + 1, w - 2, h - 2, glass); p.rect(x + Math.floor(w / 2), y + 1, 1, h - 2, '#ffffff');
};

/** Phố: hai mặt tiền tiệm (hoa: hồng, hoa trong chậu; bánh: kem, mái hiên sọc nâu, bảng bánh mì), đường lát đá, đèn, ghế */
export function streetBackground(phase: 'day' | 'night' | 'sunset' | 'dawn') {
  return makeSprite(`street:v1:${phase}`, 256, 192, p => {
    const night = phase === 'night', dusk = phase === 'sunset';
    const sky = night ? ['#0e1640', '#2a3270'] : dusk ? ['#6a4fc4', '#ffa07a'] : ['#7ac8f6', '#d8f0ff'];
    for (let y = 0; y < 40; y++) p.rect(0, y, 256, 1, mix(sky[0], sky[1], y / 40));
    const r = seeded('street');
    for (let x = -4; x < 260; x += 12) ellipse(p, x, 38 + (r() * 3 | 0), 9, 7, night ? '#1e3a2e' : mix('#6ab858', '#4a9a4a', r()));
    p.rect(0, 40, 256, 66, night ? '#3a4a3a' : '#a8d890');
    // ── tiệm hoa (trái) ──
    const fw = night ? '#e8b8c8' : '#ffd8e4';
    p.rect(22, 30, 96, 72, fw); for (let i = 0; i < 9; i++) p.rect(18 + i, 22 + i, 104 - i * 2, 1, i % 2 ? '#e86a8a' : '#f59ab3');
    p.rect(18, 30, 104, 3, '#c8506a');
    p.rect(40, 36, 60, 10, '#fffaf0'); p.rect(42, 38, 56, 6, '#f59ab3'); for (let x = 45; x < 96; x += 6) ellipse(p, x, 41, 1.6, 1.6, '#fffaf0');
    win(p, 28, 52, 26, 24, night ? '#ffe08a' : '#a8d8f0'); win(p, 86, 52, 26, 24, night ? '#ffe08a' : '#a8d8f0');
    for (const x0 of [28, 86]) for (let x = x0; x < x0 + 26; x += 4) { ellipse(p, x + 2, 78, 2.2, 2, '#5aa84a'); p.px(x + 2, 77, ['#e8604a', '#f6c64e', '#ffffff', '#c8a2e8'][((x / 4) | 0) % 4]); }
    for (const x0 of [28, 86]) p.rect(x0 - 1, 80, 28, 3, '#a8693f');
    p.rect(60, 62, 20, 40, '#a8693f'); p.rect(62, 64, 16, 22, night ? '#ffe08a' : '#ffe8f0'); p.px(76, 86, '#f6c64e');
    for (let i = 0; i < 6; i++) { ellipse(p, 50 + i * 8, 100, 3, 2.5, ['#e8604a', '#f59ab3', '#f6c64e', '#ffffff', '#c8a2e8', '#e8604a'][i]); }
    // ── tiệm bánh (phải) ──
    const bw = night ? '#d8c0a0' : '#fff0d8';
    p.rect(138, 30, 96, 72, bw); for (let i = 0; i < 9; i++) p.rect(134 + i, 22 + i, 104 - i * 2, 1, i % 2 ? '#8a5a3c' : '#a8703f');
    p.rect(134, 30, 104, 3, '#6a4028');
    p.rect(156, 36, 60, 10, '#fffaf0'); p.rect(158, 38, 56, 6, '#c88a5a'); ellipse(p, 170, 41, 5, 2.2, '#e8b070'); ellipse(p, 186, 41, 3, 2.5, '#f6c87a'); ellipse(p, 200, 41, 4, 2, '#d8a050');
    for (let x = 138; x < 234; x += 8) p.rect(x, 48, 8, 5, x % 16 ? '#a8693f' : '#fffaf0');                     // mái hiên sọc
    win(p, 144, 56, 30, 22, night ? '#ffe08a' : '#a8d8f0'); win(p, 200, 56, 30, 22, night ? '#ffe08a' : '#a8d8f0');
    for (let x = 147; x < 172; x += 6) { ellipse(p, x, 72, 2.5, 1.6, '#e8b070'); } for (let x = 203; x < 228; x += 6) { p.rect(x - 2, 70, 4, 3, '#f59ab3'); p.rect(x - 2, 69, 4, 1, '#fffaf0'); }
    p.rect(176, 62, 20, 40, '#8a5a3c'); p.rect(178, 64, 16, 22, night ? '#ffe08a' : '#fff4e0'); p.px(192, 86, '#f6c64e');
    p.rect(210, 84, 16, 14, '#3a3a4a'); p.rect(211, 85, 14, 12, '#2a4a3a'); p.rect(213, 88, 10, 1, '#ffffff'); p.rect(213, 91, 7, 1, '#ffffff');   // bảng menu
    // vỉa hè + đường đá
    for (let y = 102; y < 192; y++) p.rect(0, y, 256, 1, (y - 102) % 7 === 0 ? (night ? '#7a7068' : '#c8b8a8') : night ? '#968a80' : '#e0d4c4');
    for (let y = 102; y < 192; y += 7) for (let x = ((y / 7) % 2) * 8; x < 256; x += 16) p.rect(x, y, 1, 7, night ? '#7a7068' : '#cfc2b2');
    for (const x of [14, 128, 244]) { p.rect(x, 96, 1, 26, '#5a5a6a'); p.rect(x - 2, 94, 5, 3, night ? '#fff1a8' : '#8a8a9a'); }
    p.rect(110, 140, 36, 3, '#a8693f'); p.rect(112, 143, 2, 6, '#6a4028'); p.rect(142, 143, 2, 6, '#6a4028'); p.rect(110, 134, 36, 2, '#c88a5a');   // ghế đá
    p.rect(124, 172, 2, 16, '#8a5a3c'); p.rect(116, 166, 18, 7, '#c8905a'); p.rect(119, 168, 12, 1, '#fffaf0');                                   // biển về làng
  }, null);
}

/** Bên trong tiệm hoa: tường hồng, kệ xô hoa nhiều màu, quầy gói hoa, bàn cắm, tủ mát */
export function floristRoom() {
  return makeSprite('florist-room:v2', 192, 144, p => {
    p.rect(0, 0, 192, 76, '#ffe0ea'); for (let x = 0; x < 192; x += 10) p.rect(x, 0, 1, 76, '#f8d0dc');
    p.rect(0, 70, 192, 6, '#e8a8b8');
    for (let y = 76; y < 144; y++) p.rect(0, y, 192, 1, (y - 76) % 8 === 0 ? '#c8a080' : mix('#ecd0b0', '#dcc0a0', (y - 76) / 68));
    // kệ xô hoa 2 tầng
    for (const sy of [22, 46]) {
      p.rect(8, sy + 16, 104, 3, '#a8693f');
      for (let i = 0; i < 8; i++) { const x = 12 + i * 12, c = ['#e8604a', '#f59ab3', '#f6c64e', '#ffffff', '#c8a2e8', '#ff8a5a', '#e8304a', '#a8d8f0'][(i + sy) % 8];
        p.rect(x, sy + 8, 8, 8, '#8aa8c0'); p.rect(x, sy + 8, 8, 1, '#c8dce8');
        for (let k = 0; k < 4; k++) { p.rect(x + 1 + k * 2, sy + 3, 1, 6, '#5aa84a'); ellipse(p, x + 1.5 + k * 2, sy + 2, 1.6, 1.6, c); } }
    }
    // tủ mát kính
    p.rect(124, 14, 60, 52, '#d8e8f0'); p.rect(126, 16, 56, 48, '#a8d8f0'); p.rect(153, 16, 2, 48, '#d8e8f0');
    for (let i = 0; i < 6; i++) { ellipse(p, 134 + (i % 3) * 16, 28 + Math.floor(i / 3) * 20, 5, 4, ['#e8304a', '#ffffff', '#f6c64e', '#f59ab3', '#c8a2e8', '#e8604a'][i]); p.rect(133 + (i % 3) * 16, 32 + Math.floor(i / 3) * 20, 2, 6, '#5aa84a'); }
    // quầy gói hoa (giữa) + giấy gói, kéo, ruy băng
    p.rect(66, 72, 60, 14, '#c88a5a'); p.rect(66, 72, 60, 3, '#e8b07a'); p.rect(70, 70, 14, 3, '#f8d0dc'); p.rect(88, 70, 10, 2, '#fff8e0'); p.rect(104, 69, 3, 4, '#e8304a');
    // bàn cắm hoa (phải dưới) có bình
    p.rect(132, 88, 40, 8, '#e8c890'); p.rect(134, 96, 2, 10, '#a8703f'); p.rect(168, 96, 2, 10, '#a8703f');
    // lẵng hoa mây đan trên bàn cắm
    ellipse(p, 152, 86, 11, 4, '#b8864a'); p.rect(141, 80, 22, 6, '#c8965a'); for (let x = 142; x < 162; x += 3) p.rect(x, 80, 1, 6, '#a8763a');
    for (let i = 0; i < 12; i++) p.px(141 + (i * 7) % 22, 70 + (i * 5) % 14, '#e8a0b8');
    for (let k = 0; k < 7; k++) { ellipse(p, 143 + k * 3, 77 - (k % 3) * 2, 2.2, 2, ['#e8304a', '#ffffff', '#f6c64e', '#f59ab3', '#c8a2e8', '#ff8a5a', '#e8304a'][k]); p.rect(143 + k * 3, 79, 1, 2, '#5aa84a'); }
    // chậu cây lớn góc trái + cửa
    ellipse(p, 14, 98, 9, 8, '#4a9a4a'); p.rect(8, 100, 12, 10, '#e8905a');
    p.rect(82, 134, 28, 10, '#d8b088');
  }, null);
}

/** Bên trong tiệm bánh: tường kem gạch, lò gạch có lửa, tủ kính bày bánh, quầy, bàn ghế nhỏ */
export function bakeryRoom(baking: boolean) {
  return makeSprite(`bakery-room:v3:${baking}`, 192, 144, p => {
    p.rect(0, 0, 192, 76, '#fff0d8'); for (let y = 6; y < 70; y += 6) for (let x = (y / 6) % 2 ? 0 : 6; x < 192; x += 12) p.rect(x, y, 11, 5, '#f8e4c4');
    p.rect(0, 70, 192, 6, '#c8905a');
    for (let y = 76; y < 144; y++) p.rect(0, y, 192, 1, (y - 76) % 9 === 0 ? '#a8703f' : mix('#d8a068', '#c8905a', (y - 76) / 68));
    // lò gạch
    p.rect(14, 18, 60, 58, '#b8583a'); for (let y = 20; y < 74; y += 5) for (let x = (y / 5) % 2 ? 14 : 18; x < 72; x += 8) p.rect(x, y, 7, 4, '#c8684a');
    ellipse(p, 44, 52, 16, 13, '#3a2020'); p.rect(28, 52, 32, 14, '#3a2020');
    if (baking) { ellipse(p, 44, 60, 12, 6, '#f6a03a'); ellipse(p, 44, 61, 8, 4, '#ffe08a'); ellipse(p, 38, 56, 3, 2, '#e8b070'); ellipse(p, 50, 56, 3, 2, '#e8b070'); }
    p.rect(26, 66, 36, 4, '#8a5a3c'); p.rect(40, 10, 8, 10, '#8a8098');
    // khu nhào bột như bếp: bàn đá, thau trộn, cây cán bột, rây bột
    p.rect(84, 22, 34, 3, '#a8693f'); for (let i = 0; i < 4; i++) { p.rect(86 + i * 8, 14, 6, 8, ['#fffaf0', '#f6e0b0', '#e8c890', '#f8d0dc'][i]); p.rect(86 + i * 8, 13, 6, 1, '#a8693f'); }
    // tủ kính bày bánh
    p.rect(92, 64, 64, 26, '#e8d4b0'); p.rect(94, 66, 60, 16, '#d8f0ff'); p.rect(94, 74, 60, 1, '#ffffff');
    for (let i = 0; i < 6; i++) { const x = 98 + i * 9; if (i % 2) { p.rect(x, 69, 6, 4, '#f59ab3'); p.rect(x, 68, 6, 1, '#fffaf0'); } else ellipse(p, x + 3, 71, 3, 1.8, '#e8b070'); ellipse(p, x + 3, 79, 3, 1.8, i % 3 ? '#d8a050' : '#fff0c0'); }
    // tủ nguyên liệu (tủ mát) góc phải
    p.rect(164, 14, 24, 54, '#e8eef4'); p.rect(166, 16, 20, 24, '#d0dce8'); p.rect(166, 42, 20, 24, '#d0dce8'); p.rect(183, 26, 2, 6, '#8a8098'); p.rect(183, 50, 2, 6, '#8a8098');
    for (let i = 0; i < 4; i++) { ellipse(p, 170 + (i % 2) * 8, 22 + Math.floor(i / 2) * 8, 2.5, 3, ['#fff6e0', '#f6c64e', '#fffaf0', '#ffe8a0'][i]); }
    // bàn trang trí: đĩa xoay, túi bắt kem, bát dâu
    p.rect(4, 82, 80, 12, '#e8e4dc'); p.rect(4, 82, 80, 2, '#ffffff'); p.rect(6, 94, 76, 6, '#a8703f');
    ellipse(p, 24, 81, 8, 3, '#f0f0f8'); ellipse(p, 24, 80, 6, 2, '#fff4d8'); p.rect(40, 79, 16, 2, '#d8a868'); ellipse(p, 40, 80, 1.5, 1.5, '#a8703f'); ellipse(p, 56, 80, 1.5, 1.5, '#a8703f');
    ellipse(p, 70, 81, 5, 2, '#c8c8d8'); for (let i = 0; i < 8; i++) p.px(64 + (i * 3) % 12, 78 - (i % 2), '#ffffff');
    // bàn tròn nhỏ
    ellipse(p, 40, 112, 12, 4, '#e8c890'); p.rect(39, 112, 2, 12, '#8a5a3c'); ellipse(p, 40, 109, 3, 1.5, '#f59ab3');
    p.rect(144, 104, 44, 10, '#f2ece4'); p.rect(144, 104, 44, 2, '#ffffff'); p.rect(146, 114, 2, 10, '#a8703f'); p.rect(184, 114, 2, 10, '#a8703f');
    ellipse(p, 156, 104, 6, 2, '#d8d8e0'); ellipse(p, 156, 102, 4, 2, '#fff6e0'); p.rect(168, 99, 4, 6, '#f8b8cc'); p.px(169, 98, '#ffffff'); ellipse(p, 180, 103, 4, 2, '#ffffff'); p.px(179, 102, '#e8304a'); p.px(181, 102, '#e8304a');
    p.rect(82, 134, 28, 10, '#d8b088');
  }, null);
}

/** Biển chỉ đường trong làng tới phố tiệm */
export const streetSignSprite = () => makeSprite('street-sign', 22, 26, p => {
  p.rect(10, 8, 2, 18, '#8a5a3c'); p.rect(1, 2, 20, 9, '#f59ab3'); p.rect(2, 3, 18, 7, '#ffd8e4');
  ellipse(p, 7, 6.5, 2, 2, '#e8304a'); p.rect(12, 5, 6, 3, '#e8b070'); p.rect(12, 4, 6, 1, '#fffaf0');
});

/** Bó hoa pixel (kiểu tranh tô màu): tán lá xanh phía sau, hoa nở xếp vòm, giấy gói hình phễu chấm bi + nơ to. */
const FLOWER_LOOK: Record<string, { p: string; d: string; l: string; c: string; kind: 'round' | 'cup' | 'spike' | 'daisy' | 'sun' }> = {
  rose_bloom: { p: '#e8304a', d: '#a81830', l: '#ff7a8a', c: '#c82040', kind: 'round' },
  tulip_bloom: { p: '#f070b0', d: '#c04888', l: '#ffb0d8', c: '#e05aa0', kind: 'cup' },
  lavender: { p: '#a070e0', d: '#7048b0', l: '#d0b0ff', c: '#8858c8', kind: 'spike' },
  daisy_bloom: { p: '#ffffff', d: '#d8d8e8', l: '#ffffff', c: '#f6c64e', kind: 'daisy' },
  sunflower_bloom: { p: '#f6c64e', d: '#d89a20', l: '#ffe890', c: '#7a4a20', kind: 'sun' },
  sakura_bloom: { p: '#ffc0d8', d: '#e890b0', l: '#ffe4ee', c: '#f6c64e', kind: 'daisy' },
};
const BQ_SLOTS: [number, number][] = [[24, 17], [16, 21], [32, 21], [10, 27], [38, 27], [20, 28], [28, 28], [24, 33]];
export function bouquetSprite(stems: string[], paper: string | null, ribbon: string) {
  return makeSprite(`bq:${stems.join(',')}:${paper}:${ribbon}`, 48, 62, p => {
    const n = stems.length;
    // tán lá phía sau (2 tông xanh ngọc như tranh), rộng theo số hoa
    if (n) {
      const leaf = (x: number, y: number, rx: number, ry: number) => { ellipse(p, x, y, rx, ry, '#1e9a6a'); ellipse(p, x - 1, y - 1, rx - 1.5, ry - 1.5, '#3cc890'); ellipse(p, x - 2, y - 2, rx / 3, ry / 3, '#8af0c0'); };
      const k = Math.max(5, n);
      for (const [x, y] of BQ_SLOTS.slice(0, k)) { leaf(x - 5, y + 4, 5, 3.5); leaf(x + 5, y + 5, 5, 3.5); }
      leaf(24, 34, 13, 6); leaf(12, 33, 6, 4); leaf(36, 33, 6, 4);
      for (const [x, y] of [[6, 30], [42, 30], [24, 12]] as const) if (n >= 5) leaf(x, y, 4, 3);
    }
    // hoa
    stems.forEach((id, i) => {
      const [x, y] = BQ_SLOTS[i % BQ_SLOTS.length], f = FLOWER_LOOK[id] ?? FLOWER_LOOK.rose_bloom;
      if (f.kind === 'spike') { for (let k = 0; k < 6; k++) { ellipse(p, x, y - 4 + k * 2, 2.2 - k * 0.1, 1.4, k % 2 ? f.d : f.p); p.px(x - 1, y - 4 + k * 2, f.l); } return; }
      if (f.kind === 'cup') { ellipse(p, x, y + 1, 4, 3.6, f.d); p.rect(x - 4, y - 3, 8, 4, f.p); p.rect(x - 4, y - 4, 2, 2, f.p); p.rect(x - 1, y - 5, 2, 3, f.p); p.rect(x + 2, y - 4, 2, 2, f.p); p.rect(x - 3, y - 2, 2, 3, f.l); return; }
      if (f.kind === 'round') { ellipse(p, x, y, 4.6, 4.2, f.d); ellipse(p, x, y - 0.5, 3.8, 3.4, f.p); ellipse(p, x + 0.5, y - 0.5, 2, 1.8, f.d); p.px(x - 2, y - 2, f.l); p.px(x - 1, y - 3, f.l); p.px(x + 1, y + 1, f.l); return; }
      const big = f.kind === 'sun' ? 1.4 : 1;
      for (let a = 0; a < 8; a++) { const t = (a / 8) * Math.PI * 2; ellipse(p, x + Math.cos(t) * 3.2 * big, y + Math.sin(t) * 3.2 * big, 1.9 * big, 1.9 * big, a % 2 ? f.d : f.p); }
      ellipse(p, x, y, 2 * big, 2 * big, f.c); p.px(x - 1, y - 1, f.l);
    });
    if (!paper) return;
    // giấy gói hình phễu, chấm bi, viền đậm
    const dark = mix(paper, '#000000', 0.25), light = mix(paper, '#ffffff', 0.55);
    for (let y = 36; y < 56; y++) { const w = Math.round(14 - (y - 36) * 0.5); p.rect(24 - w, y, w * 2, 1, paper); p.px(24 - w, y, dark); p.px(24 + w - 1, y, dark); }
    for (const [x, y] of [[13, 36], [35, 36], [24, 35]] as const) ellipse(p, x, y, 3, 1.6, '#3cc890');   // lá chìa ra mép giấy
    for (let i = 0; i < 14; i++) p.px(13 + ((i * 7) % 22), 37 + ((i * 5) % 15), light);
    // nơ to + đuôi nơ
    const rd = mix(ribbon, '#000000', 0.3);
    ellipse(p, 18, 47, 5, 3, ribbon); ellipse(p, 30, 47, 5, 3, ribbon); ellipse(p, 18, 47, 2, 1.2, rd); ellipse(p, 30, 47, 2, 1.2, rd);
    p.rect(22, 45, 4, 4, rd); p.rect(20, 50, 3, 6, ribbon); p.rect(26, 50, 3, 6, ribbon); p.px(20, 55, rd); p.px(28, 55, rd);
    // đuôi giấy dưới cùng
    p.rect(20, 56, 8, 4, paper); p.rect(19, 59, 10, 2, light); p.px(19, 58, dark); p.px(28, 58, dark);
  });
}
