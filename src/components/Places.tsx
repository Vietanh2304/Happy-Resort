// Bảng điều khiển dưới cảnh: quán cà phê sách, vòng đu quay, bãi cắm trại.
import { useEffect, useRef, useState } from 'react';
import * as api from '../lib/api';
import { content, item } from '../lib/content';
import { emojiSprite } from '../lib/pixel';
import { notify } from '../lib/realtime';
import { toast } from '../lib/toast';
import type { HillSky } from '../lib/townSprites';
import type { Live } from '../lib/useLive';
import { RIDE_MS } from '../lib/world';
import { SEA_SPOTS, type SeaSpot } from '../lib/seaView';
import { Sheet } from './Sheet';

function Chat({ live, placeholder }: { live: Live; placeholder: string }) {
  const [text, setText] = useState('');
  return (
    <>
      <ul className="chat-log">{live.chat.slice(-3).map(c => <li key={c.at} className={c.from}>{c.text}</li>)}</ul>
      <form className="row" onSubmit={e => { e.preventDefault(); if (text.trim()) { live.say(text.trim()); setText(''); } }}>
        <input value={text} maxLength={120} onChange={e => setText(e.target.value)} placeholder={placeholder} />
        <button className="btn small">Gửi</button>
      </form>
    </>
  );
}
const status = (here: boolean, name: string, wait: string) => <p className="muted small-note">{here ? `💗 ${name} đang ở đây cùng bạn` : wait}</p>;

// ───────── Quán cà phê sách ─────────

