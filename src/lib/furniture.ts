// Đồ trang trí vẽ tay: nội thất nhìn nghiêng cho nhà gỗ/phòng ngủ, đồ treo tường, đồ vườn.
// Món nào không có ở đây sẽ dùng hình pixel tự sinh từ emoji (xem emojiSprite).
import { ellipse, isoSprite, shade, type IsoPen } from './iso';
import { EXTRA_ART } from './appliances';
import { HOLIDAY_ART } from './holiday';
import { makeSprite, mix, type Pen, type Sprite } from './pixel';

// hang: treo được — đặt trên sàn, ngoài vườn, hoặc treo lên tường
export type Place = 'floor' | 'wall' | 'garden' | 'any' | 'hang';
export interface Art {
  place: Place;
  size?: [number, number];   // số ô chiếm (theo gx, theo gy); mặc định 1×1
  sprite: () => Sprite;
  glow?: boolean;            // tỏa sáng khi trời tối
  flat?: boolean;            // nằm sát đất (thảm, đá lót) — luôn ở dưới mọi thứ
}

const WOOD = '#c99366';
const WOOD_D = '#a8703f';
const CREAM = '#fbefdc';
const PINK = '#f4a7b9';
const LEAF = '#a5d470';

function bearEars(q: IsoPen, x: number, y: number, c: string) {
  q.ellipse(x - 4, y, 3, 3, c);
  q.ellipse(x + 4, y, 3, 3, c);
  q.ellipse(x - 4, y, 1.4, 1.4, mix(c, '#ffffff', 0.35));
  q.ellipse(x + 4, y, 1.4, 1.4, mix(c, '#ffffff', 0.35));
}

function leaves(p: Pen, cx: number, cy: number, r: number, base = LEAF, seed = 0) {
  const blobs: [number, number, number][] = [[0, 0, 1], [-0.6, 0.25, 0.7], [0.6, 0.3, 0.7], [-0.25, -0.55, 0.65], [0.35, -0.45, 0.6]];
  blobs.forEach(([dx, dy, k], i) => ellipse(p, cx + dx * r, cy + dy * r, r * k * 0.75, r * k * 0.7, i % 2 ? mix(base, '#2f6b3a', 0.15) : base));
  for (let i = 0; i < 6; i++) {
    const a = (i * 2.4 + seed) % 6.28;
    p.px(Math.round(cx + Math.cos(a) * r * 0.5), Math.round(cy + Math.sin(a) * r * 0.4 - 1), mix(base, '#ffffff', 0.4));
  }
}

// ───────── Nội thất (isometric) ─────────

const bed = () => isoSprite('bed', 2, 3, 30, q => {
  const w = shade(WOOD);
  q.box(0, 0, 0, 2, 0.3, 20, w);                                // đầu giường
  bearEars(q, ...xy(q.pt(1, 0.15, 21)), WOOD_D);
  q.box(0, 0.3, 0, 2, 2.7, 6, w);                               // khung
  q.box(0.1, 0.35, 6, 1.8, 2.55, 3, shade(CREAM, 0.6));          // nệm
  q.box(0.2, 0.5, 9, 0.75, 0.55, 3, shade('#fff8ee', 0.5));      // gối có tai thỏ
  q.box(1.05, 0.5, 9, 0.75, 0.55, 3, shade('#fff8ee', 0.5));
  for (const g of [0.45, 1.3]) { const [x, y] = q.pt(g, 0.7, 12); q.px(x - 1, y - 1, PINK); q.px(x + 1, y - 1, PINK); }
  q.box(0.05, 1.2, 6, 1.9, 1.75, 5, shade('#e8946a'));           // chăn
  q.flat(0.05, 1.2, 11, 1.9, 0.3, '#f6c0a0');                     // mép chăn gập
  q.box(0, 2.9, 0, 2, 0.12, 9, w);                               // chân giường
});

