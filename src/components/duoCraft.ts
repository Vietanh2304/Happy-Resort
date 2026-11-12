// Các lớp làm thủ công hai người — cùng cơ chế với xưởng gốm & muối kim chi: ngồi vào bàn, bấm mũi tên đúng nhịp
// qua từng công đoạn (trúng nhịp = nhân vật làm động tác, sản phẩm tiến thêm; trượt nhiều thì sản phẩm kém đẹp), chấm sao cuối màn.
// Socola trái tim (Thuỵ Sĩ), bánh kem kỉ niệm (tiệm bánh), đèn lồng lụa & dệt lụa nhuộm chàm (Hội An).
import type { DuoCfg, F } from './Duo';
import { characterSprite, type AvatarLook } from '../lib/sprites';
import { bake, circ, ell, glow, heart, line, poly, R, star, twinkle, type Ctx } from '../lib/canvasArt';
import { mix, rr } from './duoSky';

const W = 320, H = 180, TAU = Math.PI * 2;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const SEATS = [120, 208];
const npcCache = new Map<string, HTMLImageElement>();
const npcImg = (look: AvatarLook, frame: 'idle' | 'act', step = 0) => { const id = JSON.stringify(look) + frame + step; let im = npcCache.get(id); if (!im) { im = new Image(); im.src = characterSprite(look, frame, undefined, 'front', step).url; npcCache.set(id, im); } return im; };
const inPh = (el: number, a: number, b: number) => el >= a && el < b;
const confetti = (c: Ctx, t: number, from: number) => { for (let k = 0; k < 40; k++) { const x = (k * 37 + Math.sin(t * 2 + k) * 6) % W, y = ((t - from) * 28 + k * 23) % 140; R(c, x, y, 1.6 * Math.abs(Math.sin(t * 4 + k)) + 0.3, 1.2, ['#e8443a', '#f6c445', '#5ab8ff', '#ff8ab0', '#ffffff'][k % 5]); } };

/** Khung chung: phòng, thợ hướng dẫn, hai ghế ngồi làm (trúng nhịp → động tác), mặt bàn che chân, món đồ của từng người */
function craft(f: F, o: { room: HTMLCanvasElement; table: number; top: [string, string, string]; npc: { look: AvatarLook; x: number }; work: [number, number]; done: number;
  item: (i: number, sx: number, act: boolean) => void; back?: () => void; front?: () => void }) {
  const { c, el, t } = f;
  c.drawImage(o.room, 0, 0, W, H);
  o.back?.();
  { const wave = Math.floor(t / 4) % 3 === 0 && t % 4 < 1.4, im = npcImg(o.npc.look, wave ? 'act' : 'idle', wave ? 12 : 0); f.put(im, o.npc.x - im.width / 2, o.table + 4 - im.height); }
  const working = inPh(el, o.work[0], o.work[1]), cheer = el >= o.done;
  SEATS.forEach((sx, i) => {
    const p = f.seats[i];
    if (!p) { R(c, sx - 7, o.table - 8, 14, 3, '#8a4a2a'); return; }
    const act = f.last(i) < 450, im = working ? (act ? p.img('actsit', 5) : p.img('actsit', 4)) : cheer ? (Math.floor(t * 2 + i) % 2 ? p.img('actsit', 12) : p.img('sit')) : p.img('sit');
    f.put(im, sx - im.width / 2, o.table - 2.6 - 8 - 34 + (act && working ? 1 : 0));
    R(c, sx - 22, o.table, 44, 3.5, o.top[0]); R(c, sx - 22, o.table, 44, 1, o.top[1]); R(c, sx - 22, o.table + 3.5, 44, H - o.table, o.top[2]);
    o.item(i, sx, act);
    if (act && f.n > 1 && [0, 1].every(j => f.last(j) < 450)) heart(c, (SEATS[0] + SEATS[1]) / 2, 88 - (f.last(i) / 450) * 14, 3, '#ff5a8a');
  });
  o.front?.();
  if (cheer) confetti(c, t, o.done / 1000);
}

