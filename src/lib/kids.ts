// Em bé của hai bạn: lớn dần theo ngày thật (sơ sinh → tập đi → bé con), cần được chăm (ăn, vệ sinh, ngủ, chơi).
import type { CareKind, Kid, Profile } from './api';
import { ellipse } from './iso';
import { makeSprite, mix } from './pixel';
import { HAIR_COLORS, SKINS } from './sprites';

export type KidStage = 'baby' | 'toddler' | 'child' | 'student';
const DAY = 86400e3;
export const kidAge = (k: Kid, today: string) => Math.max(0, Math.round((Date.parse(today) - Date.parse(k.born_on)) / DAY));
export const kidStage = (k: Kid, today: string): KidStage => { const a = kidAge(k, today); return a < 7 ? 'baby' : a < 21 ? 'toddler' : a < 45 ? 'child' : 'student'; };
export const STAGE_NAME: Record<KidStage, string> = { baby: 'Sơ sinh', toddler: 'Tập đi', child: 'Bé con', student: 'Đi học' };

/** Màu da lấy từ bố hoặc mẹ, màu tóc từ người còn lại (cố định theo bé) */
export function kidLook(k: Kid, a: Profile | null, b: Profile | null) {
  const h = [...k.id].reduce((s, c) => s + c.charCodeAt(0), 0);
  const [p1, p2] = h % 2 ? [a, b] : [b, a];
  return { skin: SKINS[p1?.avatar?.skin ?? 0], hair: HAIR_COLORS[p2?.avatar?.hairColor ?? 0], cloth: k.gender === 'm' ? '#8db8ef' : k.gender === 'f' ? '#f59ab3' : '#f6e27a' };
}
type Look = ReturnType<typeof kidLook>;

export function kidSprite(stage: KidStage, look: Look, frame: 'idle' | 'walk' | 'sleep', girl: boolean) {
  const key = `kid:${stage}:${look.skin}:${look.hair}:${look.cloth}:${frame}:${girl}`;
  if (stage === 'baby') {
    return makeSprite(key, 12, 10, p => {
      ellipse(p, 6.5, 6.5, 5.5, 3.5, look.cloth);                     // khăn quấn
      ellipse(p, 6.5, 7, 4, 2.2, mix(look.cloth, '#ffffff', 0.4));
      ellipse(p, 4, 4, 3.4, 3.2, look.skin);                         // đầu
      p.rect(2, 1, 4, 1, look.hair); p.px(3, 0, look.hair);
      if (frame === 'sleep') { p.rect(2, 4, 1, 1, '#3b2d3f'); p.rect(5, 4, 1, 1, '#3b2d3f'); }
      else { p.px(2, 4, '#3b2d3f'); p.px(5, 4, '#3b2d3f'); }
      p.px(1, 5, '#f8a8b8'); p.px(6, 5, '#f8a8b8');
    });
  }
  const tall = stage === 'child' || stage === 'student';
  const H = tall ? 18 : 13, W = tall ? 12 : 10;
  return makeSprite(key, W, H, p => {
    const cx = W / 2, hr = tall ? 4.2 : 3.8, hy = hr + 1;
    const step = frame === 'walk';
    // Chân
    const ly = Math.round(hy + hr + (tall ? 7 : 4));
    p.rect(cx - 3 + (step ? 1 : 0), ly, 2, H - ly, look.skin); p.rect(cx + 1 - (step ? 1 : 0), ly, 2, H - ly, look.skin);
    p.rect(cx - 3 + (step ? 1 : 0), H - 1, 2, 1, '#8a5a3c'); p.rect(cx + 1 - (step ? 1 : 0), H - 1, 2, 1, '#8a5a3c');
    // Thân (váy cho bé gái lớn)
    const by = Math.round(hy + hr - 1);
    if (girl && tall) { for (let y = by; y < ly + 1; y++) { const w = 3 + Math.floor((y - by) / 2); p.rect(cx - w, y, w * 2, 1, look.cloth); } }
    else p.rect(cx - 3, by, 6, ly - by + (tall ? 0 : 1), look.cloth);
    p.rect(cx - 3, by, 6, 1, mix(look.cloth, '#ffffff', 0.4));
    if (!tall) p.rect(cx - 3, ly - 1, 6, 2, '#ffffff');               // tã
    // Đầu, tóc, mặt
    ellipse(p, cx, hy, hr, hr, look.skin);
    p.rect(cx - hr + 1, hy - hr, hr * 2 - 1, 2, look.hair); p.px(cx - hr + 1, hy - hr + 2, look.hair); p.px(cx + hr - 1, hy - hr + 2, look.hair);
    if (girl) { p.px(cx - hr, hy - 1, look.hair); p.px(cx + hr, hy - 1, look.hair); p.px(cx + hr, hy - hr + 1, '#f59ab3'); }
    p.px(cx - 2, hy, '#3b2d3f'); p.px(cx + 1, hy, '#3b2d3f');
    p.px(cx - 2, hy - 1, '#ffffff');
    p.px(cx - 3, hy + 1, '#f8a8b8'); p.px(cx + 2, hy + 1, '#f8a8b8');
    p.px(cx - 0.5, hy + 2, '#e86a7a');
    if (stage === 'student') { p.rect(0, by + 1, 2, 5, '#e86a7a'); p.rect(0, by + 1, 2, 1, '#f59ab3'); p.px(2, by + 1, '#8a3a4a'); }   // cặp sách
  });
}

