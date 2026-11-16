// Phòng riêng của các con — phòng isometric như phòng ngủ của ba mẹ (cửa trên tường phải phòng khách):
// hai giường đầu đám mây (hồng / xanh) có chăn đắp thật, tủ đầu giường đèn nấm, hai bàn học có kệ sách + đôn ngồi,
// hòm đồ chơi, gấu bông; tường dán cầu vồng, mây, sao, dây cờ, thước đo chiều cao (vẽ ở roomBackground('kid')).
import type { Decor } from './api';
import { HW, HH, isoSprite, shade, type IsoPen } from './iso';
import { makeSprite, mix } from './pixel';
import { ellipse } from './iso';
import { roomPt, roomPtIn, type Pt } from './world';

const COL = [
  { head: '#f6b6cc', headD: '#e48aa8', quilt: '#ffc4d6', pat: '#ffffff', fold: '#fff0f5' },
  { head: '#a8c8f4', headD: '#7aa0dc', quilt: '#bcd8fa', pat: '#ffffff', fold: '#eef6ff' },
  { head: '#a8dc9a', headD: '#74b866', quilt: '#c8eec0', pat: '#ffffff', fold: '#f0fff0' },   // bé thứ 3: xanh lá
];
const WHITE = '#fffaf4';
/** toạ độ cảnh của một điểm trên sàn phòng các con (10×10 ô) */
const kp = (gx: number, gy: number, z = 0) => roomPtIn('kidroom', gx, gy, z);

const fix = (id: string, item_id: string, x: number, y: number, rot = 0): Decor => ({ id: `kid:${id}`, owner_id: '', island: 'kidroom', item_id, x, y, rot });
/** Đồ cố định của phòng các con (không nằm trong DB — trộn vào danh sách đồ để vẽ & chặn đường đi) */
export const KID_FURN: Decor[] = [
  fix('plant', 'potted_plant', 0, 0), fix('wardrobe', 'kid_wardrobe', 2, 0), fix('night', 'kid_night', 3, 0),
  fix('bed0', 'kid_bed_0', 5, 2), fix('bed1', 'kid_bed_1', 7, 2), fix('bed2', 'kid_bed_2', 9, 2), fix('teddy', 'teddy', 9, 4),
  fix('desk0', 'kid_desk_0', 1, 2, 1), fix('stool0', 'kid_stool_0', 0, 1),
  fix('desk1', 'kid_desk_1', 1, 4, 1), fix('stool1', 'kid_stool_1', 0, 3),
  fix('desk2', 'kid_desk_2', 1, 6, 1), fix('stool2', 'kid_stool_2', 0, 5),
  fix('toys', 'kid_toybox', 0, 7),
];
const bedOf = (i: number) => KID_FURN.find(d => d.id === `kid:bed${i}`)!;
/** gối giữa một giường đơn của bé (toạ độ cảnh, z = độ sâu chân giường) */
export function kidPillow(i: number) {
  const d = bedOf(i), foot = kp(d.x + 1, d.y + 1), gx = 1 - 2, gy = 0.72 - 3;
  return { x: foot.x + (gx - gy) * HW, y: foot.y + (gx + gy) * HH - 10, z: Math.round(foot.y) };
}
export const kidBedFoot = (i: number) => { const d = bedOf(i); return kp(d.x + 1, d.y + 1); };