const wardrobe = () => isoSprite('wardrobe', 2, 1, 40, q => {
  const w = shade(WOOD);
  q.box(0.05, 0.1, 0, 1.9, 0.8, 34, w);
  q.box(0, 0.05, 34, 2, 0.9, 3, shade(WOOD_D));
  const [x0, y0] = q.pt(1, 0.9, 3), [, y1] = q.pt(1, 0.9, 32);
  q.rect(x0, y1, 1, y0 - y1, WOOD_D);                            // khe hai cánh tủ
  for (const g of [0.85, 1.15]) { const [x, y] = q.pt(g, 0.9, 18); q.rect(x, y, 1, 3, '#f6c64e'); }
  const [hx, hy] = q.pt(0.45, 0.9, 27);                          // hình trái tim trên cánh
  q.px(hx, hy, PINK); q.px(hx + 2, hy, PINK); q.rect(hx, hy + 1, 3, 1, PINK); q.px(hx + 1, hy + 2, PINK);
});

const nightstand = () => isoSprite('nightstand', 1, 1, 18, q => {
  q.box(0.1, 0.1, 0, 0.8, 0.8, 11, shade(WOOD));
  const [x, y] = q.pt(0.5, 0.9, 6); q.rect(x - 3, y, 6, 1, WOOD_D); q.px(x, y - 2, '#f6c64e');
  q.box(0.3, 0.3, 11, 0.4, 0.35, 3, shade('#f7e6d4', 0.5));       // hộp khăn giấy
  const [tx, ty] = q.pt(0.5, 0.45, 14); q.rect(tx, ty - 2, 1, 2, '#ffffff');
});

const floorLamp = () => isoSprite('floor_lamp', 1, 1, 34, q => {
  q.flat(0.3, 0.3, 0, 0.4, 0.4, '#8a5a3c');
  const [x, y] = q.pt(0.5, 0.5, 0);
  q.rect(x, y - 22, 1, 22, '#8a5a3c');
  q.box(0.18, 0.18, 21, 0.64, 0.64, 9, { top: '#fff1b8', left: '#f6c64e', right: '#e8b84a' });
});

const pottedPlant = () => isoSprite('potted_plant', 1, 1, 28, q => {
  q.box(0.25, 0.25, 0, 0.5, 0.5, 7, shade('#d9895a'));
  const [x, y] = q.pt(0.5, 0.5, 15);
  leaves(q, x, y, 8, LEAF, 1);
});

const bearChair = () => isoSprite('chair', 1, 1, 26, q => {
  const w = shade(WOOD);
  q.box(0.2, 0.2, 0, 0.12, 0.12, 6, w); q.box(0.68, 0.2, 0, 0.12, 0.12, 6, w);
  q.box(0.2, 0.68, 0, 0.12, 0.12, 6, w); q.box(0.68, 0.68, 0, 0.12, 0.12, 6, w);
  q.box(0.15, 0.15, 6, 0.7, 0.7, 2, w);
  q.flat(0.22, 0.25, 8, 0.56, 0.55, '#f2b8c6');                  // nệm hồng
  q.box(0.15, 0.1, 8, 0.7, 0.14, 10, w);                         // tựa lưng
  bearEars(q, ...xy(q.pt(0.5, 0.15, 19)), WOOD);
});

const lowTable = () => isoSprite('low_table', 2, 1, 14, q => {
  const w = shade(WOOD);
  for (const [a, b] of [[0.1, 0.15], [1.8, 0.15], [0.1, 0.75], [1.8, 0.75]]) q.box(a, b, 0, 0.12, 0.12, 6, w);
  q.box(0, 0.05, 6, 2, 0.9, 2, w);
  q.flat(0.6, 0.25, 8, 0.8, 0.5, '#fff8ee');                      // khăn bàn
  const [x, y] = q.pt(1, 0.5, 8);
  leaves(q, x, y - 2, 3, '#7cc576', 3);                          // chậu cây nhỏ
});

const roundRug = () => isoSprite('round_rug', 2, 2, 2, q => {
  const [x, y] = q.pt(1, 1, 0);
  q.ellipse(x, y, 19, 9.5, '#e8d6b8');
  q.ellipse(x, y, 16, 8, '#fbf3e4');
  q.ellipse(x, y, 10, 5, '#f6e0c4');
  q.ellipse(x, y, 5, 2.5, '#fbf3e4');
}, '#c9a882');

