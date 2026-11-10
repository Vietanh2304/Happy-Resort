// Đồ cầm tay vẽ pixel (cốc, ly, đĩa, đũa, que nướng, sách) và cách nhân vật dùng chúng (nhấp, ăn, nướng, đọc).
import { makeSprite, mix, type Pen } from './pixel';

export type PropKind = 'mug' | 'iced' | 'boba' | 'teacup' | 'milk' | 'wine' | 'flute' | 'cocktail' | 'soju' | 'juice'
  | 'chopsticks' | 'fork' | 'spoon' | 'stick' | 'book' | 'rod' | 'can' | 'baby'
  | 'cotton' | 'skewer' | 'drum' | 'cone' | 'pop' | 'bread' | 'pastry' | 'rice' | 'cake' | 'cupnoodle' | 'sandwich' | 'tub' | 'box' | 'choco'
  | 'omikuji' | 'paper' | 'mic' | 'brush' | 'seed' | 'leaf';
export interface PropSpec { kind: PropKind; color: string }
export type HoldMode = 'sip' | 'eat' | 'roast' | 'read' | 'fish' | 'pour' | 'carry';
export interface Hold { spec: PropSpec; mode: HoldMode }
export type Ware = { kind: 'bowl' | 'plate'; color: string };

const has = (s: string, ...k: string[]) => k.some(x => s.includes(x));

/** Đồ uống: loại cốc/ly và màu nước */
export function drinkProp(name: string): PropSpec {
  const n = name.toLowerCase();
  if (has(n, 'sữa chuối')) return { kind: 'milk', color: '#f6e27a' };
  if (has(n, 'trân châu', 'trà sữa')) return { kind: 'boba', color: '#d8b48a' };
  if (has(n, 'cappuccino')) return { kind: 'mug', color: '#c8a07a' };
  if (has(n, 'cà phê muối')) return { kind: 'mug', color: '#d6b48c' };
  if (has(n, 'espresso', 'café au lait')) return { kind: 'mug', color: '#6a3a22' };
  if (has(n, 'ca cao', 'socola nóng', 'sô-cô-la nóng')) return { kind: 'mug', color: '#7a4a32' };
  if (has(n, 'americano')) return { kind: 'iced', color: '#4a2e22' };
  if (has(n, 'bạc xỉu')) return { kind: 'iced', color: '#e2cba8' };
  if (has(n, 'dalgona')) return { kind: 'iced', color: '#e8b070' };
  if (has(n, 'cà phê')) return { kind: 'iced', color: '#a8744a' };
  if (has(n, 'matcha')) return { kind: 'iced', color: '#a8c878' };
  if (has(n, 'trà đào', 'peach')) return { kind: 'iced', color: '#f6b07a' };
  if (has(n, 'hoa cúc')) return { kind: 'teacup', color: '#f2dc7a' };
  if (has(n, 'trà')) return { kind: 'teacup', color: '#c8a05a' };
  if (has(n, 'soju')) return { kind: 'soju', color: '#d8f4dc' };
  if (has(n, 'vang')) return { kind: 'wine', color: '#8a1a3a' };
  if (has(n, 'champagne')) return { kind: 'flute', color: '#f6e6a0' };
  if (has(n, 'cocktail')) return { kind: 'cocktail', color: '#f59ab3' };
  if (has(n, 'cam')) return { kind: 'juice', color: '#f6a040' };
  if (has(n, 'nho', 'grape')) return { kind: 'juice', color: '#8a4aa8' };
  if (has(n, 'dưa hấu', 'sinh tố')) return { kind: 'juice', color: '#f57a8a' };
  return { kind: 'iced', color: '#c8946a' };
}