const desk = (y: number) => ({ seat: kp(0.5, y + 0.6), top: kp(1.4, y + 0.75, 13), stand: kp(2.55, y + 1.2) });
/** Vị trí trong phòng (toạ độ cảnh) */
export const KIDROOM = {
  beds: [{ stand: kp(5.0, 3.5) }, { stand: kp(7.0, 3.5) }, { stand: kp(8.9, 3.5) }],
  desks: [desk(1), desk(3), desk(5)],
  play: [kp(4.6, 5.6), kp(6.6, 6.8), kp(4.4, 7.6), kp(7.6, 5.2), kp(6.0, 8.4), kp(3.4, 7.0), kp(8.2, 7.4)] as Pt[],
  /** chơi cùng ba mẹ trên thảm cầu vồng: chỗ con & chỗ ba mẹ đứng */
  toy: { kid: kp(5.0, 6.0), stand: kp(6.1, 5.55) },
  ball: { kid: kp(4.3, 6.9), stand: kp(7.4, 5.1) },
  talk: { kid: kp(5.1, 6.2), stand: kp(6.15, 5.75) },
  walk: [kp(3.6, 8.2), kp(7.8, 8.0), kp(7.6, 5.0), kp(4.0, 5.6)] as Pt[],
  door: kp(0.35, 8.8),
};
/** Ăn dặm / ăn cơm ở phòng khách cạnh bếp: ghế ăn của con & chỗ ba mẹ đứng đút */
export const KID_FEED = { chair: roomPt(2.15, 6.25), stand: roomPt(2.85, 5.6) };
/** chỗ của một bé (0 = hồng, 1 = xanh dương, 2 = xanh lá): hai bé khác giới thì bé gái hồng, bé trai xanh; bé thứ 3 xanh lá */
export function kidSlot(kid: { id: string; gender: 'm' | 'f' | null }, grown: { id: string; gender: 'm' | 'f' | null }[]) {
  const i = Math.max(0, grown.findIndex(k => k.id === kid.id));
  if (grown.length === 2 && grown[0].gender !== grown[1].gender && kid.gender) return kid.gender === 'f' ? 0 : 1;
  return i % 3;
}

