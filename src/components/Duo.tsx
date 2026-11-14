// Khung chung cho các hoạt động hai người toàn màn hình (thả đèn trời, khinh khí cầu, ngắm sao, trượt băng, làm socola…):
// rủ nhau / vào cùng / đồng bộ theo mốc `at`, bấm nhịp mũi tên hoặc nút bấm (hai máy cùng thấy), chụp ảnh, quà mang về.
// Bắt đầu từ bất cứ đâu: window.dispatchEvent(new CustomEvent('duo-start', { detail: 'balloon' })).
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { characterSprite, type AvatarLook, type Frame } from '../lib/sprites';
import type { View } from '../lib/chibi';
import type { Ctx } from '../lib/canvasArt';
import { onEvent, sendEvent } from '../lib/realtime';
import * as api from '../lib/api';
import { notify } from '../lib/realtime';
import { toastError } from '../lib/toast';
import type { Live } from '../lib/useLive';
import { InviteBanner } from './InviteBanner';
import { DUO_SCENES } from './duoScenes';

export interface Seat { key: string; img: (frame: Frame, step?: number, view?: View) => HTMLImageElement }
export interface F {
  c: Ctx; el: number; t: number; now: number; W: number; H: number;
  seats: (Seat | null)[]; n: number;
  /** cả hai nhân vật (kể cả người chưa vào màn) — để vẽ hình hai đứa */
  all: Seat[];
  /** ms từ lần trúng nhịp / bấm nút gần nhất của ghế i (chưa bấm = Infinity) */
  last: (i: number, id?: string) => number;
  /** tỉ lệ trúng nhịp của ghế i trong một công đoạn */
  score: (i: number, ph: string) => number;
  taps: { i: number; id: string; at: number }[];
  text: (i: number) => string;
  /** vẽ ảnh nhân vật: sc = 1 đúng cỡ, 0.5 nửa cỡ (nét vẫn sắc khi Z=2) */
  put: (im: HTMLImageElement, x: number, y: number, sc?: number, flip?: boolean) => void;
}
export interface DuoCfg {
  title: string; ms: number; join: number; W?: number; H?: number; Z?: number;
  beats?: { ph: string; from: number; to: number }[];
  buttons?: { id: string; label: string; from: number; to: number; prompt?: string; max?: number }[];
  caption: (el: number) => string;
  draw: (f: F) => void;
  snap: number[]; endTitle: string; endNote: string;
  gift?: { item: string; n?: number }; price: number;
  ask: string; joinAsk: string; invite: string; yes: string; late: string;
  /** người bắt đầu chạy thêm việc (vd. nhận quà mỗi ngày) sau khi đồng ý */
  onStart?: () => Promise<void>;
}
export type DuoKey = keyof typeof DUO_SCENES;
export const isDuo = (k: string | null | undefined): k is DuoKey => !!k && k in DUO_SCENES;

const BEAT = 1500, HIT_WIN = 450, AHEAD = 6500;
const DIRS = [{ k: 'ArrowLeft', icon: '⬅️' }, { k: 'ArrowUp', icon: '⬆️' }, { k: 'ArrowDown', icon: '⬇️' }, { k: 'ArrowRight', icon: '➡️' }];
const stars = (n: number) => (n >= 0.8 ? 3 : n >= 0.5 ? 2 : 1);

