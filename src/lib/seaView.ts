// Cảnh "ghế dài ngắm biển": nhìn từ sau lưng hai chiếc ghế ra biển. Trời & biển theo giờ thật,
// mặt trời/mặt trăng chạy theo giờ, sóng và lấp lánh làm bằng CSS phủ lên nền.
import type { Phase } from './content';
import { makeSprite, mix, type Pen } from './pixel';
import { seeded } from './rng';
import { SEA, SKY } from './sky';

/** Các nơi ngắm biển (vẽ lại nét đặc trưng của từng nơi trên đường chân trời) */
export type SeaSpot = 'home' | 'halong' | 'jeju' | 'kenting' | 'santorini' | 'maldives' | 'borabora'
  | 'phuquoc' | 'whitehaven' | 'navagio' | 'copacabana' | 'waikiki' | 'seychelles' | 'boracay';
export const SEA_SPOTS: { id: SeaSpot; name: string; flag: string; note: string }[] = [
  { id: 'home', name: 'Biển làng mình', flag: '🏝️', note: 'Đảo dừa nhỏ ngoài khơi' },
  { id: 'halong', name: 'Vịnh Hạ Long', flag: '🇻🇳', note: 'Núi đá vôi nhấp nhô, thuyền buồm đỏ' },
  { id: 'jeju', name: 'Đảo Jeju', flag: '🇰🇷', note: 'Núi lửa Seongsan Ilchulbong, bờ đá đen' },
  { id: 'kenting', name: 'Khẩn Đinh', flag: '🇹🇼', note: 'Núi Đại Tiêm nhọn, ngọn hải đăng trắng' },
  { id: 'santorini', name: 'Santorini', flag: '🇬🇷', note: 'Vách đá nhà trắng mái vòm xanh' },
  { id: 'maldives', name: 'Maldives', flag: '🇲🇻', note: 'Nhà gỗ trên mặt nước xanh ngọc' },
  { id: 'borabora', name: 'Bora Bora', flag: '🇵🇫', note: 'Núi Otemanu giữa phá xanh' },
  { id: 'phuquoc', name: 'Phú Quốc', flag: '🇻🇳', note: 'Cầu Hôn hai nửa sắp chạm nhau, cáp treo vượt biển ra Hòn Thơm' },
  { id: 'whitehaven', name: 'Whitehaven', flag: '🇦🇺', note: 'Cát trắng tinh, dải cát xoáy giữa nước ngọc (Úc)' },
  { id: 'navagio', name: 'Vịnh Xác Tàu Navagio', flag: '🇬🇷', note: 'Vách đá trắng dựng đứng, xác tàu trên bãi cát' },
  { id: 'copacabana', name: 'Copacabana', flag: '🇧🇷', note: 'Núi Đường Phèn, cáp treo, vỉa hè sóng đen trắng (Rio)' },
  { id: 'waikiki', name: 'Waikiki', flag: '🇺🇸', note: 'Núi Diamond Head, dân lướt sóng (Hawaii)' },
  { id: 'seychelles', name: "Anse Source d'Argent", flag: '🇸🇨', note: 'Những tảng đá granite hồng khổng lồ (Seychelles)' },
  { id: 'boracay', name: 'Boracay', flag: '🇵🇭', note: 'Bãi Cát Trắng, thuyền buồm paraw sặc sỡ' },
];

export const LOUNGE = {
  horizon: 58,      // đường chân trời
  shore: 108,       // mép nước vỗ vào cát
  chairs: [{ x: 70 }, { x: 122 }],
  chairTop: 118,    // mép trên lưng ghế (ghế neo ở đáy cảnh, cao 26)
  table: { x: 96, y: 128 },
  swim: [{ x: 88, y: 84 }, { x: 106, y: 86 }],   // khoảng biển trống giữa hai tán dù
  bar: { x: 24, y: 120 },
};

/** Dây cáp treo ra Hòn Thơm (Phú Quốc) và lên núi Đường Phèn (Rio): độ cao theo x */
export const cableY = (x: number) => Math.round(LOUNGE.horizon - 30 + (x / 150) * 22 + Math.sin((x / 150) * Math.PI) * 6);
export const sugarY = (x: number) => Math.round(LOUNGE.horizon - 34 + ((x - 30) / 34) * 20 + Math.sin(((x - 30) / 34) * Math.PI) * 3);

function ell(p: Pen, cx: number, cy: number, rx: number, ry: number, c: string) {
  for (let y = Math.ceil(cy - ry); y <= Math.floor(cy + ry); y++) {
    const w = rx * Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2));
    if (w >= 0.5) p.rect(Math.round(cx - w), y, Math.round(w * 2), 1, c);
  }
}