function stars(q: IsoPen, pts: [number, number, number][], c: string) {
  for (const [gx, gy, z] of pts) { const [x, y] = q.pt(gx, gy, z); q.px(x, y, c); q.px(x - 1, y, c); q.px(x + 1, y, c); q.px(x, y - 1, c); q.px(x, y + 1, c); }
}
/** Giường đơn của bé: đầu giường đám mây, nệm trắng, gối, chăn chấm bi gập mép */
const kidBed = (i: number) => () => isoSprite(`kid_bed_${i}`, 2, 3, 30, q => {
  const c = COL[i];
  q.box(0.1, 0, 0, 1.8, 0.28, 18, shade(c.head));                                  // đầu giường
  for (const [g, r] of [[0.45, 5], [1.0, 6.5], [1.55, 5]] as const) { const [x, y] = q.pt(g, 0.14, 18); q.ellipse(x, y - 1, r, r - 1.5, c.head); q.ellipse(x - 1, y - 2, r - 2, r - 3.5, mix(c.head, '#ffffff', 0.35)); }
  stars(q, [[0.5, 0.28, 11], [1.4, 0.28, 14]], '#ffffff');
  q.box(0.1, 0.28, 0, 1.8, 2.62, 5, shade(WHITE));                                 // khung giường
  q.box(0.15, 0.32, 5, 1.7, 2.52, 3, shade('#ffffff', 0.5));                        // nệm
  q.box(0.55, 0.42, 8, 0.9, 0.55, 3, shade('#ffffff', 0.4));                        // gối
  q.box(0.12, 1.15, 5, 1.76, 1.72, 5, shade(c.quilt));                              // chăn (khi giường trống)
  q.flat(0.12, 1.15, 10, 1.76, 0.32, c.fold);
  for (const [gx, gy] of [[0.5, 1.8], [1.3, 1.7], [0.9, 2.3], [1.6, 2.5], [0.4, 2.6]]) { const [x, y] = q.pt(gx, gy, 10); q.px(x, y, c.pat); q.px(x + 1, y, c.pat); }
  q.box(0.1, 2.82, 0, 1.8, 0.16, 9, shade(c.headD));                               // chân giường thấp
});
/** Chăn đắp phủ lên bé đang ngủ (vẽ cùng khung giường, đè lên người, chừa đầu trên gối) */
const kidQuilt = (i: number) => () => isoSprite(`kid_quilt_${i}`, 2, 3, 30, q => {
  const c = COL[i];
  q.box(0.12, 1.0, 5, 1.76, 1.87, 6, shade(c.quilt));
  q.flat(0.12, 1.0, 11, 1.76, 0.3, c.fold);
  for (const [gx, gy] of [[0.5, 1.7], [1.3, 1.6], [0.9, 2.2], [1.6, 2.4], [0.4, 2.5]]) { const [x, y] = q.pt(gx, gy, 11); q.px(x, y, c.pat); q.px(x + 1, y, c.pat); }
});
export const kidQuiltSprite = (i: number) => kidQuilt(i % 3)();
/** Bàn học của bé: kệ sách phía sau, đèn bàn, sách vở, ống bút, quả địa cầu, hộc kéo màu */
const kidDesk = (i: number) => () => isoSprite(`kid_desk_${i}`, 2, 1, 34, q => {
  const c = COL[i], w = shade(WHITE);
  q.box(0.05, 0.1, 0, 0.55, 0.8, 11, shade(c.head));                                // hộc kéo màu
  for (const z of [3, 7]) { const [x, y] = q.pt(0.6, 0.5, z); q.rect(x - 1, y, 3, 1, '#ffffff'); }
  q.box(1.8, 0.12, 0, 0.12, 0.12, 11, w); q.box(1.8, 0.76, 0, 0.12, 0.12, 11, w);
  q.box(0, 0.05, 11, 2, 0.9, 2, w);                                                 // mặt bàn
  { const [x, y] = q.pt(1.6, 0.35, 13); q.rect(x, y - 3, 1, 3, '#a06a48'); q.ellipse(x, y - 6, 3.2, 3.2, '#6aa8e0'); q.rect(x - 2, y - 7, 2, 2, '#8ad08a'); q.px(x + 1, y - 5, '#8ad08a'); }   // quả địa cầu
  q.box(0.75, 0.5, 13, 0.6, 0.4, 1, shade('#ffffff'));                               // vở mở
  { const [x, y] = q.pt(1.05, 0.7, 14); q.rect(x - 3, y, 6, 1, '#cfe2f8'); }
  q.box(1.15, 0.45, 13, 0.35, 0.3, 2, shade('#e8606a')); q.box(1.18, 0.47, 15, 0.3, 0.26, 1.5, shade('#6aa8e0'));   // chồng sách
  { const [x, y] = q.pt(1.75, 0.5, 13); q.rect(x - 1, y - 5, 3, 5, c.headD); q.px(x - 1, y - 7, '#f6c64e'); q.px(x + 1, y - 8, '#e8606a'); q.px(x, y - 7, '#6aa8e0'); }   // ống bút
  { const [x, y] = q.pt(0.2, 0.5, 13); q.rect(x, y - 9, 1, 9, '#8a7a6a'); q.ellipse(x + 1, y - 10, 4, 2.5, c.head); q.rect(x - 2, y - 9, 6, 1, mix(c.head, '#2a2030', 0.2)); }   // đèn bàn
});
const kidStool = (i: number) => () => isoSprite(`kid_stool_${i}`, 1, 1, 10, q => {
  const c = COL[i], [x, y] = q.pt(0.5, 0.5, 0);
  q.ellipse(x, y - 1, 6, 3, mix(c.headD, '#3a2030', 0.2));
  for (let z = 1; z < 6; z++) q.ellipse(x, y - z - 1, 6, 3, c.headD);
  q.ellipse(x, y - 7, 6, 3, c.head); q.ellipse(x - 1, y - 7.5, 3, 1.4, mix(c.head, '#ffffff', 0.45));
});
const kidNight = () => isoSprite('kid_night', 1, 1, 26, q => {
  q.box(0.12, 0.12, 0, 0.76, 0.76, 11, shade(WHITE));
  { const [x, y] = q.pt(0.5, 0.88, 5); q.rect(x - 3, y, 6, 1, '#e8c0a0'); q.px(x, y - 2, '#f6c64e'); }
  const [x, y] = q.pt(0.5, 0.5, 11);                                               // đèn ngủ cây nấm
  q.rect(x - 1, y - 5, 3, 5, '#fff2dc'); q.ellipse(x, y - 7, 5, 3.2, '#f59ab3'); for (const dx of [-3, 0, 2]) q.px(x + dx, y - 8, '#ffffff');
});
/** Tủ quần áo của các con: trắng kem, hai cánh hồng & xanh, núm ngôi sao, vương miện trên nóc, móc áo nhỏ bên hông */
const kidWardrobe = () => isoSprite('kid_wardrobe', 2, 1, 40, q => {
  q.box(0.06, 0.1, 0, 1.88, 0.8, 30, shade(WHITE));
  q.box(0.0, 0.05, 30, 2, 0.9, 2.5, shade('#f6c64e'));
  for (const [g, col] of [[0.5, COL[0].head], [1.5, COL[1].head]] as const) {
    q.poly([q.pt(g - 0.4, 0.9, 3), q.pt(g + 0.4, 0.9, 3), q.pt(g + 0.4, 0.9, 27), q.pt(g - 0.4, 0.9, 27)], col);
    q.poly([q.pt(g - 0.3, 0.9, 16), q.pt(g + 0.3, 0.9, 16), q.pt(g + 0.3, 0.9, 25), q.pt(g - 0.3, 0.9, 25)], mix(col, '#ffffff', 0.45));
    const [x, y] = q.pt(g + (g < 1 ? 0.3 : -0.3), 0.9, 14); q.px(x, y - 1, '#f6c64e'); q.px(x - 1, y, '#f6c64e'); q.px(x, y, '#ffe680'); q.px(x + 1, y, '#f6c64e'); q.px(x, y + 1, '#f6c64e');
  }
  { const [x, y] = q.pt(1, 0.9, 1); q.rect(x - 1, y - 30, 2, 28, '#e8dccc'); }
  for (const g of [0.4, 1.0, 1.6]) { const [x, y] = q.pt(g, 0.5, 33); q.rect(x - 1, y - 4, 2, 4, '#f6c64e'); q.px(x, y - 5, '#ff8ab0'); }   // vương miện
  { const [x, y] = q.pt(2, 0.4, 24); q.rect(x, y, 3, 1, '#a8a8b8'); q.rect(x, y + 1, 4, 6, COL[2].head); q.px(x + 1, y + 3, '#ffffff'); }   // áo treo bên hông
});
const kidToybox = () => isoSprite('kid_toybox', 1, 1, 22, q => {
  q.box(0.08, 0.15, 0, 0.84, 0.7, 9, shade('#f6c084'));
  q.box(0.08, 0.15, 9, 0.84, 0.7, 1.5, shade('#e8a060'));
  { const [x, y] = q.pt(0.5, 0.85, 5); q.rect(x - 2, y - 1, 4, 2, '#f6c64e'); }
  { const [x, y] = q.pt(0.35, 0.4, 10.5); q.ellipse(x, y - 3, 3, 3, '#e8606a'); q.rect(x - 2, y - 4, 4, 1, '#ffffff'); }   // bóng
  { const [x, y] = q.pt(0.7, 0.45, 10.5); q.rect(x - 1, y - 9, 1, 9, '#8a7a6a'); q.rect(x - 4, y - 10, 5, 3, '#8ad08a'); }   // chong chóng / cờ
  q.box(0.55, 0.9, 0, 0.3, 0.25, 2.5, shade('#6aa8e0')); q.box(0.58, 0.92, 2.5, 0.25, 0.2, 2.5, shade('#f6c64e'));   // khối gỗ rơi ra
});
export const KID_ART = {
  kid_bed_0: { place: 'floor' as const, size: [2, 3] as [number, number], sprite: kidBed(0) },
  kid_bed_1: { place: 'floor' as const, size: [2, 3] as [number, number], sprite: kidBed(1) },
  kid_bed_2: { place: 'floor' as const, size: [2, 3] as [number, number], sprite: kidBed(2) },
  kid_desk_0: { place: 'floor' as const, size: [2, 1] as [number, number], sprite: kidDesk(0) },
  kid_desk_1: { place: 'floor' as const, size: [2, 1] as [number, number], sprite: kidDesk(1) },
  kid_desk_2: { place: 'floor' as const, size: [2, 1] as [number, number], sprite: kidDesk(2) },
  kid_stool_0: { place: 'floor' as const, sprite: kidStool(0) },
  kid_stool_1: { place: 'floor' as const, sprite: kidStool(1) },
  kid_stool_2: { place: 'floor' as const, sprite: kidStool(2) },
  kid_night: { place: 'floor' as const, sprite: kidNight, glow: true },
  kid_toybox: { place: 'floor' as const, sprite: kidToybox },
  kid_wardrobe: { place: 'floor' as const, size: [2, 1] as [number, number], sprite: kidWardrobe },
};
/** Mép bồn cầu phía trước (che chân con đang ngồi) */
export function toiletFrontSprite() {
  return makeSprite('kidroom:toiletfront', 14, 7, p => { ellipse(p, 7, 2, 6.5, 2.5, '#ffffff'); p.rect(2, 2, 10, 5, '#ffffff'); p.rect(2, 6, 10, 1, '#d8d8e0'); p.rect(4, 0, 6, 1, '#e8e8f0'); });
}

