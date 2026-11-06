// Đồ cầm tay vẽ pixel (cốc, ly, đĩa, đũa, que nướng, sách) và cách nhân vật dùng chúng (nhấp, ăn, nướng, đọc).
import { makeSprite, mix, type Pen } from './pixel';

export type PropKind = 'mug' | 'iced' | 'boba' | 'teacup' | 'milk' | 'wine' | 'flute' | 'cocktail' | 'soju' | 'juice'
  | 'chopsticks' | 'fork' | 'spoon' | 'stick' | 'book' | 'rod' | 'can' | 'baby';
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
  if (has(n, 'ca cao', 'socola nóng')) return { kind: 'mug', color: '#7a4a32' };
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