/** Nền: trời, đảo xa, biển (đậm ngoài khơi → xanh ngọc gần bờ), bãi cát */
export function loungeBackground(phase: Phase, spot: SeaSpot = 'home') {
  return makeSprite(`lounge:v4:${phase}:${spot}`, 192, 144, p => {
    const { horizon, shore } = LOUNGE;
    const [top, low] = SKY[phase];
    for (let y = 0; y < horizon; y++) {
      const t = y / horizon, c = mix(top, low, t * t);
      p.rect(0, y, 192, 1, c);
      if (y % 6 === 3) for (let x = (y * 7) % 4; x < 192; x += 4) p.px(x, y, mix(c, low, 0.25));   // hòa sắc caro
    }
    const rand = seeded('lounge');
    if (phase === 'night') {
      for (let i = 0; i < 70; i++) p.px(Math.floor(rand() * 192), Math.floor(rand() * (horizon - 6)), rand() < 0.3 ? '#fff6c8' : '#c8d0ff');
    } else {
      // mây trôi xa
      for (const [cx, cy, w] of [[30, 16, 14], [118, 10, 18], [160, 26, 11], [72, 30, 9]]) {
        const cl = phase === 'sunset' ? '#ffc8b0' : phase === 'dawn' ? '#ffe0d8' : '#ffffff';
        ell(p, cx, cy, w, 3, mix(cl, low, 0.2)); ell(p, cx - w * 0.3, cy - 2, w * 0.5, 3, cl); ell(p, cx + w * 0.3, cy - 1, w * 0.45, 2.5, cl);
      }
    }
    // Biển: đậm ngoài khơi, nhạt dần, xanh ngọc ở chỗ nước nông (mỗi nơi một sắc nước)
    const tint = WATER[spot];
    const deep = mix(mix(SEA[phase], tint.deep, 0.35), '#0a2a5a', 0.25);
    const shallow = phase === 'night' ? mix(SEA[phase], '#4a7ab0', 0.4) : mix(SEA[phase], tint.shallow, 0.65);
    for (let y = horizon; y < shore; y++) {
      const t = (y - horizon) / (shore - horizon), c = mix(deep, shallow, t ** 1.6);
      p.rect(0, y, 192, 1, c);
      // gợn sóng xa: vệt sáng ngắn, càng gần càng dài
      if (y % 3 === 0) for (let i = 0; i < 6 + t * 6; i++) { const x = Math.floor(rand() * 192); p.rect(x, y, 2 + Math.round(t * 5), 1, mix(c, '#ffffff', 0.28)); }
    }
    p.rect(0, horizon, 192, 1, mix(deep, '#ffffff', 0.35));
    landmarks(p, spot, phase, rand);
    // Cát ướt + bãi cát
    const base = tint.sand;
    const sand = phase === 'night' ? mix(base, '#6a60a0', 0.5) : phase === 'sunset' ? mix(base, '#ffa070', 0.3) : base;
    p.rect(0, shore, 192, 4, mix(sand, '#8a5a30', 0.22));
    for (let y = shore + 4; y < 144; y++) p.rect(0, y, 192, 1, mix(sand, '#ffffff', Math.max(0, 0.18 - (y - shore) * 0.004)));
    for (let i = 0; i < 160; i++) p.px(Math.floor(rand() * 192), shore + 5 + Math.floor(rand() * 34), rand() < 0.5 ? mix(sand, '#a0602a', 0.2) : mix(sand, '#ffffff', 0.5));
    for (const [x, y] of [[150, 126], [40, 134], [176, 138]]) { p.rect(x, y, 3, 2, '#ffd6e0'); p.px(x + 1, y - 1, '#ffd6e0'); }   // vỏ sò
    p.px(60, 140, '#ff8a6a'); p.px(59, 141, '#ff8a6a'); p.px(61, 141, '#ff8a6a'); p.px(60, 141, '#ffb090');                   // sao biển
    if (spot === 'copacabana') for (let x = 0; x < 192; x++) for (let y = 138; y < 144; y++) p.px(x, y, (Math.round(y + Math.sin(x / 4) * 2.2) % 4 < 2) ? (phase === 'night' ? '#3a3448' : '#2a2a2a') : (phase === 'night' ? '#a8a4c0' : '#f4f0e8'));
    if (spot === 'jeju') for (const [x, y, r] of [[8, 112, 7], [182, 114, 9], [168, 110, 4]]) { ell(p, x, y, r, r * 0.55, '#3a3640'); ell(p, x - 1, y - 1, r * 0.6, r * 0.3, '#5a5660'); }   // đá bazan đen
  }, null);
}

