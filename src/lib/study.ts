// Dạy con học buổi tối: mỗi ngày 2–3 môn (Toán, Tiếng Việt, Tiếng Anh) như lớp 1–2 ngoài đời, mỗi môn 4 câu.
// Điểm lưu lại (kid_scores) để bé khoe với ba mẹ và cô giáo nhận xét ở buổi họp phụ huynh.
import { seeded } from './rng';

export type Subject = 'toan' | 'van' | 'anh';
export const SUBJECTS: Record<Subject, { name: string; icon: string }> = {
  toan: { name: 'Toán', icon: '➕' }, van: { name: 'Tiếng Việt', icon: '📖' }, anh: { name: 'Tiếng Anh', icon: '🔤' },
};
export interface Ex { q: string; options: string[]; ok: number; hint?: string }

/** Môn phải học tối nay (2–3 môn, đổi theo thứ trong tuần) */
export function subjectsOn(date: string): Subject[] {
  const w = new Date(`${date}T12:00:00`).getDay();
  return ([['toan', 'van'], ['toan', 'van'], ['toan', 'anh'], ['van', 'anh'], ['toan', 'van', 'anh'], ['toan', 'anh'], ['van', 'anh']] as Subject[][])[w];
}
/** Bé học tới đâu: lớp 1 (45–95 ngày tuổi game) rồi lớp 2 */
export const gradeOf = (age: number) => (age < 95 ? 1 : 2);

function shuffle<T>(a: T[], r: () => number) { return [...a].sort(() => r() - 0.5); }
function mc(q: string, right: string, wrong: string[], r: () => number, hint?: string): Ex {
  const options = shuffle([right, ...wrong.slice(0, 3)], r);
  return { q, options, ok: options.indexOf(right), hint };
}