const sofa = () => isoSprite('sofa', 2, 1, 20, q => {
  const c = shade(PINK);
  q.box(0, 0.1, 0, 2, 0.85, 7, c);
  q.box(0, 0.05, 7, 2, 0.25, 9, c);                              // tựa
  q.box(0, 0.1, 7, 0.22, 0.85, 4, c);                            // tay vịn
  q.box(1.78, 0.1, 7, 0.22, 0.85, 4, c);
  q.flat(0.25, 0.35, 7, 0.7, 0.55, '#f9c6d2');
  q.flat(1.05, 0.35, 7, 0.7, 0.55, '#f9c6d2');
  q.box(1.2, 0.3, 7, 0.35, 0.18, 4, shade('#f6c64e'));           // gối vàng
});

const bookshelf = () => isoSprite('bookshelf', 2, 1, 36, q => {
  q.box(0.05, 0.1, 0, 1.9, 0.6, 30, shade(WOOD));
  q.poly([q.pt(0.15, 0.7, 2), q.pt(1.85, 0.7, 2), q.pt(1.85, 0.7, 28), q.pt(0.15, 0.7, 28)], '#7a4a34');
  const cols = ['#f59ab3', '#8db8ef', '#d6f1a4', '#f6c64e', '#b9a2e8', '#f5a36c', '#ffffff'];
  for (const z of [3, 12, 21]) {
    const [sx, sy] = q.pt(0.15, 0.7, z), [ex] = q.pt(1.85, 0.7, z);
    q.poly([q.pt(0.15, 0.7, z), q.pt(1.85, 0.7, z), q.pt(1.85, 0.7, z - 1), q.pt(0.15, 0.7, z - 1)], WOOD);
    for (let x = sx + 1, i = z; x < ex - 1; x += 2, i++) {
      const h = Math.max(3, Math.round((5 + ((i * 7) % 3)) * q.k));
      const y = sy + Math.round((x - sx) * 0.5);
      q.rect(x, y - h, 2, h, cols[(i * 3) % cols.length]);
    }
  }
});

const teddy = () => isoSprite('teddy', 1, 1, 18, q => {
  const [x, y] = q.pt(0.5, 0.5, 0);
  const b = '#c98b5a', l = '#f3d2b0';
  q.ellipse(x, y - 5, 5, 4.5, b);                                // thân
  q.ellipse(x, y - 4, 2.6, 2.4, l);
  q.ellipse(x, y - 12, 4.5, 4, b);                               // đầu
  q.ellipse(x - 4, y - 15, 1.8, 1.8, b); q.ellipse(x + 4, y - 15, 1.8, 1.8, b);
  q.ellipse(x, y - 11, 1.8, 1.3, l);
  q.px(x - 2, y - 13, '#3b2d3f'); q.px(x + 2, y - 13, '#3b2d3f'); q.px(x, y - 12, '#3b2d3f');
  q.px(x - 3, y - 11, PINK); q.px(x + 3, y - 11, PINK);
});

const desk = () => isoSprite('desk', 2, 1, 26, q => {
  const w = shade(WOOD);
  q.box(0.05, 0.1, 0, 0.4, 0.8, 12, w);                          // ngăn kéo
  q.box(1.85, 0.1, 0, 0.12, 0.12, 12, w); q.box(1.85, 0.78, 0, 0.12, 0.12, 12, w);
  q.box(0, 0.05, 12, 2, 0.9, 2, w);
  q.box(0.8, 0.25, 14, 0.7, 0.45, 1, shade('#d8dbe6'));          // laptop
  q.poly([q.pt(0.8, 0.25, 15), q.pt(1.5, 0.25, 15), q.pt(1.5, 0.25, 23), q.pt(0.8, 0.25, 23)], '#bcd8f2');
  const [x, y] = q.pt(0.3, 0.5, 14); q.rect(x - 1, y - 4, 3, 4, '#f6c64e'); q.ellipse(x, y - 6, 3, 2, '#fff1b8'); // đèn bàn
});

// ───────── Đồ treo tường (vẽ thẳng, khi hiển thị sẽ được nghiêng theo tường) ─────────