const WATER: Record<SeaSpot, { deep: string; shallow: string; sand: string }> = {
  home: { deep: '#1a6ab0', shallow: '#7ee8e0', sand: '#f6dca0' },
  halong: { deep: '#1a6a6a', shallow: '#7ad0b0', sand: '#e8d8a8' },
  jeju: { deep: '#1a5ab0', shallow: '#7ad8e8', sand: '#f2e6c8' },
  kenting: { deep: '#1060b8', shallow: '#68e0e8', sand: '#f6e2b0' },
  santorini: { deep: '#0a3a9a', shallow: '#3a8ad8', sand: '#9a8a80' },
  maldives: { deep: '#1a8ac8', shallow: '#9af4ec', sand: '#fff8ec' },
  borabora: { deep: '#1478b8', shallow: '#8af0e0', sand: '#fff2d8' },
  phuquoc: { deep: '#1a6ab0', shallow: '#78dcd0', sand: '#fbe6bc' },
  whitehaven: { deep: '#1478c8', shallow: '#8cf4f0', sand: '#fdfcf6' },
  navagio: { deep: '#0a62b8', shallow: '#48e8f2', sand: '#f2ede2' },
  copacabana: { deep: '#14589a', shallow: '#6ac8d8', sand: '#f2d8a8' },
  waikiki: { deep: '#1462b0', shallow: '#6ad8e0', sand: '#f0d6a0' },
  seychelles: { deep: '#1a7ab8', shallow: '#a0f0e4', sand: '#fff6e6' },
  boracay: { deep: '#1a72c0', shallow: '#90ecec', sand: '#fffbf2' },
};

