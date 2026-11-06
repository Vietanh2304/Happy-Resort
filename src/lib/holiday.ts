// Đồ trang trí ngày lễ theo mùa (Tết, Valentine, Trung thu, Halloween, Giáng sinh): vẽ pixel tay,
// chỉ bán trong khoảng thời gian quanh ngày lễ ở cửa hàng Mèo.
import { isoSprite, shade, type IsoPen } from './iso';
import { makeSprite, mix } from './pixel';
import { seeded } from './rng';
import type { Art } from './furniture';

export type HolidaySeason = 'tet' | 'valentine' | 'trungthu' | 'halloween' | 'xmas';
/** Mùa bán: [tháng, ngày] bắt đầu → kết thúc (có thể vắt qua năm mới) */
export const HOLIDAY_SEASONS: { id: HolidaySeason; name: string; from: [number, number]; to: [number, number] }[] = [
  { id: 'tet', name: '🧧 Tết Nguyên Đán', from: [1, 5], to: [2, 28] },
  { id: 'valentine', name: '💝 Valentine', from: [2, 1], to: [2, 20] },
  { id: 'trungthu', name: '🏮 Trung thu', from: [8, 20], to: [10, 10] },
  { id: 'halloween', name: '🎃 Halloween', from: [10, 10], to: [11, 2] },
  { id: 'xmas', name: '🎄 Giáng sinh', from: [11, 1], to: [1, 10] },
];
export function seasonOpen(id: HolidaySeason, month: number, day: number) {
  const s = HOLIDAY_SEASONS.find(x => x.id === id)!;
  const v = month * 100 + day, a = s.from[0] * 100 + s.from[1], b = s.to[0] * 100 + s.to[1];
  return a <= b ? v >= a && v <= b : v >= a || v <= b;
}

const RED = '#d8343c', GOLD = '#f6c64e';

function blossomTree(q: IsoPen, key: string, petal: string, petal2: string) {
  q.box(0.28, 0.28, 0, 0.44, 0.44, 7, shade('#b8483a'));
  q.flat(0.3, 0.3, 7, 0.4, 0.4, '#6a4a3a');
  const [x, y] = q.pt(0.5, 0.5, 7);
  const br = '#7a4a2e';
  for (const [dx, dy] of [[0, -14], [-6, -20], [5, -22], [-2, -26], [7, -14]]) {
    const n = Math.max(Math.abs(dx), Math.abs(dy));
    for (let i = 0; i <= n; i++) q.px(x + Math.round((dx * i) / n), y + Math.round((dy * i) / n), br);
  }
  const r = seeded(key);
  for (let i = 0; i < 46; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r());
    const px = x + Math.round(Math.cos(a) * d * 10), py = y - 18 + Math.round(Math.sin(a) * d * 8);
    q.px(px, py, i % 3 ? petal : petal2);
    if (i % 4 === 0) q.px(px + 1, py, petal);
  }
}

const hoaMai = () => isoSprite('hol:mai', 1, 1, 34, q => blossomTree(q, 'mai', GOLD, '#ffe9a0'));
const hoaDao = () => isoSprite('hol:dao', 1, 1, 34, q => blossomTree(q, 'dao', '#f59ab3', '#ffd0dc'));

const banhChung = () => isoSprite('hol:banhchung', 1, 1, 14, q => {
  q.box(0.22, 0.22, 0, 0.56, 0.56, 6, shade('#4f9a48'));
  q.flat(0.22, 0.48, 6, 0.56, 0.06, '#efe0a8');
  q.flat(0.48, 0.22, 6, 0.06, 0.56, '#efe0a8');
  const [x, y] = q.pt(0.5, 0.5, 6); q.px(x, y - 1, RED); q.px(x + 1, y - 1, RED);
});

const denCaChep = () => isoSprite('hol:cachep', 1, 1, 30, q => {
  const [x, y] = q.pt(0.5, 0.5, 0);
  q.rect(x, y - 26, 1, 26, '#8a5a3c');
  q.ellipse(x + 1, y - 18, 7, 4.5, '#f2763a');
  q.ellipse(x + 1, y - 19, 5, 2.5, '#ffb070');
  for (const sx of [-2, 1, 4]) q.px(x + sx, y - 17, '#d8503a');
  q.map(['RR.', 'RRR', 'RR.'], { R: '#d8503a' }, x + 7, y - 20);
  q.px(x - 4, y - 19, '#3b2d3f'); q.px(x - 3, y - 15, GOLD);
  q.rect(x - 1, y - 13, 1, 3, GOLD);
}, '#5a2a1e');

