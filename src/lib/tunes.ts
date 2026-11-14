// Giai điệu sàn khiêu vũ: các bản cổ điển / dân gian nổi tiếng đã thuộc phạm vi công cộng (tác giả mất trên 70 năm),
// chép lại bằng nốt rồi cho bộ tổng hợp âm thanh chơi — không dùng bản thu âm nào.
//  · Waltz   — "Dòng Danube xanh" (An der schönen blauen Donau), Johann Strauss II, 1866
//  · Ragtime — "The Entertainer", Scott Joplin, 1902
//  · Disco   — "Can-Can" (Galop infernal, Orphée aux enfers), Jacques Offenbach, 1858 — phối nhịp disco
//  · Cha-cha — "La Cucaracha", dân ca Mexico
//  · Tango   — "Habanera" (Carmen), Georges Bizet, 1875
//  · Lãng mạn — "Canon in D", Johann Pachelbel, ~1680

export type DanceMood = 'waltz' | 'jazz' | 'disco' | 'latin' | 'tango' | 'slow';
export interface Tune {
  title: string; bpm: number; per: number; bars: number; total: number; oct: number;
  /** số phách nhạc giữa hai mũi tên */
  arrow: number;
  /** nốt giai điệu gom theo phách: [vị trí lẻ trong phách, nốt MIDI, độ dài (phách)] */
  ev: [number, number, number][][];
  /** hợp âm từng ô nhịp (1 hoặc 2 hợp âm mỗi ô) */
  ch: number[][][];
}