/** Nét đặc trưng của từng nơi trên đường chân trời (xa thì nhạt, đêm thì tối) */
function landmarks(p: Pen, spot: SeaSpot, phase: Phase, rand: () => number) {
  const H = LOUNGE.horizon, night = phase === 'night';
  const far = (c: string) => mix(c, SEA[phase], night ? 0.55 : 0.3);
  const shade = (c: string) => (night ? mix(c, '#1a1a3a', 0.55) : phase === 'sunset' ? mix(c, '#6a3a5a', 0.3) : c);
  /** Núi: rộng w (nửa bề ngang ở chân), cao h; round < 1 → sườn phồng, 1 → nhọn thẳng */
  const peak = (cx: number, base: number, w: number, h: number, c: string, round = 0.5) => {
    for (let y = 0; y < h; y++) { const t = y / h, half = w * Math.pow(t, round); p.rect(Math.round(cx - half), base - h + y, Math.max(1, Math.round(half * 2)), 1, c); }
  };
  const line = (x0: number, y0: number, x1: number, y1: number, c: string) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) p.px(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), c);
  };
  switch (spot) {
    case 'home': {
      const isl = mix(SEA[phase], '#1a2a3a', night ? 0.5 : 0.35);
      ell(p, 158, H, 20, 5, isl); ell(p, 150, H - 2, 9, 4, isl);
      for (const tx of [152, 160]) { p.rect(tx, H - 10, 1, 8, isl); for (const dx of [-3, -2, 2, 3]) p.px(tx + dx, H - 10 + Math.abs(dx) - 1, isl); p.rect(tx - 2, H - 11, 5, 1, isl); }
      break;
    }
    case 'halong': {
      // Núi đá vôi: xa thì nhỏ & nhạt, gần thì cao & đậm; thân thẳng, đỉnh tròn có cây
      const rocks: [number, number, number, number][] = [[96, H, 4, 8], [44, H, 5, 10], [128, H, 6, 12], [18, H, 7, 14], [176, H + 1, 7, 18], [66, H + 2, 9, 22], [150, H + 3, 11, 28]];
      rocks.forEach(([cx, base, w, h], i) => {
        const c0 = shade(i % 2 ? '#7a8a7a' : '#6a7a6a'), c = h < 13 ? far(c0) : c0;
        for (let y = 0; y < h; y++) { const t = y / h, half = w * (0.55 + 0.45 * Math.min(1, t * 2.2)); p.rect(Math.round(cx - half), base - h + y, Math.round(half * 2), 1, y < 3 ? shade('#6a9a5a') : c); }
        p.rect(cx - Math.round(w * 0.4), base - h + 4, 2, Math.round(h * 0.5), mix(c, '#3a4a3a', 0.3));
      });
      p.rect(104, H + 9, 12, 2, shade('#8a5a3c'));                                                       // thuyền buồm đỏ
      for (const x of [106, 111]) for (let y = 0; y < 7; y++) p.rect(x, H + 2 + y, y < 2 ? 3 : 4, 1, shade('#d8603a'));
      break;
    }
    case 'jeju': {
      ell(p, 40, H, 26, 3, far(shade('#5a7a6a'))); peak(40, H, 26, 9, far(shade('#6a8a7a')), 0.6);   // Hallasan xa mờ
      // Seongsan Ilchulbong: núi lửa đỉnh bằng, vành miệng núi lởm chởm
      const c = shade('#5a8a4a');
      for (let y = 0; y < 20; y++) { const half = 16 + y * 1.6; p.rect(Math.round(150 - half), H - 20 + y, Math.round(half * 2), 1, y < 2 ? shade('#7aa85a') : y % 5 === 4 ? mix(c, '#3a5a3a', 0.3) : c); }
      for (let x = 136; x < 166; x += 3) p.rect(x, H - 22 + (x % 2), 2, 2, shade('#6a7a5a'));
      for (let x = 60; x < 120; x += 2) if (rand() < 0.5) p.px(x, H + 1, shade('#f6d84a'));          // dải hoa cải vàng
      break;
    }
    case 'kenting': {
      // Núi Đại Tiêm nhọn bên trái; mũi đất có hải đăng trắng bên phải
      peak(70, H, 22, 10, far(shade('#5a8a5a')), 0.6); peak(46, H, 16, 26, shade('#4a7a4a'), 0.9);
      for (let y = 0; y < 10; y++) p.rect(140 + y, H - 10 + y, 52 - y, 1, shade('#5a8a4a'));
      p.rect(160, H - 24, 5, 14, shade('#fffaf0')); p.rect(159, H - 26, 7, 2, shade('#3a3a4a')); p.rect(161, H - 29, 3, 3, night ? '#fff6a8' : '#f6e08a');
      if (night) for (let i = 1; i < 30; i++) p.px(160 - i * 2, H - 28 + Math.round(i * 0.15), '#fff6c8');   // chùm đèn hải đăng
      break;
    }
    case 'santorini': {
      ell(p, 150, H, 30, 3, far(shade('#6a5a5a')));                                                      // đảo núi lửa giữa vịnh
      // Vách đá cao bên trái, nhà trắng mái vòm xanh xếp tầng, cối xay gió trên đỉnh
      for (let y = 0; y < 46; y++) { const w = Math.round(78 - y * 0.25 + Math.sin(y * 0.7) * 2); p.rect(0, H - 34 + y, w, 1, shade(y > 30 ? '#7a5a4a' : y % 4 ? '#9a6a5a' : '#8a5a4a')); }
      for (let i = 0; i < 26; i++) {
        const x = 4 + Math.floor(rand() * 64), y = H - 34 + Math.floor(rand() * 24);
        p.rect(x, y, 6, 4, shade('#fffaf0')); p.rect(x, y + 4, 6, 1, shade('#d8d0c4'));
        if (i % 4 === 0) { ell(p, x + 3, y - 1, 3, 2, shade('#2a5ad0')); p.px(x + 3, y - 3, shade('#fffaf0')); } else p.px(x + 2, y + 2, shade('#3a6ab0'));
      }
      p.rect(70, H - 44, 4, 10, shade('#fffaf0'));
      for (const [dx, dy] of [[-5, -5], [5, -5], [-5, 4], [5, 4]]) line(72, H - 44, 72 + dx, H - 44 + dy, shade('#c8a070'));
      break;
    }
    case 'maldives': {
      ell(p, 30, H, 22, 3, far(shade('#5a9a5a')));
      // Dãy nhà gỗ mái lá trên cọc giữa biển, cầu gỗ nối vào
      p.rect(96, H + 14, 96, 1, shade('#a8703f'));
      for (let i = 0; i < 6; i++) {
        const x = 100 + i * 15, y = H + 6 + (i % 2);
        p.rect(x, y + 4, 1, 6, shade('#8a5a3c')); p.rect(x + 9, y + 4, 1, 6, shade('#8a5a3c'));
        p.rect(x, y, 10, 5, shade('#e8c88a')); p.rect(x + 3, y + 1, 3, 3, night ? '#f6c64e' : '#7a5a3a');
        for (let r = 0; r < 4; r++) p.rect(x - 1 + r, y - 4 + r, 12 - r * 2, 1, shade('#c8a050'));
        p.rect(x - 2, y - 1, 14, 1, shade('#b08a3a'));
      }
      break;
    }
    case 'borabora': {
      // Núi Otemanu: khối đá dựng đứng đỉnh vuông giữa phá xanh; nhà trên mặt nước dưới chân
      peak(118, H, 40, 14, shade('#4a8a5a'), 0.5);
      const c = shade('#3a6a4a');
      for (let y = 0; y < 30; y++) { const half = 6 + Math.round(y * 0.35) + (y < 4 ? -1 : 0); p.rect(124 - half, H - 42 + y, half * 2, 1, y < 2 ? shade('#5a8a5a') : c); }
      peak(96, H, 16, 22, shade('#4a7a5a'), 0.8);
      for (let i = 0; i < 5; i++) { const x = 56 + i * 9; p.rect(x, H + 4, 7, 4, shade('#e8c88a')); for (let r = 0; r < 3; r++) p.rect(x - 1 + r, H + 1 + r, 9 - r * 2, 1, shade('#c8a050')); p.rect(x + 3, H + 8, 1, 3, shade('#8a5a3c')); }
      break;
    }
    case 'phuquoc': {
      // Hòn Thơm xa, cáp treo vượt biển (cabin chạy bằng CSS), Cầu Hôn: hai nửa vòm cầu vươn ra gần chạm nhau
      ell(p, 160, H, 22, 4, far(shade('#4a7a5a'))); peak(160, H, 18, 8, far(shade('#5a8a5a')), 0.6);
      ell(p, 120, H, 9, 2, far(shade('#5a8a5a')));
      for (let x = 0; x < 150; x++) p.px(x, cableY(x), shade('#5a5a6a'));
      for (const x of [40, 100]) { const y = cableY(x); p.rect(x - 1, y, 2, H - y + 2, shade('#9aa0b0')); p.rect(x - 2, y, 4, 1, shade('#6a7080')); }
      const deck = shade('#e8dcc8'), rail = shade('#c8a070'), pier = shade('#8a7a6a');
      for (const side of [0, 1]) {
        for (let i = 0; i <= 74; i++) {
          const x = side ? 172 - i : 20 + i, y = Math.round(H + 16 - Math.sin((i / 74) * (Math.PI / 2)) * 9);
          p.rect(x, y, 1, 2, deck); p.px(x, y - 2, rail);
          if (i % 12 === 0) p.rect(x, y + 2, 1, H + 20 - y, pier);
        }
      }
      if (night) for (let i = 0; i < 74; i += 6) for (const x of [20 + i, 172 - i]) p.px(x, Math.round(H + 14 - Math.sin((i / 74) * (Math.PI / 2)) * 9) - 1, '#fff1a8');
      break;
    }
    case 'whitehaven': {
      // Đồi rừng xanh hai bên, dải cát trắng xoáy uốn lượn giữa nước nông xanh ngọc
      peak(16, H, 34, 14, shade('#3a6a3a'), 0.55); peak(176, H, 38, 18, shade('#356a3a'), 0.5); peak(120, H, 20, 6, far(shade('#4a7a4a')), 0.6);
      const white = mix(WATER.whitehaven.shallow, '#ffffff', 0.7);
      for (let k = 0; k < 4; k++) {
        const y0 = H + 18 + k * 7;
        for (let x = 0; x < 192; x++) { const y = Math.round(y0 + Math.sin(x / (18 + k * 4) + k * 1.7) * (3 + k)); if ((x + k * 13) % 70 < 48) p.rect(x, y, 1, 2 + (k >> 1), shade(k % 2 ? white : mix(white, '#ffffff', 0.5))); }
      }
      break;
    }
    case 'navagio': {
      // Vách đá vôi trắng dựng đứng ôm vịnh hai bên, bụi cây trên đỉnh; xác tàu gỉ nằm trên cát ở mép nước
      const cliff = shade('#ece2d0'), cliffD = shade('#cbbca4');
      for (let y = 0; y < 72; y++) {
        const wl = Math.round(46 - y * 0.32 + Math.sin(y * 0.5) * 2), wr = Math.round(40 - y * 0.25 + Math.cos(y * 0.6) * 2);
        p.rect(0, H - 34 + y, wl, 1, y % 7 === 3 ? cliffD : cliff); p.rect(wl - 3, H - 34 + y, 3, 1, cliffD);
        p.rect(192 - wr, H - 30 + y, wr, 1, y % 6 === 2 ? cliffD : cliff); p.rect(192 - wr, H - 30 + y, 2, 1, cliffD);
      }
      for (let x = 0; x < 46; x += 2) p.rect(x, H - 36 + (x % 3), 2, 2, shade('#6a8a4a'));
      for (let x = 152; x < 192; x += 2) p.rect(x, H - 32 + (x % 3), 2, 2, shade('#6a8a4a'));
      const rust = shade('#a8603a'), rustD = shade('#7a4028');
      for (let i = 0; i < 9; i++) p.rect(110 + i, 106 - i, 40 - i * 2, 1, i < 2 ? rustD : rust);
      p.rect(116, 92, 10, 6, shade('#d8d0c4')); p.rect(117, 93, 2, 2, rustD); p.rect(121, 93, 2, 2, rustD);
      p.rect(130, 86, 2, 12, rustD); p.rect(138, 90, 1, 8, rustD);
      break;
    }
    case 'copacabana': {
      // Núi Đường Phèn (Pão de Açúcar) bên trái + núi Urca nhỏ, dây cáp treo; tượng Chúa trên núi Corcovado xa
      peak(160, H, 30, 26, far(shade('#4a6a5a')), 0.7);
      p.rect(160, H - 31, 1, 5, far(shade('#f2f0e8'))); p.rect(158, H - 30, 5, 1, far(shade('#f2f0e8')));
      const rock = shade('#5a6a5a'), rockL = shade('#7a8a6a');
      for (let y = 0; y < 34; y++) { const half = Math.round(4 + 10 * Math.sqrt(y / 34)); p.rect(30 - half, H - 34 + y, half * 2, 1, y < 3 ? rockL : rock); p.px(30 - half + 2, H - 34 + y, mix(rock, '#ffffff', 0.15)); }
      for (let y = 0; y < 14; y++) { const half = Math.round(5 + 9 * Math.sqrt(y / 14)); p.rect(64 - half, H - 14 + y, half * 2, 1, y < 2 ? rockL : rock); }
      for (let x = 30; x <= 64; x++) p.px(x, sugarY(x), shade('#3a3a4a'));
      for (let i = 0; i < 18; i++) { const x = 100 + i * 5, h = 4 + ((i * 7) % 6); p.rect(x, H - h + 1, 4, h, shade(i % 2 ? '#e8e0d0' : '#d0c8bc')); if (night) p.px(x + 1, H - h + 2, '#fff1a8'); }
      break;
    }
    case 'waikiki': {
      // Núi lửa Diamond Head: sườn dài răng cưa bên phải; khách sạn cao tầng dọc bờ; thuyền độc mộc
      const dh = shade('#7a7a5a'), dhD = shade('#5a5a44');
      for (let x = 100; x < 192; x++) { const t = (x - 100) / 92, h = Math.max(1, Math.round(6 + Math.sin(t * Math.PI * 0.9) * 18 + Math.sin(x * 0.9) * 1.5 - (t > 0.7 ? (t - 0.7) * 30 : 0))); p.rect(x, H - h, 1, h, (x % 5 === 0) ? dhD : dh); }
      for (let i = 0; i < 10; i++) { const x = 4 + i * 9, h = 8 + ((i * 5) % 9); p.rect(x, H - h + 2, 7, h, shade(i % 2 ? '#f0ece4' : '#d8e0e8')); for (let yy = H - h + 4; yy < H; yy += 3) p.rect(x + 1, yy, 5, 1, night ? '#ffe08a' : shade('#8aa8c8')); }
      p.rect(70, H + 12, 14, 2, shade('#8a5a3c')); p.rect(72, H + 9, 10, 1, shade('#c8a070')); p.rect(76, H + 9, 1, 3, shade('#c8a070'));
      break;
    }
    case 'seychelles': {
      // Tảng đá granite hồng xám khổng lồ, tròn trịa, có vệt xói dọc; dừa nghiêng ra biển
      const boulder = (cx: number, by: number, rx: number, ry: number) => {
        const c = shade('#b89a8a'), d = shade('#8a6a64'), l = shade('#d8bcae');
        ell(p, cx, by - ry, rx, ry, c); ell(p, cx - rx * 0.25, by - ry * 1.35, rx * 0.55, ry * 0.45, l);
        for (let x = Math.round(cx - rx + 3); x < cx + rx - 2; x += 4) for (let y = Math.round(by - ry * 0.9); y < by - 1; y++) if (((x * 7 + y) % 5) < 2 && ((x - cx) / rx) ** 2 + ((y - (by - ry)) / ry) ** 2 < 0.8) p.px(x, y, d);
        p.rect(Math.round(cx - rx + 2), by - 2, Math.round(rx * 2 - 4), 2, d);
      };
      boulder(18, 110, 22, 22); boulder(52, 108, 13, 11); boulder(176, 110, 20, 26); boulder(150, 106, 10, 8); boulder(98, H + 6, 6, 4);
      for (const [x0, y0, dir] of [[30, 66, 1], [168, 62, -1]] as const) {
        for (let i = 0; i < 26; i++) p.rect(x0 + Math.round(dir * i * i * 0.025), y0 + i, 2, 1, shade('#8a6a4a'));
        for (const [dx, dy] of [[-7, 2], [-5, -2], [0, -4], [5, -2], [7, 2]]) line(x0, y0, x0 + dx, y0 + dy + 2, shade('#3a8a3a'));
      }
      break;
    }
    case 'boracay': {
      // Núi Luho xa bên phải, Willy's Rock (mỏm đá có tượng trắng) giữa nước nông; thuyền paraw buồm sặc sỡ
      peak(170, H, 30, 12, far(shade('#4a7a4a')), 0.55);
      ell(p, 44, 92, 9, 6, shade('#5a5048')); ell(p, 42, 89, 5, 4, shade('#6a6058')); p.rect(43, 80, 2, 6, shade('#fffaf0')); p.rect(42, 79, 4, 1, shade('#fffaf0')); p.px(43, 77, shade('#5aa8e0'));
      for (const [x, y, c] of [[90, H + 8, '#e8604a'], [126, H + 4, '#f6c64e'], [150, H + 12, '#5aa8e0']] as const) {
        p.rect(x - 6, y + 7, 14, 2, shade('#fffaf0')); p.rect(x - 9, y + 9, 20, 1, shade('#8a5a3c'));
        for (let k = 0; k < 7; k++) p.rect(x - Math.round(k * 0.7), y + k, Math.round(k * 0.7) + 4, 1, shade(c));
        p.rect(x + 1, y - 1, 1, 9, shade('#8a5a3c'));
      }
      break;
    }
  }
}