export function cradleSprite() {
  return makeSprite('cradle', 22, 16, p => {
    ellipse(p, 11, 9, 10, 5, '#d8a066'); ellipse(p, 11, 8, 9, 4, '#f2dcc0');
    for (let x = 3; x < 20; x += 3) p.rect(x, 9, 1, 4, '#b07a4a');
    p.rect(2, 12, 18, 2, '#b07a4a');
    for (let x = 1; x < 21; x++) p.px(x, 15 - Math.round(Math.sin(((x - 1) / 19) * Math.PI) * 2), '#8a5a3c');
    p.rect(14, 0, 2, 8, '#d8a066'); p.rect(12, 0, 6, 1, '#d8a066');      // cần treo đồ chơi
    p.px(13, 2, '#f6c64e'); p.px(17, 2, '#8db8ef'); p.px(15, 3, '#f59ab3');
  });
}
export function strollerSprite() {
  return makeSprite('stroller', 16, 14, p => {
    for (let y = 0; y < 7; y++) { const w = Math.round(Math.sqrt(49 - (7 - y) ** 2)); p.rect(8 - w, y, w, 1, '#f59ab3'); }
    p.rect(1, 6, 13, 3, '#f7b8cc'); p.rect(1, 6, 13, 1, '#ffd6e2');
    p.rect(13, 2, 1, 6, '#8a8098'); p.rect(13, 2, 3, 1, '#8a8098');
    ellipse(p, 4, 11.5, 2, 2, '#5a5a6a'); ellipse(p, 11, 11.5, 2, 2, '#5a5a6a');
    p.px(4, 11, '#c8c8d0'); p.px(11, 11, '#c8c8d0');
  });
}

// ───────── Nhu cầu của bé ─────────

export const NEEDS: { kind: CareKind; field: keyof Kid; label: string; icon: string; hours: number }[] = [
  { kind: 'feed', field: 'fed_at', label: 'No bụng', icon: '🍼', hours: 8 },
  { kind: 'clean', field: 'bathed_at', label: 'Sạch sẽ', icon: '🫧', hours: 24 },
  { kind: 'sleep', field: 'slept_at', label: 'Ngủ đủ', icon: '😴', hours: 16 },
  { kind: 'play', field: 'played_at', label: 'Vui vẻ', icon: '🧸', hours: 12 },
];
/** 0..100 cho mỗi nhu cầu */
export function needLevel(k: Kid, field: keyof Kid, hours: number) {
  const at = k[field] as string | null;
  if (!at) return 20;
  return Math.max(0, Math.min(100, Math.round(100 - ((Date.now() - Date.parse(at)) / 3600e3 / hours) * 100)));
}
export function kidMood(k: Kid) {
  const lv = NEEDS.map(n => needLevel(k, n.field, n.hours));
  const low = NEEDS.filter((_, i) => lv[i] < 30);
  return { avg: lv.reduce((a, b) => a + b, 0) / lv.length, low };
}

