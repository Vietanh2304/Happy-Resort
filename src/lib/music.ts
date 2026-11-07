// Nhạc nền lo-fi chill tự sinh bằng Web Audio (không dùng file nhạc, không lo bản quyền):
// hợp âm piano điện ấm, giai điệu ngũ cung thưa thớt có tiếng vang, trống nhẹ, tiếng đĩa than lạo xạo.

export type Mood = 'day' | 'night' | 'love' | 'cafe' | 'camp' | 'sea';

const PROG: Record<Mood, number[][]> = {
  day: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]],      // Fmaj7 Em7 Dm7 Cmaj7
  night: [[45, 48, 52, 55], [50, 53, 57, 60], [43, 47, 50, 53], [48, 52, 55, 59]],    // Am7 Dm7 G7 Cmaj7
  love: [[48, 52, 55, 59], [45, 48, 52, 55], [53, 57, 60, 64], [55, 59, 62, 64]],     // Cmaj7 Am7 Fmaj7 G6 — vòng hợp âm "tình yêu"
  cafe: [[50, 53, 57, 60, 64], [43, 53, 59, 64], [48, 52, 55, 59, 62], [45, 55, 61, 64]], // Dm9 G13 Cmaj9 A7 — jazz quán cà phê
  camp: [[43, 47, 50, 55, 59], [38, 45, 50, 54, 57], [40, 47, 52, 55, 59], [36, 43, 48, 52, 55]], // G D Em C — ghi-ta bên lửa trại
  sea: [[50, 54, 57, 61], [47, 50, 54, 57], [43, 47, 50, 54], [45, 49, 52, 57]],                  // Dmaj7 Bm7 Gmaj7 A — nghỉ dưỡng bên biển
};
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
    g.gain.value = 0.5;
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

  private schedule() {
    const ctx = this.ctx!;
    while (this.nextBeat < ctx.currentTime + 0.6) {
      const t = this.nextBeat, b = this.beat, inBar = b % 4;
      const chord = PROG[this.mood][Math.floor(b / 4) % 4];
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

  start() {
    if (this.playing) return;
    if (!this.ctx) this.setup();
    const ctx = this.ctx!;
    void ctx.resume();
    this.nextBeat = ctx.currentTime + 0.1;
    this.master.gain.cancelScheduledValues(ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(this.vol * 0.9, ctx.currentTime + 1.5);
    this.startCrackle();
    if (this.mood === 'sea') this.startWind();
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
    this.mood = m;
    if (m === 'sea' && this.playing) this.startWind(); else if (m !== 'sea') this.stopWind();
    if (this.ctx) this.tone.frequency.setTargetAtTime(m === 'night' || m === 'camp' ? 1800 : m === 'love' || m === 'cafe' ? 2000 : 2400, this.ctx.currentTime, 1);
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