/** Lưng ghế dài nhìn từ phía sau (vải sọc), chân gỗ */
export const loungerBackSprite = (color: string) => makeSprite(`lounger-back:${color}`, 30, 26, p => {
  for (let y = 0; y < 20; y++) {
    const inset = Math.round((20 - y) * 0.18);
    for (let x = inset; x < 30 - inset; x++) p.px(x, y, Math.floor((x - inset) / 4) % 2 ? '#fffaf0' : color);
  }
  p.rect(0, 19, 30, 2, '#b07a4a'); p.rect(0, 20, 30, 1, '#8a5a3c');
  p.rect(2, 21, 2, 5, '#8a5a3c'); p.rect(26, 21, 2, 5, '#8a5a3c');
});

/** Dù che nắng nhìn từ dưới lên/sau lưng: tán sọc + cột */
export const parasolSprite = (color: string) => makeSprite(`parasol:${color}`, 46, 52, p => {
  p.rect(22, 10, 2, 42, '#e8e0d4'); p.rect(23, 10, 1, 42, '#c8bcae');
  for (let y = 0; y < 12; y++) {
    const w = Math.round(6 + y * 1.45);
    for (let x = 23 - w; x < 23 + w; x++) p.px(x, y, Math.floor((x - (23 - w)) / Math.max(3, w / 3)) % 2 ? '#fffaf0' : color);
  }
  for (let x = 2; x < 44; x += 6) { p.rect(x, 12, 4, 1, color); p.px(x + 1, 13, color); }
  p.px(23, 0, '#8a5a3c');
});