const painting = () => makeSprite('wall:painting', 14, 11, p => {
  p.rect(0, 0, 14, 11, '#b98256'); p.rect(1, 1, 12, 9, '#cfe8f7');
  p.rect(1, 6, 12, 4, '#d6f1a4'); p.rect(4, 4, 3, 3, '#f6c64e'); p.rect(8, 5, 4, 2, '#ffffff');
}, '#5a3a2e');
const clock = () => makeSprite('wall:clock', 11, 11, p => {
  ellipse(p, 5.5, 5.5, 5.5, 5.5, '#c99366'); ellipse(p, 5.5, 5.5, 4.2, 4.2, '#fff8ee');
  p.rect(5, 2, 1, 4, '#5a3a2e'); p.rect(5, 5, 3, 1, '#5a3a2e');
}, '#5a3a2e');
const mirror = () => makeSprite('wall:mirror', 10, 15, p => {
  ellipse(p, 5, 7.5, 5, 7.5, '#e8c070'); ellipse(p, 5, 7.5, 3.8, 6.2, '#d7ecf7');
  p.rect(3, 3, 1, 4, '#ffffff'); p.px(4, 2, '#ffffff');
}, '#5a3a2e');
const bunting = () => makeSprite('wall:bunting', 20, 8, p => {
  for (let x = 0; x < 20; x++) p.px(x, Math.round(Math.abs(x - 10) / 5), '#8a5a3c');
  ['#f59ab3', '#f6c64e', '#d6f1a4', '#8db8ef'].forEach((c, i) => {
    const x0 = 1 + i * 5, y0 = 1 + Math.round(Math.abs(x0 + 1.5 - 10) / 5);
    for (let r = 0; r < 4; r++) p.rect(x0 + Math.floor(r / 2), y0 + r, 4 - Math.floor(r / 2) * 2, 1, c);
  });
}, null);
const wallShelf = () => makeSprite('wall:shelf', 18, 12, p => {
  p.rect(0, 9, 18, 2, '#a8703f'); p.rect(2, 11, 1, 1, '#a8703f'); p.rect(15, 11, 1, 1, '#a8703f');
  p.rect(2, 5, 4, 4, '#d9895a'); leaves(p, 4, 3, 3, LEAF, 2);
  p.rect(8, 2, 5, 7, '#fff8ee'); p.rect(9, 3, 3, 4, '#f6c0a0');
  p.rect(14, 6, 2, 3, '#8db8ef');
}, '#5a3a2e');
const photoString = () => makeSprite('wall:photos', 22, 10, p => {
  for (let x = 0; x < 22; x++) p.px(x, Math.round(Math.abs(x - 11) / 6), '#8a5a3c');
  ['#f6c0a0', '#bcd8f2', '#c9e8b8'].forEach((c, i) => {
    const x0 = 2 + i * 7, y0 = 2 + (i === 1 ? 0 : 1);
    p.rect(x0, y0, 5, 6, '#ffffff'); p.rect(x0 + 1, y0 + 1, 3, 3, c); p.px(x0 + 2, y0 - 1, '#e8505b');
  });
}, null);
const heartFrame = () => makeSprite('wall:heart', 11, 10, p => p.map([
  '.RRR...RRR.', 'RRPPR.RPPRR', 'RPWPPRPPPPR', 'RPPPPPPPPPR', 'RPPPPPPPPPR', '.RPPPPPPPR.', '..RPPPPPR..', '...RPPPR...', '....RPR....', '.....R.....',
], { R: '#e86a8a', P: '#f9c6d2', W: '#ffffff' }), '#5a3a2e');

// ───────── Đồ vườn (nhìn chính diện hơi từ trên xuống) ─────────

const hedge = () => makeSprite('g:hedge:v2', 16, 15, p => {
  p.rect(0, 1, 16, 14, '#86c257');
  p.rect(0, 10, 16, 5, '#76b44a');
  p.rect(0, 14, 16, 1, '#5f9a3e');
  p.rect(0, 1, 16, 9, '#b5df7e');
  p.rect(1, 1, 14, 1, '#cdeb9a');
  for (let x = 1; x < 15; x += 3) for (let y = 3; y < 10; y += 3) if ((x + y) % 2) p.px(x, y, '#d6f1a4');
  for (let x = 2; x < 15; x += 4) p.px(x, 12, '#6aa645');
}, '#4f7a3a');