/** Đồ ăn vặt cầm tay ngoài phố (kẹo bông, xiên mực, kem…); null = không phải đồ cầm tay */
export function snackProp(name: string): PropSpec | null {
  const n = name.toLowerCase();
  const R: [string[], PropKind, string][] = [
    [['kẹo bông'], 'cotton', '#f8b8d8'], [['kẹo dẻo'], 'cotton', '#a8e0f0'], [['mực'], 'skewer', '#e8a060'], [['tteokbokki'], 'skewer', '#e85a3a'],
    [['gà rán', 'gà/tôm', 'gà'], 'drum', '#d8903a'], [['kem que'], 'pop', '#f8a8c8'], [['gelato', 'kem'], 'cone', '#f8e0a8'], [['bánh mì'], 'bread', '#e8b060'],
    [['bánh tráng'], 'bread', '#f0d090'], [['croissant'], 'pastry', '#e8a850'], [['onigiri'], 'rice', '#fffaf0'], [['macaron'], 'cake', '#f59ab3'], [['tiramisu'], 'cake', '#a87850'],
    [['mì ly'], 'cupnoodle', '#f6c445'], [['sandwich'], 'sandwich', '#f0d8a8'], [['skyr'], 'tub', '#fffaf0'], [['sushi'], 'box', '#ffffff'], [['sô-cô-la'], 'choco', '#c8c8d0'], [['phô mai'], 'skewer', '#f6d860'],
  ];
  for (const [ks, kind, color] of R) if (has(n, ...ks)) return { kind, color };
  return null;
}

/** Món ăn: bát hay đĩa trên bàn, màu món, ăn bằng đũa / nĩa / thìa */
export function foodProp(name: string): { ware: Ware; utensil: PropSpec } {
  const n = name.toLowerCase();
  const color =
    has(n, 'dâu', 'kem dâu', 'macaron') ? '#f59ab3' : has(n, 'sô-cô-la', 'socola', 'donut') ? '#8a5a3c' : has(n, 'flan', 'bí', 'pie') ? '#f2b84a'
      : has(n, 'kem') ? '#fff0f4' : has(n, 'tteokbokki', 'cay', 'kimchi') ? '#e85a3a' : has(n, 'phở', 'mì bò', 'súp') ? '#f2d8a0'
        : has(n, 'mì ý', 'pizza', 'tôm') ? '#f08a4a' : has(n, 'bít tết', 'thịt', 'bbq') ? '#8a4a32' : has(n, 'gỏi', 'salad', 'rau') ? '#8cc65c'
          : has(n, 'cơm', 'sushi', 'kimbap', 'bibimbap') ? '#fffaf0' : has(n, 'gà') ? '#d8903a' : '#e8a060';
  const bowl = has(n, 'mì', 'phở', 'bún', 'súp', 'canh', 'bibimbap', 'tteokbokki', 'kem', 'curry', 'cơm', 'kimchi', 'ngô');
  const asian = has(n, 'mì', 'phở', 'bún', 'cơm', 'sushi', 'kimbap', 'bibimbap', 'tteokbokki', 'tiểu long', 'gỏi', 'kimchi', 'gà rán', 'bbq', 'thịt nướng');
  const spoon = has(n, 'súp', 'kem', 'flan', 'curry', 'canh', 'bánh kem');
  return { ware: { kind: bowl ? 'bowl' : 'plate', color }, utensil: { kind: spoon ? 'spoon' : asian ? 'chopsticks' : 'fork', color } };
}

// ───────── Vẽ đồ cầm tay ─────────
// (gx, gy) = chỗ bàn tay cầm. phase 1 = đang đưa lên miệng / đang làm động tác.

