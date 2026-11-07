// Bãi nhảy dù riêng: đứng cạnh máy bay → lên máy bay cất cánh (mây trôi xuống, mặt đất xa dần) → đủ độ cao bấm Nhảy
// → rơi tự do (gió rít, mây vụt lên) → bung dù đung đưa, lái trái/phải → hạ cánh xuống bãi cỏ có hồng tâm.
// Camera bám theo độ cao của mình; người ấy hiện ở đúng chênh lệch độ cao (ra khỏi khung thì có mũi tên chỉ).
import { useEffect, useRef, useState } from 'react';
import type { Profile } from '../lib/api';
import type { Phase } from '../lib/content';
import { mix } from '../lib/pixel';
import { onEvent, sendEvent } from '../lib/realtime';
import { seeded } from '../lib/rng';
import { SKY } from '../lib/sky';
import {
  AIRFIELD, airfieldSprite, altOf, AUTO_OPEN, canopyDownSprite, canopySprite, CHUTE_MIN_FREE, doorX, JUMP_MIN, landingNote,
  planeAlt, planeSprite, TOP, type Jump,
} from '../lib/skydive';
import { characterSprite, cloudSprite } from '../lib/sprites';
import type { Live } from '../lib/useLive';
import { avatarPx } from './Avatar';
import { Chat, status } from './Places';
import { Tag, useScale } from './Stage';

const K = 0.12;          // px trên màn hình cho mỗi mét độ cao
const CAM_MIN = 450;     // camera không xuống thấp hơn: lúc đứng dưới đất vẫn thấy cả bãi đáp
const PARK = -112;       // máy bay đậu trên đường băng (m so với hồng tâm)
const MID = 64;          // mình luôn ở độ cao giữa khung này

/** Đồng hồ chạy ~30 khung/giây khi đang ở bãi nhảy dù */
export function useTicker(on: boolean, ms = 33) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [on, ms]);
  return now;
}

/** Chuyến bay đang có (ai đang ngồi máy bay, hoặc vừa nhảy khỏi máy bay chưa lâu) */
function flight(a: Jump | null | undefined, b: Jump | null | undefined, now: number): number | null {
  for (const j of [a, b]) if (j?.ph === 'plane') return j.at;
  for (const j of [a, b]) if (j && j.ph !== 'land' && j.pa && now - j.pa < 90_000) return j.pa;
  return null;
}
/** Vị trí ngang (m so với hồng tâm) */
const xOf = (j: Jump | null | undefined, standby: number) => (!j ? PARK + standby : j.ph === 'plane' ? doorX(j.at) + standby / 3 : j.x ?? 0);

interface Who { look: Profile['avatar']; jump: Jump | null | undefined; bubble?: string; name?: string }