const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const midi = (n: string) => { const m = /^([A-G])([#b]?)(\d)$/.exec(n)!; return 12 * (+m[3] + 1) + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); };
const chord = (s: string) => { const m = /^([A-G])([#b]?)(m?)(7?)$/.exec(s)!; const r = 48 + ((PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0)) % 12); return [r, r + (m[3] ? 3 : 4), r + 7, ...(m[4] ? [r + 10] : [])]; };

function tune(title: string, bpm: number, per: number, arrow: number, oct: number, mel: string[], ch: string): Tune {
  const total = mel.length * per, ev: Tune['ev'] = Array.from({ length: total }, () => []);
  let p = 0;
  for (const tok of mel.join(' ').split(/\s+/).filter(Boolean)) {
    const [n, l] = tok.split(':'), len = +l;
    if (n !== '-') ev[Math.floor(p + 1e-6) % total].push([p - Math.floor(p + 1e-6), midi(n), len]);
    p += len;
  }
  if (Math.abs(p - total) > 0.02) console.warn(`tune ${title}: ${p} phách, cần ${total}`);
  const chs = ch.trim().split(/\s+/).map(b => b.split(',').map(chord));
  return { title, bpm, per, bars: mel.length, total, oct, arrow, ev, ch: chs };
}

export const TUNES: Record<DanceMood, Tune> = {
  waltz: tune('Dòng Danube xanh — J. Strauss II', 150, 3, 3, 0, [
    '-:2 D4:1', 'D4:1 F#4:1 A4:1', 'A4:2 A5:1', 'A5:1 -:1 F#5:1', 'F#5:1 -:1 D4:1', 'D4:1 F#4:1 A4:1', 'A4:2 A5:1', 'A5:1 -:1 G5:1',
    'G5:1 -:1 C#4:1', 'C#4:1 E4:1 B4:1', 'B4:2 B5:1', 'B5:1 -:1 G5:1', 'G5:1 -:1 C#4:1', 'C#4:1 E4:1 B4:1', 'B4:2 B5:1', 'B5:1 -:1 F#5:1',
    'F#5:1 -:1 D4:1', 'D4:1 F#4:1 A4:1', 'D5:2 D6:1', 'D6:1 -:1 A5:1', 'A5:1 -:1 D4:1', 'D4:1 F#4:1 A4:1', 'D5:2 D6:1', 'D6:1 -:1 B5:1',
    'B5:1 -:1 E4:1', 'E4:1 G4:1 B4:1', 'B4:3', 'B4:1 G#4:1 A4:1', 'F#5:2 D5:1', 'F#4:2 F#4:1', 'E4:2 B4:1', 'A4:1 D5:2',
  ], 'D D D D D D D A7 A7 A7 A7 A7 A7 A7 A7 D D D D D D D D G Em Em Em A7 D D A7 D'),
  jazz: tune('The Entertainer — Scott Joplin', 200, 4, 4, 12, [
    'E4:.5 C5:1 E4:.5 C5:1 E4:.5 C5:2.5', '-:.5 C5:.5 D5:.5 D#5:.5', 'E5:.5 C5:.5 D5:.5 E5:1 B4:.5 D5:1', 'C5:3 D4:.5 D#4:.5',
    'E4:.5 C5:1 E4:.5 C5:1 E4:.5 C5:2.5', '-:2', 'A4:.5 G4:.5 F#4:.5 A4:.5 C5:.5 E5:1 D5:.5', 'C5:.5 A4:.5 D5:2 D4:.5 D#4:.5',
    'E4:.5 C5:1 E4:.5 C5:1 E4:.5 C5:2.5', '-:1 C5:.5 D5:.5', 'E5:.5 C5:.5 D5:.5 E5:1 C5:.5 D5:.5 C5:.5', 'E5:.5 C5:.5 D5:.5 E5:1 C5:.5 D5:.5 C5:.5',
    'E5:.5 C5:.5 D5:.5 E5:1 B4:.5 D5:1', 'C5:3 D4:.5 D#4:.5',
  ], 'C C C,G7 C C C D7 G7 C C7 C C C,G7 C'),
  disco: tune('Can-Can — J. Offenbach', 120, 4, 2, 0, [
    'C5:2 D5:.5 F5:.5 E5:.5 D5:.5', 'G5:1 G5:1 G5:.5 A5:.5 E5:.5 F5:.5', 'D5:1 D5:1 D5:.5 F5:.5 E5:.5 D5:.5', 'C5:.5 C6:.5 B5:.5 A5:.5 G5:.5 F5:.5 E5:.5 D5:.5',
    'C5:2 D5:.5 F5:.5 E5:.5 D5:.5', 'G5:1 G5:1 G5:.5 A5:.5 E5:.5 F5:.5', 'D5:1 D5:1 D5:.5 F5:.5 E5:.5 D5:.5', 'C5:.5 G5:.5 D5:.5 E5:.5 C5:2',
  ], 'C G7 G7 C C G7 G7 C'),
  latin: tune('La Cucaracha — dân ca Mexico', 112, 4, 2, 12, [
    'F4:1.5 A4:1 C4:.5 C4:.5 C4:.5', 'F4:1.5 A4:1.5 F4:.5 F4:.5', 'E4:.5 E4:.5 D4:.5 D4:.5 C4:2', '-:2.5 C4:.5 C4:.5 C4:.5',
    'E4:1.5 G4:1 C4:.5 C4:.5 C4:.5', 'E4:1.5 G4:1.5 C5:.5 D5:.5', 'C5:.5 Bb4:.5 A4:.5 G4:.5 F4:2', '-:2.5 C4:.5 C4:.5 C4:.5',
  ], 'F F C7 C7 C7 C7 F F'),
  tango: tune('Habanera (Carmen) — G. Bizet', 72, 4, 2, 12, [
    'D5:.75 C#5:.25 C5:.34 C5:.33 C5:.33 B4:.5 Bb4:.5 A4:1', 'A4:.75 G#4:.25 G4:.34 F4:.33 G4:.33 F4:.5 E4:.5 F4:1',
    'D5:.75 C#5:.25 C5:.34 C5:.33 C5:.33 B4:.5 Bb4:.5 A4:1', 'G4:.75 F4:.25 E4:.34 D4:.33 E4:.33 F4:.5 E4:.5 D4:1',
  ], 'Dm Dm,A7 Dm A7,Dm'),
  slow: tune('Canon in D — J. Pachelbel', 52, 4, 1, 0, [
    'F#5:2 E5:2', 'D5:2 C#5:2', 'B4:2 A4:2', 'B4:2 C#5:2',
    'D5:1 F#5:1 A5:1 G5:1', 'F#5:1 D5:1 F#5:1 E5:1', 'D5:1 B4:1 D5:1 A5:1', 'G5:1 B5:1 A5:1 G5:1',
  ], 'D,A Bm,F#m G,D G,A D,A Bm,F#m G,D G,A'),
};
/** ms giữa hai mũi tên của bài */
export const arrowMs = (m: DanceMood) => (60000 / TUNES[m].bpm) * TUNES[m].arrow;
/** ms một ô nhịp */
export const barMs = (m: DanceMood) => (60000 / TUNES[m].bpm) * TUNES[m].per;