const banhTrungThu = () => isoSprite('hol:banhtt', 1, 1, 14, q => {
  q.flat(0.1, 0.1, 1, 0.8, 0.8, '#f4f0ec');
  q.box(0.15, 0.15, 0, 0.7, 0.7, 1, shade('#e0d8d4'));
  for (const [g, d] of [[0.3, 0.35], [0.6, 0.35], [0.45, 0.62]]) {
    const [x, y] = q.pt(g, d, 2);
    q.ellipse(x, y - 2, 3.4, 2.4, '#c8873a'); q.ellipse(x, y - 3, 2.6, 1.6, '#e0a858'); q.px(x, y - 3, '#a8662a');
  }
});

const thoNgoc = () => isoSprite('hol:tho', 1, 1, 22, q => {
  const [x, y] = q.pt(0.5, 0.5, 0);
  q.ellipse(x, y - 5, 5, 4, '#ffffff'); q.ellipse(x - 1, y - 11, 3.6, 3.2, '#ffffff');
  q.rect(x - 3, y - 19, 2, 6, '#ffffff'); q.rect(x, y - 19, 2, 6, '#ffffff');
  q.rect(x - 3, y - 18, 1, 4, '#f7b8cc'); q.rect(x, y - 18, 1, 4, '#f7b8cc');
  q.px(x - 2, y - 11, '#d8343c'); q.px(x + 1, y - 11, '#d8343c'); q.px(x - 1, y - 9, '#f7a1a8');
  q.ellipse(x + 5, y - 4, 1.6, 1.6, '#ffffff');
}, '#8a7a8a');

const thongNoel = () => isoSprite('hol:thong', 1, 1, 44, q => {
  q.box(0.3, 0.3, 0, 0.4, 0.4, 6, shade(RED));
  const [x, y] = q.pt(0.5, 0.5, 6);
  q.rect(x - 1, y - 3, 3, 3, '#7a4a2e');
  const tiers = [[0, 11], [-8, 9], [-15, 7], [-21, 4.5]];
  for (const [dy, w] of tiers) for (let i = 0; i < 9; i++) { const ww = Math.round((w * (i + 1)) / 9); q.rect(x - ww, y - 3 + dy - 9 + i, ww * 2 + 1, 1, i % 3 === 2 ? '#3f8a4a' : '#4fa85a'); }
  const r = seeded('noel');
  const balls = ['#d8343c', GOLD, '#8db8ef', '#f59ab3'];
  for (let i = 0; i < 12; i++) { const yy = y - 5 - Math.floor(r() * 26), w = Math.max(1, 10 - Math.floor((y - 5 - yy) / 3.2)); q.px(x - w + 1 + Math.floor(r() * (w * 2 - 1)), yy, balls[i % 4]); }
  q.map(['..Y..', 'YYYYY', '.YYY.', 'Y...Y'], { Y: GOLD }, x - 2, y - 39);
}, '#24502a');

const nguoiTuyet = () => isoSprite('hol:snowman', 1, 1, 30, q => {
  const [x, y] = q.pt(0.5, 0.5, 0);
  q.ellipse(x, y - 5, 6, 5, '#ffffff'); q.ellipse(x, y - 14, 4.5, 4, '#ffffff');
  q.rect(x - 3, y - 20, 7, 1, '#3a3a4a'); q.rect(x - 2, y - 25, 5, 5, '#3a3a4a'); q.rect(x - 2, y - 21, 5, 1, RED);
  q.px(x - 2, y - 15, '#3b2d3f'); q.px(x + 1, y - 15, '#3b2d3f'); q.rect(x, y - 13, 3, 1, '#f2863a');
  q.rect(x - 4, y - 10, 9, 2, RED); q.rect(x + 2, y - 9, 2, 4, RED);
  for (const yy of [-6, -3]) q.px(x, y + yy, '#3b2d3f');
}, '#7a8aa8');

const hopQua = () => isoSprite('hol:gift', 1, 1, 22, q => {
  q.box(0.15, 0.2, 0, 0.6, 0.6, 9, shade('#e8505b'));
  q.box(0.3, 0.3, 9, 0.4, 0.4, 7, shade('#8db8ef'));
  q.flat(0.42, 0.2, 9, 0.12, 0.6, GOLD); q.flat(0.15, 0.45, 9, 0.6, 0.12, GOLD);
  const [x, y] = q.pt(0.5, 0.5, 16); q.map(['W.W', '.W.'], { W: '#ffffff' }, x - 1, y - 2);
});

