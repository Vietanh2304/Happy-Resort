// Bản đồ thế giới chung: làng, bãi biển, đồi ngắm cảnh và các tòa nhà đi vào được.
// Tọa độ là pixel logic của từng cảnh (trước khi phóng to).
import { HH, HW } from './iso';

export type SceneId = 'town' | 'beach' | 'hill' | 'farm' | 'arcade' | 'house' | 'bedroom' | 'bathroom' | 'shop' | 'cinema' | 'restaurant' | 'cafe' | 'wheel' | 'camp' | 'twin' | 'disco' | 'lounge' | 'reef' | 'sky' | 'school' | 'campus' | 'gym' | 'ranch' | 'office' | 'city';
export interface Pt { x: number; y: number }
export interface Box { x0: number; x1: number; y0: number; y1: number }

export interface SceneDef {
  name: string;
  icon: string;
  w: number;
  h: number;
  outdoor: boolean;
  walk?: Box | 'room'; // vùng đi lại được ('room' = sàn hình thoi của phòng; không có = ngồi cố định)
  spawn: Pt;           // vào cảnh thì đứng ở đây
}

// ───────── Phòng isometric (nhà gỗ, phòng ngủ) ─────────
// Sàn 8×8 ô hình thoi, hai bức tường phía sau (trái: gx = 0, phải: gy = 0).
export const ROOM = { ox: 96, oy: 50, n: 8, wallH: 44 };
export const roomPt = (gx: number, gy: number, z = 0): Pt => ({ x: ROOM.ox + (gx - gy) * HW, y: ROOM.oy + (gx + gy) * HH - z });
export function roomGrid(p: Pt) {
  const a = (p.x - ROOM.ox) / HW, b = (p.y - ROOM.oy) / HH;
  return { gx: (a + b) / 2, gy: (b - a) / 2 };
}
/** Ô tường: tường trái là hàng y = 10, tường phải là hàng y = 11 (x = vị trí dọc tường) */
export const WALL_L = 10, WALL_R = 11;
export function wallSlot(row: number, i: number, z = 25): Pt {
  return row === WALL_L ? roomPt(0, i + 0.5, z) : roomPt(i + 0.5, 0, z);
}