// ═════════ Socola trái tim — xưởng socola trong nhà gỗ Thuỵ Sĩ ═════════
const CH = { melt: 6000, pour: 19500, write: 31500, deco: 43500, done: 54000, ms: 61000 };
const chalet = () => bake('duo:chalet', W, H, (c, rnd) => {
  R(c, 0, 0, W, H, '#a8703a'); for (let x = 0; x < W; x += 12) { R(c, x, 0, 0.6, H, '#8a5a2a'); } for (let k = 0; k < 300; k++) R(c, rnd() * W, rnd() * 130, 2 + rnd() * 5, 0.5, '#b8804a');
  // cửa sổ nhìn ra đỉnh Matterhorn phủ tuyết
  R(c, 122, 18, 86, 62, '#5a3418'); const g = c.createLinearGradient(0, 22, 0, 76); g.addColorStop(0, '#5aa0e8'); g.addColorStop(1, '#d8ecff'); c.fillStyle = g; c.fillRect(126, 22, 78, 54);
  poly(c, [140, 76, 166, 30, 172, 36, 196, 76], '#8a9ab8'); poly(c, [160, 41, 166, 30, 172, 36, 170, 44, 164, 40], '#ffffff'); for (let x = 126; x < 204; x += 4) { const h = 6 + Math.sin(x / 7) * 3; poly(c, [x, 76, x + 2, 76 - h, x + 4, 76], '#2a5a3a'); }
  R(c, 164, 22, 2, 54, '#5a3418'); R(c, 126, 48, 78, 2, '#5a3418'); R(c, 118, 80, 94, 4, '#7a4a22'); for (let k = 0; k < 8; k++) circ(c, 124 + k * 12, 79, 2.4, ['#e8443a', '#ffffff', '#ff8ab0'][k % 3]);
  // kệ hộp socola thắt nơ + nồi đồng treo
  for (const y of [40, 66]) { R(c, 18, y, 84, 3, '#6a3a1a'); for (let x = 22; x < 98; x += 13) { R(c, x, y - 9, 11, 9, ['#c8303a', '#f6c445', '#5a2e1a', '#ff8ab0', '#3a7a5a'][Math.floor(rnd() * 5)]); R(c, x + 5, y - 9, 1, 9, '#ffffff'); R(c, x, y - 5, 11, 1, '#ffffff'); } }
  for (let k = 0; k < 4; k++) { const x = 228 + k * 22; line(c, x, 0, x, 14 + k % 2 * 4, 0.6, '#3a2a1a'); circ(c, x, 22 + (k % 2) * 4, 7 - k % 2, '#c87a3a'); R(c, x - 7, 20 + (k % 2) * 4, 14, 1, '#e8a060'); }
  // đồng hồ cúc cu
  R(c, 252, 52, 22, 26, '#6a3a1a'); poly(c, [248, 52, 263, 40, 278, 52], '#4a2a10'); circ(c, 263, 62, 6, '#f4ecd8'); R(c, 262.6, 58, 0.8, 4, '#2a1a10'); R(c, 263, 61.6, 3, 0.8, '#2a1a10'); line(c, 258, 78, 258, 94, 0.4, '#c8a040'); line(c, 268, 78, 268, 90, 0.4, '#c8a040');
  // quầy đá cẩm thạch
  R(c, 0, 132, W, H - 132, '#7a4a22'); for (let x = 0; x < W; x += 40) R(c, x + 2, 140, 36, 30, '#8a5a2a');
});
const CHEF: AvatarLook = { gender: 'm', hair: 0, hairColor: 4, skin: 0, shirt: 7, outfit: 6 };
function drawChoco(f: F) {
  const { c, el, t } = f, T = 132;
  craft(f, { room: chalet(), table: T, top: ['#e8e4ec', '#ffffff', '#c8c0cc'], npc: { look: CHEF, x: 60 }, work: [CH.melt, CH.done - 500], done: CH.done,
    item: (i, sx, act) => {
      const melt = f.score(i, 'melt'), pour = f.score(i, 'pour'), wr = f.score(i, 'write'), dc = f.score(i, 'deco');
      for (let k = 0; k < 8; k++) R(c, sx - 20 + k * 5.5, T + 1.5, 3, 0.4, '#b8b0c0');
      if (el < CH.pour) { // nồi cách thuỷ + tô socola tan dần, bóng mượt
        R(c, sx - 10, T - 6, 20, 6, '#9aa0b0'); ell(c, sx, T - 6, 11, 2.6, '#c8ccd8'); ell(c, sx, T - 6.5, 9, 2, mix('#7a4a2a', '#4a2412', melt));
        if (melt < 0.9) for (let k = 0; k < 6; k++) R(c, sx - 6 + k * 2.2, T - 8 + (k % 2), 1.6, 1.4, '#6a3a1e');
        ell(c, sx - 3, T - 7, 2.4 * melt + 0.3, 0.5, '#c8906a'); const a = t * (2 + (act ? 8 : 0)); line(c, sx + Math.cos(a) * 5, T - 6.5 + Math.sin(a), sx + 8, T - 20, 1, '#d8b080');
        for (let k = 0; k < 3; k++) { const q = (t * 0.5 + k / 3) % 1; c.globalAlpha = (1 - q) * 0.4; circ(c, sx - 4 + k * 4, T - 10 - q * 14, 1.4 + q * 2, '#ffffff'); c.globalAlpha = 1; }
        return;
      }
      // khuôn trái tim bạc: rót socola → viết chữ socola trắng → rắc vàng lá, mâm xôi
      const lift = el >= CH.done ? clamp((el - CH.done) / 1500) * 14 : 0, hy = T - 7 - lift;
      if (!lift) { heart(c, sx, T - 7, 10.5, '#9aa0b0'); heart(c, sx, T - 7.4, 9.6, '#d8dce6'); }
      const lvl = el < CH.write ? pour : 1;
      if (lvl > 0.05) { c.save(); c.beginPath(); c.rect(sx - 12, hy + 6 - lvl * 18, 24, 30); c.clip(); heart(c, sx, hy, 9, '#4a2412'); c.restore(); ell(c, sx - 3, hy - 3, 2.4, 1.2, '#8a5a3a'); }
      if (inPh(el, CH.pour, CH.write)) { const a = act ? 1 : 0.6; R(c, sx - 0.6, T - 30, 1.2 * a + 0.4, 23 - lvl * 6, '#5a2e1a'); poly(c, [sx - 6, T - 32, sx + 6, T - 36, sx + 8, T - 30, sx - 4, T - 28], '#c8ccd8'); }
      if (el >= CH.write) { const n = Math.floor((el < CH.deco ? wr : 1) * 6); for (let k = 0; k < n; k++) { const x = sx - 5 + k * 2, y = hy - 1 + Math.sin(k * 1.7) * 1.2; line(c, x, y, x + 2, y - Math.cos(k) * 1.2, 0.5, '#fff6e8'); } if (n >= 5) heart(c, sx, hy + 3.5, 1.4, '#fff6e8'); }
      if (el >= CH.deco) { const n = Math.floor((el < CH.done ? dc : Math.max(dc, 0.3)) * 10); for (let k = 0; k < n; k++) { const a = k * 0.9, x = sx + Math.cos(a) * 5.5, y = hy + Math.sin(a) * 3.5 - 1; if (k % 3 === 0) circ(c, x, y, 1, '#d8204a'); else R(c, x, y, 0.8, 0.8, '#ffd84a'); } }
      if (lift) { glow(c, sx, hy, 16, '#fff0c0', 0.4); if (Math.floor(t * 3 + i) % 3 === 0) twinkle(c, sx - 4, hy - 3, 2, '#ffffff'); }
    } });
}
const choco: DuoCfg = {
  title: 'Làm socola trái tim', ms: CH.ms, join: CH.pour, price: 24, gift: { item: 'swiss_choco', n: 3 },
  ask: '🍫 Vào xưởng socola Thuỵ Sĩ làm socola trái tim', joinAsk: '🍫 Vào làm socola cùng người ấy', invite: '🍫 Người ấy rủ vào xưởng làm socola trái tim', yes: 'Vào làm cùng!', late: 'Lớp socola rót khuôn mất rồi — lần sau nha',
  beats: [{ ph: 'melt', from: CH.melt, to: CH.pour }, { ph: 'pour', from: CH.pour, to: CH.write }, { ph: 'write', from: CH.write, to: CH.deco }, { ph: 'deco', from: CH.deco, to: CH.done }],
  caption: el => el < CH.melt ? `🍫 Xưởng socola nhà gỗ — đội mũ, đeo tạp dề nào… ${Math.ceil((CH.melt - el) / 1000)}` : el < CH.pour ? '🔥 Bấm đúng nhịp khuấy socola tan chảy, bóng mượt' : el < CH.write ? '🫗 Bấm đúng nhịp rót socola vào khuôn trái tim' : el < CH.deco ? '✍️ Bấm đúng nhịp viết chữ bằng socola trắng' : el < CH.done ? '✨ Bấm đúng nhịp rắc vàng lá, mâm xôi' : '💝 Lấy ra khỏi khuôn — socola trái tim của hai đứa!',
  draw: drawChoco, snap: [CH.done + 2500], endTitle: '🍫 3 thanh socola Thuỵ Sĩ đã vào túi đồ!', endNote: 'Cất tủ lạnh để làm dâu nhúng socola, socola nóng nha',
};