export interface CareAction { id: string; kind: CareKind; icon: string; label: string; say: string; milestone?: string }
export const ACTIONS: Record<KidStage, CareAction[]> = {
  baby: [
    { id: 'bottle', kind: 'feed', icon: '🍼', label: 'Bú bình', say: '🍼 Ực ực…' },
    { id: 'diaper', kind: 'clean', icon: '🧷', label: 'Thay tã', say: '🧷 Sạch thơm rồi!' },
    { id: 'bath', kind: 'clean', icon: '🛁', label: 'Tắm cho bé', say: '🛁 Bé té nước tung tóe' },
    { id: 'lullaby', kind: 'sleep', icon: '🎶', label: 'Hát ru', say: '🎶 À ơi… bé ngủ ngoan' },
    { id: 'hold', kind: 'play', icon: '🤱', label: 'Bế bé', say: '🤱 Bé cười khúc khích' },
  ],
  toddler: [
    { id: 'puree', kind: 'feed', icon: '🥣', label: 'Ăn dặm', say: '🥣 Măm măm!' },
    { id: 'bath', kind: 'clean', icon: '🛁', label: 'Tắm', say: '🛁 Vịt cao su nổi lềnh bềnh' },
    { id: 'nap', kind: 'sleep', icon: '😴', label: 'Ru ngủ trưa', say: '😴 Khò khò…' },
    { id: 'toy', kind: 'play', icon: '🧸', label: 'Chơi đồ chơi', say: '🧸 Bé ôm gấu cười tít mắt' },
    { id: 'walk', kind: 'play', icon: '👣', label: 'Tập đi', say: '👣 Chập chững… chập chững!', milestone: 'walk' },
    { id: 'talk', kind: 'play', icon: '🗣️', label: 'Dạy nói', say: '🗣️ …', milestone: 'talk' },
  ],
  child: [
    { id: 'meal', kind: 'feed', icon: '🍚', label: 'Ăn cơm', say: '🍚 Con ăn hết sạch!' },
    { id: 'bath', kind: 'clean', icon: '🛁', label: 'Tắm', say: '🛁 Thơm phức!' },
    { id: 'bedtime', kind: 'sleep', icon: '🛏️', label: 'Kể chuyện đi ngủ', say: '📖 Ngày xửa ngày xưa…' },
    { id: 'ball', kind: 'play', icon: '⚽', label: 'Chơi bóng', say: '⚽ Sút nè!' },
    { id: 'study', kind: 'play', icon: '📚', label: 'Học bài', say: '📚 A, ă, â…', milestone: 'read' },
    { id: 'draw', kind: 'play', icon: '🎨', label: 'Vẽ tranh', say: '🎨 Con vẽ ba mẹ nè!', milestone: 'draw' },
  ],
  student: [
    { id: 'meal', kind: 'feed', icon: '🍱', label: 'Chuẩn bị cơm hộp', say: '🍱 Cơm hộp hình gấu!' },
    { id: 'bath', kind: 'clean', icon: '🛁', label: 'Tắm', say: '🛁 Thơm phức!' },
    { id: 'bedtime', kind: 'sleep', icon: '🛏️', label: 'Đi ngủ sớm', say: '🌙 Mai con đi học nha' },
    { id: 'school', kind: 'play', icon: '🏫', label: 'Đưa bé đi học', say: '🏫 Con chào ba mẹ, con đi học đây!', milestone: 'school' },
    { id: 'homework', kind: 'play', icon: '✏️', label: 'Kèm bài tập', say: '✏️ 1 + 1 = 2!', milestone: 'homework' },
    { id: 'card', kind: 'play', icon: '💌', label: 'Bé làm thiệp', say: '💌 Con tặng ba mẹ nè!', milestone: 'card' },
  ],
};
export const MILESTONES: Record<string, string> = {
  born: '🐦 Cò mang bé về nhà', talk: '🗣️ Tiếng gọi đầu tiên', walk: '👣 Những bước đi đầu tiên', read: '📚 Lần đầu đọc chữ', draw: '🎨 Bức tranh đầu tiên vẽ ba mẹ',
  school: '🏫 Ngày đầu tiên đi học', homework: '✏️ Bài tập đầu tiên được điểm 10', card: '💌 Tấm thiệp đầu tiên tặng ba mẹ',
};