/** Bàn nhỏ giữa hai ghế */
export const sideTableSprite = () => makeSprite('lounge-table', 18, 12, p => {
  ell(p, 9, 3, 8, 2.5, '#d8a868'); ell(p, 9, 2.5, 7, 1.8, '#e8c088');
  p.rect(8, 5, 2, 7, '#a8703f'); p.rect(5, 11, 8, 1, '#8a5a3c');
});

/** Quầy bar dừa mái lá */
export const beachBarSprite = () => makeSprite('beach-bar:v1', 44, 46, p => {
  for (let y = 0; y < 13; y++) { const w = 8 + y * 1.4; p.rect(22 - w, y, w * 2, 1, y % 3 === 2 ? '#b08a3a' : y % 2 ? '#d8b05a' : '#e8c46a'); }
  for (let x = 2; x < 42; x += 3) p.rect(x, 13, 1, 2 + (x % 2), '#b08a3a');                     // tua lá
  p.rect(5, 14, 2, 20, '#8a5a3c'); p.rect(37, 14, 2, 20, '#8a5a3c');
  p.rect(3, 30, 38, 16, '#b07a4a'); p.rect(3, 30, 38, 2, '#e8c088'); for (let x = 5; x < 40; x += 5) p.rect(x, 33, 1, 13, '#8a5a3c');
  // dừa, ly, bảng
  ell(p, 12, 27, 3, 3, '#7a9a3a'); p.px(11, 26, '#a8c85a'); p.rect(12, 22, 1, 3, '#ffffff');
  p.rect(20, 25, 4, 5, '#f59ab3'); p.rect(20, 25, 4, 1, '#ffffff'); p.px(23, 23, '#f6c64e');
  p.rect(28, 24, 6, 6, '#f6c64e'); p.rect(29, 25, 4, 4, '#f7894a');
  p.rect(12, 16, 20, 5, '#fffaf0'); p.rect(14, 18, 16, 1, '#e8604a');
});