const biNgo = () => isoSprite('hol:pumpkin', 1, 1, 18, q => {
  const [x, y] = q.pt(0.5, 0.5, 0);
  q.ellipse(x, y - 6, 7, 5.5, '#f2863a');
  for (const dx of [-3, 0, 3]) q.rect(x + dx, y - 11, 1, 10, '#d86a2a');
  q.rect(x, y - 13, 2, 3, '#5a8a3a');
  q.map(['Y...Y', '.....', 'YYYYY', '.Y.Y.'], { Y: '#ffe07a' }, x - 2, y - 9);
}, '#6a3a1a');

const boHoaHong = () => isoSprite('hol:roses', 1, 1, 26, q => {
  q.box(0.35, 0.35, 0, 0.3, 0.3, 8, shade('#bfe6f4'));
  const [x, y] = q.pt(0.5, 0.5, 8);
  for (const [dx, dy] of [[-3, -6], [2, -8], [-1, -11], [4, -4], [-5, -3]]) {
    q.rect(x + Math.round(dx / 2), y - 2 + Math.round(dy / 2), 1, Math.abs(Math.round(dy / 2)) + 2, '#5a9a4a');
    q.ellipse(x + dx, y + dy, 2.2, 2, '#e8405a'); q.px(x + dx, y + dy, '#ff8aa0');
  }
});

const bongBayTim = () => isoSprite('hol:balloons', 1, 1, 36, q => {
  const [x, y] = q.pt(0.5, 0.5, 0);
  q.rect(x - 1, y - 3, 3, 3, '#c0c0d0');
  const heart = ['.RR.RR.', 'RWRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'];
  for (const [dx, dy, c] of [[-7, -30, '#f06283'], [1, -33, '#f59ab3'], [-2, -24, '#e8405a']] as [number, number, string][]) {
    q.map(heart, { R: c, W: '#ffffff' }, x + dx, y + dy);
    const n = Math.abs(dy) - 4;
    for (let i = 0; i < n; i++) q.px(x + Math.round(((dx + 3) * (n - i)) / n), y - 3 - i, '#8a7a8a');
  }
});

// ───────── Đồ treo tường ─────────
const cauDoi = () => makeSprite('wall:caudoi', 22, 20, p => {
  p.rect(4, 0, 14, 4, RED); for (let x = 6; x < 17; x += 3) p.rect(x, 1, 2, 2, GOLD);
  for (const x0 of [0, 18]) { p.rect(x0, 5, 4, 15, RED); for (let yy = 6; yy < 19; yy += 3) p.rect(x0 + 1, yy, 2, 2, GOLD); }
}, '#7a1a1a');
const lixi = () => makeSprite('wall:lixi', 22, 12, p => {
  for (let x = 0; x < 22; x++) p.px(x, Math.round(Math.abs(x - 11) / 5), '#c0392b');
  [2, 9, 16].forEach((x0, i) => { const y0 = 2 + (i === 1 ? 1 : 0); p.rect(x0, y0, 5, 8, RED); p.rect(x0, y0, 5, 2, mix(RED, '#000000', 0.15)); p.rect(x0 + 2, y0 + 4, 1, 2, GOLD); p.px(x0 + 1, y0 + 5, GOLD); p.px(x0 + 3, y0 + 5, GOLD); });
}, null);
const phao = () => makeSprite('wall:phao', 10, 22, p => {
  p.rect(4, 0, 2, 22, GOLD);
  for (let yy = 2; yy < 21; yy += 3) { p.rect(0, yy, 4, 2, RED); p.rect(6, yy + 1, 4, 2, RED); p.px(0, yy, GOLD); p.px(9, yy + 1, GOLD); }
}, '#7a1a1a');
const denOngSao = () => makeSprite('wall:ongsao', 15, 20, p => {
  p.map([
    '.......Y.......', '......YRY......', '.....YRRRY.....', 'YYYYYRRRRRYYYYY', '.YRRRRRRRRRRRY.', '..YRRRRRRRRRY..', '...YRRRRRRRY...',
    '...YRRRYRRRRY..', '..YRRRY.YRRRY..', '.YRRY.....YRRY.', 'YRY.........YRY',
  ], { Y: GOLD, R: RED }, 0, 0);
  for (const x of [3, 7, 11]) p.rect(x, 11, 1, 8, ['#f59ab3', GOLD, '#8db8ef'][x % 3]);
}, '#7a1a1a');
const vongNguyetQue = () => makeSprite('wall:wreath', 14, 15, p => {
  for (let a = 0; a < 40; a++) { const t = (a / 40) * Math.PI * 2; const x = 7 + Math.round(Math.cos(t) * 5.5), y = 7 + Math.round(Math.sin(t) * 5.5); p.rect(x - 1, y - 1, 2, 2, a % 4 ? '#3f8a4a' : '#5aa85a'); }
  for (const [x, y] of [[3, 4], [11, 5], [9, 11], [2, 9]]) p.px(x, y, RED);
  p.map(['RR.RR', '.RRR.', 'R.R.R'], { R: RED }, 5, 11);
}, '#24502a');
const tatNoel = () => makeSprite('wall:stocking', 20, 14, p => {
  for (let x = 0; x < 20; x++) p.px(x, 0, '#8a5a3c');
  for (const [x0, c] of [[2, RED], [11, '#4fa85a']] as [number, string][]) {
    p.rect(x0, 1, 5, 3, '#ffffff'); p.rect(x0, 4, 5, 6, c); p.rect(x0, 9, 8, 4, c); p.px(x0 + 7, 9, '#ffffff'); p.rect(x0 + 1, 6, 1, 1, GOLD);
  }
}, '#5a2a1e');