function DuoRoom({ k, at: t0, me, mate, them, onExit }: { k: DuoKey; at: number; me: AvatarLook; mate: AvatarLook; them: AvatarLook | null; onExit: () => void }) {
  const cfg = DUO_SCENES[k] as DuoCfg;
  const W = cfg.W ?? 320, H = cfg.H ?? 180, Z = cfg.Z ?? 2;
  const cv = useRef<HTMLCanvasElement>(null);
  const [lineTxt, setLine] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [flash, setFlash] = useState<'hit' | 'miss' | null>(null);
  const meKey = JSON.stringify(me);
  const looks = useMemo(() => [me, mate].sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1)), [meKey, JSON.stringify(mate)]); // eslint-disable-line react-hooks/exhaustive-deps
  const seats = useMemo<(Seat | null)[]>(() => looks.map(l => {
    if (l !== me && !them) return null;
    const cache = new Map<string, HTMLImageElement>();
    return { key: JSON.stringify(l), img: (frame, step = 0, view = 'front') => { const id = `${frame}:${step}:${view}`; let im = cache.get(id); if (!im) { im = new Image(); im.src = characterSprite(l, frame, undefined, view, step).url; cache.set(id, im); } return im; } };
  }), [looks, !!them]); // eslint-disable-line react-hooks/exhaustive-deps
  const all = useMemo<Seat[]>(() => looks.map(l => { const cache = new Map<string, HTMLImageElement>(); return { key: JSON.stringify(l), img: (frame, step = 0, view = 'front') => { const id = `${frame}:${step}:${view}`; let im = cache.get(id); if (!im) { im = new Image(); im.src = characterSprite(l, frame, undefined, view, step).url; cache.set(id, im); } return im; } }; }), [looks]);
  const seatOf = (key: string) => seats.findIndex(s => s?.key === key);
  const BEATS = useMemo(() => (cfg.beats ?? []).flatMap(w => { const out: { t: number; ph: string }[] = []; for (let t = w.from + 1000; t < w.to - 300; t += BEAT) out.push({ t, ph: w.ph }); return out; }), [cfg]);
  const seq = useMemo(() => { let x = (t0 * 13) % 2147483647 || 17; return BEATS.map(() => { x = (x * 16807) % 2147483647; return x % 4; }); }, [t0, BEATS]);
  const hits = useRef<Record<string, Set<number>>>({}), lastHit = useRef<Record<string, number>>({});
  const taps = useRef<{ i: number; id: string; at: number }[]>([]), texts = useRef<Record<string, string>>({});
  const mark = (who: string, b: number) => { (hits.current[who] ??= new Set()).add(b); lastHit.current[who] = Date.now(); };
  const tapIn = (who: string, id: string, text?: string) => { const i = seatOf(who); taps.current = [...taps.current.slice(-60), { i, id, at: Date.now() }]; if (text !== undefined) texts.current[who] = text; };
  useEffect(() => onEvent('duo-hit', (d: { at: number; by: string; b: number }) => { if (d.at === t0 && d.by !== meKey) mark(d.by, d.b); }), [t0, meKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => onEvent('duo-tap', (d: { at: number; by: string; id: string; text?: string }) => { if (d.at === t0 && d.by !== meKey) tapIn(d.by, d.id, d.text); }), [t0, meKey, seats]); // eslint-disable-line react-hooks/exhaustive-deps
  const press = (d: number) => {
    const el = Date.now() - t0, mine = hits.current[meKey];
    const b = BEATS.findIndex((x, i) => Math.abs(el - x.t) <= HIT_WIN && seq[i] === d && !mine?.has(i));
    setFlash(b >= 0 ? 'hit' : 'miss'); setTimeout(() => setFlash(null), 180);
    if (b >= 0) { mark(meKey, b); sendEvent('duo-hit', { at: t0, by: meKey, b }); }
  };
  const pressRef = useRef(press); pressRef.current = press;
  useEffect(() => {
    if (!BEATS.length) return;
    const onKey = (e: KeyboardEvent) => { const d = DIRS.findIndex(x => x.k === e.key); if (d >= 0) { e.preventDefault(); pressRef.current(d); } };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [BEATS]);
  const tap = (b: NonNullable<DuoCfg['buttons']>[number]) => {
    if (b.id === 'photo') return snapRef.current();
    let text: string | undefined;
    if (b.prompt) { const v = window.prompt(b.prompt, texts.current[meKey] ?? ''); if (v === null) return; text = v.trim().slice(0, 40); }
    tapIn(meKey, b.id, text); sendEvent('duo-tap', { at: t0, by: meKey, id: b.id, text });
  };
  const exitRef = useRef(onExit); exitRef.current = onExit;
  const snapRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    const c = cv.current!, ctx = c.getContext('2d')!;
    let raf = 0, last = '', ended = false; const snapped = new Set<number>();
    snapRef.current = () => { const ph = document.createElement('canvas'); ph.width = 640; ph.height = Math.round(640 * H / W); const pc = ph.getContext('2d')!; pc.imageSmoothingEnabled = false; pc.drawImage(c, 0, 0, W * Z, H * Z, 0, 0, ph.width, ph.height); setPhotos(p => [...p.slice(-3), ph.toDataURL('image/jpeg', 0.88)]); };
    const f: F = {
      c: ctx, el: 0, t: 0, now: 0, W, H, seats, all, n: seats.filter(Boolean).length,
      last: (i, id) => { const s = seats[i]; if (!s) return Infinity; const tp = taps.current.filter(x => x.i === i && (!id || x.id === id)).pop(); const a = id ? Infinity : Date.now() - (lastHit.current[s.key] ?? -1e12); return Math.min(a, tp ? Date.now() - tp.at : Infinity); },
      score: (i, ph) => { const s = seats[i]; const h = s && hits.current[s.key]; const n = BEATS.filter(b => b.ph === ph).length; if (!h || !n) return 0; let m = 0; h.forEach(b => { if (BEATS[b].ph === ph) m++; }); return m / n; },
      taps: [], text: i => (seats[i] ? texts.current[seats[i]!.key] ?? '' : ''),
      put: (im, x, y, sc = 1, flip = false) => { if (!im.complete || !im.height) return; const w = im.width * sc, h = im.height * sc, X = Math.round(x * Z) / Z, Y = Math.round(y * Z) / Z; if (flip) { ctx.save(); ctx.translate(X + w, Y); ctx.scale(-1, 1); ctx.drawImage(im, 0, 0, w, h); ctx.restore(); } else ctx.drawImage(im, X, Y, w, h); },
    };
    const frame = () => {
      const nowMs = Date.now(), el = nowMs - t0;
      setNow(nowMs);
      ctx.setTransform(Z, 0, 0, Z, 0, 0); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 1;
      f.el = el; f.t = el / 1000; f.now = nowMs; f.taps = taps.current;
      cfg.draw(f);
      const ln = cfg.caption(el); if (ln !== last) { last = ln; setLine(ln); }
      cfg.snap.forEach((s, i) => { if (!snapped.has(i) && el > s) { snapped.add(i); snapRef.current(); } });
      if (!ended && el > cfg.ms) { ended = true; setDone(true); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [t0, seats, cfg, BEATS]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!done) return; const t = setTimeout(() => exitRef.current(), 25000); return () => clearTimeout(t); }, [done]);

  const el = now - t0;
  const win = (cfg.beats ?? []).find(w => el > w.from - 2000 && el < w.to + 500);
  const live = (cfg.beats ?? []).some(w => el > w.from && el < w.to);
  const btns = (cfg.buttons ?? []).filter(b => el > b.from && el < b.to);
  const other = seats.find(s => s && s.key !== meKey);
  const total = (who: string) => (BEATS.length ? (hits.current[who]?.size ?? 0) / BEATS.length : 1);
  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
  return createPortal(
    <div className="coaster" onClick={stop} onPointerDown={stop} onMouseDown={stop} onTouchStart={stop}>
      <canvas ref={cv} width={W * Z} height={H * Z} />
      {!done && lineTxt && <b className="coaster-line">{lineTxt}</b>}
      {!done && win && (
        <div className="dance-bar pot-bar">
          <div className="dance-head"><span>🎯 Trúng {hits.current[meKey]?.size ?? 0}/{BEATS.length}{other ? ` · người ấy ${hits.current[other.key]?.size ?? 0}` : ''}</span></div>
          <div className={`dance-lane ${flash ?? ''}`}>
            <div className="dance-target" />
            {BEATS.map((b, i) => { const dt = b.t - el; if (dt < -400 || dt > AHEAD) return null; return <span key={i} className={`dance-arrow ${hits.current[meKey]?.has(i) ? 'hit' : ''}`} style={{ left: `calc(10% + ${(dt / AHEAD) * 86}%)` }}>{DIRS[seq[i]].icon}</span>; })}
          </div>
          <div className="dance-keys">{DIRS.map((d, i) => <button key={d.k} className="btn" disabled={!live} onPointerDown={e => { e.preventDefault(); press(i); }}>{d.icon}</button>)}</div>
        </div>
      )}
      {!done && !win && btns.length > 0 && (
        <div className="dance-bar pot-bar bb-bar cb-bar">
          <div className="row center">{btns.map(b => <button key={b.id} className={`btn bb-tap ${b.id === 'photo' ? 'ghost' : ''}`} onClick={() => tap(b)}>{b.id === 'photo' ? `${b.label} (${photos.length}/4)` : b.label}</button>)}</div>
        </div>
      )}
      {done && (
        <div className="coaster-end">
          <h3>{cfg.endTitle}</h3>
          <p>{cfg.endNote}</p>
          {BEATS.length > 0 && <p>Bạn {'⭐'.repeat(stars(total(meKey)))}{other ? ` · Người ấy ${'⭐'.repeat(stars(total(other.key)))}` : ''}</p>}
          <div className="cb-photos">{photos.map((p, i) => <a key={i} href={p} download={`${k}-${i + 1}.jpg`}><img src={p} alt={`Ảnh ${i + 1}`} /></a>)}</div>
          {photos.length > 0 && <p className="muted small-note">Bấm vào ảnh để lưu về máy</p>}
          <div className="row"><button className="btn small" onClick={() => exitRef.current()}>🚶 Về thôi</button></div>
        </div>
      )}
      {!done && <button className="coaster-x btn small ghost" onClick={() => { if (confirm('Rời giữa chừng?')) exitRef.current(); }}>✖</button>}
    </div>,
    document.body,
  );
}