const GLASS = '#e8f6ff', GLASS_D = '#b8d8ec', WHITE = '#fffaf0';
export function drawProp(p: Pen, s: PropSpec, gx: number, gy: number, phase: 0 | 1) {
  const c = s.color, cd = mix(c, '#2a1a1a', 0.25), cl = mix(c, '#ffffff', 0.45);
  switch (s.kind) {
    case 'mug':
      p.rect(gx, gy - 3, 3, 4, WHITE); p.rect(gx, gy - 3, 3, 1, c); p.px(gx + 3, gy - 2, WHITE); p.px(gx + 3, gy - 1, WHITE);
      if (!phase) { p.px(gx + 1, gy - 5, '#ffffff'); p.px(gx + 2, gy - 6, '#f2f2f2'); }
      break;
    case 'iced':
      p.rect(gx, gy - 4, 3, 5, GLASS); p.rect(gx, gy - 3, 3, 4, c); p.px(gx, gy - 2, '#ffffff'); p.px(gx + 2, gy - 1, cl);
      p.rect(gx + 2, gy - 6, 1, 3, '#f08aa6');
      break;
    case 'boba':
      p.rect(gx, gy - 4, 4, 5, mix(c, '#ffffff', 0.15)); p.rect(gx, gy - 5, 4, 1, GLASS); p.rect(gx + 1, gy - 6, 2, 1, GLASS);
      p.px(gx, gy, '#3a2420'); p.px(gx + 2, gy, '#3a2420'); p.px(gx + 1, gy - 1, '#3a2420'); p.px(gx + 3, gy - 1, '#3a2420');
      p.rect(gx + 2, gy - 8, 1, 3, '#f08aa6');
      break;
    case 'teacup':
      p.rect(gx, gy - 2, 3, 2, WHITE); p.rect(gx, gy - 2, 3, 1, c); p.px(gx + 3, gy - 1, WHITE); p.rect(gx - 1, gy, 5, 1, '#f2d0dc');
      if (!phase) p.px(gx + 1, gy - 4, '#ffffff');
      break;
    case 'milk':
      p.rect(gx, gy - 3, 3, 4, c); p.rect(gx + 1, gy - 4, 1, 1, cl); p.px(gx, gy - 2, cl); p.rect(gx, gy, 3, 1, cd);
      p.rect(gx + 1, gy - 6, 1, 2, '#ffffff');
      break;
    case 'wine':
      p.rect(gx, gy - 4, 3, 2, c); p.px(gx, gy - 5, GLASS); p.px(gx + 2, gy - 5, GLASS); p.px(gx + 1, gy - 2, GLASS_D); p.px(gx + 1, gy - 1, GLASS_D); p.rect(gx, gy, 3, 1, GLASS_D);
      break;
    case 'flute':
      p.rect(gx + 1, gy - 5, 2, 3, c); p.px(gx + 1, gy - 4, '#ffffff'); p.px(gx + 1, gy - 2, GLASS_D); p.px(gx + 1, gy - 1, GLASS_D); p.rect(gx, gy, 3, 1, GLASS_D);
      break;
    case 'cocktail':
      p.rect(gx - 1, gy - 4, 5, 1, c); p.rect(gx, gy - 3, 3, 1, c); p.px(gx + 1, gy - 2, GLASS_D); p.px(gx + 1, gy - 1, GLASS_D); p.rect(gx, gy, 3, 1, GLASS_D); p.px(gx + 3, gy - 5, '#8cc65c');
      break;
    case 'soju':
      p.rect(gx, gy - 2, 2, 3, GLASS); p.rect(gx, gy - 1, 2, 2, c);
      break;
    case 'juice':
      p.rect(gx, gy - 4, 3, 5, GLASS); p.rect(gx, gy - 3, 3, 4, c); p.px(gx + 3, gy - 4, '#f6c64e'); p.rect(gx + 1, gy - 6, 1, 3, '#7ac8e8');
      break;
    case 'chopsticks':
      for (let i = 0; i < 5; i++) { p.px(gx + 1 + i, gy - 1 - i, '#c98a52'); p.px(gx + 2 + i, gy - 1 - i, '#a8703f'); }
      if (phase) p.rect(gx + 5, gy - 6, 2, 2, c);
      break;
    case 'fork':
      for (let i = 0; i < 4; i++) p.px(gx + 1 + i, gy - 1 - i, '#c8c8d0');
      p.px(gx + 5, gy - 5, '#c8c8d0'); p.px(gx + 6, gy - 5, '#c8c8d0'); p.px(gx + 5, gy - 6, '#c8c8d0'); p.px(gx + 6, gy - 4, '#c8c8d0');
      if (phase) p.rect(gx + 5, gy - 7, 2, 2, c);
      break;
    case 'spoon':
      for (let i = 0; i < 3; i++) p.px(gx + 1 + i, gy - 1 - i, '#c8c8d0');
      p.rect(gx + 4, gy - 5, 2, 2, '#c8c8d0');
      if (phase) p.px(gx + 4, gy - 5, c);
      break;
    case 'stick': {
      // Que xiên chìa ra phía trước (về phía lửa), kẹo dẻo ở đầu que
      const dy = phase ? 1 : 0;
      for (let i = 1; i <= 6; i++) p.px(gx + i, gy - Math.floor(i / 2) + (i > 3 ? dy : 0), '#a8703f');
      p.rect(gx + 6, gy - 4 + dy, 2, 2, c);
      p.px(gx + 6, gy - 4 + dy, mix(c, '#ffffff', 0.4));
      break;
    }
    case 'rod': {
      // Cần câu chĩa lên trời, dây buông xuống nước; cá cắn câu thì đầu cần cong xuống
      const n = 9;
      for (let i = 1; i <= n; i++) p.px(gx + i, gy - i + (phase && i > 6 ? i - 6 : 0), i < 3 ? '#8a5a3c' : '#c98a52');
      const tx = gx + n, ty = gy - n + (phase ? 3 : 0);
      for (let j = 1; j <= 9 - (phase ? 3 : 0); j++) p.px(tx, ty + j, '#e8f0f8');
      break;
    }
    case 'can':
      p.rect(gx, gy - 2, 4, 3, '#7ac8e8'); p.rect(gx, gy - 2, 4, 1, '#a8dcf0'); p.rect(gx + 1, gy - 4, 2, 1, '#5aa8c8'); p.px(gx, gy - 3, '#5aa8c8'); p.px(gx + 3, gy - 3, '#5aa8c8');
      p.px(gx + 4, gy - 2, '#5aa8c8'); p.px(gx + 5, gy - 3 + phase, '#5aa8c8');
      if (phase) { p.px(gx + 6, gy - 1, '#8fd4ff'); p.px(gx + 6, gy + 1, '#8fd4ff'); p.px(gx + 7, gy + 2, '#8fd4ff'); }
      break;
    case 'baby':
      p.rect(gx, gy - 3, 7, 4, c); p.rect(gx + 1, gy - 2, 5, 2, cl);
      p.rect(gx + 4 - phase, gy - 5, 3, 3, '#fde3d0'); p.px(gx + 4 - phase, gy - 5, '#7a4e34');
      p.px(gx + 5 - phase, gy - 4, '#3b2d3f');
      break;
    case 'cotton':   // kẹo bông trên que
      p.rect(gx + 1, gy - 3, 1, 4, '#e8dcc8'); p.rect(gx - 1, gy - 8, 5, 5, c); p.rect(gx, gy - 9, 3, 1, c); p.px(gx, gy - 7, cl); p.px(gx + 2, gy - 6, cl);
      break;
    case 'skewer':   // xiên nướng (mực, bánh gạo, gà)
      for (let i = 0; i < 7; i++) p.px(gx + 1 + Math.floor(i / 2), gy - i, '#c8a878');
      for (let k = 0; k < 3; k++) p.rect(gx + 2 + k, gy - 4 - k * 2, 3, 2, k % 2 ? cd : c);
      break;
    case 'drum':     // đùi gà rán to
      p.rect(gx, gy - 1, 2, 2, WHITE); p.rect(gx + 1, gy - 6, 5, 5, c); p.rect(gx + 2, gy - 7, 3, 1, c); p.px(gx + 2, gy - 5, cl); p.px(gx + 4, gy - 3, cd);
      break;
    case 'cone':     // kem ốc quế / gelato
      for (let i = 0; i < 4; i++) p.rect(gx + Math.floor(i / 2), gy - i, 4 - Math.floor(i / 2) * 2 || 1, 1, '#d8a050');
      p.rect(gx - 1, gy - 7, 5, 3, c); p.rect(gx, gy - 8, 3, 1, c); p.px(gx, gy - 6, cl);
      break;
    case 'pop':      // kem que
      p.rect(gx + 1, gy - 1, 1, 2, '#e8d0a0'); p.rect(gx, gy - 6, 3, 5, c); p.px(gx, gy - 5, cl); p.rect(gx, gy - 6, 3, 1, cl);
      break;
    case 'bread':    // ổ bánh mì
      p.rect(gx - 1, gy - 3, 8, 3, c); p.rect(gx, gy - 4, 6, 1, cl); for (let k = 0; k < 3; k++) p.px(gx + 1 + k * 2, gy - 3, cd);
      p.rect(gx, gy - 1, 6, 1, '#8cc65c');
      break;
    case 'pastry':   // croissant
      p.rect(gx, gy - 3, 6, 3, c); p.px(gx - 1, gy - 1, c); p.px(gx + 6, gy - 1, c); p.px(gx + 2, gy - 3, cd); p.px(gx + 4, gy - 2, cd); p.rect(gx + 1, gy - 4, 4, 1, cl);
      break;
    case 'rice':     // nắm cơm onigiri rong biển
      p.rect(gx + 1, gy - 5, 2, 1, WHITE); p.rect(gx, gy - 4, 4, 2, WHITE); p.rect(gx - 1, gy - 2, 6, 2, WHITE); p.rect(gx, gy - 2, 4, 2, '#2a3a2a');
      break;
    case 'cake':     // miếng bánh / macaron
      p.rect(gx, gy - 4, 5, 4, c); p.rect(gx, gy - 4, 5, 1, cl); p.rect(gx, gy - 2, 5, 1, WHITE); p.px(gx + 2, gy - 5, '#e84a5a');
      break;
    case 'cupnoodle':
      p.rect(gx, gy - 4, 4, 5, WHITE); p.rect(gx, gy - 3, 4, 1, '#e8443a'); p.rect(gx - 1, gy - 5, 6, 1, '#f0e8d0'); p.px(gx + 1, gy - 7, '#ffffff'); p.px(gx + 2, gy - 8, '#f2f2f2');
      break;
    case 'sandwich':
      for (let i = 0; i < 4; i++) p.rect(gx, gy - 1 - i, 6 - i, 1, i === 1 ? '#8cc65c' : i === 2 ? '#f6c445' : '#f0d8a8');
      break;
    case 'tub':      // hũ sữa chua skyr + thìa
      p.rect(gx, gy - 3, 4, 4, WHITE); p.rect(gx, gy - 3, 4, 1, '#5a8ad0'); p.px(gx + 4, gy - 5, '#c8c8d0'); p.px(gx + 3, gy - 4, '#c8c8d0');
      break;
    case 'box':      // hộp sushi
      p.rect(gx - 1, gy - 3, 8, 4, '#2a2a2a'); p.rect(gx - 1, gy - 3, 8, 1, '#c83a2a'); for (let k = 0; k < 3; k++) { p.rect(gx + k * 2, gy - 2, 2, 2, WHITE); p.px(gx + k * 2, gy - 2, k % 2 ? '#f6a07a' : '#e85a5a'); }
      break;
    case 'choco':    // thanh sô-cô-la bóc vỏ
      p.rect(gx, gy - 5, 4, 6, '#5a3020'); p.rect(gx, gy - 2, 4, 3, c); p.px(gx + 1, gy - 4, '#7a4a32'); p.px(gx + 2, gy - 5, '#7a4a32');
      break;
    case 'omikuji':  // ống xăm lục giác, lắc thì que thò ra
      p.rect(gx, gy - 6, 4, 7, '#c83a2a'); p.rect(gx, gy - 6, 4, 1, '#f0d070'); p.px(gx + 1, gy - 3, '#f0d070');
      if (phase) p.rect(gx + 1, gy - 9, 1, 3, '#e8d8b0');
      break;
    case 'paper':    // tờ quẻ mở ra đọc
      p.rect(gx - 1, gy - 5, 7, 5, WHITE); for (let k = 0; k < 3; k++) p.rect(gx, gy - 4 + k, 5, 1, k === 0 ? '#c83a2a' : '#8a8a9a');
      break;
    case 'mic':
      p.rect(gx + 1, gy - 2, 1, 3, '#3a3a3a'); p.rect(gx, gy - 5, 3, 3, '#9a9aa8'); p.px(gx + 1, gy - 4, '#d8d8e0');
      break;
    case 'brush':    // cọ sơn chấm màu
      for (let i = 0; i < 5; i++) p.px(gx + 1 + i, gy - 1 - i, '#c98a52');
      p.rect(gx + 5, gy - 7, 2, 2, c);
      if (phase) p.px(gx + 7, gy - 8, c);
      break;
    case 'seed':     // túi hạt, rắc thì hạt rơi
      p.rect(gx, gy - 3, 4, 4, '#d8c090'); p.rect(gx + 1, gy - 4, 2, 1, '#b8a070');
      if (phase) { p.px(gx + 5, gy, '#f0d870'); p.px(gx + 6, gy + 2, '#f0d870'); p.px(gx + 4, gy + 3, '#f0d870'); }
      break;
    case 'leaf':     // lá phong đỏ
      p.rect(gx + 1, gy - 5, 3, 3, c); p.px(gx, gy - 4, c); p.px(gx + 4, gy - 4, c); p.px(gx + 2, gy - 6, c); p.px(gx + 2, gy - 2, '#6a3a22'); p.px(gx + 2, gy - 1, '#6a3a22');
      break;
    case 'book':
      p.rect(gx, gy - 3, 7, 4, c); p.rect(gx + 1, gy - 3, 2, 3, WHITE); p.rect(gx + 4, gy - 3, 2, 3, WHITE); p.px(gx + 3, gy - 3, cd);
      for (const y of [gy - 2, gy - 1]) { p.px(gx + 1, y, '#c8c0d0'); p.px(gx + 4, y, '#c8c0d0'); }
      if (phase) { p.rect(gx + 3, gy - 5, 2, 2, WHITE); p.px(gx + 4, gy - 4, '#e8e0f0'); }
      break;
  }
}