function flowerBed(key: string, petal: string, center: string, tall = false) {
  return () => makeSprite(`g:${key}`, 16, tall ? 20 : 14, p => {
    const oy = tall ? 6 : 0;
    p.rect(1, 9 + oy, 14, 5, '#8a6a4a');
    p.rect(1, 9 + oy, 14, 1, '#a8825a');
    for (const [x, y] of [[3, 4], [8, 2], [13, 4], [5, 8], [11, 8]]) {
      p.rect(x, y + 2 + oy, 1, 6 - (y > 5 ? 3 : 0), '#86c257');
      p.px(x - 1, y + 5 + oy, '#a5d470'); p.px(x + 1, y + 6 + oy, '#a5d470');
      if (tall) p.rect(x, y + oy - 4, 1, 6, '#86c257');
      const fy = tall ? y + oy - 6 : y;
      p.rect(x - 1, fy, 3, 3, petal); p.px(x, fy - 1, petal); p.px(x, fy + 1, center);
    }
  }, '#3b5a3a');
}

const roseArch = () => makeSprite('g:rose_arch', 26, 30, p => {
  for (let a = 0; a <= 26; a++) {
    const t = (a / 26) * Math.PI;
    const x = 13 - Math.cos(t) * 11, y = 13 - Math.sin(t) * 11;
    p.rect(Math.round(x) - 1, Math.round(y), 3, 2, '#fbf6ee');
  }
  p.rect(1, 13, 3, 17, '#fbf6ee'); p.rect(22, 13, 3, 17, '#fbf6ee');
  for (let i = 0; i < 16; i++) {
    const t = (i / 15) * Math.PI, x = 13 - Math.cos(t) * 11, y = 13 - Math.sin(t) * 11;
    ellipse(p, x, y, 2, 1.6, i % 2 ? '#a5d470' : '#86c257');
    if (i % 2 === 0) ellipse(p, x + 0.5, y - 0.5, 1.3, 1.3, i % 4 ? '#f59ab3' : '#e0718f');
  }
  for (const y of [17, 22, 27]) { ellipse(p, 2.5, y, 2, 1.6, '#a5d470'); ellipse(p, 23.5, y + 2, 2, 1.6, '#a5d470'); p.px(2, y - 1, '#f59ab3'); p.px(23, y + 1, '#f59ab3'); }
}, '#5a5a6a');

const gazebo = () => makeSprite('g:gazebo', 30, 38, p => {
  ellipse(p, 15, 35, 14, 3, '#e8e0d4');                          // nền đá
  for (const x of [3, 9, 15, 21, 27]) p.rect(x, 14, 1, 21, '#fbf6ee'); // song lồng chim
  p.rect(2, 22, 27, 1, '#fbf6ee');
  for (let i = 0; i < 14; i++) {                                  // mái vòm
    const half = Math.round(Math.sqrt(Math.max(0, 196 - (14 - i) * (14 - i))));
    p.rect(15 - half, i + 1, half * 2, 1, i < 3 ? '#fff' : mix('#fbf6ee', '#e8d8c8', i / 14));
  }
  p.rect(14, 0, 2, 2, '#e8c070');
  for (let i = 0; i < 9; i++) ellipse(p, 3 + i * 3, 14 + (i % 2), 1.8, 1.4, i % 2 ? '#a5d470' : '#d6f1a4'); // dây leo
  for (const [x, y] of [[4, 13], [11, 15], [19, 13], [26, 15], [3, 26], [27, 24]]) p.px(x, y, '#f59ab3');
  p.rect(10, 28, 10, 2, '#c99366');                               // ghế bên trong
}, '#6a6a7a');

const bench = () => makeSprite('g:bench', 20, 14, p => {
  p.rect(1, 2, 18, 2, WOOD); p.rect(1, 5, 18, 2, WOOD);
  p.rect(0, 8, 20, 3, '#d9a070'); p.rect(0, 8, 20, 1, '#e8b88a');
  p.rect(2, 11, 2, 3, '#6b4630'); p.rect(16, 11, 2, 3, '#6b4630');
  p.rect(2, 2, 1, 7, '#6b4630'); p.rect(17, 2, 1, 7, '#6b4630');
}, '#4a3020');

const lampPost = () => makeSprite('g:lamp_post', 8, 30, p => {
  p.rect(3, 8, 2, 20, '#3f4a5a'); p.rect(1, 27, 6, 3, '#3f4a5a');
  p.rect(1, 2, 6, 6, '#fff1b8'); p.rect(0, 1, 8, 1, '#3f4a5a'); p.rect(1, 0, 6, 1, '#3f4a5a');
  p.rect(1, 8, 6, 1, '#3f4a5a'); p.rect(3, 3, 2, 4, '#fbe6a0');
}, '#2a3040');