// ═════════ Bánh kem kỉ niệm — tiệm bánh ở phố ═════════
const CK = { whisk: 6000, bake: 18000, frost: 26000, deco: 38000, candle: 50000, done: 58000, ms: 65000 };
const bakery = () => bake('duo:bakery', W, H, (c, rnd) => {
  for (let x = 0; x < W; x += 8) R(c, x, 0, 8, 132, x % 16 ? '#ffe4ec' : '#fff2f6');
  for (let k = 0; k < 13; k++) { const x = 6 + k * 24; poly(c, [x, 10, x + 12, 10, x + 6, 20], ['#ff8ab0', '#ffd84a', '#7ac8ff', '#a8e07a'][k % 4]); } line(c, 0, 10, W, 10, 0.6, '#c87a9a');
  // tủ kính bánh ngọt
  R(c, 214, 54, 92, 50, '#fff8fa'); R(c, 216, 56, 88, 46, '#d8f0ff'); for (const y of [74, 96]) R(c, 216, y, 88, 1.5, '#ffffff');
  for (let k = 0; k < 12; k++) { const x = 222 + (k % 6) * 14, y = k < 6 ? 72 : 94; ell(c, x, y - 3, 5, 3, ['#ff8ab0', '#f6e0a0', '#7a4a2a', '#ffffff', '#c8a0ff', '#ffb070'][k % 6]); R(c, x - 4, y - 3, 8, 3, '#f8d8b0'); circ(c, x, y - 7, 1.2, '#e8304a'); }
  // lò nướng
  R(c, 12, 60, 56, 50, '#c8c0cc'); R(c, 18, 70, 44, 30, '#3a3440'); R(c, 18, 64, 44, 3, '#e8e4ec'); for (let k = 0; k < 3; k++) circ(c, 28 + k * 12, 66, 1.5, '#5a5a62');
  // cửa sổ nhìn ra phố
  R(c, 104, 24, 74, 50, '#ffffff'); R(c, 108, 28, 66, 42, '#bfe4ff'); R(c, 140, 28, 2, 42, '#ffffff'); for (let k = 0; k < 5; k++) R(c, 110 + k * 13, 56 + (k % 2) * 4, 10, 14, ['#f6c445', '#ff8ab0', '#8ad0a0'][k % 3]);
  poly(c, [100, 22, 182, 22, 176, 30, 106, 30], '#ff8ab0'); for (let x = 106; x < 176; x += 8) R(c, x, 22, 4, 8, '#ffffff');
  R(c, 0, 132, W, H - 132, '#f0c8a0'); for (let x = 0; x < W; x += 20) R(c, x, 136, 0.6, 44, '#d8a880');
});
const BAKER: AvatarLook = { gender: 'f', hair: 1, hairColor: 2, skin: 0, shirt: 1, outfit: 6 };
function drawCake(f: F) {
  const { c, el, t } = f, T = 132;
  const blown = f.taps.find(x => x.id === 'blow'), out = blown && f.now - blown.at > 300;
  craft(f, { room: bakery(), table: T, top: ['#ffffff', '#ffffff', '#f6d8e0'], npc: { look: BAKER, x: 62 }, work: [CK.whisk, CK.candle], done: CK.done,
    back: () => { const on = inPh(el, CK.bake, CK.frost); if (on) { glow(c, 40, 85, 30, '#ff9a3a', 0.6 + 0.2 * Math.sin(t * 6)); R(c, 18, 70, 44, 30, '#ff8a3a60'); const q = clamp((el - CK.bake) / 7000); R(c, 28, 92 - q * 8, 24, q * 8 + 2, '#f8d890'); R(c, 28, 92 - q * 8, 24, 1, '#e8b860'); } },
    item: (i, sx, act) => {
      if (el < CK.bake) { const s = f.score(i, 'whisk'); ell(c, sx, T - 4, 10, 3, '#c8e0f0'); R(c, sx - 10, T - 4, 20, 4, '#b8d0e4'); ell(c, sx, T - 4.6, 8.4, 2.2, mix('#f8e0a0', '#fff8e8', s)); for (let k = 0; k < Math.floor(s * 6); k++) circ(c, sx - 5 + k * 2, T - 5.4 - (k % 2) * 0.6, 1.2, '#fffbf0');
        const a = t * (act ? 16 : 5); line(c, sx + Math.cos(a) * 3, T - 5, sx + 6, T - 18, 0.8, '#a8a8b8'); ell(c, sx + Math.cos(a) * 3, T - 5, 1.4, 2, '#c8c8d8'); return; }
      if (inPh(el, CK.frost, CK.candle)) { const a = act ? -0.4 : Math.sin(t * 2 + i) * 0.2; c.save(); c.translate(sx + (i ? -14 : 14), T - 22); c.rotate(a + (i ? 0.6 : -0.6)); poly(c, [-3, -6, 3, -6, 0.6, 6, -0.6, 6], '#fff4f8'); R(c, -3, -7, 6, 1.4, '#ff8ab0'); c.restore(); }
    },
    front: () => {
      // bánh kem chung ở giữa bàn: cốt bánh → phủ kem → dâu, kem bắt hoa → nến trái tim
      const x = (SEATS[0] + SEATS[1]) / 2, b = T - 2; if (el < CK.frost - 1500) return;
      const fr = el < CK.deco ? Math.max(f.score(0, 'frost'), f.score(1, 'frost')) : 1, dc = el < CK.candle ? Math.max(f.score(0, 'deco'), f.score(1, 'deco')) : 1;
      ell(c, x, b + 1, 22, 3, '#e8e4ec'); R(c, x - 1.5, b, 3, 4, '#c8c0cc');
      R(c, x - 18, b - 14, 36, 14, '#f8d890'); ell(c, x, b - 14, 18, 3, '#f8e0a0'); R(c, x - 12, b - 24, 24, 10, '#f8d890'); ell(c, x, b - 24, 12, 2.4, '#f8e0a0');
      if (fr > 0) { const hh = 14 * fr; R(c, x - 18.5, b - hh, 37, hh, '#ffd0e0'); if (fr > 0.5) { R(c, x - 12.5, b - 14 - 10 * (fr - 0.5) * 2, 25, 10 * (fr - 0.5) * 2, '#ffe4ee'); ell(c, x, b - 14, 18.5, 3, '#ffe4ee'); } if (fr > 0.95) ell(c, x, b - 24, 12.5, 2.6, '#fff0f6'); for (let k = 0; k < Math.floor(fr * 12); k++) circ(c, x - 17 + k * 3, b - 14, 1.2, '#ffffff'); }
      for (let k = 0; k < Math.floor(dc * 9); k++) { const a = Math.PI + (k / 8) * Math.PI, px = x + Math.cos(a) * 15, py = b - 15 + Math.sin(a) * 2.2; circ(c, px, py, 1.5, '#e8203a'); R(c, px - 0.5, py - 2, 1, 1, '#3a8a3a'); }
      for (let k = 0; k < Math.floor(dc * 6); k++) { const px = x - 10 + k * 4, py = b - 25.5; circ(c, px, py, 1.1, '#ffffff'); circ(c, px, py - 0.7, 0.6, '#ffe4ee'); }
      if (el >= CK.candle - 2000) for (const dx of [-4, 4]) { R(c, x + dx - 0.8, b - 33, 1.6, 8, dx < 0 ? '#ff8ab0' : '#7ac8ff'); if (!out) { const fl = 0.8 + 0.2 * Math.sin(t * 14 + dx); glow(c, x + dx, b - 35, 8, '#ffc860', 0.6); ell(c, x + dx, b - 35, 0.9 * fl, 1.8 * fl, '#ffb030'); } else { const q = (f.now - blown!.at) / 3000; if (q < 1) { c.globalAlpha = 1 - q; circ(c, x + dx + Math.sin(q * 6) * 2, b - 36 - q * 12, 1 + q * 2, '#c8c8d0'); c.globalAlpha = 1; } } }
      if (out) for (let k = 0; k < 4; k++) heart(c, x - 12 + k * 8, b - 46 - ((t * 10 + k * 5) % 20), 2, '#ff5a8a');
    } });
}
const cake: DuoCfg = {
  title: 'Bánh kem kỉ niệm', ms: CK.ms, join: CK.bake, price: 30, gift: { item: 'love_cake' },
  ask: '🎂 Vào tiệm bánh nướng bánh kem kỉ niệm', joinAsk: '🎂 Vào nướng bánh cùng người ấy', invite: '🎂 Người ấy rủ nướng bánh kem kỉ niệm', yes: 'Vào làm cùng!', late: 'Bánh vào lò mất rồi — lần sau nha',
  beats: [{ ph: 'whisk', from: CK.whisk, to: CK.bake }, { ph: 'frost', from: CK.frost, to: CK.deco }, { ph: 'deco', from: CK.deco, to: CK.candle }],
  buttons: [{ id: 'blow', label: '🌬️ Thổi nến', from: CK.candle + 600, to: CK.done }, { id: 'photo', label: '📸 Chụp', from: CK.candle + 600, to: CK.ms }],
  caption: el => el < CK.whisk ? `🎂 Tiệm bánh màu hồng — rửa tay, đeo tạp dề… ${Math.ceil((CK.whisk - el) / 1000)}` : el < CK.bake ? '🥚 Bấm đúng nhịp đánh trứng, bột bông xốp' : el < CK.frost ? '🔥 Bánh vào lò… thơm lừng cả tiệm' : el < CK.deco ? '🍰 Bấm đúng nhịp phủ kem quanh bánh' : el < CK.candle ? '🍓 Bấm đúng nhịp xếp dâu, bắt hoa kem' : el < CK.done ? '🕯️ Thắp nến rồi — ước một điều rồi cùng "Thổi nến"!' : '🎉 Chúc mừng kỉ niệm của hai đứa!',
  draw: drawCake, snap: [CK.candle + 1500], endTitle: '🎂 Bánh kem kỉ niệm đã vào túi đồ!', endNote: 'Mở túi đồ ăn cùng nhau nha (+thiện cảm)',
};

