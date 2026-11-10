// Du lịch: mỗi điểm đến là một bản đồ riêng (256×192) đi dạo được — nền trời, cảnh xa, mặt đất và công trình nổi tiếng.
import { makeSprite, mix, type Pen } from './pixel';
import { seeded } from './rng';

export type TripId = 'taichung' | 'gwangju' | 'hoian' | 'tokyo' | 'paris' | 'venice' | 'swiss' | 'iceland';
export interface Spot { x: number; y: number; icon: string; name: string; say: string }
export interface Trip {
  id: TripId; name: string; icon: string; bg: string; price: number; souvenir: string; line: string;
  sky: [string, string]; ground: [string, string]; far: 'sea' | 'mountain' | 'snow' | 'skyline' | 'hills' | 'none';
  food: { name: string; icon: string }; spots: Spot[];
}
const S = (x: number, y: number, icon: string, name: string, say: string): Spot => ({ x, y, icon, name, say });

export const TRIPS: Trip[] = [
  { id: 'taichung', name: 'Đài Trung', icon: '🌈', bg: 'linear-gradient(#ffd27a,#7ac8e8)', price: 260, souvenir: 'peach_tea', line: 'Làng Cầu Vồng sặc sỡ, chợ đêm Phùng Giáp với ly trà sữa trân châu chính gốc.',
    sky: ['#7ac8f0', '#d8f0ff'], ground: ['#d8c8b0', '#c8b8a0'], far: 'skyline', food: { name: 'Trà sữa trân châu', icon: '🧋' },
    spots: [S(70, 96, '🌈', 'Làng Cầu Vồng', 'Ông Hoàng vẽ cả ngôi làng bằng tay đó! Chụp ảnh đi 📸'), S(190, 100, '🏮', 'Chợ đêm Phùng Giáp', 'Gà rán khổng lồ, mực nướng, đậu hũ thối… thử hết nào!')] },
  { id: 'gwangju', name: 'Gwangju', icon: '🍁', bg: 'linear-gradient(#f6c48a,#c8604a)', price: 260, souvenir: 'teapot', line: 'Leo núi Mudeung mùa lá đỏ, tối ăn gà nướng phố Chungjang.',
    sky: ['#8ac0e8', '#f0e0c8'], ground: ['#c8b090', '#b89c7c'], far: 'mountain', food: { name: 'Tteokgalbi nướng', icon: '🍖' },
    spots: [S(60, 98, '⛰️', 'Núi Mudeung', 'Lá phong đỏ rực cả sườn núi 🍁'), S(196, 98, '🏯', 'Nhà hanok', 'Ngồi hiên nhà gỗ uống trà gừng ấm bụng ghê')] },
  { id: 'hoian', name: 'Phố cổ Hội An', icon: '🏮', bg: 'linear-gradient(#f6c445,#e8743a)', price: 120, souvenir: 'lantern', line: 'Đèn lồng sáng cả con phố, tụi mình đi thuyền thả hoa đăng.',
    sky: ['#f6b06a', '#ffe0a8'], ground: ['#c8a878', '#b89868'], far: 'none', food: { name: 'Cao lầu', icon: '🍜' },
    spots: [S(128, 96, '🌉', 'Chùa Cầu', 'Cây cầu 400 năm tuổi nè'), S(210, 100, '🪷', 'Bến thả hoa đăng', 'Thả một chiếc đèn, ước một điều 🪷')] },
  { id: 'tokyo', name: 'Tokyo', icon: '🗾', bg: 'linear-gradient(#ffd8e8,#f08aa6)', price: 320, souvenir: 'sakura_bloom', line: 'Hoa anh đào rơi trên vai, tụi mình ăn ramen đến no căng.',
    sky: ['#9ad0f8', '#ffe8f0'], ground: ['#d8d0c0', '#c8c0b0'], far: 'skyline', food: { name: 'Ramen', icon: '🍜' },
    spots: [S(64, 96, '⛩️', 'Đền Asakusa', 'Rút một quẻ xăm thử vận may nha'), S(190, 98, '🌸', 'Công viên Ueno', 'Ngồi picnic dưới gốc anh đào 🌸')] },
  { id: 'paris', name: 'Paris', icon: '🗼', bg: 'linear-gradient(#c8d8f8,#f0b8c8)', price: 450, souvenir: 'rose_bloom', line: 'Hôn nhau dưới tháp Eiffel lúc đèn bật sáng, sáng ra ăn croissant bên sông Seine.',
    sky: ['#9ac0f0', '#f0e0e8'], ground: ['#d8c8a8', '#c8b898'], far: 'skyline', food: { name: 'Croissant', icon: '🥐' },
    spots: [S(128, 98, '🗼', 'Tháp Eiffel', 'Bonjour! Đèn tháp nhấp nháy mỗi giờ đó ✨'), S(40, 100, '🎨', 'Hoạ sĩ vẽ chân dung', 'Ngồi xuống đi, tôi vẽ hai bạn thật đẹp 🖌️')] },
  { id: 'venice', name: 'Venice', icon: '🛶', bg: 'linear-gradient(#f8e0a8,#4a8ab8)', price: 420, souvenir: 'bouquet', line: 'Ngồi thuyền gondola qua những cây cầu nhỏ, người lái thuyền hát cho tụi mình nghe.',
    sky: ['#8ac8f0', '#fff0d8'], ground: ['#d8b890', '#c8a880'], far: 'none', food: { name: 'Gelato', icon: '🍨' },
    spots: [S(128, 98, '🛶', 'Bến gondola', 'O sole mio~ 🎶 lên thuyền đi hai bạn'), S(214, 96, '🎭', 'Tiệm mặt nạ', 'Mặt nạ lễ hội Carnival, đeo thử không?')] },
  { id: 'swiss', name: 'Thuỵ Sĩ', icon: '🏔️', bg: 'linear-gradient(#e8f4ff,#5a9a6a)', price: 500, souvenir: 'chocolate', line: 'Tàu đỏ chạy qua núi tuyết, uống sô-cô-la nóng trong nhà gỗ.',
    sky: ['#7ab8f0', '#e8f4ff'], ground: ['#8ac878', '#7ab868'], far: 'snow', food: { name: 'Fondue phô mai', icon: '🫕' },
    spots: [S(60, 98, '🚂', 'Ga tàu núi', 'Tàu Glacier Express chạy qua 291 cây cầu!'), S(196, 98, '🏠', 'Nhà gỗ chalet', 'Vào đây uống sô-cô-la nóng cho ấm ☕')] },
  { id: 'iceland', name: 'Iceland', icon: '🌌', bg: 'linear-gradient(#0a1a3a,#3ac88a)', price: 550, souvenir: 'star_lantern', line: 'Nằm giữa trời lạnh ngắm cực quang nhảy múa, tay trong tay.',
    sky: ['#0a1030', '#1a3060'], ground: ['#e8f0f8', '#d8e4f0'], far: 'snow', food: { name: 'Súp thịt cừu', icon: '🍲' },
    spots: [S(80, 98, '🌌', 'Đồi ngắm cực quang', 'Cực quang hiện rồi kìa!! Ước đi 💚'), S(200, 100, '♨️', 'Suối nước nóng Blue Lagoon', 'Ngâm mình nước ấm giữa trời tuyết, sướng ghê')] },
];
export const tripOf = (id: string) => TRIPS.find(t => t.id === id);
export const TRIP_WALK = { x0: 8, x1: 248, y0: 104, y1: 186 };

