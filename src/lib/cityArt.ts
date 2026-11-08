// Thành phố (bản đồ riêng, ngoài làng): hàng phố có toà công ty, quán cà phê, cửa hàng tiện lợi, vỉa hè,
// đường xe chạy, trạm xe buýt về làng. Người đi đường là NPC; trong công ty có đồng nghiệp.
import { ellipse } from './iso';
import { makeSprite, mix } from './pixel';
import { seeded } from './rng';

export const CITY = {
  w: 256, h: 192,
  sidewalk: { y0: 104, y1: 130 },
  company: { x: 128, door: { x: 128, y: 106 } },
  bus: { x: 232, y: 112, stand: { x: 222, y: 118 } },
  cafe: { x: 40 }, store: { x: 194 },
};

export function cityBackground(phase: 'day' | 'night' | 'sunset' | 'dawn') {
  return makeSprite(`city:v1:${phase}`, CITY.w, CITY.h, p => {
    const night = phase === 'night', dusk = phase === 'sunset';
    const sky = night ? ['#0e1640', '#2a3270'] : dusk ? ['#6a4fc4', '#ff9a6a'] : ['#5ab4f0', '#bfe6ff'];
    for (let y = 0; y < 60; y++) p.rect(0, y, 256, 1, mix(sky[0], sky[1], y / 60));
    const r = seeded('city');
    // toà nhà xa phía sau
    for (let x = 0; x < 256; x += 14) { const h = 24 + Math.floor(r() * 36); const c = night ? '#2a3060' : dusk ? '#7a5a8a' : '#9ab0c8'; p.rect(x, 60 - h, 13, h + 10, c); for (let yy = 64 - h; yy < 66; yy += 4) for (let xx = x + 2; xx < x + 12; xx += 3) if (r() < 0.6) p.px(xx, yy, night ? '#ffe08a' : mix(c, '#ffffff', 0.4)); }
    // hàng phố phía trước
    const front = (x0: number, w: number, top: number, c: string, sign?: string) => {
      p.rect(x0, top, w, 104 - top, c); p.rect(x0, top, w, 2, mix(c, '#ffffff', 0.3));
      for (let yy = top + 6; yy < 92; yy += 9) for (let xx = x0 + 3; xx < x0 + w - 5; xx += 7) p.rect(xx, yy, 5, 6, night ? (r() < 0.7 ? '#ffe08a' : '#3a4070') : '#a8d0f0');
      if (sign) p.rect(x0 + 2, 92, w - 4, 4, sign);
    };
    front(4, 66, 46, '#e8c8a0', '#8a5a3c');                // quán cà phê
    p.rect(14, 92, 46, 12, '#8a5a3c'); p.rect(16, 94, 42, 8, '#f2dcb8'); p.rect(30, 94, 12, 10, '#5a3a2a');
    for (let x = 6; x < 70; x += 6) { p.rect(x, 88, 6, 4, x % 12 ? '#e8604a' : '#fffaf0'); }        // mái hiên sọc
    // toà công ty cao tầng kính
    p.rect(88, 8, 80, 96, '#5a7aa8'); for (let yy = 12; yy < 96; yy += 6) for (let xx = 92; xx < 164; xx += 8) p.rect(xx, yy, 6, 4, night ? (r() < 0.75 ? '#ffe08a' : '#2a3a5a') : mix('#a8d0f0', '#ffffff', r() * 0.3));
    p.rect(88, 8, 80, 3, '#8aa8d0'); p.rect(112, 84, 32, 20, '#3a4a6a'); p.rect(114, 86, 28, 18, '#a8d8f0'); p.rect(127, 86, 2, 18, '#3a4a6a');
    p.rect(104, 76, 48, 6, '#fffaf0'); p.rect(106, 77, 44, 4, '#3a6ab0');                          // bảng tên công ty
    front(176, 40, 54, '#a5d470', '#3a8a4a');              // cửa hàng tiện lợi
    p.rect(182, 92, 28, 12, '#e8f6ff'); p.rect(194, 92, 2, 12, '#3a8a4a');
    front(220, 36, 62, '#f2b8c8');
    // vỉa hè lát gạch
    for (let y = 104; y < 132; y++) p.rect(0, y, 256, 1, (y - 104) % 6 === 0 ? '#b8b0a8' : '#d8d0c4');
    for (let x = 0; x < 256; x += 12) p.rect(x, 104, 1, 28, '#c4bcb0');
    // cây xanh + đèn đường trên vỉa hè
    for (const x of [78, 176, 250]) { p.rect(x, 116, 2, 12, '#7a5a3a'); ellipse(p, x + 1, 112, 6, 6, night ? '#2a5a3a' : '#5aa84a'); }
    for (const x of [20, 100, 160, 210]) { p.rect(x, 96, 1, 32, '#5a5a6a'); p.rect(x - 2, 95, 5, 2, night ? '#fff1a8' : '#8a8a9a'); }
    // lòng đường
    p.rect(0, 132, 256, 44, '#4a4a58'); p.rect(0, 132, 256, 2, '#8a8a98');
    for (let x = 0; x < 256; x += 20) p.rect(x, 153, 10, 2, '#f6e08a');
    for (let x = 110; x < 146; x += 6) p.rect(x, 134, 4, 40, '#e8e8f0');               // vạch qua đường
    p.rect(0, 176, 256, 16, '#d8d0c4');
    // trạm xe buýt
    p.rect(226, 96, 18, 2, '#3a6ab0'); p.rect(226, 98, 1, 18, '#5a5a6a'); p.rect(243, 98, 1, 18, '#5a5a6a'); p.rect(228, 108, 14, 3, '#8a5a3c');
    p.rect(246, 92, 2, 24, '#5a5a6a'); p.rect(244, 88, 8, 6, '#3a6ab0'); p.px(247, 90, '#ffffff');
  }, null);
}

/** Ô tô nhỏ (nhìn ngang, đi sang phải) */
export const carSprite = (c: string) => makeSprite(`car:${c}`, 26, 12, p => {
  p.rect(1, 5, 24, 5, c); p.rect(6, 1, 13, 5, c); p.rect(8, 2, 4, 3, '#a8d8f0'); p.rect(13, 2, 4, 3, '#a8d8f0');
  p.rect(23, 6, 2, 2, '#fff1a8'); p.rect(1, 6, 1, 2, '#e8604a');
  ellipse(p, 6, 10, 2.5, 2.5, '#2a2a3a'); ellipse(p, 20, 10, 2.5, 2.5, '#2a2a3a'); p.px(6, 10, '#c8c8d8'); p.px(20, 10, '#c8c8d8');
});
/** Xe buýt */
export const busSprite = () => makeSprite('bus', 48, 18, p => {
  p.rect(1, 2, 46, 13, '#f6c64e'); p.rect(1, 2, 46, 2, '#ffe08a'); for (let x = 4; x < 40; x += 7) p.rect(x, 5, 5, 4, '#a8d8f0');
  p.rect(41, 5, 5, 8, '#a8d8f0'); p.rect(1, 11, 46, 1, '#c8a020');
  ellipse(p, 10, 15, 3, 3, '#2a2a3a'); ellipse(p, 38, 15, 3, 3, '#2a2a3a');
});