export function SkyContent({ phase, me, them, firstSeat }: { phase: Phase; me: Who; them: Who | null; firstSeat: boolean }) {
  const s = useScale();
  const ps = avatarPx(s);
  const now = useTicker(true);
  const myAlt = altOf(me.jump, now);
  const cam = Math.max(myAlt, CAM_MIN);
  const yAt = (a: number) => MID + (cam - a) * K;
  const ground = yAt(0);
  const side = firstSeat ? -6 : 6;
  const camX = xOf(me.jump, side);
  const sx = (xm: number) => 96 + (xm - camX);

  // Trời: càng cao càng xanh thẫm
  const [top, low] = SKY[phase];
  const deep = Math.min(1, cam / TOP);
  const sky = `linear-gradient(${mix(top, '#0a1450', deep * 0.45)}, ${mix(low, top, deep * 0.5)})`;
  const night = phase === 'night';

  // Mây ở nhiều tầng độ cao (cố định theo thế giới) → trôi lên khi rơi, trôi xuống khi máy bay leo
  const clouds = useCloudField();
  const cloud = cloudSprite(night);

  // Máy bay
  const pa = flight(me.jump, them?.jump, now);
  const pAlt = pa !== null ? planeAlt((now - pa) / 1000) : 0;
  const pX = pa !== null ? doorX(pa) : PARK;
  const plane = planeSprite();
  const planeLeft = sx(pX) - 51, planeTop = yAt(pa !== null ? pAlt : 0) - 29;
  const taxiing = pa !== null && pAlt === 0;

  const field = airfieldSprite(phase);
  const freeFalling = me.jump?.ph === 'free';
  const bothFree = me.jump?.ph === 'free' && them?.jump?.ph === 'free' && Math.abs(altOf(them.jump, now) - myAlt) < 120;
  const bothChute = me.jump?.ph === 'chute' && them?.jump?.ph === 'chute' && Math.abs(altOf(them.jump, now) - myAlt) < 160;

  const person = (w: Who, mine: boolean) => {
    const j = w.jump, alt = altOf(j, now), standby = mine ? side : -side;
    const x = sx(xOf(j, standby));
    // gần đất thì dạt dần xuống giữa bãi cỏ (đúng hàng hồng tâm)
    const near = 10 * Math.max(0, Math.min(1, 1 - alt / CAM_MIN));
    let y = j?.ph === 'plane' ? planeTop + 22 : j && j.ph !== 'land' ? yAt(alt) + near : j ? ground + 10 : ground - 1;
    if (!j && pa !== null && !mine) y = ground - 1;
    const off = y < -6 || y > 150 || x < -10 || x > 202;
    if (off && !mine) {
      const up = y < 0;
      return <Tag key="ind" x={Math.max(16, Math.min(176, x))} y={up ? 8 : 134} className="label sky-ind">{up ? '⬆️' : '⬇️'} {w.name} · {Math.round(alt)}m</Tag>;
    }
    const cls = mine ? 'me' : 'them';
    if (j?.ph === 'free') {
      const sp = characterSprite(w.look, 'act', undefined, 'front', 12);
      return (
        <div key={cls} className={`sky-free ${cls}`} style={{ left: x * s, top: y * s, zIndex: 50 }}>
          <img src={sp.url} alt="" draggable={false} style={{ width: sp.w * ps, height: sp.h * ps, marginLeft: -(sp.w * ps) / 2, marginTop: -(sp.h * ps) / 2 }} />
          {w.bubble && <span className="speech" style={{ bottom: (sp.h * ps) / 2 + 4 }}>{w.bubble}</span>}
        </div>
      );
    }
    if (j?.ph === 'chute') {
      const sp = characterSprite(w.look, 'idle', undefined, 'front'), cn = canopySprite(mine ? '#f08aa6' : '#5aa8e0');
      const opening = Math.min(1, (now - j.at) / 700);
      return (
        <div key={cls} className={`sky-chute ${cls}`} style={{ left: x * s, top: (y - cn.h - 8) * s, zIndex: 50 }}>
          <img src={cn.url} alt="" draggable={false} className="canopy" style={{ width: cn.w * s, height: cn.h * s, marginLeft: -(cn.w * s) / 2, transform: `scaleX(${0.3 + opening * 0.7})` }} />
          <img src={sp.url} alt="" draggable={false} style={{ width: sp.w * ps, height: sp.h * ps, marginLeft: -(sp.w * ps) / 2, marginTop: -3 * s }} />
          {w.bubble && <span className="speech" style={{ bottom: `calc(100% + 4px)` }}>{w.bubble}</span>}
        </div>
      );
    }
    // đứng dưới đất / trong cửa máy bay
    const sp = characterSprite(w.look, 'idle', undefined, 'front'), down = canopyDownSprite(mine ? '#f08aa6' : '#5aa8e0');
    return (
      <div key={cls} className={`sky-stand ${cls}`} style={{ left: x * s, top: y * s, zIndex: j?.ph === 'plane' ? 31 : 40 }}>
        {j?.ph === 'land' && <img src={down.url} alt="" draggable={false} style={{ width: down.w * s, height: down.h * s, marginLeft: (mine ? 4 : -30) * s, marginTop: -down.h * s, position: 'absolute' }} />}
        <img src={sp.url} alt="" draggable={false} style={{ width: sp.w * ps, height: sp.h * ps, marginLeft: -(sp.w * ps) / 2, marginTop: -sp.h * ps, position: 'absolute', clipPath: j?.ph === 'plane' ? `inset(0 0 ${Math.round(sp.h * 0.12)}px 0)` : undefined }} />
        {w.bubble && <span className="speech" style={{ bottom: sp.h * ps + 4 }}>{w.bubble}</span>}
      </div>
    );
  };

  return (
    <div className={`skyzone ${phase}`} style={{ background: sky }}>
      {night && <div className="sky-stars" style={{ opacity: Math.min(1, 0.4 + deep) }} />}
      {/* Mặt đất nhìn từ trên cao (ô ruộng, sông) khi bãi đáp còn ở dưới khung */}
      {ground > 144 && <div className="sky-earth" style={{ height: Math.max(6, 26 - (cam / TOP) * 16) * s, opacity: Math.min(1, (ground - 144) / 60) }} />}
      {clouds.map((c, i) => {
        const y = yAt(c.alt);
        if (y < -30 || y > 174) return null;
        return <img key={i} src={cloud.url} alt="" className="sky-cloud" style={{ left: (96 + (c.x - camX) * 0.7 - (cloud.w * c.k) / 2) * s, top: y * s, width: cloud.w * c.k * s, height: cloud.h * c.k * s, zIndex: c.front ? 60 : 5, opacity: c.front ? 0.85 : 0.95 }} />;
      })}
      {ground < 190 && <img src={field.url} alt="" className="sky-field" style={{ left: (sx(0) - AIRFIELD.target) * s, top: (ground - AIRFIELD.ground) * s, width: field.w * s, height: field.h * s }} />}
      {ground < 190 && <Tag x={sx(0)} y={ground + 22} className="label">🎯 Bãi đáp</Tag>}
      {/* Máy bay (đậu trên đường băng, hoặc đang chở mọi người lên cao) */}
      <img src={plane.url} alt="" className={`sky-plane ${pa !== null && !taxiing ? 'flying' : ''}`} style={{ left: planeLeft * s, top: planeTop * s, width: plane.w * s, height: plane.h * s, zIndex: 30 }} />
      {pa !== null && <i className="sky-prop" style={{ left: (planeLeft + 90) * s, top: (planeTop + 8) * s, width: 3 * s, height: 16 * s, zIndex: 32 }} />}
      {(me.jump?.ph === 'plane' || freeFalling) && <div className={`sky-wind ${freeFalling ? 'fall' : 'climb'}`}>{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${-(i % 7) * 0.13}s` }} />)}</div>}
      {person(me, true)}
      {them && person(them, false)}
      {(bothFree || bothChute) && <Tag x={96 + (xOf(them?.jump, 0) - camX) / 2} y={MID - 26} className="float-hearts">💞</Tag>}
      <div className="sky-alt">
        <b>{Math.round(myAlt)} m</b>
        <span>{!me.jump ? 'Dưới mặt đất' : me.jump.ph === 'plane' ? (myAlt >= JUMP_MIN ? 'Đủ độ cao — nhảy được rồi!' : myAlt > 0 ? 'Máy bay đang lên…' : 'Chạy đà…') : me.jump.ph === 'free' ? 'Rơi tự do!' : me.jump.ph === 'chute' ? 'Dù đã bung' : landingNote(me.jump.x ?? 0)}</span>
      </div>
    </div>
  );
}

/** Mây cố định theo thế giới: vài đám mỗi tầng 250m, từ 300m tới 4600m */
function useCloudField() {
  const ref = useRef<{ alt: number; x: number; k: number; front: boolean }[] | null>(null);
  if (!ref.current) {
    const r = seeded('sky-clouds'), out: { alt: number; x: number; k: number; front: boolean }[] = [];
    for (let a = 300; a <= 4600; a += 250) for (let i = 0; i < 2; i++) out.push({ alt: a + Math.round(r() * 120), x: Math.round((r() - 0.5) * 300), k: 0.8 + r() * 1.4, front: r() < 0.25 });
    ref.current = out;
  }
  return ref.current;
}

// ───────── Bảng điều khiển ─────────

export function SkyPanel({ live, partnerHere, partnerName, onLeave }: { live: Live; partnerHere: boolean; partnerName: string; onLeave: () => void }) {
  const now = useTicker(true, 200);
  const j = live.mine.jump ?? null, theirs = partnerHere ? live.theirs?.jump ?? null : null;
  const alt = altOf(j, now);
  const jRef = useRef(j);
  jRef.current = j;
  const set = (v: Jump | null) => live.update({ jump: v });

  // Tự chuyển pha: tới độ cao thì tự bung dù, chạm đất thì đáp
  useEffect(() => {
    if (!j) return;
    if (j.ph === 'free' && alt <= AUTO_OPEN) { set({ ph: 'chute', at: Date.now(), alt, x: j.x, pa: j.pa }); live.say('🪂 Bung dù!'); }
    else if (j.ph === 'chute' && alt <= 0) { set({ ph: 'land', at: Date.now(), x: j.x }); live.say(landingNote(j.x ?? 0)); }
  }, [now]); // eslint-disable-line react-hooks/exhaustive-deps

  const board = () => set({ ph: 'plane', at: theirs?.ph === 'plane' ? theirs.at : Date.now() });
  const jump = (together = false) => {
    if (!j || j.ph !== 'plane') return;
    set({ ph: 'free', at: Date.now(), alt, x: doorX(j.at) + (together ? -9 : 0), pa: j.at });
    live.say(together ? '🤝 Một, hai, ba… NHẢY!' : '🙌 Nhảy nào!');
    if (together) sendEvent('skyjump', { pa: j.at });
  };
  // Người ấy rủ nắm tay cùng nhảy (cùng chuyến bay) → mình nhảy theo luôn
  useEffect(() => onEvent('skyjump', (d: { pa?: number }) => {
    const cur = jRef.current;
    if (!cur || cur.ph !== 'plane' || cur.at !== d?.pa) return;
    set({ ph: 'free', at: Date.now(), alt: altOf(cur, Date.now()), x: doorX(cur.at) + 9, pa: cur.at });
    live.say('🤝 Nhảy cùng nhau!');
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  // Lái dù: giữ nút để trôi sang trái/phải
  const steer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hold = (dir: number) => {
    stopSteer();
    steer.current = setInterval(() => {
      const cur = jRef.current;
      if (!cur || cur.ph !== 'chute') return stopSteer();
      live.update({ jump: { ...cur, x: Math.max(-160, Math.min(160, (cur.x ?? 0) + dir * 1.6)) } });
    }, 120);
  };
  const stopSteer = () => { if (steer.current) clearInterval(steer.current); steer.current = null; };
  useEffect(() => stopSteer, []);

  const samePlane = j?.ph === 'plane' && theirs?.ph === 'plane' && theirs.at === j.at;
  const canOpen = j?.ph === 'free' && (now - j.at) / 1000 > CHUTE_MIN_FREE;
  const steerBtn = (dir: number, label: string) => (
    <button className="btn sky-steer" onPointerDown={e => { e.preventDefault(); hold(dir); }} onPointerUp={stopSteer} onPointerLeave={stopSteer} onContextMenu={e => e.preventDefault()}>{label}</button>
  );

  return (
    <div className="room-bar">
      <div className="room-panel">
        {status(partnerHere, partnerName, `Rủ ${partnerName} ra bãi nhảy dù cùng bay nhé 🪂`)}
        {!j && (
          <>
            <p className="muted small-note">🛩️ Máy bay chở lên {TOP}m — tới {JUMP_MIN}m là nhảy được. Rơi tự do, bung dù, rồi lái về hồng tâm 🎯</p>
            <div className="row wrap"><button className="btn" onClick={board}>🛫 Lên máy bay{theirs?.ph === 'plane' ? ` cùng ${partnerName}` : ''}</button></div>
          </>
        )}
        {j?.ph === 'plane' && (
          <div className="row wrap">
            <button className="btn" disabled={alt < JUMP_MIN} onClick={() => jump()}>{alt < JUMP_MIN ? `⏳ Đợi lên ${JUMP_MIN}m (${Math.round(alt)}m)` : '🪂 NHẢY!'}</button>
            {samePlane && <button className="btn" disabled={alt < JUMP_MIN} onClick={() => jump(true)}>🤝 Nắm tay cùng nhảy</button>}
          </div>
        )}
        {j?.ph === 'free' && (
          <div className="row wrap">
            <button className="btn" disabled={!canOpen} onClick={() => { set({ ph: 'chute', at: Date.now(), alt, x: j.x, pa: j.pa }); live.say('🪂 Bung dù!'); }}>🪂 Bung dù</button>
            <span className="muted small-note">Tự bung ở {AUTO_OPEN}m</span>
          </div>
        )}
        {j?.ph === 'chute' && (
          <div className="row wrap sky-steer-row">
            {steerBtn(-1, '◀ Lái trái')}
            <span className="muted small-note">🎯 {Math.abs(Math.round(j.x ?? 0))}m {Math.round(j.x ?? 0) > 0 ? '(tâm ở bên trái)' : Math.round(j.x ?? 0) < 0 ? '(tâm ở bên phải)' : ''}</span>
            {steerBtn(1, 'Lái phải ▶')}
          </div>
        )}
        {j?.ph === 'land' && (
          <>
            <p className="small-note"><b>{landingNote(j.x ?? 0)}</b></p>
            <div className="row wrap"><button className="btn" onClick={board}>🛫 Nhảy lần nữa</button></div>
          </>
        )}
        <div className="row wrap">
          <button className="btn small ghost" onClick={() => live.say('😆 Wooohooo!')}>😆</button>
          <button className="btn small ghost" onClick={() => live.say('😱 Cao quá!')}>😱</button>
          <button className="btn small ghost" onClick={() => live.say('🥰 Đẹp quá!')}>🥰</button>
        </div>
        <Chat live={live} placeholder="Hét lên giữa trời…" />
      </div>
      <button className="btn small ghost leave" onClick={onLeave}>🏘️ Về làng</button>
    </div>
  );
}