export const SCENES: Record<SceneId, SceneDef> = {
  town: { name: 'Làng', icon: '🏘️', w: 384, h: 288, outdoor: true, walk: { x0: 6, x1: 378, y0: 54, y1: 284 }, spawn: { x: 192, y: 124 } },
  lounge: { name: 'Ghế ngắm biển', icon: '⛱️', w: 192, h: 144, outdoor: true, spawn: { x: 70, y: 136 } },
  beach: { name: 'Bãi biển', icon: '🏖️', w: 192, h: 144, outdoor: true, walk: { x0: 6, x1: 186, y0: 50, y1: 121 }, spawn: { x: 96, y: 56 } },
  reef: { name: 'Lặn ngắm san hô', icon: '🤿', w: 192, h: 144, outdoor: false, walk: { x0: 8, x1: 184, y0: 26, y1: 134 }, spawn: { x: 96, y: 40 } },
  city: { name: 'Thành phố (đi làm)', icon: '🌆', w: 256, h: 192, outdoor: true, walk: { x0: 8, x1: 248, y0: 106, y1: 128 }, spawn: { x: 222, y: 120 } },
  office: { name: 'Công ty', icon: '🏢', w: 192, h: 144, outdoor: false, walk: { x0: 10, x1: 182, y0: 112, y1: 140 }, spawn: { x: 96, y: 138 } },
  ranch: { name: 'Trang trại chăn nuôi', icon: '🐄', w: 256, h: 192, outdoor: true, walk: { x0: 6, x1: 250, y0: 44, y1: 188 }, spawn: { x: 128, y: 178 } },
  campus: { name: 'Trường học', icon: '🏫', w: 256, h: 192, outdoor: true, walk: { x0: 6, x1: 250, y0: 100, y1: 180 }, spawn: { x: 128, y: 172 } },
  gym: { name: 'Nhà thể chất', icon: '🏀', w: 192, h: 144, outdoor: false, walk: { x0: 10, x1: 182, y0: 86, y1: 140 }, spawn: { x: 96, y: 136 } },
  school: { name: 'Lớp học của bé', icon: '✏️', w: 192, h: 144, outdoor: false, walk: { x0: 10, x1: 182, y0: 112, y1: 140 }, spawn: { x: 96, y: 138 } },
  sky: { name: 'Bãi nhảy dù', icon: '🪂', w: 192, h: 144, outdoor: true, spawn: { x: 96, y: 118 } },
  hill: { name: 'Đồi ngắm cảnh', icon: '⛰️', w: 192, h: 144, outdoor: true, spawn: { x: 86, y: 124 } },
  farm: { name: 'Nông trại', icon: '🌾', w: 256, h: 192, outdoor: true, walk: { x0: 6, x1: 250, y0: 58, y1: 188 }, spawn: { x: 128, y: 182 } },
  arcade: { name: 'Khu vui chơi', icon: '🎮', w: 192, h: 144, outdoor: false, walk: { x0: 8, x1: 184, y0: 92, y1: 140 }, spawn: { x: 96, y: 136 } },
  house: { name: 'Nhà gỗ', icon: '🏡', w: 192, h: 144, outdoor: false, walk: 'room', spawn: roomPt(5, 7.4) },
  bedroom: { name: 'Phòng ngủ', icon: '🛏️', w: 192, h: 144, outdoor: false, walk: 'room', spawn: roomPt(1.2, 6.6) },
  bathroom: { name: 'Phòng tắm', icon: '🛁', w: 192, h: 144, outdoor: false, walk: 'room', spawn: roomPt(1.2, 6.6) },
  shop: { name: 'Cửa hàng', icon: '🛍️', w: 192, h: 144, outdoor: false, walk: { x0: 8, x1: 184, y0: 94, y1: 140 }, spawn: { x: 96, y: 136 } },
  cinema: { name: 'Rạp phim', icon: '🎬', w: 160, h: 120, outdoor: false, spawn: { x: 68, y: 100 } },
  restaurant: { name: 'Nhà hàng', icon: '🕯️', w: 192, h: 144, outdoor: false, spawn: { x: 70, y: 118 } },
  disco: { name: 'Sàn khiêu vũ', icon: '💃', w: 192, h: 144, outdoor: false, spawn: { x: 76, y: 122 } },
  cafe: { name: 'Cà phê sách', icon: '☕', w: 192, h: 144, outdoor: false, spawn: { x: 70, y: 119 } },
  wheel: { name: 'Vòng đu quay', icon: '🎡', w: 192, h: 144, outdoor: false, spawn: { x: 48, y: 117 } },
  camp: { name: 'Bãi cắm trại', icon: '⛺', w: 192, h: 144, outdoor: true, spawn: { x: 72, y: 120 } },
  twin: { name: 'Đài quan sát hai bờ', icon: '🔭', w: 192, h: 144, outdoor: false, spawn: { x: 86, y: 128 } },
};

/** Các tòa nhà trong làng: vẽ ở (x, y) — đáy tòa nhà; cửa để đi vào */
export const BUILDINGS: { scene: SceneId; x: number; y: number; door: Pt }[] = [
  { scene: 'house', x: 62, y: 96, door: { x: 62, y: 102 } },
  { scene: 'shop', x: 142, y: 96, door: { x: 142, y: 102 } },
  { scene: 'cinema', x: 216, y: 96, door: { x: 216, y: 102 } },
  { scene: 'restaurant', x: 292, y: 96, door: { x: 292, y: 102 } },
];