/** Gắn một lần trong World: nghe lệnh bắt đầu, lời rủ của người ấy, và vẽ màn đang chơi */
export function DuoHost({ live, looks }: { live: Live; looks: { me: AvatarLook; them: AvatarLook } }) {
  const L = useRef(live); L.current = live;
  const [inv, setInv] = useState<{ k: DuoKey; at: number } | null>(null);
  const pay = async (cfg: DuoCfg) => { if (!cfg.gift || cfg.price < 1) return; const n = cfg.gift.n ?? 1; await api.buyItems(cfg.gift.item, Math.max(1, Math.ceil(cfg.price / n)), n); notify('inventory', 'profiles'); };
  useEffect(() => {
    const start = (e: Event) => {
      const k = (e as CustomEvent<string>).detail; if (!isDuo(k)) return;
      const cfg = DUO_SCENES[k] as DuoCfg;
      void (async () => {
        try {
          if (!confirm(cfg.price ? `${cfg.ask} (${cfg.price} xu)?` : `${cfg.ask}?`)) return;
          await pay(cfg); if (cfg.onStart) await cfg.onStart();
          const th = L.current.theirs;
          if (th?.act === k && th.trip && Date.now() - th.trip.at < cfg.join) { setInv(null); L.current.update({ act: k, trip: { i: 0, at: th.trip.at }, dish: null, drink: null }); return; }
          const at = Date.now(); L.current.update({ act: k, trip: { i: 0, at }, dish: null, drink: null });
          sendEvent('duo-invite', { k, at });
        } catch (err) { toastError(err); }
      })();
    };
    window.addEventListener('duo-start', start); return () => window.removeEventListener('duo-start', start);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => onEvent('duo-invite', (d: { k: string; at: number }) => {
    if (!isDuo(d.k) || L.current.mine.act === d.k) return;
    setInv({ k: d.k, at: d.at }); const j = (DUO_SCENES[d.k] as DuoCfg).join; setTimeout(() => setInv(v => (v && v.at === d.at ? null : v)), Math.max(3000, j - 500));
  }), []);
  const join = () => {
    const d = inv; setInv(null); if (!d) return; const cfg = DUO_SCENES[d.k] as DuoCfg;
    void (async () => {
      try {
        if (!confirm(cfg.price ? `${cfg.joinAsk} (${cfg.price} xu)?` : `${cfg.joinAsk}?`)) return;
        if (Date.now() - d.at > cfg.join) return toastError(new Error(cfg.late));
        await pay(cfg);
        L.current.update({ act: d.k, trip: { i: 0, at: d.at }, dish: null, drink: null });
      } catch (err) { toastError(err); }
    })();
  };
  const mine = live.mine, theirs = live.theirs;
  return (
    <>
      {inv && <InviteBanner text={(DUO_SCENES[inv.k] as DuoCfg).invite} yes={(DUO_SCENES[inv.k] as DuoCfg).yes} onYes={join} onNo={() => setInv(null)} />}
      {isDuo(mine.act) && mine.trip && <DuoRoom key={`${mine.act}${mine.trip.at}`} k={mine.act} at={mine.trip.at} me={looks.me} mate={looks.them}
        them={theirs?.act === mine.act && theirs.trip?.at === mine.trip.at ? looks.them : null} onExit={() => live.update({ act: null, trip: null })} />}
    </>
  );
}