/** Bát / đĩa thức ăn đặt trên bàn */
export function wareSprite(w: Ware) {
  return makeSprite(`ware:${w.kind}:${w.color}`, 12, 7, p => {
    if (w.kind === 'bowl') {
      p.rect(1, 1, 10, 2, w.color); p.rect(2, 0, 8, 1, mix(w.color, '#ffffff', 0.3));
      p.rect(1, 3, 10, 2, WHITE); p.rect(2, 5, 8, 1, '#f2d0dc'); p.rect(4, 6, 4, 1, WHITE);
      p.px(4, 1, mix(w.color, '#2a1a1a', 0.25)); p.px(7, 2, mix(w.color, '#2a1a1a', 0.25));
    } else {
      p.rect(0, 4, 12, 2, WHITE); p.rect(1, 6, 10, 1, '#e8dcd0'); p.rect(0, 4, 12, 1, '#f2d0dc');
      p.rect(3, 1, 6, 3, w.color); p.rect(4, 0, 4, 1, mix(w.color, '#ffffff', 0.35)); p.px(5, 2, mix(w.color, '#2a1a1a', 0.25));
    }
  }, '#6a4a5a');
}

/** Ly đồ uống đặt trên bàn (khi tay đang cầm đũa/nĩa ăn) */
export function cupSprite(s: PropSpec) {
  return makeSprite(`cup:${s.kind}:${s.color}`, 6, 9, p => drawProp(p, s, 1, 8, 0), '#6a4a5a');
}

/** Màu kẹo dẻo theo độ nướng 0..100 */
export function marshmallow(heat: number | null) {
  if (heat === null) return '#fff6e8';
  return heat < 45 ? mix('#fffaf0', '#f2d8a0', heat / 45) : heat <= 78 ? mix('#f2c870', '#d8903a', (heat - 45) / 33) : mix('#8a5a3c', '#2a1a1a', Math.min(1, (heat - 78) / 22));
}