export const TOWN = {
  path: 98,                                   // đường lát đá chạy ngang trước các tòa nhà
  fountain: { x: 192, y: 158 },
  toBeach: { x: 207, y: 282 },
  toHill: { x: 352, y: 58 },
  mailbox: { x: 90, y: 100 },
  toFarm: { x: 262, y: 212 },
  toArcade: { x: 306, y: 210 },
  cafe: { x: 250, y: 274, door: { x: 250, y: 280 } },
  toCamp: { x: 16, y: 58 },
  twin: { x: 104, y: 160 },         // bãi cỏ trống bên trái đài phun nước
  guestSpots: [{ x: 160, y: 172 }, { x: 232, y: 148 }, { x: 118, y: 184 }, { x: 264, y: 182 }, { x: 196, y: 196 }, { x: 172, y: 130 }],
  trees: [
    ['pine', 330, 90], ['round1', 376, 94],
    ['pine', 138, 150], ['cherry', 252, 152], ['round2', 300, 140],
    ['pine', 290, 286], ['round1', 372, 284],
  ] as [string, number, number][],
  bushes: [[100, 94, 0], [178, 94, 1], [254, 94, 3], [328, 100, 4], [120, 132, 2], [278, 166, 0], [226, 266, 1]] as [number, number, number][],
  lamps: [[34, 122], [122, 122], [170, 122], [262, 122], [330, 122], [196, 284]] as [number, number][],
  benches: [[168, 202], [226, 200]] as [number, number][],
  // Vòng đu quay khổng lồ (dời từ bãi biển vào làng): góc phải, cạnh lều khu vui chơi
  wheel: { x: 352, y: 196, stand: { x: 352, y: 208 } },
  toSky: { x: 372, y: 238 },
  bus: { x: 16, y: 128 },          // trạm xe buýt ra thành phố (đi làm)       // biển chỉ đường ra bãi nhảy dù (dưới đu quay)
};

/** Ruộng nông trại: trồng ở ô nào tùy thích (ô = y * cols + x), đồ trang trí cũng đặt trên lưới này */
export const FARM = { x: 32, y: 62, cw: 16, ch: 14, cols: 12, rows: 8, exit: { x: 128, y: 186 } };
export const farmCell = (x: number, y: number) => y * FARM.cols + x;

/** Khu vui chơi: mỗi trạm một trò */
export type GameId = 'caro' | 'rps' | 'memory' | 'draw' | 'cook' | 'quiz' | 'fishrace' | 'puzzle' | 'dance' | 'castle' | 'focus' | 'golf' | 'snow' | 'boat' | 'hide' | 'cards';
export const ARCADE: { game: GameId; name: string; icon: string; hot: Box; stand: Pt }[] = [
  { game: 'draw', name: 'Vẽ đoán', icon: '🎨', hot: { x0: 14, x1: 50, y0: 32, y1: 88 }, stand: { x: 32, y: 96 } },
  { game: 'rps', name: 'Oẳn tù tì', icon: '✊', hot: { x0: 80, x1: 112, y0: 26, y1: 88 }, stand: { x: 96, y: 96 } },
  { game: 'caro', name: 'Cờ ca-rô', icon: '⭕', hot: { x0: 14, x1: 66, y0: 96, y1: 126 }, stand: { x: 40, y: 130 } },
  { game: 'memory', name: 'Lật thẻ', icon: '🃏', hot: { x0: 126, x1: 178, y0: 94, y1: 126 }, stand: { x: 152, y: 130 } },
];

/** Vườn hoa trang trí được (kiểu vườn có hàng rào cây xanh) */
export const GARDEN = { x: 24, y: 188, cw: 16, ch: 14, cols: 10, rows: 6 };

/** Một vòng đu quay kéo dài bao lâu */
export const RIDE_MS = 60_000;

export const BEACH = {
  horizon: 34,
  sandTop: 40,
  wet: 114,
  water: 122,
  toTown: { x: 96, y: 50 },
  dock: { x: 168, y: 142, stand: { x: 176, y: 121 } },
  bobber: { x: 150, y: 136 },
  // Dù che nắng + ghế dài (chỗ vòng đu quay cũ): chạm vào ghế → nằm ngắm biển
  loungers: [{ x: 20, y: 84 }, { x: 62, y: 88 }, { x: 40, y: 112 }],
};