/** Nền bản đồ du lịch: trời, cảnh xa, công trình nổi tiếng, mặt đất */
export function tripBackground(id: TripId, phase: 'day' | 'night' | 'sunset' | 'dawn') {
  const t = tripOf(id)!;
  return makeSprite(`trip:v1:${id}:${phase}`, 256, 192, p => {
    const night = phase === 'night' || id === 'iceland', dusk = phase === 'sunset';
    const sky = id === 'iceland' ? t.sky : night ? ['#0e1640', '#2a3270'] : dusk ? ['#6a4fc4', '#ff9a6a'] : t.sky;
    for (let y = 0; y < 100; y++) p.rect(0, y, 256, 1, mix(sky[0], sky[1], y / 100));
    const r = seeded(`trip:${id}`);
    if (night) for (let i = 0; i < 40; i++) p.px(Math.floor(r() * 256), Math.floor(r() * 60), '#ffffff');
    if (id === 'iceland') for (let x = 0; x < 256; x++) { const y = 22 + Math.sin(x / 18) * 8 + Math.sin(x / 7) * 3; p.rect(x, y, 1, 14, '#3af0a0'); p.rect(x, y + 4, 1, 6, '#8affc8'); p.rect(x, y - 4, 1, 4, '#8a6af0'); }
    far(p, t, night, r);
    // mặt đất
    for (let y = 100; y < 192; y++) p.rect(0, y, 256, 1, mix(t.ground[0], t.ground[1], (y - 100) / 92));
    for (let y = 104; y < 192; y += 8) for (let x = (y / 8) % 2 ? 0 : 8; x < 256; x += 16) p.rect(x, y, 15, 1, mix(t.ground[1], '#000000', 0.06));
    LANDMARK[id](p, night, r);
    if (night) p.rect(0, 0, 256, 192, '#0a0a3010');
  }, null);
}

