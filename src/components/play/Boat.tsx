// 🛶 Chèo thuyền đôi: mỗi người một mái chèo (người id nhỏ hơn chèo bên trái). Một máy giữ thuyền
// ("người lái"), máy kia gửi nhát chèo. 90 giây nhặt đồ trôi trên biển, đồ nhặt được vào túi của cả hai.
import { useEffect, useMemo, useRef, useState } from 'react';
import * as api from '../../lib/api';
import { grabbed, ROUND_MS, SEA_H, SEA_W, seaMap, startBoat, step, stroke, type Boat as B } from '../../lib/boat';
import { item } from '../../lib/content';
import { emojiSprite, makeSprite } from '../../lib/pixel';
import { notify } from '../../lib/realtime';
import { characterSprite } from '../../lib/sprites';
import { toast } from '../../lib/toast';
import { reward } from '../gameKit';
import { PlayScreen, typing, useFrame, usePeer, useViewport, type PlayProps } from './kit';

const T = 16;
interface Run { seed: string; at: number; got: number[]; over: boolean }

export function Boat({ me, partner, date, onLeave }: PlayProps) {
  const them = partner?.id ?? '';
  const name = partner?.display_name ?? 'Người ấy';
  const mySide: 'L' | 'R' = !them || me.id < them ? 'L' : 'R';
  const [run, setRun] = useState<Run | null>(null);
  const runRef = useRef(run); runRef.current = run;
  const [boat, setBoat] = useState<B>(startBoat);
  const boatRef = useRef(boat);
  const [cheer, setCheer] = useState<{ at: number } | null>(null);
  const hereRef = useRef(false);
  const isHost = () => !hereRef.current || me.id < them;

  const { send, here } = usePeer('boat', me.id, (m, mine) => {
    if (m.t === 'start') { const b = startBoat(); boatRef.current = b; setBoat(b); setRun({ seed: m.seed, at: Date.now() + 1500, got: [], over: false }); }
    if (m.t === 'row' && isHost()) {
      const r = runRef.current;
      if (!r || r.over || Date.now() < r.at) return;
      const nb = stroke(boatRef.current, m.side, Date.now());
      boatRef.current = nb;
      if (nb.sync) send('sync');
    }
    if (m.t === 'sync') setCheer({ at: Date.now() });
    if (m.t === 'b' && !mine) {
      boatRef.current = m.b; setBoat(m.b);
      setRun(r => (r ? { ...r, got: m.got, over: m.over } : { seed: m.seed, at: Date.now() - m.el, got: m.got, over: m.over }));
    }
  });
  hereRef.current = here;
  const now = useFrame();
  const map = useMemo(() => (run ? seaMap(run.seed) : seaMap('preview')), [run?.seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const el = run ? now - run.at : 0;

  // Người lái: mô phỏng thuyền, nhặt đồ, gửi trạng thái ~10 lần/giây
  const lastT = useRef(performance.now()), lastSend = useRef(0);
  useEffect(() => {
    const t = performance.now(), dt = Math.min(0.05, (t - lastT.current) / 1000);
    lastT.current = t;
    const r = runRef.current;
    if (!r || !isHost()) return;
    let b = boatRef.current;
    let got = r.got;
    if (!r.over && Date.now() >= r.at) {
      b = step(b, dt, map.rocks);
      const fresh = map.loot.map((l, i) => i).filter(i => !got.includes(i) && grabbed(b, map.loot[i]));
      if (fresh.length) got = [...got, ...fresh];
    }
    const over = r.over || Date.now() - r.at >= ROUND_MS || got.length === map.loot.length;
    boatRef.current = b; setBoat(b);
    if (got !== r.got || over !== r.over) setRun({ ...r, got, over });
    if (t - lastSend.current > 100 || over !== r.over || got !== r.got) { lastSend.current = t; send('b', { b, got, over, seed: r.seed, el: Date.now() - r.at }); }
  }, [now]); // eslint-disable-line react-hooks/exhaustive-deps

  // Kết thúc: đồ nhặt được vào túi mỗi người
  useEffect(() => {
    if (!run?.over || !run.got.length) return;
    const counts: Record<string, number> = {};
    run.got.forEach(i => { const id = map.loot[i].id; counts[id] = (counts[id] ?? 0) + 1; });
    api.claim(`boat:${run.seed}`, Object.entries(counts).map(([id, n]) => ({ id, n }))).then(ok => {
      if (ok) { toast(`🛶 Mang về: ${Object.entries(counts).map(([id, n]) => `${item(id).icon}×${n}`).join(' ')}`); notify('inventory', 'collection'); }
    }, console.error);
    reward('boat', date);
  }, [run?.over]); // eslint-disable-line react-hooks/exhaustive-deps

  const row = (side: 'L' | 'R') => { if (runRef.current && !runRef.current.over) send('row', { side }); };
  const rowRef = useRef(row); rowRef.current = row;
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (typing(e) || e.repeat) return;
      const solo = !hereRef.current;
      const side = e.key === ' ' || e.key === 'Enter' ? mySide
        : solo && (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') ? 'L'
          : solo && (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') ? 'R' : null;
      if (side) { e.preventDefault(); rowRef.current(side); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Camera theo thuyền
  const vw = useViewport();
  const fit = Math.min((vw.w - 16) / (SEA_W * T), (vw.h - 230) / (SEA_H * T));
  const s = Math.max(fit, Math.min(2.2, Math.max(1.4, fit)));
  const tile = T * s, bw = SEA_W * tile, bh = SEA_H * tile;
  const viewW = Math.min(bw, vw.w - 16), viewH = Math.min(bh, vw.h - 230);
  const cam = (p: number, v: number, full: number) => Math.max(0, Math.min(full - v, p - v / 2));
  const camX = cam(boat.x * tile, viewW, bw), camY = cam(boat.y * tile, viewH, bh);
  const bg = useMemo(seaSprite, []);
  const hull = useMemo(boatSprite, []);
  const swing = (t: number) => Date.now() - t < 350;
  // Người chèo: mỗi nhát chèo thì kéo tay về rồi đẩy ra (khung 4 → 5)
  const rower = (look: typeof me.avatar | undefined, t: number) => {
    if (!look) return null;
    const dt = Date.now() - t;
    return dt < 380 ? characterSprite(look, 'actsit', undefined, 'front', dt < 190 ? 4 : 5) : characterSprite(look, 'sit', undefined, 'back');
  };
  const mate = here ? partner?.avatar : undefined;
  const left = rower(mySide === 'L' ? me.avatar : mate, boat.lastL), right = rower(mySide === 'L' ? mate : me.avatar, boat.lastR);

  return (
    <PlayScreen title="🛶 Chèo thuyền đôi" here={here} partnerName={name} onLeave={onLeave}
      bottom={
        <div className="row center wrap boat-bar">
          {!run || run.over ? (
            <>
              {run?.over && <b className="game-big">🎉 Nhặt được {run.got.length}/{map.loot.length} món!</b>}
              <span className="k-hint">Bạn chèo bên <b>{mySide === 'L' ? 'trái' : 'phải'}</b>{here ? `, ${name} chèo bên ${mySide === 'L' ? 'phải' : 'trái'}` : ''}. Chèo cùng nhịp thì thuyền lao thẳng 💨, một bên chèo thì thuyền quẹo. 90 giây nhặt đồ trôi trên biển!{!here && ' (Chưa có người ấy: tự chèo cả hai bên bằng 2 nút hoặc phím A/D)'}</span>
              <button className="btn" onClick={() => send('start', { seed: `${Date.now()}` })}>{run?.over ? '🔄 Chèo chuyến nữa' : '🛶 Ra khơi!'}</button>
            </>
          ) : (
            <>
              <span>{el < 0 ? `Chuẩn bị… ${Math.ceil(-el / 1000)}` : `⏱️ ${Math.ceil((ROUND_MS - el) / 1000)}s`} · 🎁 {run.got.length}/{map.loot.length}</span>
              {cheer && now - cheer.at < 800 && <b className="boat-cheer">💞 Đồng nhịp!</b>}
              {here ? (
                <button className="btn boat-row" onPointerDown={e => { e.preventDefault(); row(mySide); }}>🚣 Chèo {mySide === 'L' ? 'trái' : 'phải'} (Space)</button>
              ) : (
                <>
                  <button className="btn boat-row" onPointerDown={e => { e.preventDefault(); row('L'); }}>🚣 Trái (A)</button>
                  <button className="btn boat-row" onPointerDown={e => { e.preventDefault(); row('R'); }}>Phải (D) 🚣</button>
                </>
              )}
            </>
          )}
        </div>
      }>
      <div className="k-view" style={{ width: viewW, height: viewH }}>
        <div className="k-board" style={{ width: bw, height: bh, transform: `translate(${-camX}px, ${-camY}px)` }}>
          <img className="k-bg" src={bg.url} alt="" draggable={false} style={{ width: bw, height: bh }} />
          {map.rocks.map((r, i) => r.isle ? (
            <div key={i} className="boat-isle" style={{ left: (r.x - r.r) * tile, top: (r.y - r.r) * tile, width: r.r * 2 * tile, height: r.r * 2 * tile }}>
              <img src={emojiSprite(i % 2 ? '🌴' : '🏝️').url} alt="" style={{ width: r.r * tile, height: r.r * tile }} />
            </div>
          ) : <img key={i} className="boat-rock" src={emojiSprite('🪨').url} alt="" style={{ left: (r.x - 0.7) * tile, top: (r.y - 0.7) * tile, width: tile * 1.4, height: tile * 1.4 }} />)}
          {map.loot.map((l, i) => run?.got.includes(i) ? null : (
            <img key={i} className="boat-loot" src={emojiSprite(item(l.id).icon).url} alt="" style={{ left: (l.x - 0.5) * tile, top: (l.y - 0.5) * tile, width: tile, height: tile, animationDelay: `${(i % 5) * 0.3}s` }} />
          ))}
          <div className="boat" style={{ left: boat.x * tile, top: boat.y * tile, transform: `rotate(${boat.a}rad)` }}>
            <img src={hull.url} alt="" style={{ width: hull.w * s, height: hull.h * s, left: -hull.w * s / 2, top: -hull.h * s / 2 }} />
            <i className={`oar l ${swing(boat.lastL) ? 'swing' : ''}`} style={{ width: tile * 1.1, height: tile * 0.18, left: -tile * 1.55, top: -tile * 0.1 }} />
            <i className={`oar r ${swing(boat.lastR) ? 'swing' : ''}`} style={{ width: tile * 1.1, height: tile * 0.18, left: tile * 0.45, top: -tile * 0.1 }} />
            {left && <img className="boat-sit" src={left.url} alt="" style={{ width: left.w * s * 0.7, height: left.h * s * 0.7, left: -left.w * s * 0.35, top: -tile * 0.75 }} />}
            {right && <img className="boat-sit" src={right.url} alt="" style={{ width: right.w * s * 0.7, height: right.h * s * 0.7, left: -right.w * s * 0.35, top: tile * 0.05 }} />}
          </div>
        </div>
      </div>
    </PlayScreen>
  );
}

function seaSprite() {
  return makeSprite('sea-big', SEA_W * T, SEA_H * T, p => {
    for (let y = 0; y < SEA_H; y++) for (let x = 0; x < SEA_W; x++) {
      const X = x * T, Y = y * T;
      p.rect(X, Y, T, T, (x + y) % 2 ? '#5fb2e4' : '#58aade');
      if ((x * 7 + y * 3) % 5 === 0) { p.rect(X + 3, Y + 6, 5, 1, '#a6dcf6'); p.rect(X + 9, Y + 12, 4, 1, '#a6dcf6'); }
      if (y === SEA_H - 1) { p.rect(X, Y + 6, T, 10, '#f2dca0'); p.rect(X, Y + 5, T, 1, '#fff6dc'); }
    }
  }, null);
}
function boatSprite() {
  // Thuyền gỗ nhìn từ trên xuống, mũi hướng lên
  return makeSprite('canoe', 14, 34, p => {
    for (let y = 0; y < 34; y++) {
      const half = y < 8 ? Math.round((y / 8) * 6) + 1 : y > 28 ? Math.round(((34 - y) / 6) * 5) + 2 : 7;
      p.rect(7 - half, y, half * 2, 1, '#a8693c');
      if (half > 2) p.rect(8 - half, y, half * 2 - 2, 1, '#c88a52');
    }
    p.rect(3, 13, 8, 2, '#8a5430'); p.rect(3, 22, 8, 2, '#8a5430');
  });
}
