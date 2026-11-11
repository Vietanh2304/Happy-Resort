// Đồ lưu niệm du lịch (đặt trang trí trong nhà), ổ khoá tình yêu, trụ đóng dấu, ô che đôi — vẽ pixel tay.
import { ellipse } from './iso';
import { makeSprite, mix, type Pen } from './pixel';
import type { Art } from './furniture';
import type { TripId } from './trips';
import { balloonDecoSprite, castleModelSprite, musicBoxSprite } from './fairyArt';

const WOOD = '#a8703f', WOOD_D = '#7a4e2c', GOLD = '#f6c64e', RED = '#d8343c', CREAM = '#fbefdc';
const frame = (p: Pen, w: number, h: number, c = WOOD) => { p.rect(0, 0, w, h, c); p.rect(1, 1, w - 2, h - 2, mix(c, '#000000', 0.25)); };

// ── Đài Trung
const skyLantern = () => makeSprite('tv:skylantern', 14, 20, p => {
  for (let y = 2; y < 17; y++) { const w = Math.round(6.4 - (y - 2) * 0.17); p.rect(7 - w, y, w * 2, 1, y % 5 === 0 ? '#e8443a' : '#f6c445'); }
  p.rect(3, 4, 1, 8, '#fff2b0'); p.rect(4, 7, 6, 4, '#e8443a'); p.px(6, 9, CREAM); p.px(7, 10, CREAM);
  p.rect(5, 17, 4, 2, '#ffb84a'); p.px(6, 19, '#ff7a2a'); p.px(7, 19, '#ffd84a'); p.rect(1, 1, 12, 1, '#f8d878');
}, '#7a3a2a');
const rainbowArt = () => makeSprite('tv:rainbowart', 22, 16, p => {
  frame(p, 22, 16, '#f6f0e0');
  const C = ['#e8443a', '#f6a43a', '#f6d84a', '#5ac85a', '#4a9ae8', '#9a6ae0'];
  C.forEach((c, i) => p.rect(2, 2 + i * 2, 18, 2, c));
  ellipse(p, 7, 8, 3, 3, '#fde3d0'); p.px(6, 7, '#2a2a3a'); p.px(8, 7, '#2a2a3a'); p.rect(6, 9, 3, 1, RED);
  ellipse(p, 15, 9, 2, 2, '#ffffff'); p.px(14, 8, '#2a2a3a'); p.px(16, 8, '#2a2a3a');
}, '#5a3a2a');
// ── Gwangju
const mapleFrame = () => makeSprite('tv:maple', 18, 18, p => {
  frame(p, 18, 18, '#c98b4b'); p.rect(2, 2, 14, 14, '#fbefdc');
  const leaf = ['..R..', 'R.R.R', '.RRR.', 'RRRRR', '.RRR.', '..W..'];
  p.map(leaf, { R: '#e8543a', W: WOOD_D }, 4, 4); p.map(leaf, { R: '#f6a43a', W: WOOD_D }, 9, 7);
}, '#5a3a2a');
const hanbokDoll = () => makeSprite('tv:hanbok', 12, 20, p => {
  ellipse(p, 6, 4, 3, 3, '#fde3d0'); p.rect(3, 1, 6, 2, '#2a2430'); p.rect(5, 0, 2, 1, '#2a2430'); p.px(5, 4, '#2a2a3a'); p.px(7, 4, '#2a2a3a');
  p.rect(4, 7, 4, 3, '#f6c8d4'); p.rect(5, 7, 2, 1, '#ffffff'); p.px(6, 8, RED);
  for (let y = 10; y < 19; y++) { const w = 2 + Math.round((y - 10) * 0.45); p.rect(6 - w, y, w * 2, 1, y % 3 ? '#e8443a' : '#d0303a'); }
  p.rect(1, 19, 10, 1, WOOD);
}, '#4a2a30');
// ── Hội An
const hoianLanterns = () => makeSprite('tv:hoianlant', 24, 16, p => {
  for (let x = 0; x < 24; x++) p.px(x, 0, WOOD_D);
  const C = ['#e8443a', '#f6c445', '#3aa86a', '#e8743a'];
  C.forEach((c, i) => {
    const cx = 3 + i * 6, top = 2 + (i % 2) * 2;
    p.rect(cx, 1, 1, top - 1, WOOD_D);
    for (let y = 0; y < 8; y++) { const w = Math.round(Math.sin((y + 0.5) / 8 * Math.PI) * 2.6); p.rect(cx - w, top + 1 + y, w * 2 + 1, 1, y % 3 ? c : mix(c, '#ffffff', 0.3)); }
    p.rect(cx - 1, top, 3, 1, GOLD); p.rect(cx - 1, top + 9, 3, 1, GOLD); p.px(cx, top + 10, RED); p.px(cx, top + 11, RED);
  });
}, '#4a2a20');
const basketBoat = () => makeSprite('tv:basket', 18, 12, p => {
  ellipse(p, 9, 7, 8, 4, '#8a6a3a'); ellipse(p, 9, 6, 7, 3, '#5a4022');
  for (let x = 2; x < 17; x += 2) p.px(x, 8, '#b08a50');
  p.rect(4, 10, 10, 1, '#4a9ae0'); p.rect(2, 11, 14, 1, '#7ac8f8');
  p.rect(13, 0, 1, 7, WOOD); ellipse(p, 9, 3, 2, 1, '#e8c070'); p.rect(8, 1, 3, 1, '#d8b060');
}, '#3a2a1a');
// ── Tokyo
const maneki = () => makeSprite('tv:maneki', 14, 18, p => {
  ellipse(p, 7, 12, 5, 5, '#ffffff'); ellipse(p, 7, 6, 5, 4, '#ffffff');
  p.map(['W...W', 'WW.WW'], { W: '#ffffff' }, 4, 1); p.px(3, 2, '#f6a8b8'); p.px(10, 2, '#f6a8b8');
  p.px(5, 6, '#2a2a3a'); p.px(9, 6, '#2a2a3a'); p.px(7, 7, '#f6a8b8'); p.rect(4, 9, 7, 1, RED); p.px(7, 10, GOLD);
  p.rect(11, 2, 2, 5, '#ffffff'); p.px(11, 2, '#f6a8b8');                                   // tay vẫy
  ellipse(p, 7, 13, 2, 2, GOLD); p.px(7, 13, '#c89a2a'); p.px(4, 9, '#f6c445');
  p.rect(2, 16, 10, 2, '#e8443a');
}, '#4a3a3a');
const daruma = () => makeSprite('tv:daruma', 14, 15, p => {
  ellipse(p, 7, 8, 6, 6, '#e8343c'); ellipse(p, 7, 6, 4, 3, '#fde3d0');
  p.rect(4, 5, 2, 2, '#ffffff'); p.rect(8, 5, 2, 2, '#ffffff'); p.px(4, 5, '#1a1a1a'); p.rect(3, 4, 3, 1, '#1a1a1a'); p.rect(8, 4, 3, 1, '#1a1a1a');
  p.rect(5, 8, 4, 1, '#1a1a1a'); p.rect(4, 11, 6, 2, GOLD); p.px(6, 11, RED); p.px(7, 12, RED);
}, '#5a1a1a');
// ── Paris
const eiffelModel = () => makeSprite('tv:eiffel', 14, 24, p => {
  const C = '#8a6a50', L = '#b08a68';
  p.rect(6, 0, 2, 3, C);
  for (let y = 3; y < 21; y++) { const w = Math.round(1 + ((y - 3) / 18) ** 1.8 * 6); p.px(7 - w, y, C); p.px(6 + w, y, C); if (y % 3 === 0) p.rect(7 - w, y, w * 2, 1, L); }
  p.rect(3, 9, 8, 1, C); p.rect(2, 14, 10, 1, C);
  for (let x = 3; x < 11; x++) { const d = Math.abs(x - 6.5); if (d > 1.5) p.px(x, 19 - Math.round(Math.sqrt(Math.max(0, 9 - (d - 1.5) ** 2))), C); }
  p.rect(1, 21, 12, 3, '#3a3a5a'); p.rect(1, 21, 12, 1, '#5a5a8a');
}, '#3a2a2a');
const parisPoster = () => makeSprite('tv:poster', 16, 20, p => {
  frame(p, 16, 20, '#2a2a3a'); p.rect(1, 1, 14, 18, '#f6d0b8');
  for (let y = 1; y < 12; y++) p.rect(1, y, 14, 1, mix('#f6a8b8', '#f6d8a8', y / 12));
  ellipse(p, 11, 5, 2, 2, '#fff2c0');
  p.rect(7, 4, 1, 12, '#3a2a3a'); for (let y = 8; y < 16; y++) { const w = Math.round((y - 8) * 0.5); p.px(7 - w, y, '#3a2a3a'); p.px(7 + w, y, '#3a2a3a'); } p.rect(5, 11, 5, 1, '#3a2a3a');
  p.rect(2, 16, 12, 2, '#4a6ab0'); p.rect(3, 17, 2, 1, CREAM); p.rect(7, 17, 3, 1, CREAM);
}, null);
// ── Venice
const gondolaModel = () => makeSprite('tv:gondola', 24, 12, p => {
  for (let x = 1; x < 23; x++) { const lift = Math.round(Math.max(0, Math.abs(x - 12) - 6) * 0.8); p.rect(x, 6 - lift, 1, 3, '#1a1a24'); }
  p.rect(9, 5, 6, 1, '#d8343c'); p.rect(10, 4, 4, 1, '#f6c64e'); p.rect(22, 0, 1, 3, '#d8d8e0'); p.px(23, 1, '#d8d8e0');
  p.rect(16, 0, 1, 6, '#c89a5a'); p.px(16, 0, '#ffffff');
  p.rect(2, 10, 20, 2, '#3a3a4a'); p.rect(2, 10, 20, 1, '#5a5a6a');
}, '#101018');
const carnivalMask = () => makeSprite('tv:mask', 20, 12, p => {
  for (let y = 2; y < 10; y++) { const w = Math.round(9 - Math.abs(y - 5.5) * 0.8); p.rect(10 - w, y, w * 2, 1, y < 6 ? '#f6c64e' : '#e8f0ff'); }
  ellipse(p, 6, 5, 2, 1, '#2a1a3a'); ellipse(p, 14, 5, 2, 1, '#2a1a3a');
  p.rect(9, 6, 2, 3, '#e8d8a8'); p.px(3, 3, '#4a9ae0'); p.px(17, 3, '#4a9ae0'); p.px(10, 2, RED);
  for (let k = 0; k < 4; k++) p.rect(16 + k, 1 - (k % 2), 1, 3, ['#4a9ae0', '#9a6ae0', '#e8443a', '#3ab08a'][k]);
  p.rect(0, 6, 2, 1, '#9a6ae0'); p.rect(18, 7, 2, 1, '#9a6ae0');
}, '#4a2a2a');
// ── Thuỵ Sĩ
const cuckoo = () => makeSprite('tv:cuckoo', 18, 24, p => {
  for (let y = 0; y < 6; y++) p.rect(Math.round(8 - y * 1.5 - 1), y, y * 3 + 3, 1, '#5a3a22');
  p.rect(2, 6, 14, 11, WOOD); p.rect(2, 6, 14, 1, '#c98b4b');
  ellipse(p, 9, 11, 4, 4, CREAM); p.rect(9, 8, 1, 3, '#2a2a2a'); p.rect(9, 11, 3, 1, '#2a2a2a');
  p.rect(7, 2, 4, 3, '#3a2414'); p.px(8, 3, '#f6c445'); p.px(9, 3, '#e8743a');                 // ô cửa có chim
  for (const x of [3, 14]) p.map(['.L.', 'LLL', '.L.'], { L: '#3a8a4a' }, x - 1, 13);
  p.rect(6, 17, 1, 4, '#c8a050'); p.rect(11, 17, 1, 6, '#c8a050'); p.rect(5, 21, 3, 3, '#a87a30'); p.rect(10, 22, 3, 2, '#a87a30');
}, '#3a2414');
const cowbell = () => makeSprite('tv:cowbell', 16, 16, p => {
  p.rect(2, 0, 12, 3, RED); p.px(4, 1, '#ffffff'); p.px(5, 1, '#ffffff'); p.px(10, 1, '#ffffff'); p.px(11, 1, '#ffffff');
  for (let y = 3; y < 13; y++) { const w = 3 + Math.round((y - 3) * 0.35); p.rect(8 - w, y, w * 2, 1, y < 5 ? '#c89a2a' : '#e8b83a'); }
  p.rect(4, 6, 1, 5, '#fff2b0'); p.rect(5, 12, 6, 1, '#a87a1a'); ellipse(p, 8, 14, 1, 1, '#7a5a1a');
  p.rect(6, 8, 4, 2, RED); p.px(7, 8, '#ffffff'); p.px(8, 9, '#ffffff');
}, '#4a3010');
// ── Iceland
const auroraPainting = () => makeSprite('tv:aurora', 24, 16, p => {
  frame(p, 24, 16, '#c9c2b4'); p.rect(2, 2, 20, 12, '#0a1a3a');
  for (let x = 2; x < 22; x++) { const y = 5 + Math.round(Math.sin(x / 3) * 2); p.rect(x, y, 1, 3, '#3ae89a'); p.px(x, y - 1, '#8af0c8'); if (x % 3 === 0) p.px(x, y + 3, '#9a6ae0'); }
  for (const [x, y] of [[4, 3], [12, 3], [19, 4], [16, 2]]) p.px(x, y, '#ffffff');
  for (let x = 2; x < 22; x++) p.rect(x, 12 - Math.round(Math.abs(Math.sin(x / 2.5)) * 2), 1, 3, '#e8eef8');
}, '#5a5048');
const puffin = () => makeSprite('tv:puffin', 14, 16, p => {
  ellipse(p, 7, 10, 5, 5, '#2a2a34'); ellipse(p, 7, 11, 3, 4, '#ffffff'); ellipse(p, 7, 5, 4, 4, '#2a2a34');
  ellipse(p, 6, 5, 2, 2, '#ffffff'); p.px(6, 5, '#1a1a1a'); p.px(5, 4, '#e8443a');
  p.map(['OOO.', 'ROOO', 'RRO.'], { O: '#f68a2a', R: '#e8443a' }, 9, 4);
  p.rect(4, 15, 2, 1, '#f68a2a'); p.rect(8, 15, 2, 1, '#f68a2a');
}, '#101018');
// ── Phần thưởng đủ 20 con dấu
const globe = () => makeSprite('tv:globe', 16, 22, p => {
  ellipse(p, 8, 8, 7, 7, '#4a9ae0');
  p.map(['..GG...', '.GGGG..', 'GGG..G.', '.G...GG', '....GG.', '.....G.'], { G: '#5ac85a' }, 3, 4);
  p.rect(5, 3, 2, 1, '#8ac8f8'); p.px(4, 4, '#8ac8f8');
  for (let a = 0; a < 18; a++) { const t = -0.2 + a / 17 * 3.4; p.px(Math.round(8 + Math.cos(t) * 8.5), Math.round(8 + Math.sin(t) * 8.5), GOLD); }
  p.rect(7, 16, 2, 3, '#c8a050'); p.rect(3, 19, 10, 3, WOOD); p.rect(3, 19, 10, 1, '#c98b4b');
}, '#2a3a5a');