const birdbath = () => makeSprite('g:birdbath', 14, 16, p => {
  p.rect(5, 6, 4, 8, '#d8d4cc'); p.rect(3, 13, 8, 3, '#c8c2b8');
  ellipse(p, 7, 5, 7, 2.6, '#e8e4dc'); ellipse(p, 7, 4.6, 5.4, 1.6, '#9fd3f2');
  p.px(5, 4, '#ffffff');
  p.rect(10, 1, 3, 2, '#8db8ef'); p.px(12, 0, '#8db8ef'); p.px(13, 1, '#f6c64e');  // chú chim nhỏ
}, '#6a6660');

const picketFence = () => makeSprite('g:fence', 16, 12, p => {
  for (let x = 0; x < 16; x += 4) { p.rect(x + 1, 1, 2, 11, '#fbf6ee'); p.px(x + 1, 0, '#fbf6ee'); p.rect(x + 1, 11, 2, 1, '#e0d8cc'); }
  p.rect(0, 4, 16, 1, '#e8e0d4'); p.rect(0, 8, 16, 1, '#e8e0d4');
}, '#8a8070');

const cherryTree = () => makeSprite('g:cherry_tree', 26, 32, p => {
  p.rect(11, 18, 4, 14, '#8a5a3c'); p.rect(9, 30, 8, 2, '#8a5a3c'); p.rect(14, 20, 4, 2, '#8a5a3c');
  leaves(p, 13, 12, 12, '#f6b8cc', 4);
  for (const [x, y] of [[6, 8], [18, 6], [10, 16], [20, 14], [13, 4]]) p.px(x, y, '#ffffff');
}, '#8a4a5a');

const stonePath = () => makeSprite('g:stones', 16, 10, p => {
  ellipse(p, 4, 4, 3.5, 2.2, '#d8d0c4'); ellipse(p, 11, 6, 4, 2.4, '#e2dace'); ellipse(p, 6, 8, 2.5, 1.5, '#cfc6b8');
  p.px(3, 3, '#f4f0e8'); p.px(10, 5, '#f4f0e8');
}, '#9a9080');

const pondLily = () => makeSprite('g:mini_pond', 22, 12, p => {
  ellipse(p, 11, 6, 11, 6, '#c8c2b8'); ellipse(p, 11, 6, 9, 4.6, '#7cc3e8'); ellipse(p, 11, 5.2, 7, 3, '#9fd3f2');
  ellipse(p, 7, 6, 2.2, 1.3, '#a5d470'); p.px(7, 5, '#f9c6d2'); ellipse(p, 15, 7, 1.8, 1.1, '#a5d470');
}, '#6a6660');

const swing = () => makeSprite('g:swing', 22, 30, p => {
  p.rect(0, 0, 22, 3, WOOD); p.rect(1, 3, 2, 27, WOOD_D); p.rect(19, 3, 2, 27, WOOD_D);
  p.rect(6, 3, 1, 18, '#e8dcc4'); p.rect(15, 3, 1, 18, '#e8dcc4');
  p.rect(5, 21, 12, 2, '#f59ab3');
  for (let i = 0; i < 6; i++) ellipse(p, 2 + i * 3.6, 2 + (i % 2), 1.6, 1.3, i % 2 ? '#a5d470' : '#f6b8cc');
}, '#4a3020');