function toan(r: () => number, grade: number): Ex[] {
  const max = grade === 1 ? 10 : 50;
  const n = (lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
  const out: Ex[] = [];
  const a = n(1, max), b = n(1, max - Math.min(a, max - 1));
  out.push(mc(`${a} + ${b} = ?`, String(a + b), [String(a + b + 1), String(a + b - 1), String(a + b + 2)], r));
  const c = n(5, max + 5), d = n(1, c - 1);
  out.push(mc(`${c} − ${d} = ?`, String(c - d), [String(c - d + 1), String(Math.max(0, c - d - 1)), String(c - d + 2)], r));
  const fruits: [string, string][] = [['🍊', 'quả cam'], ['🍎', 'quả táo'], ['🍬', 'cái kẹo'], ['🎈', 'quả bóng'], ['🖍️', 'cây bút màu']];
  const [ic, nm] = fruits[Math.floor(r() * fruits.length)];
  const x = n(2, grade === 1 ? 6 : 20), y = n(1, grade === 1 ? 4 : 15);
  const story = r() < 0.5
    ? mc(`Lan có ${x} ${nm} ${ic}, mẹ cho thêm ${y} ${nm}. Lan có tất cả bao nhiêu ${nm}?`, String(x + y), [String(x + y + 1), String(Math.abs(x - y)), String(x + y - 1)], r, 'Cho thêm → làm phép cộng')
    : mc(`Bình có ${x + y} ${nm} ${ic}, cho bạn ${y} ${nm}. Bình còn lại bao nhiêu ${nm}?`, String(x), [String(x + 1), String(x + y + y), String(Math.max(0, x - 1))], r, 'Cho bạn → làm phép trừ');
  out.push(story);
  const p = n(3, max), q = n(3, max);
  if (r() < 0.5) out.push(mc(`Điền dấu: ${p} … ${q}`, p > q ? '>' : p < q ? '<' : '=', ['>', '<', '='].filter(s => s !== (p > q ? '>' : p < q ? '<' : '=')), r));
  else { const k = n(2, max); out.push(mc(`Số liền sau của ${k} là?`, String(k + 1), [String(k - 1), String(k + 2), String(k)], r)); }
  return out;
}

const SPELL: [string, string[]][] = [
  ['con trâu', ['con châu', 'con trau', 'con chau']], ['quả chuối', ['quả truối', 'quả chúi', 'quả chuôi']], ['cái xẻng', ['cái sẻng', 'cái xẽng', 'cái sẽng']],
  ['ngôi sao', ['ngôi xao', 'ngôi sau', 'ngôi xau']], ['con rùa', ['con dùa', 'con giùa', 'con rúa']], ['nặng nề', ['lặng nề', 'nặng lề', 'lặng lề']],
  ['cây tre', ['cây che', 'cây tré', 'cây ché']], ['xinh xắn', ['sinh sắn', 'xinh sắn', 'sinh xắn']], ['giọt mưa', ['dọt mưa', 'rọt mưa', 'giọt mua']],
  ['bông lúa', ['bông núa', 'bông lúe', 'bông núe']], ['chăm chỉ', ['trăm chỉ', 'chăm trỉ', 'trăm trỉ']], ['sạch sẽ', ['xạch xẽ', 'sạch xẽ', 'xạch sẽ']],
];
const OPPOSITE: [string, string, string[]][] = [['cao', 'thấp', ['to', 'dài', 'xanh']], ['nóng', 'lạnh', ['ấm', 'mát', 'khô']], ['vui', 'buồn', ['cười', 'khóc', 'hát']], ['nhanh', 'chậm', ['xa', 'gần', 'mạnh']], ['to', 'nhỏ', ['cao', 'béo', 'dài']], ['ngày', 'đêm', ['sáng', 'trưa', 'chiều']], ['đen', 'trắng', ['đỏ', 'vàng', 'tím']]];
const MISSING: [string, string, string[]][] = [['con c_ (🐟)', 'á', ['a', 'à', 'ả']], ['quả b_ (🎈)', 'óng', ['òng', 'ông', 'õng']], ['cái m_ (🎩)', 'ũ', ['ú', 'u', 'ù']], ['con m_ (🐱)', 'èo', ['éo', 'eo', 'ẻo']], ['bông h_ (🌸)', 'oa', ['óa', 'òa', 'ọa']], ['con g_ (🐔)', 'à', ['á', 'a', 'ả']]];
const ORDER: [string, string[]][] = [['Em yêu mẹ lắm.', ['Mẹ lắm yêu em.', 'Yêu em mẹ lắm.', 'Lắm mẹ yêu em.']], ['Bé đi học đúng giờ.', ['Đi bé học giờ đúng.', 'Học bé đi đúng giờ.', 'Giờ đúng bé đi học.']], ['Hoa hồng nở rất đẹp.', ['Nở hoa hồng đẹp rất.', 'Rất đẹp hoa nở hồng.', 'Hồng hoa rất nở đẹp.']]];

function van(r: () => number): Ex[] {
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const [ok1, bad1] = pick(SPELL);
  const [w, opp, bad2] = pick(OPPOSITE);
  const [miss, okm, badm] = pick(MISSING);
  const [ok4, bad4] = pick(ORDER);
  return [
    mc('Từ nào viết đúng chính tả?', ok1, bad1, r),
    mc(`Từ trái nghĩa với "${w}" là?`, opp, bad2, r),
    mc(`Điền vần còn thiếu: ${miss}`, okm, badm, r),
    mc('Câu nào sắp xếp đúng?', ok4, bad4, r),
  ];
}

const WORDS: [string, string, string][] = [
  ['🍎', 'apple', 'quả táo'], ['🐱', 'cat', 'con mèo'], ['🐶', 'dog', 'con chó'], ['🐟', 'fish', 'con cá'], ['☀️', 'sun', 'mặt trời'], ['🌙', 'moon', 'mặt trăng'],
  ['📚', 'book', 'quyển sách'], ['🏠', 'house', 'ngôi nhà'], ['🚗', 'car', 'ô tô'], ['🌸', 'flower', 'bông hoa'], ['🍌', 'banana', 'quả chuối'], ['🐘', 'elephant', 'con voi'],
  ['👩', 'mother', 'mẹ'], ['👨', 'father', 'bố'], ['❤️', 'love', 'yêu thương'], ['🔴', 'red', 'màu đỏ'], ['🔵', 'blue', 'màu xanh dương'], ['🟡', 'yellow', 'màu vàng'],
];
const NUMBERS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
function anh(r: () => number): Ex[] {
  const ws = shuffle(WORDS, r);
  const [e1, en1, vi1] = ws[0], [e2, en2] = ws[1], [e3, en3] = ws[2];
  const others = (i: number, k: 1 | 2) => ws.slice(3 + i * 3, 6 + i * 3).map(w => w[k]);
  const k = Math.floor(r() * 10);
  const blank = en3.length > 3 ? Math.floor(r() * (en3.length - 1)) + 1 : 1;
  const masked = en3.slice(0, blank) + '_' + en3.slice(blank + 1);
  const letters = shuffle(['a', 'e', 'o', 'i', 'u', 'n', 't', 'r', 's', 'l'].filter(c => c !== en3[blank]), r).slice(0, 3);
  return [
    mc(`"${en1}" nghĩa là gì? ${e1}`, vi1, others(0, 2), r),
    mc(`${e2} tiếng Anh là gì?`, en2, others(1, 1), r),
    mc(`Số ${k + 1} tiếng Anh là?`, NUMBERS[k], shuffle(NUMBERS.filter((_, i) => i !== k), r).slice(0, 3), r),
    mc(`Điền chữ còn thiếu: ${masked} ${e3}`, en3[blank], letters, r),
  ];
}

/** Bài tập tối nay của một bé, một môn (cố định theo bé + ngày + môn) */
export function exercise(kidId: string, date: string, subject: Subject, grade: number): Ex[] {
  const r = seeded(`study:${kidId}:${date}:${subject}`);
  return subject === 'toan' ? toan(r, grade) : subject === 'van' ? van(r) : anh(r);
}
export const scoreOf = (right: number, total: number) => Math.round((right / total) * 10);

/** Giờ học buổi tối (sau giờ tan học) */
export const studyTime = (hour: number) => hour >= 16;

/** Điểm trên lớp hôm nay bé mang về khoe (theo môn của bài học trên lớp, nhích lên nếu tối hay được kèm) */
export function classGrade(kidId: string, date: string, recentAvg: number | null) {
  const r = seeded(`class:${kidId}:${date}`)();
  const base = recentAvg ?? 7;
  return Math.max(5, Math.min(10, Math.round(base - 1.5 + r * 3)));
}

/** Họp phụ huynh: 10 ngày một lần (cùng ngày cho cả hai người) */
export function meetingDay(date: string) {
  const n = Math.floor(Date.parse(`${date}T12:00:00Z`) / 864e5);
  return n % 10 === 3;
}
export function nextMeeting(date: string) {
  for (let i = 0; i < 12; i++) { const d = new Date(Date.parse(`${date}T12:00:00Z`) + i * 864e5).toISOString().slice(0, 10); if (meetingDay(d)) return d; }
  return date;
}
/** Lời cô giáo nhận xét theo điểm trung bình */
export function teacherComment(name: string, avg: number | null, sessions: number) {
  if (avg === null) return `Bé ${name} ngoan, nhưng mấy hôm nay ở nhà chưa ôn bài. Ba mẹ dành chút thời gian buổi tối kèm con nhé.`;
  if (avg >= 9) return `Bé ${name} học rất giỏi, phát biểu sôi nổi! Ba mẹ kèm con ${sessions} buổi rồi, cô thấy rõ sự tiến bộ. Cô đề nghị khen thưởng.`;
  if (avg >= 7.5) return `Bé ${name} học khá, chăm chỉ làm bài. Cố thêm chút nữa ở môn yếu là sẽ giỏi đều.`;
  if (avg >= 6) return `Bé ${name} có cố gắng nhưng hay mất tập trung. Ba mẹ cùng con ôn bài đều đặn mỗi tối nhé.`;
  return `Bé ${name} còn chậm ở vài môn. Cô và ba mẹ cùng kiên nhẫn với con, mỗi tối 15 phút là con sẽ tiến bộ.`;
}
export const PARENT_CHATTER = [
  'Mẹ bé Thỏ: "Nhà mình tối nào cũng phải dỗ con làm toán, mệt ghê!"',
  'Bố bé Gấu: "Cháu nhà tôi mê tiếng Anh, ngày nào cũng hát Baby Shark."',
  'Mẹ bé Mèo: "Cô ơi, tuần sau lớp có đi dã ngoại không ạ?"',
  'Bố bé Cún: "Con tôi về kể được cô khen, vui cả tối."',
  'Bà nội bé Gà: "Ngày xưa tôi học chữ bằng than trên nền nhà đấy…"',
];
