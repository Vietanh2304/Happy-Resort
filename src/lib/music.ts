// Nhạc nền lo-fi chill tự sinh bằng Web Audio (không dùng file nhạc, không lo bản quyền):
// hợp âm piano điện ấm, giai điệu ngũ cung thưa thớt có tiếng vang, trống nhẹ, tiếng đĩa than lạo xạo.

import { TUNES, type DanceMood } from './tunes';

export type Mood = 'day' | 'night' | 'love' | 'cafe' | 'camp' | 'sea' | 'deep' | 'sky' | DanceMood;

const PROG: Record<Mood, number[][]> = {
  day: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]],      // Fmaj7 Em7 Dm7 Cmaj7
  night: [[45, 48, 52, 55], [50, 53, 57, 60], [43, 47, 50, 53], [48, 52, 55, 59]],    // Am7 Dm7 G7 Cmaj7
  love: [[48, 52, 55, 59], [45, 48, 52, 55], [53, 57, 60, 64], [55, 59, 62, 64]],     // Cmaj7 Am7 Fmaj7 G6 — vòng hợp âm "tình yêu"
  cafe: [[50, 53, 57, 60, 64], [43, 53, 59, 64], [48, 52, 55, 59, 62], [45, 55, 61, 64]], // Dm9 G13 Cmaj9 A7 — jazz quán cà phê
  camp: [[43, 47, 50, 55, 59], [38, 45, 50, 54, 57], [40, 47, 52, 55, 59], [36, 43, 48, 52, 55]], // G D Em C — ghi-ta bên lửa trại
  deep: [[45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59], [40, 47, 52, 55]],                // Am9 F G Em — lặn dưới biển, mơ màng
  sky: [[48, 55, 60, 64], [43, 50, 55, 59], [45, 52, 57, 60], [41, 48, 53, 57]],                  // C G Am F — bay giữa trời
  sea: [[50, 54, 57, 61], [47, 50, 54, 57], [43, 47, 50, 54], [45, 49, 52, 57]],                  // Dmaj7 Bm7 Gmaj7 A — nghỉ dưỡng bên biển
  // Sàn nhảy
  waltz: [[48, 52, 55], [53, 57, 60], [55, 59, 62], [48, 52, 55]],                                  // C F G C — waltz 3/4
  jazz: [[50, 53, 57, 60], [43, 50, 53, 59], [48, 52, 55, 59], [45, 49, 55, 60]],                  // ii-V-I-VI swing
  disco: [[45, 52, 57, 60], [45, 52, 57, 60], [43, 50, 55, 59], [41, 48, 53, 57]],                  // Am Am G F — disco sôi động
  latin: [[45, 52, 57, 60], [50, 53, 57, 62], [52, 56, 59, 62], [45, 52, 57, 60]],                  // Am Dm E7 Am — cha-cha
  slow: [[48, 52, 55, 59], [45, 48, 52, 55], [41, 45, 48, 52], [43, 47, 50, 53]],                   // Cmaj7 Am7 Fmaj7 G7 — khiêu vũ chậm
  tango: [[50, 53, 57], [50, 53, 57], [45, 49, 52, 55], [50, 53, 57]],                              // Dm Dm A7 Dm
};
/** Bài nhạc cho sàn nhảy */
export const DANCE_SONGS: { mood: DanceMood; name: string }[] = [
  { mood: 'waltz', name: '🎻 Waltz · Dòng Danube xanh' }, { mood: 'slow', name: '🌙 Lãng mạn · Canon in D' }, { mood: 'tango', name: '🌹 Tango · Habanera' },
  { mood: 'jazz', name: '🎷 Swing · The Entertainer' }, { mood: 'latin', name: '💃 Cha-cha · La Cucaracha' }, { mood: 'disco', name: '🪩 Disco · Can-Can' },
];
const LOVE_MELODY = [76, 74, 72, 74, 76, 79, 76, 74, 72, 69, 72, 74, 76, 72, 74, 72];
const PENTA = [72, 74, 76, 79, 81, 84];
const BPM = 70;
const BEAT = 60 / BPM;
const hz = (m: number) => 440 * 2 ** ((m - 69) / 12);