export const ART: Record<string, Art> = {
  bed: { place: 'floor', size: [2, 3], sprite: bed },
  wardrobe: { place: 'floor', size: [2, 1], sprite: wardrobe },
  nightstand: { place: 'floor', sprite: nightstand },
  floor_lamp: { place: 'floor', sprite: floorLamp, glow: true },
  potted_plant: { place: 'any', sprite: pottedPlant },
  chair: { place: 'any', sprite: bearChair },
  low_table: { place: 'floor', size: [2, 1], sprite: lowTable },
  round_rug: { place: 'floor', size: [2, 2], sprite: roundRug, flat: true },
  sofa: { place: 'floor', size: [2, 1], sprite: sofa },
  bookshelf: { place: 'floor', size: [2, 1], sprite: bookshelf },
  teddy: { place: 'any', sprite: teddy },
  desk: { place: 'floor', size: [2, 1], sprite: desk },

  painting: { place: 'wall', sprite: painting },
  clock: { place: 'wall', sprite: clock },
  mirror: { place: 'wall', sprite: mirror },
  bunting: { place: 'wall', sprite: bunting },
  wall_shelf: { place: 'wall', sprite: wallShelf },
  photo_string: { place: 'wall', sprite: photoString },
  heart_frame: { place: 'wall', sprite: heartFrame },

  hedge: { place: 'garden', sprite: hedge },
  tulip_bed: { place: 'garden', sprite: flowerBed('tulip', '#f59ab3', '#e0718f') },
  daisy_bed: { place: 'garden', sprite: flowerBed('daisy', '#ffffff', '#f6c64e') },
  hydrangea: { place: 'garden', sprite: flowerBed('hydrangea', '#a9b8f2', '#c9a2e8') },
  sunflower: { place: 'garden', sprite: flowerBed('sunflower', '#f6c64e', '#8a5a3c', true) },
  rose_arch: { place: 'garden', sprite: roseArch },
  gazebo: { place: 'garden', size: [2, 2], sprite: gazebo },
  garden_bench: { place: 'garden', sprite: bench },
  lamp_post: { place: 'garden', sprite: lampPost, glow: true },
  birdbath: { place: 'garden', sprite: birdbath },
  picket_fence: { place: 'garden', sprite: picketFence },
  cherry_tree: { place: 'garden', size: [2, 1], sprite: cherryTree },
  stone_path: { place: 'garden', sprite: stonePath, flat: true },
  mini_pond: { place: 'garden', size: [2, 1], sprite: pondLily, flat: true },
  swing: { place: 'garden', size: [2, 1], sprite: swing },
  ...EXTRA_ART,
  ...HOLIDAY_ART,
};

function xy(p: [number, number]): [number, number] {
  return p;
}

/** Nơi một món được đặt: đồ không vẽ tay (emoji) đặt được trên sàn và ngoài vườn */
/** Đồ không vẽ tay nhưng treo được lên tường */
const HANGABLE = new Set(['lantern', 'chime', 'guitar', 'photo_frame', 'den_ca_chep', 'bong_bay_tim']);
export const placeOf = (itemId: string): Place => (HANGABLE.has(itemId) ? 'hang' : ART[itemId]?.place ?? 'any');

/**
 * Cỡ (px) cho đồ vẽ từ emoji, theo kích thước thật so với nhân vật cao ~24 px
 * (ấm trà, nến, radio chỉ cỡ cái đầu; đàn guitar cao tới ngực).
 */
const EMOJI_PX: Record<string, number> = {
  teapot: 8, candle: 7, radio: 9, books: 8, lantern: 10, chime: 9, guitar: 15, photo_frame: 9, gift_box: 9,
  sandcastle: 10, fishing: 14, cactus: 10, flower: 9, pet_bed: 12, pet_toy: 7, pet_ball: 6, pet_food: 7, pet_treat: 6,
};
export const emojiPx = (itemId: string) => EMOJI_PX[itemId] ?? 10;
export const sizeOf = (itemId: string): [number, number] => ART[itemId]?.size ?? [1, 1];

/** Chăn đắp phủ lên người đang nằm (cùng khung với giường để đặt trùng vị trí) */
export const bedQuiltSprite = () => isoSprite('bed-quilt', 2, 3, 30, q => {
  q.box(0, 0.95, 6, 2, 2.0, 7, shade('#f59ab3'));
  q.flat(0, 0.95, 13, 2, 0.3, '#ffd6e2');
  for (const [gx, gy] of [[0.5, 1.6], [1.4, 1.5], [0.9, 2.2], [1.6, 2.5], [0.4, 2.6]]) {
    const [x, y] = q.pt(gx, gy, 13);
    q.px(x - 1, y, '#ffffff'); q.px(x + 1, y, '#ffffff'); q.rect(x - 1, y + 1, 3, 1, '#ffffff'); q.px(x, y + 2, '#ffffff');
  }
});
/** Hai chiếc gối trên giường (tọa độ trong khung giường 2×3) */
export const BED_PILLOWS: [number, number][] = [[0.575, 0.775], [1.425, 0.775]];
