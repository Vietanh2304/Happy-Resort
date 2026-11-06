// Lịch ngày đặc biệt: vài ngày quan trọng có sẵn (Valentine, ngày yêu nhau, sinh nhật, Tết, Trung thu, Giáng sinh)
// cộng những ngày hai bạn tự ghi. Mỗi ngày đặc biệt làng đổi cảnh theo "phong cách" của ngày đó,
// hai bạn nhận quà một lần và có thể tự bày thêm đồ trang trí cho ngày hôm ấy.
import type { Gift } from './content';

export type Theme = 'romantic' | 'party' | 'calm' | 'tet' | 'lantern' | 'winter';
export interface Festival { id: string; theme: Theme; name: string; icon: string; greet: string; gift: Gift[]; custom?: boolean }
export interface CustomDay { id: string; day: string; title: string; icon: string; theme: Theme; yearly: boolean; created_by: string }

// Ngày dương của Tết và Trung thu
const TET = ['2026-02-17', '2027-02-06', '2028-01-26', '2029-02-13', '2030-02-03', '2031-01-23', '2032-02-11'];
const MID_AUTUMN = ['2026-09-25', '2027-09-15', '2028-10-03', '2029-09-22', '2030-09-12', '2031-10-01', '2032-09-19'];

const DAY = 86400e3;
const toMs = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
const fromMs = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const addDays = (d: string, n: number) => fromMs(toMs(d) + n * DAY);
export const diffDays = (a: string, b: string) => Math.round((toMs(b) - toMs(a)) / DAY);

export interface People { meName: string; partnerName: string; myBirthday?: string | null; partnerBirthday?: string | null; anniversary?: string | null; custom?: CustomDay[] }

/** Số ngày yêu nhau kiểu Hàn: ngày bắt đầu là ngày thứ 1 */
export const loveDays = (anniversary: string, today: string) => diffDays(anniversary, today) + 1;

export function festivalsOn(date: string, p: People): Festival[] {
  const out: Festival[] = [];
  const md = date.slice(5), year = date.slice(0, 4);

  if (p.anniversary && p.anniversary <= date) {
    const n = loveDays(p.anniversary, date);
    const years = +year - +p.anniversary.slice(0, 4);
    if (p.anniversary.slice(5) === md && years > 0) out.push({ id: `anniv:${year}`, theme: 'romantic', name: `Kỷ niệm ${years} năm yêu nhau`, icon: '💍', greet: `${years} năm bên nhau rồi đó! Cảm ơn vì đã luôn ở đây 💍`, gift: [{ id: 'love_ring', n: 1 }, { id: 'bouquet', n: 1 }] });
    else if (n % 100 === 0) out.push({ id: `day${n}`, theme: 'romantic', name: `${n} ngày yêu nhau`, icon: '💯', greet: `Hôm nay là ngày thứ ${n} hai bạn yêu nhau 💕`, gift: [{ id: 'bouquet', n: 1 }, { id: 'chocolate', n: 1 }] });
  }
  if (md === '02-14') out.push({ id: `valentine:${year}`, theme: 'romantic', name: 'Valentine', icon: '💝', greet: 'Valentine vui vẻ nha! Trong túi có sô-cô-la để tặng người ấy 🍫', gift: [{ id: 'chocolate', n: 2 }, { id: 'bouquet', n: 1 }] });
  if (p.myBirthday?.slice(5) === md) out.push({ id: `bday-me:${year}`, theme: 'party', name: 'Sinh nhật bạn', icon: '🎂', greet: `Chúc mừng sinh nhật ${p.meName}! Cả làng treo bóng bay cho bạn 🎈`, gift: [{ id: 'birthday_cake', n: 1 }, { id: 'gift_box', n: 1 }] });
  if (p.partnerBirthday?.slice(5) === md) out.push({ id: `bday-partner:${year}`, theme: 'party', name: `Sinh nhật ${p.partnerName}`, icon: '🎂', greet: `Hôm nay sinh nhật ${p.partnerName}! Nhớ gửi lời chúc và quà nhé 🎁`, gift: [{ id: 'birthday_cake', n: 1 }] });
  if (TET.some(d => { const k = diffDays(d, date); return k >= -1 && k <= 3; })) out.push({ id: `tet:${year}`, theme: 'tet', name: 'Tết Nguyên Đán', icon: '🧧', greet: 'Chúc mừng năm mới! Năm nay mình vẫn bên nhau nhé 🧧🌸', gift: [{ id: 'lixi', n: 1 }, { id: 'peach', n: 1 }] });
  if (MID_AUTUMN.includes(date)) out.push({ id: `midautumn:${year}`, theme: 'lantern', name: 'Trung Thu', icon: '🥮', greet: 'Trung thu trăng tròn — lên đồi ngắm trăng và ăn bánh nướng nhé 🥮🏮', gift: [{ id: 'mooncake', n: 2 }, { id: 'star_lantern', n: 1 }] });
  if (md === '12-24' || md === '12-25') out.push({ id: `xmas:${year}`, theme: 'winter', name: 'Giáng Sinh', icon: '🎄', greet: 'Giáng sinh an lành! Có quà dưới gốc thông cho hai bạn 🎁', gift: [{ id: 'xmas_tree', n: 1 }, { id: 'gift_box', n: 1 }] });

  for (const c of p.custom ?? []) {
    if (c.yearly ? c.day.slice(5) === md && c.day <= date : c.day === date) {
      out.push({ id: `custom:${c.id}:${year}`, theme: c.theme, name: c.title, icon: c.icon, greet: `Hôm nay là ngày "${c.title}" ${c.icon}`, gift: [], custom: true });
    }
  }
  return out;
}