export const HOLIDAY_ART: Record<string, Art> = {
  hoa_mai: { place: 'any', sprite: hoaMai },
  hoa_dao: { place: 'any', sprite: hoaDao },
  banh_chung: { place: 'any', sprite: banhChung },
  cau_doi: { place: 'wall', sprite: cauDoi },
  lixi_treo: { place: 'wall', sprite: lixi },
  phao_tet: { place: 'wall', sprite: phao },
  bo_hoa_hong: { place: 'any', sprite: boHoaHong },
  bong_bay_tim: { place: 'any', sprite: bongBayTim },
  den_ong_sao: { place: 'wall', sprite: denOngSao, glow: true },
  den_ca_chep: { place: 'any', sprite: denCaChep, glow: true },
  banh_trung_thu: { place: 'any', sprite: banhTrungThu },
  tho_ngoc: { place: 'any', sprite: thoNgoc },
  bi_ngo: { place: 'any', sprite: biNgo, glow: true },
  cay_thong_noel: { place: 'any', sprite: thongNoel, glow: true },
  nguoi_tuyet: { place: 'any', sprite: nguoiTuyet },
  hop_qua_noel: { place: 'any', sprite: hopQua },
  vong_nguyet_que: { place: 'wall', sprite: vongNguyetQue },
  tat_noel: { place: 'wall', sprite: tatNoel },
};

/** Món → mùa bán, giá */
export const HOLIDAY_SHOP: { id: string; season: HolidaySeason; price: number; name: string; icon: string }[] = [
  { id: 'hoa_mai', season: 'tet', price: 90, name: 'Chậu mai vàng', icon: '🌼' },
  { id: 'hoa_dao', season: 'tet', price: 90, name: 'Chậu đào hồng', icon: '🌸' },
  { id: 'banh_chung', season: 'tet', price: 40, name: 'Bánh chưng', icon: '🟩' },
  { id: 'cau_doi', season: 'tet', price: 60, name: 'Câu đối đỏ', icon: '🧧' },
  { id: 'lixi_treo', season: 'tet', price: 45, name: 'Dây lì xì', icon: '🧧' },
  { id: 'phao_tet', season: 'tet', price: 45, name: 'Dây pháo Tết', icon: '🧨' },
  { id: 'bo_hoa_hong', season: 'valentine', price: 60, name: 'Bình hoa hồng', icon: '🌹' },
  { id: 'bong_bay_tim', season: 'valentine', price: 50, name: 'Bóng bay trái tim', icon: '🎈' },
  { id: 'den_ong_sao', season: 'trungthu', price: 55, name: 'Đèn ông sao', icon: '⭐' },
  { id: 'den_ca_chep', season: 'trungthu', price: 65, name: 'Đèn cá chép', icon: '🏮' },
  { id: 'banh_trung_thu', season: 'trungthu', price: 45, name: 'Đĩa bánh trung thu', icon: '🥮' },
  { id: 'tho_ngoc', season: 'trungthu', price: 60, name: 'Thỏ ngọc', icon: '🐇' },
  { id: 'bi_ngo', season: 'halloween', price: 50, name: 'Đèn bí ngô', icon: '🎃' },
  { id: 'cay_thong_noel', season: 'xmas', price: 110, name: 'Cây thông Noel', icon: '🎄' },
  { id: 'nguoi_tuyet', season: 'xmas', price: 70, name: 'Người tuyết', icon: '⛄' },
  { id: 'hop_qua_noel', season: 'xmas', price: 45, name: 'Chồng quà Noel', icon: '🎁' },
  { id: 'vong_nguyet_que', season: 'xmas', price: 50, name: 'Vòng nguyệt quế', icon: '🎀' },
  { id: 'tat_noel', season: 'xmas', price: 40, name: 'Tất Noel', icon: '🧦' },
];
