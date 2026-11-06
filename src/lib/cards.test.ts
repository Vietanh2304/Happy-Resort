import { describe, expect, it } from 'vitest';
import { beats, classify, dealLiar, dealSam, liarCall, liarPlay, mustCall, passSam, playSam, type Liar, type Sam } from './cards';

const c = (r: string, s = '♠') => ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'].indexOf(r) * 4 + ['♠', '♣', '♦', '♥'].indexOf(s);

describe('sâm lốc', () => {
  it('nhận đúng các bộ, kể cả sảnh A-2-3', () => {
    expect(classify([c('5'), c('5', '♥')])?.kind).toBe('pair');
    expect(classify([c('5'), c('6'), c('7', '♦')])?.kind).toBe('straight');
    expect(classify([c('A'), c('2'), c('3')])?.kind).toBe('straight');
    expect(classify([c('K'), c('A'), c('2')])).toBeNull();
    expect(classify([c('9'), c('9', '♣'), c('9', '♦'), c('9', '♥')])?.kind).toBe('quad');
    expect(classify([c('5'), c('7')])).toBeNull();
  });
  it('không xét chất: cùng hạng không chặn được nhau; tứ quý chặt heo', () => {
    const one = (x: number[]) => classify(x)!;
    expect(beats(one([c('7', '♥')]), one([c('7', '♠')]))).toBe(false);
    expect(beats(one([c('8')]), one([c('7', '♥')]))).toBe(true);
    expect(beats(one([c('A'), c('2'), c('3')]), one([c('3'), c('4'), c('5')]))).toBe(false);
    expect(beats(one([c('9'), c('9', '♣'), c('9', '♦'), c('9', '♥')]), one([c('2', '♥')]))).toBe(true);
  });
  it('chia 10 lá, đánh, bỏ lượt, hết bài thì thắng', () => {
    let s = dealSam('x', 'a', 'b');
    expect(s.hands.a).toHaveLength(10);
    const who = s.turn, opp = who === 'a' ? 'b' : 'a';
    s = playSam(s, who, [s.hands[who][0]]) as Sam;
    expect(s.turn).toBe(opp);
    s = passSam(s, opp) as Sam;
    expect(s.table).toBeNull();
    const last: Sam = { hands: { a: [c('3')], b: [c('2')] }, turn: 'a', table: null, lastBy: null, winner: null };
    expect((playSam(last, 'a', [c('3')]) as Sam).winner).toBe('a');
  });
});

describe('nói dối', () => {
  const base = (hands: Liar['hands']): Liar => ({ table: 'Q', hands, turn: 'a', pile: null, played: 0, reveal: null });
  it('chia 5 lá mỗi người, bàn gọi một loại', () => {
    const s = dealLiar('s', 'a', 'b', 'a');
    expect(s.hands.a).toHaveLength(5);
    expect(['J', 'Q', 'K', 'A']).toContain(s.table);
  });
  it('lật trúng nói dối → người úp thua; bài thật (kể cả Joker) → người hô thua', () => {
    let s = liarPlay(base({ a: ['K', 'Q', 'J'], b: ['A'] }), 'a', [0, 1]) as Liar;
    expect(s.turn).toBe('b');
    expect((liarCall(s, 'b') as Liar).reveal).toMatchObject({ lied: true, loser: 'a' });
    s = liarPlay(base({ a: ['Q', 'Joker', 'J'], b: ['A'] }), 'a', [0, 1]) as Liar;
    expect((liarCall(s, 'b') as Liar).reveal).toMatchObject({ lied: false, loser: 'b' });
  });
  it('người kia úp hết bài thì mình bắt buộc phải lật', () => {
    const s = liarPlay(base({ a: ['Q'], b: ['A', 'K'] }), 'a', [0]) as Liar;
    expect(mustCall(s, 'b')).toBe(true);
    expect(liarPlay(s, 'b', [0])).toMatch(/lật/);
    expect(liarPlay(base({ a: ['Q', 'K', 'A', 'J'], b: [] }), 'a', [0, 1, 2, 3])).toMatch(/1 đến 3/);
  });
});