// ═════════ Đèn lồng lụa Hội An ═════════
const LT = { frame: 6000, silk: 18000, paint: 30000, light: 42000, ms: 58000 };
const hoianRoom = (key: string, wall: string) => bake(key, W, H, (c, rnd) => {
  R(c, 0, 0, W, H, wall); for (let k = 0; k < 600; k++) R(c, rnd() * W, rnd() * 130, 1 + rnd() * 2, 0.5, rnd() < 0.5 ? mix(wall, '#000000', 0.06) : mix(wall, '#ffffff', 0.12));
  R(c, 0, 0, W, 10, '#6a3a22'); for (let x = 0; x < W; x += 6) R(c, x, 0, 3, 10, '#7a4a2a'); R(c, 0, 10, W, 3, '#4a2614');
  for (const x of [0, 104, 214, 312]) R(c, x, 13, 8, 120, '#5a2e18');
  R(c, 0, 132, W, H - 132, '#7a4224'); for (let x = 0; x < W; x += 40) R(c, x + 2, 138, 36, 12, '#8a4a2a');
  for (let y = 150; y < H; y += 6) for (let x = ((y / 6) % 2) * 8; x < W; x += 16) R(c, x, y, 15.5, 5.5, '#c8784a');
});
const LCOL = ['#e8303a', '#f6c445', '#ff7ab0', '#3a8ae8', '#8a4ad8', '#3ab87a'];
const seatCol = (f: F, i: number) => LCOL[(f.seats[i]?.key.length ?? i) % LCOL.length];
function silkLantern(c: Ctx, x: number, by: number, col: string, ribs: number, silk: number, paint: number, lit: number, t: number) {
  const rx = 8, ry = 11, cy = by - ry - 2;
  if (lit) glow(c, x, cy, 26, col, 0.55 * lit);
  R(c, x - 3, by - 2, 6, 2, '#6a3a12'); R(c, x - 3, cy - ry - 1, 6, 2, '#6a3a12'); R(c, x - 0.3, cy - ry - 6, 0.6, 5, '#6a3a12');
  if (silk > 0) { c.save(); c.beginPath(); c.rect(x - rx - 1, cy + ry - silk * ry * 2, rx * 2 + 2, silk * ry * 2 + 1); c.clip(); ell(c, x, cy, rx, ry, lit ? mix(col, '#fff6c0', 0.45 * lit) : col); ell(c, x - rx * 0.35, cy - ry * 0.2, rx * 0.25, ry * 0.6, '#ffffff40'); c.restore(); }
  for (let k = 0; k < ribs; k++) { const u = (k / 7) * 2 - 1; c.strokeStyle = '#8a5a2a'; c.lineWidth = 0.4; c.beginPath(); c.ellipse(x, cy, Math.abs(u) * rx + 0.3, ry, 0, -Math.PI / 2, Math.PI / 2, u < 0); c.stroke(); }
  for (let k = 0; k < Math.floor(paint * 7); k++) { const a = k * 0.9, px = x + Math.sin(a) * rx * 0.55, py = cy - ry * 0.5 + (k % 3) * ry * 0.45; for (let j = 0; j < 5; j++) circ(c, px + Math.cos(j * 1.26) * 0.8, py + Math.sin(j * 1.26) * 0.8, 0.4, '#ffd84a'); }
  if (silk > 0.95) for (let k = 0; k < 5; k++) R(c, x - 2 + k, by, 0.4, 4 + Math.sin(t * 2 + k) * 0.6, '#e8303a');
}
const ARTISAN: AvatarLook = { gender: 'f', hair: 1, hairColor: 6, skin: 1, shirt: 6, outfit: 12 };
function drawLantern(f: F) {
  const { c, el, t } = f, T = 132, dark = clamp((el - LT.light) / 2500);
  craft(f, { room: hoianRoom('duo:hoianL', '#f2c45a'), table: T, top: ['#9a5a32', '#c88050', '#7a4224'], npc: { look: ARTISAN, x: 60 }, work: [LT.frame, LT.light], done: LT.light + 4000,
    back: () => { for (let k = 0; k < 14; k++) { const ax = 14 + k * 22, sw = Math.sin(t * 1.2 + k) * 0.12, L = 14 + (k % 3) * 8, x = ax + Math.sin(sw) * L, y = 13 + L; line(c, ax, 13, x, y - 8, 0.4, '#3a1a0a'); silkLantern(c, x, y + 10, LCOL[k % LCOL.length], 7, 1, 0.6, 0.35 + dark * 0.65, t); } },
    item: (i, sx) => { const col = seatCol(f, i), fr = el < LT.silk ? f.score(i, 'frame') : 1, sk = el < LT.silk ? 0 : el < LT.paint ? f.score(i, 'silk') : 1, pt = el < LT.paint ? 0 : el < LT.light ? f.score(i, 'paint') : Math.max(0.3, f.score(i, 'paint'));
      const rise = clamp((el - LT.light - 2000) / 3000) * 30; silkLantern(c, sx + (i ? -16 : 16), T - 1 - rise, col, Math.max(1, Math.round(fr * 7)), Math.max(0, sk), pt, dark, t); },
    front: () => { if (dark > 0) { c.globalAlpha = dark * 0.45; c.fillStyle = '#0a0a2a'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; for (let k = 0; k < 14; k++) glow(c, 14 + k * 22, 40, 14, LCOL[k % LCOL.length], dark * 0.35); SEATS.forEach((sx, i) => f.seats[i] && glow(c, sx + (i ? -16 : 16), T - 44, 24, seatCol(f, i), dark * 0.5)); } } });
}
const lanternmake: DuoCfg = {
  title: 'Làm đèn lồng lụa Hội An', ms: LT.ms, join: LT.silk, price: 20, gift: { item: 'ha_silk_lantern' },
  ask: '🏮 Học làm đèn lồng lụa với nghệ nhân phố cổ', joinAsk: '🏮 Vào làm đèn lồng cùng người ấy', invite: '🏮 Người ấy rủ học làm đèn lồng lụa Hội An', yes: 'Vào làm cùng!', late: 'Lớp làm đèn đã căng lụa mất rồi — lần sau nha',
  beats: [{ ph: 'frame', from: LT.frame, to: LT.silk }, { ph: 'silk', from: LT.silk, to: LT.paint }, { ph: 'paint', from: LT.paint, to: LT.light }],
  buttons: [{ id: 'photo', label: '📸 Chụp', from: LT.light, to: LT.ms }],
  caption: el => el < LT.frame ? `🏮 Xưởng đèn lồng phố cổ — trăm chiếc đèn treo kín trần… ${Math.ceil((LT.frame - el) / 1000)}` : el < LT.silk ? '🎋 Bấm đúng nhịp uốn nan tre thành khung đèn' : el < LT.paint ? '🧵 Bấm đúng nhịp căng lụa, dán từng múi' : el < LT.light ? '🖌️ Bấm đúng nhịp vẽ hoa văn vàng' : '✨ Thắp đèn! Cả xưởng bừng sáng lung linh',
  draw: drawLantern, snap: [LT.light + 5000], endTitle: '🏮 Đèn lồng lụa tự tay làm đã vào túi đồ!', endNote: 'Treo ở nhà, tối lên là sáng lung linh như phố cổ',
};