// ── Bình gốm Thanh Hà tự nặn (xưởng gốm Hội An)
const haVase = () => makeSprite('tv:ha_vase', 12, 18, p => {
  const prof = [3, 4, 5, 5, 5, 5, 4, 4, 3, 2, 2, 2, 2, 3];
  prof.forEach((r, k) => { const y = 16 - k; p.rect(6 - r, y, r * 2, 1, '#eef2f8'); p.rect(6 + Math.ceil(r / 2), y, Math.floor(r / 2), 1, '#c8d4e4'); });
  p.rect(3, 15, 6, 1, '#2a5ab8'); p.rect(4, 5, 4, 1, '#2a5ab8'); p.rect(4, 3, 4, 1, '#c8d4e4');
  for (const [x, y] of [[4, 11], [7, 12], [5, 9]]) { p.px(x, y, '#2a5ab8'); p.px(x + 1, y, '#2a5ab8'); p.px(x, y + 1, '#2a5ab8'); }
  p.px(3, 10, '#ffffff'); p.px(3, 11, '#ffffff'); p.rect(2, 17, 8, 1, '#8a6a5a');
}, '#1a2a4a');

export const TRIP_ART: Record<string, Art> = {
  ha_vase: { place: 'any', sprite: haVase },
  tw_sky_lantern: { place: 'any', sprite: skyLantern, glow: true }, tw_rainbow_art: { place: 'wall', sprite: rainbowArt },
  kr_maple_frame: { place: 'wall', sprite: mapleFrame }, kr_hanbok_doll: { place: 'any', sprite: hanbokDoll },
  hoian_lanterns: { place: 'wall', sprite: hoianLanterns, glow: true }, hoian_basket_boat: { place: 'any', sprite: basketBoat },
  jp_maneki: { place: 'any', sprite: maneki }, jp_daruma: { place: 'any', sprite: daruma },
  fr_eiffel_model: { place: 'any', sprite: eiffelModel }, fr_paris_poster: { place: 'wall', sprite: parisPoster },
  it_gondola_model: { place: 'any', sprite: gondolaModel }, it_carnival_mask: { place: 'wall', sprite: carnivalMask },
  ch_cuckoo_clock: { place: 'wall', sprite: cuckoo }, ch_cowbell_deco: { place: 'wall', sprite: cowbell },
  is_aurora_painting: { place: 'wall', sprite: auroraPainting, glow: true }, is_puffin_plush: { place: 'any', sprite: puffin },
  travel_globe: { place: 'any', sprite: globe, glow: true },
  fa_castle_model: { place: 'any', sprite: castleModelSprite, glow: true }, fa_music_box: { place: 'any', sprite: musicBoxSprite }, fa_balloon: { place: 'any', sprite: balloonDecoSprite },
};
/** Chợ lưu niệm mỗi nơi: [id, giá] */
export const TRIP_SHOP: Record<TripId, [string, number][]> = {
  taichung: [['tw_sky_lantern', 25], ['tw_rainbow_art', 30]], gwangju: [['kr_maple_frame', 25], ['kr_hanbok_doll', 30]],
  hoian: [['hoian_lanterns', 20], ['hoian_basket_boat', 25]], tokyo: [['jp_maneki', 30], ['jp_daruma', 25]],
  paris: [['fr_eiffel_model', 35], ['fr_paris_poster', 25]], venice: [['it_gondola_model', 35], ['it_carnival_mask', 30]],
  swiss: [['ch_cuckoo_clock', 40], ['ch_cowbell_deco', 25]], fairy: [['fa_castle_model', 45], ['fa_music_box', 35]], iceland: [['is_aurora_painting', 40], ['is_puffin_plush', 30]],
};

