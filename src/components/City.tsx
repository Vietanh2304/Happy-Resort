// Thành phố: người đi đường (NPC) qua lại trên vỉa hè, xe cộ chạy, toà công ty để vào làm, trạm xe buýt về làng.
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { busSprite, carSprite, CITY } from '../lib/cityArt';
import { seeded } from '../lib/rng';
import { characterSprite } from '../lib/sprites';
import type { Pt } from '../lib/world';
import { Tag, useScale } from './Stage';
import { Follower } from './Wander';
import { pickChatter, wxLook, wxRain } from '../lib/weather';
const UMB = ['#5aa8e0', '#f6c445', '#8bc87a', '#e07a7a', '#b08ae0'];
import { avatarPx } from './Avatar';

const v = (o: Record<string, string | number>) => o as CSSProperties;
const OUTFITS = [0, 1, 2, 6, 7, 8, 9, 14, 16, 3, 10];
const CHATTER = ['Trễ giờ làm rồi!', 'Alo, em nghe…', 'Trưa nay ăn gì ta?', 'Mưa sắp tới kìa', '☕ Cà phê không?', 'Hôm nay đẹp trời ghê', '…'];

function Walker({ i }: { i: number }) {
  const ps = avatarPx(useScale());
  const r = useMemo(() => seeded(`walker:${i}`), [i]);
  const look = useMemo(() => ({ gender: (r() < 0.5 ? 'm' : 'f') as 'm' | 'f', hair: Math.floor(r() * 8), hairColor: Math.floor(r() * 6), skin: Math.floor(r() * 4), shirt: Math.floor(r() * 12), outfit: OUTFITS[Math.floor(r() * OUTFITS.length)] }), [r]);
  const y = CITY.sidewalk.y0 + 6 + Math.floor(r() * 20);
  const [at, setAt] = useState<Pt>({ x: Math.floor(r() * 240) + 8, y });
  const [say, setSay] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    const step = () => {
      if (!alive) return;
      // đi một quãng tới điểm mới trên vỉa hè, đôi khi dừng lại nói vu vơ
      setAt(a => ({ x: Math.max(-6, Math.min(262, a.x + (Math.random() < 0.5 ? -1 : 1) * (40 + Math.random() * 90))), y: CITY.sidewalk.y0 + 6 + Math.floor(Math.random() * 20) }));
      if (Math.random() < 0.15) { setSay(pickChatter(CHATTER, Math.floor(Math.random() * 99))); setTimeout(() => alive && setSay(null), 2600); }
      setTimeout(step, 3000 + Math.random() * 3000);
    };
    const t = setTimeout(step, 400 + i * 350);
    return () => { alive = false; clearTimeout(t); };
  }, [i]);
  return (
    <>
      <Follower sprite={characterSprite(wxLook(look), 'idle', undefined, 'side')} walk={characterSprite(wxLook(look), 'walk', undefined, 'side', 1)} umbrella={wxRain() ? UMB[i % UMB.length] : undefined} x={at.x} y={at.y} title="Người đi đường" ps={ps} onClick={() => setSay(pickChatter(CHATTER, i + Math.floor(Date.now() / 3000)))} />
      {say && <Tag x={at.x} y={at.y - 30} className="bed-bubble">{say}</Tag>}
    </>
  );
}

export function CityContent({ go, onOffice, onHome, onStall, night }: { go: (to: Pt, then?: () => void) => void; onOffice: () => void; onHome: () => void; onStall: (id: 'citycafe' | 'store') => void; night: boolean }) {
  const s = useScale();
  const cars = ['#e8604a', '#5aa8e0', '#fffaf0', '#2a2a3a', '#f6c64e', '#a5d470'];
  return (
    <>
      <Tag x={CITY.company.x} y={4} className="label" onClick={() => go(CITY.company.door, onOffice)}>🏢 Công ty — vào làm</Tag>
      <button className="hot" title="Vào công ty" style={{ left: 112 * s, top: 84 * s, width: 32 * s, height: 20 * s }} onClick={e => { e.stopPropagation(); go(CITY.company.door, onOffice); }} />
      <Tag x={36} y={84} className="label" onClick={() => go({ x: 36, y: 108 }, () => onStall('citycafe'))}>☕ Cà phê</Tag>
      <button className="hot" title="Vào quán cà phê" style={{ left: 28 * s, top: 92 * s, width: 16 * s, height: 12 * s }} onClick={e => { e.stopPropagation(); go({ x: 36, y: 108 }, () => onStall('citycafe')); }} />
      <Tag x={196} y={50} className="label" onClick={() => go({ x: 196, y: 108 }, () => onStall('store'))}>🏪 Tiện lợi</Tag>
      <button className="hot" title="Vào cửa hàng tiện lợi" style={{ left: 182 * s, top: 92 * s, width: 28 * s, height: 12 * s }} onClick={e => { e.stopPropagation(); go({ x: 196, y: 108 }, () => onStall('store')); }} />
      <Tag x={CITY.bus.x} y={86} className="label" onClick={() => go(CITY.bus.stand, onHome)}>🚌 Về làng</Tag>
      <button className="hot" title="Trạm xe buýt — về làng" style={{ left: 224 * s, top: 94 * s, width: 24 * s, height: 22 * s }} onClick={e => { e.stopPropagation(); go(CITY.bus.stand, onHome); }} />
      {/* Xe cộ hai chiều */}
      <div className="city-traffic" style={{ top: 134 * s, height: 42 * s }}>
        {cars.map((c, i) => {
          const sp = carSprite(c), back = i % 2 === 1, K = 1.4;   // xe con thấp hơn người một chút (nhân vật cao ~22 đơn vị)
          return <img key={i} src={sp.url} alt="" className={`city-car ${back ? 'back' : ''}`} style={v({ top: (back ? 2 : 22) * s, width: sp.w * K * s, height: sp.h * K * s, '--w': `${310 * s}px`, animationDuration: `${7 + (i % 3) * 2}s`, animationDelay: `${-i * 2.3}s` })} />;
        })}
        <img src={busSprite().url} alt="" className="city-car bus" style={v({ top: 6 * s, width: 82 * s, height: 31 * s, '--w': `${340 * s}px`, animationDuration: '14s', animationDelay: '-5s' })} />
      </div>
      {Array.from({ length: 8 }, (_, i) => <Walker key={i} i={i} />)}
      {night && <div className="city-night" />}
    </>
  );
}