function far(p: Pen, t: Trip, night: boolean, r: () => number) {
  const dim = (c: string) => (night ? mix(c, '#1a2050', 0.55) : c);
  if (t.far === 'sea') { p.rect(0, 70, 256, 30, dim('#2a8ad0')); for (let x = 0; x < 256; x += 9) p.rect(x, 74 + (x % 4), 5, 1, dim('#8ad0f0')); }
  if (t.far === 'mountain' || t.far === 'snow' || t.far === 'hills') {
    for (let x = 0; x < 256; x++) {
      const h = t.far === 'hills' ? 18 + Math.sin(x / 30) * 8 + Math.sin(x / 11) * 3 : 34 + Math.abs(((x * 1.3) % 80) - 40) * -0.8 + 20 + Math.sin(x / 9) * 3;
      const c = t.far === 'hills' ? '#6a9a6a' : t.id === 'gwangju' ? '#a85a3a' : '#7a8aa0';
      p.rect(x, 100 - h, 1, h, dim(c));
      if (t.far === 'snow' && h > 40) p.rect(x, 100 - h, 1, Math.min(8, h - 40), dim('#ffffff'));
      if (t.id === 'gwangju' && r() < 0.3) p.px(x, 100 - h + 2 + Math.floor(r() * h * 0.6), dim('#e8743a'));
    }
  }
  if (t.far === 'skyline') for (let x = 0; x < 256; x += 12) { const h = 20 + Math.floor(r() * 40); const c = dim('#8a9ab8'); p.rect(x, 100 - h, 11, h, c); for (let yy = 104 - h; yy < 98; yy += 4) for (let xx = x + 2; xx < x + 10; xx += 3) if (r() < 0.5) p.px(xx, yy, night ? '#ffe08a' : mix(c, '#ffffff', 0.4)); }
}

const house = (p: Pen, x: number, y: number, w: number, h: number, wall: string, roof: string, win = '#8ad0f0') => {
  p.rect(x, y - h, w, h, wall); p.rect(x - 2, y - h - 4, w + 4, 4, roof);
  for (let yy = y - h + 4; yy < y - 6; yy += 8) for (let xx = x + 3; xx < x + w - 4; xx += 7) p.rect(xx, yy, 4, 5, win);
  p.rect(x + w / 2 - 2, y - 7, 5, 7, mix(wall, '#000000', 0.4));
};
const tree = (p: Pen, x: number, y: number, c: string, h = 14) => { p.rect(x, y - 5, 2, 5, '#7a5a3a'); for (let i = 0; i < h - 4; i++) { const w = Math.max(1, Math.round((h - 4 - i) * 0.6)); p.rect(x + 1 - w, y - 5 - i, w * 2, 1, c); } };
const lantern = (p: Pen, x: number, y: number, c = '#e8443a') => { p.rect(x, y, 3, 4, c); p.px(x + 1, y - 1, '#3a2a1a'); p.px(x + 1, y + 1, '#ffd27a'); };
const sakura = (p: Pen, x: number, y: number) => { p.rect(x, y - 8, 2, 8, '#6a4a3a'); for (let i = 0; i < 30; i++) { const a = i * 2.4, d = (i % 6) + 1; p.px(x + Math.round(Math.cos(a) * d * 1.4), y - 12 + Math.round(Math.sin(a) * d * 0.8), i % 3 ? '#f8b8cc' : '#ffd8e4'); } };