class Lofi {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private tone!: BiquadFilterNode;
  private echo!: DelayNode;
  private noise!: AudioBuffer;
  private crackle: AudioBufferSourceNode | null = null;
  private fb!: GainNode;
  private crackleG: GainNode | null = null;
  private wind: { src: AudioBufferSourceNode; lfo: OscillatorNode } | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextBeat = 0;
  private beat = 0;
  private mood: Mood = 'day';
  private vol = 0.5;
  playing = false;

  private setup() {
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.tone = ctx.createBiquadFilter();
    this.tone.type = 'lowpass';
    this.tone.frequency.value = 2400;
    this.tone.connect(this.master).connect(ctx.destination);
    // Tiếng vang cho giai điệu
    this.echo = ctx.createDelay();
    this.echo.delayTime.value = BEAT * 0.75;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    this.fb = fb;
    this.echo.connect(fb).connect(this.echo);
    this.echo.connect(this.tone);
    // Tiếng ồn trắng dùng cho trống và đĩa than
    this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  private startCrackle() {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.015 + (Math.random() < 0.0004 ? (Math.random() - 0.5) * 0.6 : 0);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const g = ctx.createGain();
    g.gain.value = this.mood in TUNES ? 0 : 0.5;
    this.crackleG = g;
    src.connect(g).connect(this.tone);
    src.start();
    this.crackle = src;
  }

  private keys(m: number, t: number, len: number, gain: number) {
    const ctx = this.ctx!;
    for (const [type, detune, g] of [['triangle', -4, 1], ['sine', 5, 0.6]] as const) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = hz(m);
      o.detune.value = detune;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(gain * g, t + 0.03);
      env.gain.exponentialRampToValueAtTime(gain * g * 0.35, t + 0.8);
      env.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(env).connect(this.tone);
      o.start(t);
      o.stop(t + len + 0.05);
    }
  }

  private bell(m: number, t: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = hz(m);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.06, t + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    o.connect(env);
    env.connect(this.tone);
    env.connect(this.echo);
    o.start(t);
    o.stop(t + 1.3);
  }

  /** Tiếng gảy dây ghi-ta: tắt nhanh, hơi sáng */
  private pluck(m: number, t: number, gain = 0.05) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = hz(m);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(3200, t);
    f.frequency.exponentialRampToValueAtTime(700, t + 0.5);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(gain, t + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    o.connect(f).connect(env).connect(this.tone);
    o.start(t);
    o.stop(t + 1.5);
  }

  private kick(t: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.32, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(env).connect(this.tone);
    o.start(t);
    o.stop(t + 0.32);
  }

  private hiss(t: number, freq: number, type: BiquadFilterType, gain: number, len: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const env = ctx.createGain();
    env.gain.setValueAtTime(gain, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + len);
    src.connect(f).connect(env).connect(this.tone);
    src.start(t, Math.random());
    src.stop(t + len + 0.02);
  }

