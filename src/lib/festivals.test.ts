import { describe, expect, it } from 'vitest';
import { festivalsOn, loveDays, mainTheme, upcoming } from './festivals';

const people = { meName: 'An', partnerName: 'Bình', myBirthday: '1999-03-08', anniversary: '2025-11-06' };

describe('lịch ngày đặc biệt', () => {
  it('Valentine và ngày yêu nhau là lãng mạn', () => {
    expect(festivalsOn('2027-02-14', people).map(f => f.theme)).toContain('romantic');
    const anniv = festivalsOn('2026-11-06', people);
    expect(anniv[0].name).toBe('Kỷ niệm 1 năm yêu nhau');
    expect(mainTheme(anniv)).toBe('romantic');
  });
  it('đếm ngày yêu nhau kiểu Hàn (ngày đầu là ngày 1) và mốc 100 ngày', () => {
    expect(loveDays('2025-11-06', '2025-11-06')).toBe(1);
    expect(festivalsOn('2026-02-13', people).some(f => f.name === '100 ngày yêu nhau')).toBe(true);
  });
  it('sinh nhật, Tết âm lịch, ngày thường thì không có gì', () => {
    expect(festivalsOn('2027-03-08', people)[0].theme).toBe('party');
    expect(festivalsOn('2027-02-06', people).some(f => f.theme === 'tet')).toBe(true);
    expect(festivalsOn('2026-07-02', people)).toEqual([]);
  });
  it('ngày tự ghi: lặp hằng năm hoặc chỉ một lần', () => {
    const custom = [
      { id: 'a', day: '2025-06-01', title: 'Lần đầu nắm tay', icon: '🤝', theme: 'romantic' as const, yearly: true, created_by: 'x' },
      { id: 'b', day: '2026-12-20', title: 'Bay sang Đài', icon: '✈️', theme: 'party' as const, yearly: false, created_by: 'x' },
    ];
    const p = { ...people, custom };
    expect(festivalsOn('2027-06-01', p)[0].name).toBe('Lần đầu nắm tay');
    expect(festivalsOn('2026-12-20', p)[0].name).toBe('Bay sang Đài');
    expect(festivalsOn('2027-12-20', p)).toEqual([]);
    expect(upcoming('2026-12-01', p, 30).map(u => u.name)).toContain('Bay sang Đài');
  });
});