const LANDMARK: Record<TripId, (p: Pen, night: boolean, r: () => number) => void> = {
  taichung: p => {
    const cs = ['#e8443a', '#f6c445', '#5aa8e0', '#8bc87a', '#f59ab3', '#b08ae0'];
    for (let i = 0; i < 4; i++) { const x = 20 + i * 26; p.rect(x, 70, 24, 30, '#f8f0e0'); for (let k = 0; k < 6; k++) p.rect(x + 2 + (k % 3) * 7, 74 + Math.floor(k / 3) * 12, 5, 8, cs[(i + k) % 6]); p.rect(x, 66, 24, 4, '#8a5a3c'); }
    for (let i = 0; i < 4; i++) { const x = 150 + i * 24; p.rect(x, 82, 20, 18, '#d84a3a'); p.rect(x - 1, 78, 22, 4, '#f6c445'); lantern(p, x + 3, 84, '#ffd27a'); lantern(p, x + 14, 84, '#ffd27a'); }
  },
  gwangju: (p, _n, r) => {
    house(p, 170, 100, 46, 18, '#f0e4cc', '#3a3a4a', '#d8c8a8'); p.rect(166, 78, 54, 2, '#2a2a3a'); p.px(166, 77, '#2a2a3a'); p.px(219, 77, '#2a2a3a');
    for (let i = 0; i < 8; i++) tree(p, 10 + i * 18 + Math.floor(r() * 6), 100, i % 2 ? '#d8502a' : '#f08a3a', 16);
  },
  hoian: () => undefined,
  tokyo: p => {
    p.rect(40, 70, 4, 30, '#e8443a'); p.rect(70, 70, 4, 30, '#e8443a'); p.rect(34, 66, 46, 4, '#e8443a'); p.rect(38, 74, 38, 2, '#e8443a');
    for (let k = 0; k < 4; k++) { const w = 30 - k * 6; p.rect(150 - w / 2 + 15, 92 - k * 12, w, 8, '#c8503a'); p.rect(150 - w / 2 + 11, 90 - k * 12, w + 8, 2, '#3a3a4a'); }
    sakura(p, 110, 100); sakura(p, 220, 100); sakura(p, 240, 102);
  },
  paris: p => {
    const c = '#7a6a5a';
    for (let y = 10; y < 100; y++) { const w = y < 40 ? 2 + (y - 10) / 12 : y < 70 ? 4 + (y - 40) / 4 : 12 + (y - 70) * 0.9; p.rect(128 - w, y, 2, 1, c); p.rect(128 + w - 2, y, 2, 1, c); }
    p.rect(122, 40, 12, 2, c); p.rect(116, 70, 24, 3, c); p.rect(126, 6, 4, 6, c);
    for (let y = 72; y < 100; y++) { const w = 12 + (y - 70) * 0.9 - 4; if (y > 82) p.rect(128 - w + 4, y, 2 * w - 8, 1, '#00000000'); }
    tree(p, 30, 100, '#4a8a4a', 18); tree(p, 226, 100, '#4a8a4a', 18);
  },
  venice: p => {
    for (let i = 0; i < 6; i++) house(p, 4 + i * 42, 92, 38, 30 + (i % 3) * 6, ['#e8a87a', '#f0d088', '#d8786a', '#f0c0a0'][i % 4], '#a84a3a', '#5a3a2a');
    p.rect(0, 92, 256, 10, '#3a8ab0'); for (let x = 0; x < 256; x += 8) p.rect(x, 95, 4, 1, '#8ad0f0');
    p.rect(110, 94, 30, 3, '#1a1a2a'); p.px(108, 92, '#1a1a2a'); p.px(141, 92, '#1a1a2a'); p.rect(124, 88, 2, 6, '#e8e8e8');
  },
  swiss: p => {
    house(p, 170, 100, 40, 20, '#a8683a', '#7a3a2a', '#fff0c8'); p.rect(166, 76, 48, 4, '#ffffff');
    p.rect(0, 96, 256, 2, '#5a4a3a'); for (let i = 0; i < 4; i++) { p.rect(20 + i * 22, 86, 20, 10, '#d8302a'); p.rect(22 + i * 22, 88, 16, 4, '#c8e8ff'); }
  },
  iceland: p => { for (let i = 0; i < 4; i++) house(p, 150 + i * 24, 100, 18, 12, ['#d8302a', '#f6c445', '#3a6ad0', '#ffffff'][i], '#2a2a3a', '#ffe08a'); },
};
// Hội An: dãy nhà vàng mái ngói, đèn lồng giăng, Chùa Cầu ở giữa
LANDMARK.hoian = p => {
  for (let i = 0; i < 6; i++) house(p, 2 + i * 44, 98, 40, 26, '#f0c84a', '#a84a2a', '#5a3a2a');
  for (let x = 6; x < 256; x += 10) lantern(p, x, 60 + (x % 20 === 6 ? 2 : 0), ['#e8443a', '#f6c445', '#f59ab3'][x % 3]);
  p.rect(108, 80, 40, 12, '#c84a2a'); p.rect(104, 76, 48, 4, '#6a3a2a'); p.rect(110, 92, 4, 8, '#8a5a3a'); p.rect(142, 92, 4, 8, '#8a5a3a');
};