/** Đồ dùng khi chơi / ăn với con (vẽ tay, toạ độ pixel của cảnh) */
export function kidPropSprite(kind: 'highchair' | 'bowl' | 'spoon' | 'ball' | 'block0' | 'block1' | 'block2' | 'paper' | 'crayon' | 'pencil') {
  return makeSprite(`kidprop:${kind}`, 16, 20, p => {
    if (kind === 'highchair') {                                                   // ghế ăn dặm cao có khay
      p.rect(3, 6, 2, 14, '#f6e6d0'); p.rect(11, 6, 2, 14, '#f6e6d0'); p.rect(2, 19, 4, 1, '#d8c0a0'); p.rect(10, 19, 4, 1, '#d8c0a0');
      p.rect(4, 2, 8, 8, '#a8dcc8'); p.rect(4, 2, 8, 1, '#c8f0e0'); p.rect(2, 10, 12, 2, '#ffffff'); p.rect(2, 12, 12, 1, '#d8d0d8');
      p.rect(5, 13, 6, 1, '#f6e6d0');
    } else if (kind === 'bowl') { ellipse(p, 8, 16, 4, 1.5, '#f6c64e'); p.rect(4, 16, 8, 2, '#f59ab3'); p.rect(5, 18, 6, 1, '#e48aa8'); ellipse(p, 8, 16, 3, 1, '#f6d890'); }
    else if (kind === 'spoon') { p.rect(7, 12, 1, 6, '#c0c4d0'); ellipse(p, 7.5, 11, 1.6, 1.2, '#e0e4ee'); p.px(7, 11, '#f6d890'); }
    else if (kind === 'ball') { ellipse(p, 8, 16, 3.5, 3.5, '#ffffff'); p.rect(6, 14, 4, 4, '#3a3a4a'); p.px(6, 14, '#ffffff'); p.px(9, 17, '#ffffff'); p.px(8, 13, '#3a3a4a'); }
    else if (kind.startsWith('block')) { const c = ['#e8606a', '#6aa8e0', '#f6c64e'][Number(kind.slice(5))]; p.rect(5, 14, 6, 6, c); p.rect(5, 14, 6, 1, mix(c, '#ffffff', 0.4)); p.rect(7, 16, 2, 2, '#ffffff'); }
    else if (kind === 'paper') { p.rect(3, 16, 10, 4, '#ffffff'); p.rect(3, 19, 10, 1, '#e0e0e8'); p.rect(5, 17, 3, 1, '#f59ab3'); p.rect(8, 18, 3, 1, '#6aa8e0'); p.px(10, 17, '#f6c64e'); }
    else if (kind === 'pencil') { p.rect(7, 13, 1, 6, '#f6c64e'); p.px(7, 12, '#e8b088'); p.px(7, 11, '#3a2a3a'); p.px(7, 19, '#f59ab3'); }
    else { p.rect(7, 13, 2, 6, '#e8606a'); p.px(7, 12, '#c04048'); }
  });
}