export const HOUSE = {
  door: roomPt(5, 7.6),                       // thảm cửa ra làng
  toBedroom: roomPt(0.3, 6.5),                // cửa trên tường trái
  kitchen: { stand: roomPt(1.6, 2) },
  calendar: wallSlot(WALL_L, 0, 30),
};
/** Phòng tắm: bồn lớn chiếm ô (2..5, 1..3), hai chỗ nằm đối diện nhau */
export const BATH = {
  back: { gx: 2, gy: 1 }, w: 4, d: 3,
  front: roomPt(6, 4),
  seats: [{ ...roomPt(3.1, 3.3, 11), left: false }, { ...roomPt(4.9, 3.3, 11), left: true }] as (Pt & { left: boolean })[],
  stand: roomPt(4, 4.7),
  toBath: roomPt(6.8, 0.4),      // cửa phòng ngủ → phòng tắm (tường phải)
  toilet: roomPt(0.6, 5.5),      // bồn cầu sát tường trái
  toiletStand: roomPt(1.6, 5.5),
};

/** Ô chỉ cấm đặt đồ nhưng vẫn đi qua được (thảm cửa, lối vào phòng tắm) */
export const WALK_THROUGH = (scene: string, x: number, y: number) => (scene === 'house' && y === 7) || (scene === 'bedroom' && x >= 6 && y <= 1);

/** Ô sàn/tường đã có đồ cố định (bếp, cửa, cửa sổ) — không đặt đồ trang trí lên */
export const RESERVED: Record<string, (x: number, y: number) => boolean> = {
  house: (x, y) => (y < 8 && x === 0 && y <= 4) || (y === WALL_L && (x <= 4 || x >= 6)) || (y === WALL_R && x >= 3 && x <= 5) || (y === 7 && x >= 4 && x <= 5),
  // lối vào phòng tắm (góc tường phải phía trong) để trống, không đặt tủ che cửa
  bedroom: (x, y) => (y < 8 && x >= 6 && y <= 1) || (y === WALL_L && x >= 6) || (y === WALL_R && x >= 3),
  bathroom: (x, y) => (y < 8 && x >= 2 && x <= 5 && y >= 1 && y <= 3) || (y < 8 && x === 0 && ((y >= 1 && y <= 2) || y === 5))
    || (y === WALL_L && (x >= 6 || (x >= 1 && x <= 2))) || (y === WALL_R && x >= 3 && x <= 5),
  garden: () => false,
  farm: () => false,
};

export const SHOP = {
  door: { x: 96, y: 140 },
  counter: { x: 96, y: 70, stand: { x: 96, y: 98 } },
};

/** Ghế ngồi cố định: [người có id nhỏ hơn, người kia] */
export const SEATS: Partial<Record<SceneId, [Pt & { left: boolean }, Pt & { left: boolean }]>> = {
  cinema: [{ x: 68, y: 100, left: false }, { x: 92, y: 100, left: true }],
  restaurant: [{ x: 70, y: 119, left: false }, { x: 122, y: 119, left: true }],
  hill: [{ x: 88, y: 125, left: false }, { x: 104, y: 125, left: true }],
  cafe: [{ x: 70, y: 119, left: false }, { x: 122, y: 119, left: true }],
  wheel: [{ x: 48, y: 117, left: false }, { x: 144, y: 117, left: true }],
  camp: [{ x: 70, y: 118, left: false }, { x: 122, y: 118, left: true }],
  twin: [{ x: 86, y: 129, left: false }, { x: 106, y: 129, left: true }],
  // Đứng sát nhau vừa một cánh tay để nắm tay khiêu vũ
  disco: [{ x: 88, y: 124, left: false }, { x: 105, y: 124, left: true }],
};

export function clampTo(box: Box, p: Pt): Pt {
  return { x: Math.max(box.x0, Math.min(box.x1, p.x)), y: Math.max(box.y0, Math.min(box.y1, p.y)) };
}

/** Điểm chạm → điểm đi tới hợp lệ trong cảnh */
export function walkTarget(scene: SceneId, p: Pt): Pt | null {
  const w = SCENES[scene].walk;
  if (!w) return null;
  if (w !== 'room') return clampTo(w, p);
  const { gx, gy } = roomGrid(p);
  const c = (v: number) => Math.max(0.6, Math.min(ROOM.n - 0.3, v));
  return roomPt(c(gx), c(gy));
}

/** Động tác ngồi (ghế ngoài sân trường, bồn cầu) */
export const SIT_ACTS = ['sit', 'poop', 'peesit'];