// ── Khoá tình yêu: lan can treo khoá, ổ khoá màu
const LOCK_C = ['#e8443a', '#f6c445', '#4a9ae0', '#f08aa6', '#5ac85a', '#9a6ae0', '#e8743a'];
export const lockSprite = (k: number) => makeSprite(`lock:${k % LOCK_C.length}`, 5, 7, p => {
  const c = LOCK_C[k % LOCK_C.length];
  p.rect(1, 0, 3, 1, '#b8b8c8'); p.px(1, 1, '#b8b8c8'); p.px(3, 1, '#b8b8c8'); p.px(1, 2, '#b8b8c8'); p.px(3, 2, '#b8b8c8');
  p.rect(0, 3, 5, 4, c); p.px(1, 4, mix(c, '#ffffff', 0.5)); p.px(2, 5, '#3a2a2a');
}, '#3a2a2a');
export const lockRailSprite = () => makeSprite('lockrail', 40, 16, p => {
  p.rect(0, 2, 40, 2, '#6a6a7a'); p.rect(0, 2, 40, 1, '#9a9aaa');
  for (let x = 0; x < 40; x += 4) p.rect(x, 4, 1, 10, '#6a6a7a');
  p.rect(0, 12, 40, 2, '#5a5a6a'); p.rect(0, 0, 2, 16, '#4a4a5a'); p.rect(38, 0, 2, 16, '#4a4a5a');
}, '#2a2a34');
// ── Trụ đóng dấu: bục gỗ, hộp mực, con dấu
export const stampPostSprite = () => makeSprite('stamppost', 14, 20, p => {
  p.rect(5, 8, 4, 12, WOOD); p.rect(5, 8, 1, 12, '#c98b4b'); p.rect(3, 18, 8, 2, WOOD_D);
  p.rect(0, 4, 14, 4, '#c98b4b'); p.rect(0, 4, 14, 1, '#e0b07a'); p.rect(0, 7, 14, 1, WOOD_D);
  p.rect(2, 2, 5, 2, '#3a3a5a'); p.rect(3, 2, 3, 1, '#d8343c');                       // hộp mực
  p.rect(9, 0, 2, 3, '#7a4e2c'); p.rect(8, 3, 4, 1, '#d8343c');                         // con dấu
  p.rect(5, 10, 4, 3, CREAM); p.px(6, 11, RED); p.px(7, 11, RED);                       // biển nhỏ
}, '#3a2414');
// ── Ô to che chung hai người
export const bigUmbrellaSprite = (c: string) => makeSprite(`umb2:${c}`, 34, 32, p => {
  for (let y = 0; y < 9; y++) { const w = Math.round(Math.sqrt(1 - ((8 - y) / 9) ** 2) * 17); p.rect(17 - w, y, w * 2, 1, y % 2 ? mix(c, '#ffffff', 0.25) : c); }
  for (let x = 0; x < 34; x += 6) { p.px(x, 9, c); p.px(x + 1, 9, c); p.px(x + 2, 9, c); }
  for (let x = 3; x < 34; x += 6) p.rect(x, 2, 1, 7, mix(c, '#ffffff', 0.45));
  p.px(17, 0, '#8a5a3c'); p.rect(17, 9, 1, 22, '#8a5a3c'); p.px(16, 31, '#8a5a3c'); p.px(15, 30, '#8a5a3c');
}, '#5a3a4a');