export function CafePanel({ live, partnerHere, partnerName, onBooks }: { live: Live; partnerHere: boolean; partnerName: string; onBooks: () => void }) {
  const [menu, setMenu] = useState(false);
  const [cat, setCat] = useState(0);
  return (
    <div className="room-panel">
      {status(partnerHere, partnerName, `Ngồi bên cửa sổ đợi ${partnerName} nhé ☕`)}
      <div className="row wrap">
        <button className="btn small" onClick={() => setMenu(true)}>☕ Gọi đồ uống</button>
        <button className="btn small ghost" onClick={onBooks}>📖 Đọc sách cùng nhau</button>
        <button className="btn small ghost" onClick={() => live.say('☕ Cạn cốc nào!')}>🥂</button>
        <button className="btn small ghost" onClick={() => live.say('🥰')}>🥰</button>
      </div>
      <Chat live={live} placeholder="Thì thầm gì đó bên ly cà phê…" />
      {menu && (
        <Sheet title="☕ Thực đơn quán" onClose={() => setMenu(false)}>
          <div className="tabs scroll">{content.cafe.map((c, i) => <button key={c.cat} className={cat === i ? 'active' : ''} onClick={() => setCat(i)}>{c.cat}</button>)}</div>
          <div className="bag-grid">
            {content.cafe[cat].items.map(f => (
              <button key={f.name} className="bag-item" onClick={() => { live.update(cat === 2 ? { dish: f.name } : { drink: f.name }); live.say(`${f.name} cho mình nhé!`); setMenu(false); }}>
                <img src={emojiSprite(f.icon).url} className="px-img" alt="" /><small>{f.name}</small>
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}

// ───────── Vòng đu quay ─────────

const WHEEL_SKIES: { id: HillSky; label: string }[] = [
  { id: 'sunset', label: '🌇 Hoàng hôn' }, { id: 'night', label: '🌃 Đêm' }, { id: 'meteor', label: '🌠 Sao băng' }, { id: 'day', label: '☀️ Trời trong' }, { id: 'dawn', label: '🌅 Bình minh' },
];
export function WheelPanel({ live, partnerHere, partnerName, ride, sky, onSky, onStart, onKiss }: {
  live: Live; partnerHere: boolean; partnerName: string; ride: number; sky: HillSky | 'real';
  onSky: (s: HillSky) => void; onStart: () => void; onKiss: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t); }, []);
  const t = ride ? (now - ride) / RIDE_MS : -1;
  const riding = t >= 0 && t <= 1;
  const atTop = riding && Math.sin(Math.PI * t) > 0.85;
  return (
    <div className="room-panel">
      {status(partnerHere, partnerName, `Đợi ${partnerName} lên cabin cùng nhé 🎡`)}
      <div className="sky-chips">{WHEEL_SKIES.map(s => <button key={s.id} className={`chip ${sky === s.id ? 'active' : ''}`} onClick={() => onSky(s.id)}>{s.label}</button>)}</div>
      <div className="row wrap">
        {riding
          ? <span className="ride-bar"><i style={{ width: `${Math.round(t * 100)}%` }} />{atTop ? '✨ Đang ở đỉnh!' : t < 0.5 ? '⬆️ Đang lên cao…' : '⬇️ Đang xuống…'}</span>
          : <button className="btn small" onClick={onStart}>🎡 Bắt đầu vòng quay</button>}
        <button className={`btn small ${atTop ? 'pull' : 'ghost'}`} disabled={!atTop} onClick={onKiss} title="Truyền thuyết: hôn nhau ở đỉnh vòng đu quay thì sẽ bên nhau mãi mãi">💋 Hôn ở đỉnh</button>
        <button className="btn small ghost" onClick={() => live.say('🫶')}>🫶</button>
      </div>
      <p className="muted small-note">Truyền thuyết kể rằng: hai người cùng bấm 💋 lúc cabin lên tới đỉnh sẽ bên nhau mãi mãi 💞</p>
      <Chat live={live} placeholder="Nói gì đó trên cao…" />
    </div>
  );
}

// ───────── Bãi cắm trại ─────────

export function CampPanel({ live, partnerHere, partnerName, date, claimed, question, onAsk, onHeat }: {
  live: Live; partnerHere: boolean; partnerName: string; date: string; claimed: string[]; question: string | null; onAsk: () => void; onHeat: (h: number | null) => void;
}) {
  const [heat, setHeat] = useState<number | null>(null);
  useEffect(() => onHeat(heat), [heat]); // eslint-disable-line react-hooks/exhaustive-deps
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);
  const made = claimed.filter(k => k.startsWith(`smore:${date}:`)).length;

  function startRoast() {
    setHeat(0);
    live.update({ act: 'roast' });
    timer.current = setInterval(() => setHeat(h => (h === null ? null : Math.min(100, h + 2))), 120);
  }
  async function pull() {
    if (timer.current) clearInterval(timer.current);
    const h = heat ?? 0;
    setHeat(null);
    live.update({ act: null });
    if (h < 45) return toast('🍡 Còn sống quá — nướng thêm chút nữa nhé');
    if (h > 78) { live.say('🔥😵'); return toast('🔥 Cháy đen mất rồi! Thử lại nào'); }
    live.say('🍡✨');
    if (made >= 3) return toast('🍡 Vàng ruộm thơm phức! (hôm nay đã nướng đủ 3 cái mang về)');
    const ok = await api.claim(`smore:${date}:${made}`, [{ id: 'smore', n: 1 }]).catch(() => false);
    if (ok) {
      await api.grantCoins(`coins:smore:${date}:${made}`, content.economy.smore).catch(() => false);
      notify('claims', 'inventory', 'collection', 'profiles');
      toast(`🍡 Vàng ruộm hoàn hảo! +1 ${item('smore').name} và +${content.economy.smore} xu`);
    }
  }
  const zone = heat === null ? '' : heat < 45 ? 'raw' : heat <= 78 ? 'gold' : 'burnt';

  return (
    <div className="room-panel">
      {status(partnerHere, partnerName, `Nhóm lửa đợi ${partnerName} nhé 🔥`)}
      {question && <div className="camp-card">💬 {question}</div>}
      <div className="row wrap">
        {heat === null
          ? <button className="btn small" onClick={startRoast}>🍡 Nướng kẹo dẻo</button>
          : <>
            <span className={`roast-bar ${zone}`}><i style={{ width: `${heat}%` }} /><b /></span>
            <button className="btn small pull" onClick={pull}>Rút ra!</button>
          </>}
        <button className="btn small ghost" onClick={onAsk}>💬 Câu hỏi bên lửa trại</button>
        <button className="btn small ghost" onClick={() => live.say('🎸🎶 la la la~')}>🎸 Hát</button>
        <button className="btn small ghost" onClick={() => live.say('🤗')}>🤗</button>
      </div>
      {heat !== null && <p className="muted small-note">Rút ra khi thanh vào vùng vàng ✨ — sớm quá thì sống, trễ quá thì cháy.</p>}
      <Chat live={live} placeholder="Kể chuyện bên đống lửa…" />
    </div>
  );
}

// ───────── Ghế dài ngắm biển ─────────

export function LoungePanel({ live, partnerHere, partnerName, spot, onSpot, menu, onMenu }: {
  live: Live; partnerHere: boolean; partnerName: string; spot: SeaSpot; onSpot: (s: SeaSpot) => void; menu: boolean; onMenu: (open: boolean) => void;
}) {
  const [cat, setCat] = useState(0);
  const swimming = live.mine.act === 'swim';
  const here = SEA_SPOTS.find(x => x.id === spot) ?? SEA_SPOTS[0];
  return (
    <div className="room-panel">
      {status(partnerHere, partnerName, `Nằm dưới dù đợi ${partnerName} ra biển cùng nhé ⛱️`)}
      <div className="sky-chips">
        {SEA_SPOTS.map(x => <button key={x.id} className={`chip ${spot === x.id ? 'active' : ''}`} onClick={() => onSpot(x.id)} title={x.note}>{x.flag} {x.name}</button>)}
      </div>
      <p className="muted small-note">📍 {here.flag} {here.name} — {here.note}</p>
      <div className="row wrap">
        <button className="btn small" onClick={() => onMenu(true)}>🥥 Gọi đồ ở quầy bar</button>
        <button className="btn small ghost" onClick={() => { live.update({ act: swimming ? null : 'swim' }); live.say(swimming ? '⛱️ Lên nằm nghỉ chút' : '🌊 Xuống tắm biển nào!'); }}>
          {swimming ? '⛱️ Lên ghế nằm' : '🌊 Xuống tắm biển'}
        </button>
        <button className="btn small ghost" onClick={() => live.say('🥂 Cụng ly nào!')}>🥂</button>
        <button className="btn small ghost" onClick={() => live.say('😎 Nắng đẹp ghê')}>😎</button>
        <button className="btn small ghost" onClick={() => live.say('🥰')}>🥰</button>
      </div>
      <Chat live={live} placeholder="Nói gì đó bên tiếng sóng…" />
      {menu && (
        <Sheet title="🥥 Quầy bar dừa" onClose={() => onMenu(false)}>
          <div className="tabs scroll">{content.beachBar.map((c, i) => <button key={c.cat} className={cat === i ? 'active' : ''} onClick={() => setCat(i)}>{c.cat}</button>)}</div>
          <div className="bag-grid">
            {content.beachBar[cat].items.map(f => (
              <button key={f.name} className="bag-item" onClick={() => { live.update(cat === 1 ? { dish: f.name } : { drink: f.name }); live.say(`${f.icon} ${f.name} cho mình nhé!`); onMenu(false); }}>
                <img src={emojiSprite(f.icon).url} className="px-img" alt="" /><small>{f.name}</small>
              </button>
            ))}
          </div>
          <p className="muted small-note">Đồ gọi được mang ra bàn nhỏ giữa hai ghế.</p>
        </Sheet>
      )}
    </div>
  );
}