// ═════════ Dệt lụa & nhuộm chàm — làng lụa Hội An ═════════
const SK = { reel: 6000, weave: 17000, dye: 31000, dry: 43000, ms: 56000 };
const silkRoom = () => bake('duo:silkvillage', W, H, (c, rnd) => {
  c.drawImage(hoianRoom('duo:hoianS', '#f0d088'), 0, 0, W, H);
  // kệ cuộn lụa nhiều màu + nong tằm ăn lá dâu
  for (const y of [44, 70]) { R(c, 240, y, 72, 3, '#6a3a1a'); for (let x = 244; x < 308; x += 8) { ell(c, x + 3, y - 4, 3.5, 4, ['#e8303a', '#f6c445', '#3a6ad8', '#3ab87a', '#ff8ab0', '#ffffff'][Math.floor(rnd() * 6)]); ell(c, x + 3, y - 4, 1, 1.2, '#00000030'); } }
  for (const [x, y] of [[40, 58], [70, 70]] as const) { ell(c, x, y, 22, 5, '#c8a060'); ell(c, x, y - 0.6, 19, 4, '#5aa03a'); for (let k = 0; k < 9; k++) ell(c, x - 14 + k * 3.5, y - 1 + (k % 2), 1.4, 0.6, '#f8f4e8'); }
  // cửa mở ra sân nắng, dây phơi lụa
  R(c, 130, 20, 72, 92, '#5a2e18'); const g = c.createLinearGradient(0, 24, 0, 108); g.addColorStop(0, '#8ad0ff'); g.addColorStop(1, '#e8f6c0'); c.fillStyle = g; c.fillRect(134, 24, 64, 84);
  for (let x = 134; x < 198; x += 3) { const h = 10 + Math.sin(x / 5) * 4; R(c, x, 108 - h, 3, h, '#4a9a3a'); }
  // chum nhuộm chàm
  for (const x of [222, 300]) { R(c, x - 10, 112, 20, 20, '#5a3a24'); ell(c, x, 112, 10, 2.6, '#7a5434'); ell(c, x, 112, 8.4, 2, '#1a2a7a'); }
});
const INDIGO = '#1e2e8a';
function drawSilk(f: F) {
  const { c, el, t } = f, T = 132;
  craft(f, { room: silkRoom(), table: T, top: ['#9a5a32', '#c88050', '#7a4224'], npc: { look: ARTISAN, x: 60 }, work: [SK.reel, SK.dry], done: SK.dry + 3000,
    item: (i, sx, act) => {
      const rl = f.score(i, 'reel'), wv = el < SK.dye ? f.score(i, 'weave') : 1, dy = el < SK.dry ? f.score(i, 'dye') : Math.max(0.4, f.score(i, 'dye'));
      if (el < SK.weave) { // ươm tơ: nồi kén trắng, sợi tơ quấn lên guồng
        R(c, sx - 16, T - 7, 12, 7, '#8a8a92'); ell(c, sx - 10, T - 7, 6, 1.6, '#aac8e0'); for (let k = 0; k < 5; k++) ell(c, sx - 13 + k * 1.6, T - 7.4, 0.9, 0.6, '#fffbf0');
        const a = t * (act ? 10 : 3); circ(c, sx + 8, T - 14, 6, '#8a5a2a'); circ(c, sx + 8, T - 14, 5, '#c8a060'); ell(c, sx + 8, T - 14, 3 + rl * 2, 3 + rl * 2, '#fff8e0'); for (let k = 0; k < 4; k++) line(c, sx + 8, T - 14, sx + 8 + Math.cos(a + k * 1.57) * 5, T - 14 + Math.sin(a + k * 1.57) * 5, 0.5, '#6a3a1a');
        R(c, sx + 7.5, T - 8, 1, 8, '#6a3a1a'); line(c, sx - 10, T - 7.5, sx + 8, T - 14, 0.3, '#fffbe8'); return; }
      if (el < SK.dry) { // khung dệt: sợi dọc, vải lớn dần, thoi chạy qua lại; sau đó nhúng chum chàm
        const x0 = i ? sx - 46 : sx + 18, w = 28, top = T - 30; R(c, x0 - 2, top - 2, 2, 30, '#6a3a1a'); R(c, x0 + w, top - 2, 2, 30, '#6a3a1a'); R(c, x0 - 2, top - 3, w + 4, 2, '#8a5a2a'); R(c, x0 - 2, T - 2, w + 4, 2, '#8a5a2a');
        for (let k = 0; k <= 14; k++) R(c, x0 + k * 2, top, 0.3, 28, '#e8e0c8');
        const hh = wv * 24, col = el < SK.dye ? '#f8f2e0' : mix('#f8f2e0', INDIGO, dy);
        R(c, x0, T - 2 - hh, w, hh, col); for (let y = T - 2 - hh; y < T - 2; y += 1.2) R(c, x0, y, w, 0.3, '#00000010');
        if (el >= SK.dye) for (let k = 0; k < 5; k++) { const cx = x0 + 4 + (k % 3) * 10, cy = T - 8 - Math.floor(k / 3) * 10; c.strokeStyle = '#e8eeff'; c.lineWidth = 0.4; c.beginPath(); c.arc(cx, cy, 2.4, 0, TAU); c.stroke(); circ(c, cx, cy, 0.6, '#e8eeff'); }
        const sh = el < SK.dye ? (Math.sin(t * (act ? 9 : 2)) * 0.5 + 0.5) : 0.5; R(c, x0 + sh * (w - 6), T - 4 - hh, 6, 1.6, '#c87a3a');
        if (el >= SK.dye && act) for (let k = 0; k < 6; k++) R(c, x0 + k * 5, T - 1 + (k % 2), 1, 1, '#3a4ab8');
        return; }
      // phơi lụa chàm trên sào tre, bay trong nắng gió
      const x0 = i ? sx - 46 : sx + 18, sway = Math.sin(t * 2 + i) * 2; line(c, x0 - 4, T - 34, x0 + 32, T - 34, 0.8, '#c8a060');
      c.fillStyle = mix('#f8f2e0', INDIGO, dy); c.beginPath(); c.moveTo(x0, T - 34); c.lineTo(x0 + 28, T - 34); for (let k = 0; k <= 8; k++) { const u = k / 8; c.lineTo(x0 + 28 - u * 28 + Math.sin(t * 3 + u * 5) * 1.2, T - 8 + sway * u + Math.sin(t * 4 + u * 7) * 1); } c.closePath(); c.fill();
      for (let k = 0; k < 6; k++) { const cx = x0 + 5 + (k % 3) * 9, cy = T - 28 + Math.floor(k / 3) * 10; c.strokeStyle = '#e8eeff'; c.lineWidth = 0.4; c.beginPath(); c.arc(cx + sway * 0.3, cy, 2.6, 0, TAU); c.stroke(); circ(c, cx + sway * 0.3, cy, 0.6, '#e8eeff'); }
      if (Math.floor(t * 3 + i) % 4 === 0) twinkle(c, x0 + 6, T - 26, 1.6, '#ffffff');
    },
    front: () => { if (el >= SK.dry) { c.globalAlpha = 0.08; for (let k = 0; k < 6; k++) poly(c, [150 + k * 10, 20, 166 + k * 10, 20, 120 + k * 30, H, 96 + k * 30, H], '#fff6c0'); c.globalAlpha = 1; } } });
}
const silk: DuoCfg = {
  title: 'Dệt lụa nhuộm chàm', ms: SK.ms, join: SK.weave, price: 22, gift: { item: 'ha_indigo_silk' },
  ask: '🧵 Vào làng lụa Hội An ươm tơ, dệt lụa rồi nhuộm chàm', joinAsk: '🧵 Vào dệt lụa cùng người ấy', invite: '🧵 Người ấy rủ vào làng lụa dệt vải nhuộm chàm', yes: 'Vào dệt cùng!', late: 'Lớp dệt lụa đã lên khung mất rồi — lần sau nha',
  beats: [{ ph: 'reel', from: SK.reel, to: SK.weave }, { ph: 'weave', from: SK.weave, to: SK.dye }, { ph: 'dye', from: SK.dye, to: SK.dry }],
  buttons: [{ id: 'photo', label: '📸 Chụp', from: SK.dry, to: SK.ms }],
  caption: el => el < SK.reel ? `🧵 Làng lụa Hội An — nong tằm ăn lá dâu rào rạo… ${Math.ceil((SK.reel - el) / 1000)}` : el < SK.weave ? '🐛 Bấm đúng nhịp ươm tơ — kéo sợi từ kén lên guồng' : el < SK.dye ? '🧶 Bấm đúng nhịp đưa thoi dệt lụa' : el < SK.dry ? '💙 Bấm đúng nhịp nhúng lụa vào chum chàm — xanh dần lên' : '☀️ Phơi lụa chàm trong nắng gió phố cổ',
  draw: drawSilk, snap: [SK.dry + 3500], endTitle: '💙 Tấm lụa chàm tự tay dệt đã vào túi đồ!', endNote: 'Treo lên tường nhà cho đẹp nha',
};

export const CRAFT_SCENES = { choco, cake, lanternmake, silk };
void rr; void star;
