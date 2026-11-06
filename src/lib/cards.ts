// Bài hai người: 🃏 Sâm lốc (10 lá, không xét chất) và 🤥 Nói dối (J Q K A + Joker, úp bài rồi tuyên bố).
// Lá bài tây là số 0..51: hạng = c >> 2 (0 = "3" … 11 = "A", 12 = "2"), chất = c & 3 (♠ ♣ ♦ ♥).
import { seeded } from './rng';

export const RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
export const SUITS = ['♠', '♣', '♦', '♥'];
export const rank = (c: number) => c >> 2;
export const suit = (c: number) => c & 3;
export const label = (c: number) => RANKS[rank(c)] + SUITS[suit(c)];
export const red = (c: number) => suit(c) >= 2;

function shuffle<T>(arr: T[], seed: string) {
  const r = seeded(seed);
  const d = [...arr];
  for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
  return d;
}
const other = (hands: Record<string, unknown>, who: string) => Object.keys(hands).find(u => u !== who)!;

// ───────── Sâm lốc ─────────
export type Kind = 'single' | 'pair' | 'triple' | 'quad' | 'straight';
export interface Combo { kind: Kind; n: number; top: number } // top: hạng cao nhất
export const KIND_NAME: Record<Kind, string> = { single: 'Lá lẻ', pair: 'Đôi', triple: 'Sám cô', quad: 'Tứ quý', straight: 'Sảnh' };

export function classify(cards: number[]): Combo | null {
  const rs = cards.map(rank).sort((a, b) => a - b);
  const n = rs.length;
  if (!n) return null;
  if (rs.every(r => r === rs[0]) && n <= 4) return { kind: (['single', 'pair', 'triple', 'quad'] as const)[n - 1], n, top: rs[0] };
  // Sảnh: từ 3 lá liên tiếp, không có heo (2); riêng A-2-3 cũng là sảnh (nhỏ nhất)
  if (n >= 3 && n <= 10) {
    if (!rs.includes(12) && rs.every((r, i) => i === 0 || r === rs[i - 1] + 1)) return { kind: 'straight', n, top: rs[n - 1] };
    const low = rs.map(r => (r === 11 ? -2 : r === 12 ? -1 : r)).sort((a, b) => a - b);
    if (rs.includes(12) && low.every((r, i) => i === 0 || r === low[i - 1] + 1) && low[0] === -2) return { kind: 'straight', n, top: low[n - 1] };
  }
  return null;
}

/** Sâm: cùng kiểu cùng số lá thì hạng cao hơn mới chặn được (không xét chất); tứ quý chặt heo */
export function beats(play: Combo, prev: Combo | null): boolean {
  if (!prev) return true;
  if (play.kind === prev.kind && play.n === prev.n) return play.top > prev.top;
  if (play.kind === 'quad' && prev.kind === 'single' && prev.top === 12) return true;
  return false;
}

export interface Sam { hands: Record<string, number[]>; turn: string; table: number[] | null; lastBy: string | null; winner: string | null }
export function dealSam(seed: string, a: string, b: string, first?: string): Sam {
  const d = shuffle(Array.from({ length: 52 }, (_, i) => i), seed);
  const ha = d.slice(0, 10).sort((x, y) => x - y), hb = d.slice(10, 20).sort((x, y) => x - y);
  return { hands: { [a]: ha, [b]: hb }, turn: first ?? (ha[0] < hb[0] ? a : b), table: null, lastBy: null, winner: null };
}
export function playSam(s: Sam, who: string, cards: number[]): Sam | string {
  if (s.winner) return 'Ván đã xong';
  if (s.turn !== who) return 'Chưa tới lượt';
  const hand = s.hands[who];
  if (!cards.length || !cards.every(c => hand.includes(c))) return 'Bài không có trong tay';
  const c = classify(cards);
  if (!c) return 'Bộ bài này không hợp lệ';
  if (!beats(c, s.table ? classify(s.table) : null)) return 'Không chặn được bài trên bàn';
  const left = hand.filter(x => !cards.includes(x));
  return { hands: { ...s.hands, [who]: left }, table: [...cards].sort((a, b) => a - b), lastBy: who, turn: other(s.hands, who), winner: left.length ? null : who };
}
/** Bỏ lượt: hai người nên người kia được đánh tự do */
export function passSam(s: Sam, who: string): Sam | string {
  if (s.winner || s.turn !== who) return 'Chưa tới lượt';
  if (!s.table) return 'Đang được đánh tự do, phải đánh';
  return { ...s, turn: other(s.hands, who), table: null, lastBy: null };
}

// ───────── Nói dối ─────────
// Bộ bài: 5 lá mỗi loại J Q K A + 2 Joker (Joker thay được mọi lá). Mỗi người 5 lá, bàn gọi một loại.
export const LIAR_RANKS = ['J', 'Q', 'K', 'A'] as const;
export const JOKER = 'Joker';
export type LCard = (typeof LIAR_RANKS)[number] | typeof JOKER;
export interface Liar {
  table: (typeof LIAR_RANKS)[number];
  hands: Record<string, LCard[]>;
  turn: string;
  /** Lá vừa úp của người trước (chưa lật) */
  pile: { by: string; cards: LCard[] } | null;
  played: number;
  reveal: { caller: string; by: string; cards: LCard[]; lied: boolean; loser: string } | null;
}
export function dealLiar(seed: string, a: string, b: string, first: string): Liar {
  const deck: LCard[] = [...LIAR_RANKS.flatMap(r => Array<LCard>(5).fill(r)), JOKER, JOKER];
  const d = shuffle(deck, seed);
  const table = LIAR_RANKS[Math.floor(seeded(`table:${seed}`)() * 4)];
  return { table, hands: { [a]: d.slice(0, 5), [b]: d.slice(5, 10) }, turn: first, pile: null, played: 0, reveal: null };
}
/** Úp 1–3 lá (theo vị trí trong tay) và tuyên bố đều là lá của bàn */
export function liarPlay(s: Liar, who: string, idx: number[]): Liar | string {
  if (s.reveal) return 'Ván đã xong';
  if (s.turn !== who) return 'Chưa tới lượt';
  const hand = s.hands[who];
  if (idx.length < 1 || idx.length > 3 || new Set(idx).size !== idx.length || idx.some(i => i < 0 || i >= hand.length)) return 'Úp từ 1 đến 3 lá';
  const opp = other(s.hands, who);
  if (s.pile && s.pile.by === opp && !s.hands[opp].length) return 'Người kia hết bài rồi — phải lật!';
  const cards = idx.map(i => hand[i]);
  return { ...s, hands: { ...s.hands, [who]: hand.filter((_, i) => !idx.includes(i)) }, pile: { by: who, cards }, turn: opp, played: s.played + 1 };
}
/** Hô "Nói dối!": lật bài vừa úp. Có lá không phải lá bàn (và không phải Joker) → người úp thua, ngược lại người hô thua */
export function liarCall(s: Liar, who: string): Liar | string {
  if (s.reveal) return 'Ván đã xong';
  if (s.turn !== who || !s.pile || s.pile.by === who) return 'Chưa có gì để lật';
  const lied = s.pile.cards.some(c => c !== s.table && c !== JOKER);
  return { ...s, reveal: { caller: who, by: s.pile.by, cards: s.pile.cards, lied, loser: lied ? s.pile.by : who } };
}
/** Hết lượt mà cả hai hết bài, hoặc mình hết bài và người kia đã úp: bắt buộc phải lật */
export const mustCall = (s: Liar, who: string) => !!s.pile && s.pile.by !== who && (!s.hands[who].length || !s.hands[s.pile.by].length);