  /** Một con sóng: tiếng ầm dâng lên rồi rút (ồn trắng qua lọc thấp quét lên xuống) + tiếng bọt xì */
  private wave(t: number, big: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise; src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(260, t);
    f.frequency.linearRampToValueAtTime(900 + big * 500, t + 1.6);
    f.frequency.exponentialRampToValueAtTime(220, t + 4.6);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16 + big * 0.08, t + 1.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 4.8);
    src.connect(f).connect(g).connect(this.tone);
    src.start(t, Math.random() * 1.5); src.stop(t + 5);
    this.hiss(t + 1.3, 3200, 'highpass', 0.05 + big * 0.03, 1.6);
  }

  /** Gió biển: ồn trắng lọc dải, to nhỏ chậm rãi */
  private startWind() {
    if (this.wind || !this.ctx) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise; src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = 0.7;
    const g = ctx.createGain(); g.gain.value = 0.035;
    const lfo = ctx.createOscillator(), depth = ctx.createGain();
    lfo.frequency.value = 0.07; depth.gain.value = 0.028;
    lfo.connect(depth).connect(g.gain);
    src.connect(f).connect(g).connect(this.tone);
    src.start(); lfo.start();
    this.wind = { src, lfo };
  }
  private stopWind() {
    if (!this.wind) return;
    const { src, lfo } = this.wind;
    this.wind = null;
    try { src.stop(); lfo.stop(); } catch { /* đã dừng */ }
  }

  /** Tiếng bong bóng "bloop" dưới nước */
  private blip(t: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    const f = 280 + Math.random() * 400;
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 2.6, t + 0.09);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g).connect(this.tone); o.start(t); o.stop(t + 0.15);
  }

  private schedule() {
    const ctx = this.ctx!;
    while (this.nextBeat < ctx.currentTime + 0.6) {
      const t = this.nextBeat, b = this.beat, inBar = b % 4;
      const chord = PROG[this.mood][Math.floor(b / 4) % 4];
      if (this.dance()) continue;
      if (this.mood === 'camp') {
        // Ghi-ta rải hợp âm, không trống, thêm tiếng dế
        const pat = [0, 2, 1, 3, 2, 4, 1, 3];
        for (const half of [0, 0.5]) { const i = pat[(inBar * 2 + half * 2) % pat.length]; this.pluck(chord[i % chord.length] + (i > 2 ? 12 : 0), t + half * BEAT + (half ? 0.05 : 0)); }
        if (inBar === 0) this.pluck(chord[0] - 12, t, 0.07);
        if (Math.random() < 0.3) this.hiss(t + Math.random() * BEAT, 4800, 'bandpass', 0.012, 0.08);
        this.nextBeat += BEAT;
        this.beat++;
        continue;
      }
      if (this.mood === 'deep') {
        // Dưới nước: hợp âm kéo dài trầm, chuông vang xa, bong bóng lục bục
        if (inBar === 0) { chord.forEach((m, i) => this.keys(m, t + i * 0.08, BEAT * 4.2, 0.03)); this.keys(chord[0] - 12, t, BEAT * 4, 0.05); }
        if (Math.random() < 0.2) this.bell(PENTA[Math.floor(Math.random() * PENTA.length)], t + BEAT * Math.random());
        if (Math.random() < 0.45) { const n = 1 + Math.floor(Math.random() * 3); for (let k = 0; k < n; k++) this.blip(t + Math.random() * BEAT); }
        this.nextBeat += BEAT;
        this.beat++;
        continue;
      }
      if (this.mood === 'sky') {
        // Trên trời: hợp âm sáng thoáng, chuông cao, gió thổi liên tục
        if (inBar === 0) { chord.forEach((m, i) => this.keys(m + 12, t + i * 0.04, BEAT * 4, 0.025)); this.keys(chord[0], t, BEAT * 4, 0.04); }
        if (Math.random() < 0.3) this.bell(PENTA[Math.floor(Math.random() * PENTA.length)] + 12, t + BEAT * (Math.random() < 0.5 ? 0 : 0.5));
        this.nextBeat += BEAT;
        this.beat++;
        continue;
      }
      if (this.mood === 'sea') {
        // Biển: hợp âm đệm nhẹ, chuông lác đác, không trống; sóng vỗ ~5 giây một lần
        if (inBar === 0) { chord.forEach((m, i) => this.keys(m, t + i * 0.03, BEAT * 4, 0.032)); this.keys(chord[0] - 12, t, BEAT * 4, 0.045); }
        if (Math.random() < 0.18) this.bell(PENTA[Math.floor(Math.random() * PENTA.length)] - 12 + 2, t + BEAT * 0.5);
        if (b % 6 === 0) this.wave(t + Math.random() * 0.4, Math.random());
        this.nextBeat += BEAT;
        this.beat++;
        continue;
      }
      if (this.mood === 'cafe') {
        // Jazz nhẹ: bass đi bộ, piano nhấn lệch phách, trống chổi
        this.keys(chord[inBar % 2 ? 0 : 0] - 12 + [0, 7, 5, 2][inBar], t, BEAT * 0.9, 0.06);
        if (inBar === 0 || inBar === 2) chord.slice(1).forEach(m => this.keys(m, t + BEAT * 0.66, BEAT * 1.2, 0.03));
        if (Math.random() < 0.35) this.bell(chord[Math.floor(Math.random() * chord.length)] + 24, t + BEAT * (Math.random() < 0.5 ? 0 : 0.66));
        this.hiss(t, 5000, 'bandpass', 0.03, 0.22);
        this.hiss(t + BEAT * 0.66, 5000, 'bandpass', 0.018, 0.12);
        this.nextBeat += BEAT;
        this.beat++;
        continue;
      }
      if (inBar === 0) {
        chord.forEach((m, i) => this.keys(m, t + i * 0.012, BEAT * 4, 0.05));
        this.keys(chord[0] - 12, t, BEAT * 4, 0.07);
      }
      if (inBar === 2 && Math.random() < 0.5) chord.slice(1).forEach(m => this.keys(m, t, BEAT * 1.5, 0.025));
      // Giai điệu: nốt móc đơn, lúc có lúc không (tình yêu: hộp nhạc chơi câu nhạc ngọt)
      if (this.mood === 'love') {
        if (b % 2 === 0 || Math.random() < 0.35) this.bell(LOVE_MELODY[b % LOVE_MELODY.length] + 12, t + 0.02);
        if (Math.random() < 0.18) this.bell(PENTA[Math.floor(Math.random() * PENTA.length)] + 12, t + BEAT * 0.5);
      } else for (const half of [0, 0.5]) {
        if (Math.random() < (this.mood === 'night' ? 0.22 : 0.3)) this.bell(PENTA[Math.floor(Math.random() * PENTA.length)] - (this.mood === 'night' ? 12 : 0), t + half * BEAT + (half ? 0.04 : 0));
      }
      // Trống nhẹ có swing
      const soft = this.mood === 'love';
      if (inBar === 0 || (!soft && inBar === 2 && Math.random() < 0.6)) this.kick(t);
      if (inBar === 1 || inBar === 3) this.hiss(t, soft ? 3200 : 1800, 'bandpass', soft ? 0.035 : 0.08, soft ? 0.3 : 0.18);
      this.hiss(t, 7000, 'highpass', 0.025, 0.05);
      this.hiss(t + BEAT * 0.58, 7000, 'highpass', 0.015, 0.04);
      this.nextBeat += BEAT;
      this.beat++;
    }
  }

  /** Giai điệu chính của bài khiêu vũ: vĩ cầm ngân (waltz, lãng mạn), phong cầm (tango), piano sáng (còn lại) */
  private lead(m: number, t: number, len: number, kind: DanceMood) {
    const ctx = this.ctx!;
    const soft = kind === 'waltz' || kind === 'slow', acc = kind === 'tango';
    const env = ctx.createGain(), g = soft ? 0.085 : acc ? 0.05 : 0.075;
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(g, t + (soft ? 0.06 : 0.012));
    if (soft || acc) env.gain.setValueAtTime(g * 0.85, t + Math.max(0.07, len - 0.06));
    else env.gain.exponentialRampToValueAtTime(g * 0.3, t + Math.max(0.1, len));
    env.gain.exponentialRampToValueAtTime(0.0001, t + len + (soft ? 0.25 : 0.1));
    const out = acc ? ctx.createBiquadFilter() : null;
    if (out) { out.type = 'lowpass'; out.frequency.value = 2200; env.connect(out).connect(this.tone); } else env.connect(this.tone);
    for (const [type, det, k] of (acc ? [['sawtooth', -6, 0.5], ['square', 7, 0.3]] : soft ? [['triangle', -3, 1], ['sine', 4, 0.7]] : [['triangle', 0, 1], ['square', 0, 0.12]]) as [OscillatorType, number, number][]) {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = type; o.frequency.value = hz(m); o.detune.value = det; og.gain.value = k;
      if (soft && len > 0.5) { const lfo = ctx.createOscillator(), d = ctx.createGain(); lfo.frequency.value = 5.2; d.gain.value = 9; lfo.connect(d).connect(o.detune); lfo.start(t + 0.2); lfo.stop(t + len + 0.3); }
      o.connect(og).connect(env); o.start(t); o.stop(t + len + 0.35);
    }
  }

  /** Các bài sàn nhảy: giai điệu nổi tiếng (tunes.ts) + tiết tấu đệm riêng từng thể loại (trả về true nếu đã xếp xong một phách) */
  private dance() {
    const m = this.mood as DanceMood, tu = TUNES[m];
    if (!tu) return false;
    const t = this.nextBeat, b = this.beat, B = 60 / tu.bpm, per = tu.per, inBar = b % per;
    const chs = tu.ch[Math.floor(b / per) % tu.bars], chord = chs[Math.min(chs.length - 1, Math.floor((inBar / per) * chs.length))];
    for (const [off, n, len] of tu.ev[b % tu.total]) this.lead(n + tu.oct, t + off * B, len * B * 0.92, m);
    if (m === 'waltz') {                                                                // bùm — chát — chát
      if (inBar === 0) this.keys(chord[0] - 12, t, B * 2.5, 0.07);
      else chord.forEach(n => this.keys(n + 12, t, B * 0.8, 0.026));
    } else if (m === 'jazz') {                                                          // ragtime: trầm — hợp âm xen kẽ
      if (inBar % 2 === 0) this.pluck(chord[0] - 12 + (inBar === 2 ? 7 : 0), t, 0.09);
      else chord.forEach(n => this.keys(n + 12, t, B * 0.7, 0.028));
      this.hiss(t, 6000, 'bandpass', 0.018, 0.08);
    } else if (m === 'disco') {
      this.kick(t);                                                                    // four-on-the-floor
      this.hiss(t + B / 2, 8000, 'highpass', 0.06, 0.12);                              // hi-hat mở phách lệch
      if (inBar === 1 || inBar === 3) this.hiss(t, 2000, 'bandpass', 0.09, 0.15);       // clap
      this.pluck(chord[0] - 12, t, 0.08); this.pluck(chord[0], t + B / 2, 0.07);        // bass quãng tám
      if (inBar === 0 || inBar === 2) chord.forEach(n => this.keys(n + 12, t + B / 2, B * 0.25, 0.026));
    } else if (m === 'latin') {
      this.pluck(chord[0] - 12 + (inBar === 2 ? 7 : 0), t, 0.08);
      if (inBar === 3) { this.pluck(chord[0] - 12, t + B / 2, 0.07); this.hiss(t + B / 2, 3000, 'bandpass', 0.05, 0.08); }   // cha-cha
      this.hiss(t, 4000, 'bandpass', 0.035, 0.18);                                     // guiro
      if (inBar === 0 || inBar === 2) this.bell(96, t + B * 0.5);                       // clave
      if (inBar === 1) chord.slice(1).forEach(n => this.keys(n + 12, t, B * 0.4, 0.028));
    } else if (m === 'tango') {                                                         // nhịp habanera: đùm… đa đùm đùm
      if (inBar % 2 === 0) { this.pluck(chord[0] - 12, t, 0.1); this.pluck(chord[2] - 12, t + B * 0.75, 0.07); }
      else { this.pluck(chord[1], t, 0.07); this.pluck(chord[2] - 12, t + B * 0.5, 0.07); chord.forEach(n => this.keys(n + 12, t, B * 0.3, 0.022)); }
      if (inBar % 2 === 1) this.hiss(t, 2400, 'bandpass', 0.03, 0.1);
    } else {                                                                            // lãng mạn: rải hợp âm chậm, trầm ngân
      this.keys(chord[0] - 12, t, B * 2, 0.05);
      [chord[0], chord[2], chord[1] + 12, chord[2]].forEach((n, i) => this.pluck(n, t + (i * B) / 4, 0.035));
    }
    this.nextBeat += B;
    this.beat++;
    return true;
  }

  /** Bắt đầu lại bài từ đầu đúng lúc `atMs` (giờ máy) — để nhạc khớp với bước nhảy và mũi tên ở cả hai máy */
  cue(atMs: number) {
    if (!this.ctx) return;
    this.beat = 0;
    this.nextBeat = this.ctx.currentTime + Math.max(0.08, (atMs - Date.now()) / 1000);
  }

  start() {
    if (this.playing) return;
    if (!this.ctx) this.setup();
    const ctx = this.ctx!;
    void ctx.resume();
    this.nextBeat = ctx.currentTime + 0.1;
    this.master.gain.cancelScheduledValues(ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(this.vol * 0.9, ctx.currentTime + 1.5);
    this.startCrackle();
    if (this.mood === 'sea' || this.mood === 'sky') this.startWind();
    this.timer = setInterval(() => this.schedule(), 120);
    this.playing = true;
  }

  stop() {
    if (!this.playing || !this.ctx) return;
    const ctx = this.ctx;
    this.master.gain.cancelScheduledValues(ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    const c = this.crackle;
    setTimeout(() => c?.stop(), 700);
    const w = this.wind;
    this.wind = null;
    setTimeout(() => { try { w?.src.stop(); w?.lfo.stop(); } catch { /* đã dừng */ } }, 700);
    this.crackle = null;
    this.playing = false;
  }

  /** Trình duyệt còn chặn tiếng (chưa có lần chạm nào vào trang) */
  get blocked() {
    return !!this.ctx && this.ctx.state !== 'running';
  }
  unlock() {
    if (this.ctx) void this.ctx.resume();
  }

  setVolume(v: number) {
    this.vol = v;
    if (this.ctx && this.playing) this.master.gain.setTargetAtTime(v * 0.9, this.ctx.currentTime, 0.2);
  }

  setMood(m: Mood) {
    const was = this.mood;
    this.mood = m;
    // sàn nhảy: tắt tiếng vang & đĩa than của nhạc nền (lệch nhịp, nghe như lẫn hai bài); đổi bài thì chơi lại từ đầu
    const dance = m in TUNES;
    if (this.ctx) {
      const now = this.ctx.currentTime;
      this.fb.gain.setTargetAtTime(dance ? 0 : 0.32, now, 0.05);
      this.crackleG?.gain.setTargetAtTime(dance ? 0 : 0.5, now, 0.1);
      if (was !== m) { this.beat = 0; this.nextBeat = Math.max(this.nextBeat, now + 0.15); }
    }
    if ((m === 'sea' || m === 'sky') && this.playing) this.startWind(); else if (m !== 'sea' && m !== 'sky') this.stopWind();
    if (this.ctx) this.tone.frequency.setTargetAtTime(m in TUNES ? 3200 : m === 'deep' ? 1100 : m === 'night' || m === 'camp' ? 1800 : m === 'love' || m === 'cafe' ? 2000 : 2400, this.ctx.currentTime, 1);
  }
}

export const music = new Lofi();

const KEY = 'resort-music';
export function loadMusicPref(): { on: boolean; vol: number } {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '');
    return { on: v.on !== false, vol: typeof v.vol === 'number' ? v.vol : 0.5 };
  } catch {
    return { on: true, vol: 0.5 };
  }
}
export function saveMusicPref(p: { on: boolean; vol: number }) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* chế độ riêng tư: bỏ qua */ }
}