/** Thuyền buồm nhỏ ngoài khơi */
export const sailboatSprite = () => makeSprite('sailboat', 14, 13, p => {
  for (let y = 0; y < 8; y++) p.rect(7 - Math.round(y * 0.6), y, Math.round(y * 0.6) + 1, 1, '#fffaf0');
  for (let y = 2; y < 8; y++) p.rect(8, y, Math.round((y - 2) * 0.5) + 1, 1, '#f59ab3');
  p.rect(7, 0, 1, 9, '#8a5a3c'); p.rect(2, 9, 11, 2, '#c8564a'); p.rect(3, 11, 9, 1, '#a8423a');
});

/** Vị trí mặt trời / mặt trăng theo giờ thật (null nếu đang dưới chân trời) */
export function celestial(hour: number, minute: number): { kind: 'sun' | 'moon'; x: number; y: number } | null {
  const h = hour + minute / 60;
  const arc = (t: number) => ({ x: 20 + t * 152, y: LOUNGE.horizon - 6 - Math.sin(Math.PI * t) * 44 });
  if (h >= 5.5 && h <= 18.7) return { kind: 'sun', ...arc((h - 5.5) / 13.2) };
  const n = h >= 18.7 ? h - 18.7 : h + 24 - 18.7;               // 0..10.8 giờ đêm
  return { kind: 'moon', ...arc(n / 10.8) };
}