/** Các dịp sắp tới trong `days` ngày (để đếm ngược) */
export function upcoming(today: string, p: People, days = 120) {
  const list: { date: string; name: string; icon: string; inDays: number }[] = [];
  const seen = new Set<string>();
  for (let i = 0; i <= days; i++) {
    const d = addDays(today, i);
    for (const f of festivalsOn(d, p)) {
      const key = f.name;
      if (seen.has(key)) continue;
      seen.add(key);
      list.push({ date: d, name: f.name, icon: f.icon, inDays: i });
    }
  }
  return list;
}

/** Ưu tiên phong cách khi trùng nhiều dịp trong một ngày */
export function mainTheme(fs: Festival[]): Theme | null {
  const order: Theme[] = ['romantic', 'party', 'tet', 'lantern', 'winter', 'calm'];
  return order.find(t => fs.some(f => f.theme === t)) ?? null;
}

/** Cảnh làng theo phong cách: treo trên cột đèn, đạo cụ quanh quảng trường, thứ rơi lả tả, băng rôn, đồ để tự bày */
export const THEMES: Record<Theme, { label: string; hang: string; props: string[]; fall: string[]; tint: string; palette: string[] }> = {
  romantic: { label: '💕 Lãng mạn', hang: '💗', props: ['🌹', '💐', '🕯️', '💌'], fall: ['🌹', '💗', '🌸'], tint: 'romantic', palette: ['🌹', '💐', '🕯️', '💗', '💌', '🎀', '🧸', '🍫', '🥂', '💝', '🌷', '✨'] },
  party: { label: '🎉 Tiệc tùng', hang: '🎈', props: ['🎂', '🎁', '🎈', '🎉'], fall: ['🎊', '🎉', '✨'], tint: 'party', palette: ['🎈', '🎁', '🎂', '🎉', '🎊', '🧁', '🍰', '🎀', '🪅', '🥳', '🍾', '⭐'] },
  calm: { label: '🌸 Nhẹ nhàng', hang: '🌼', props: ['🌷', '🍃', '🌼', '🦋'], fall: ['🌸', '🍃'], tint: 'calm', palette: ['🌷', '🌼', '🌻', '🍃', '🦋', '🪴', '🕊️', '☕', '📚', '🌈', '🍀', '🐝'] },
  tet: { label: '🧧 Tết', hang: '🏮', props: ['🌸', '🧧', '🎍', '🌼'], fall: ['🌸', '🧧'], tint: 'tet', palette: ['🏮', '🧧', '🌸', '🌼', '🎍', '🍊', '🧨', '🐉', '🎆', '🍵', '🍉', '✨'] },
  lantern: { label: '🏮 Đèn lồng', hang: '🏮', props: ['🥮', '🐇', '⭐', '🏮'], fall: ['✨', '⭐'], tint: 'lantern', palette: ['🏮', '⭐', '🥮', '🐇', '🌕', '🍵', '🪔', '✨', '🎑', '🌙', '🍡', '🦊'] },
  winter: { label: '🎄 Mùa đông', hang: '🔔', props: ['🎄', '🎁', '⛄', '🦌'], fall: ['❄️', '✨'], tint: 'winter', palette: ['🎄', '🎁', '⛄', '🦌', '🔔', '🕯️', '🧦', '🍪', '❄️', '⭐', '🧣', '☃️'] },
};
export const CUSTOM_ICONS = ['💕', '💍', '🎂', '✈️', '🏠', '🎓', '🎉', '🌸', '🍀', '⭐', '📸', '🐾', '🎵', '🍜', '🌙', '🎁'];