/** Đang du lịch ở đâu (để quán ăn đổi sang thực đơn đặc sản nơi đó) */
export const tripCtx = { at: '' as TripId | '' };
type Dish = { name: string; icon: string; drink?: boolean };
const D = (name: string, icon: string, drink = false): Dish => ({ name, icon, drink });
export const TRIP_MENU: Record<TripId, Dish[]> = {
  taichung: [D('Trà sữa trân châu', '🧋', true), D('Gà rán khổng lồ', '🍗'), D('Bánh dứa', '🥮'), D('Mì bò Đài Loan', '🍜'), D('Bánh bao nước', '🥟')],
  gwangju: [D('Tteokgalbi nướng', '🍖'), D('Cơm trộn bibimbap', '🍲'), D('Kimchi', '🥬'), D('Gà rán Hàn', '🍗'), D('Soju đào', '🍶', true)],
  hoian: [D('Cao lầu', '🍜'), D('Bánh mì Phượng', '🥖'), D('Cơm gà', '🍛'), D('Bánh bao bánh vạc', '🥟'), D('Nước mót', '🍵', true)],
  tokyo: [D('Ramen', '🍜'), D('Sushi', '🍣'), D('Tempura', '🍤'), D('Bánh mochi', '🍡'), D('Trà matcha', '🍵', true)],
  paris: [D('Croissant', '🥐'), D('Bánh macaron', '🧁'), D('Súp hành', '🥣'), D('Bít tết khoai tây', '🥩'), D('Vang đỏ', '🍷', true)],
  venice: [D('Pizza', '🍕'), D('Mì Ý mực đen', '🍝'), D('Gelato', '🍨'), D('Tiramisu', '🍰'), D('Cà phê espresso', '☕', true)],
  swiss: [D('Fondue phô mai', '🫕'), D('Rösti khoai tây', '🥔'), D('Sô-cô-la Thuỵ Sĩ', '🍫'), D('Xúc xích nướng', '🌭'), D('Sô-cô-la nóng', '☕', true)],
  iceland: [D('Súp thịt cừu', '🍲'), D('Cá hồi nướng', '🐟'), D('Skyr', '🥛'), D('Xúc xích Pylsur', '🌭'), D('Trà nóng', '🍵', true)],
};