/** Dù + ghế dài trên bãi biển (nhìn chéo từ trên): ghế quay ra biển, khăn sọc, tán dù tròn che phía trên */
export const beachSetSprite = (i: number) => {
  const col = ['#f08aa6', '#5aa8e0', '#f6c64e'][i % 3];
  return makeSprite(`beach-set:${col}`, 34, 42, p => {
    // ghế: lưng ghế (trên) + mặt nằm (dưới), chân gỗ
    p.rect(10, 22, 14, 6, '#c8905a'); p.rect(11, 23, 12, 4, '#fffaf0');
    for (let x = 11; x < 23; x += 4) p.rect(x, 23, 2, 4, col);
    p.rect(9, 28, 16, 11, '#b07a4a'); p.rect(10, 29, 14, 9, '#fffaf0');
    for (let x = 10; x < 24; x += 4) p.rect(x, 29, 2, 9, col);
    p.rect(10, 39, 2, 3, '#8a5a3c'); p.rect(22, 39, 2, 3, '#8a5a3c');
    // khăn tắm gấp + kính râm trên ghế
    p.rect(12, 34, 10, 3, mix(col, '#ffffff', 0.4)); p.rect(15, 30, 2, 1, '#2a2438'); p.rect(18, 30, 2, 1, '#2a2438'); p.px(17, 30, '#2a2438');
    // cột dù + tán tròn sọc
    p.rect(27, 8, 1, 30, '#e8e0d4');
    ell(p, 27, 9, 14, 7, col);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; for (let r = 1; r < 13; r++) p.px(Math.round(27 + Math.cos(a) * r), Math.round(9 + Math.sin(a) * r * 0.5), '#fffaf0'); }
    p.px(27, 9, '#8a5a3c');
  });
};

/** Hải âu (2 khung: cánh lên/xuống) */
export const gullSprite = (f: number) => makeSprite(`gull:${f}`, 9, 4, p => {
  if (f) { p.rect(0, 2, 3, 1, '#ffffff'); p.rect(3, 1, 3, 1, '#ffffff'); p.rect(6, 2, 3, 1, '#ffffff'); p.px(4, 2, '#f6c64e'); }
  else { p.rect(0, 0, 2, 1, '#ffffff'); p.rect(2, 1, 2, 1, '#ffffff'); p.rect(5, 1, 2, 1, '#ffffff'); p.rect(7, 0, 2, 1, '#ffffff'); p.rect(4, 2, 1, 1, '#e8e8f0'); }
}, '#5a6070');
/** Cá heo đang nhảy (đầu bên phải) */
export const dolphinSprite = () => makeSprite('dolphin', 16, 8, p => {
  for (let x = 0; x < 13; x++) { const h = Math.round(Math.sin((x / 13) * Math.PI) * 3) + 1; p.rect(x + 1, 4 - h, 1, h * 2, x > 9 ? '#8aa0b8' : '#6a8aa8'); p.px(x + 1, 4 + h - 1, '#c8d8e8'); }
  p.rect(13, 3, 3, 2, '#6a8aa8'); p.px(15, 4, '#c8d8e8'); p.px(11, 2, '#2a2438');
  p.rect(6, 0, 2, 2, '#5a7a98'); p.rect(0, 2, 2, 1, '#5a7a98'); p.rect(0, 5, 2, 1, '#5a7a98');
}, '#3a4a68');
/** Cua đỏ bò ngang (2 khung chân) */
export const crabSprite = (f: number) => makeSprite(`crab:${f}`, 9, 6, p => {
  p.rect(2, 2, 5, 3, '#e8604a'); p.rect(3, 1, 3, 1, '#ff8a6a'); p.px(3, 0, '#2a2438'); p.px(5, 0, '#2a2438');
  p.rect(0, 1, 2, 2, '#e8604a'); p.rect(7, 1, 2, 2, '#e8604a');
  for (const x of [2, 4, 6]) p.px(x + (f ? 1 : 0) - 1, 5, '#c8483a');
}, '#7a2a24');
/** Người lướt sóng trên ván */
export const surferSprite = () => makeSprite('surfer', 10, 10, p => {
  p.rect(0, 8, 10, 2, '#f6c64e'); p.rect(1, 8, 8, 1, '#ffe08a');
  p.rect(4, 1, 2, 2, '#e8b890'); p.rect(4, 3, 2, 3, '#e8604a'); p.rect(3, 6, 1, 2, '#3a5a9a'); p.rect(6, 6, 1, 2, '#3a5a9a');
  p.rect(2, 3, 2, 1, '#e8b890'); p.rect(6, 4, 2, 1, '#e8b890');
});
/** Cabin cáp treo nhỏ */
export const cableCarSprite = (c = '#e8604a') => makeSprite(`cablecar:${c}`, 5, 6, p => {
  p.rect(2, 0, 1, 2, '#3a3a4a'); p.rect(0, 2, 5, 4, c); p.rect(1, 3, 3, 1, '#e8f6ff');
}, null);
