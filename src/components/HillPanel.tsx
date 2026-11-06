import { useState } from 'react';
import type { HillSky } from '../lib/townSprites';
import type { Live } from '../lib/useLive';

const SKIES: { id: HillSky | 'real'; label: string }[] = [
  { id: 'real', label: '🕰️ Giờ thật' },
  { id: 'dawn', label: '🌅 Bình minh' },
  { id: 'day', label: '☀️ Trời trong' },
  { id: 'sunset', label: '🌇 Hoàng hôn' },
  { id: 'night', label: '🌙 Đêm trăng' },
  { id: 'meteor', label: '🌠 Mưa sao băng' },
  { id: 'aurora', label: '🌌 Cực quang' },
];

/** Bảng dưới cảnh khi ngồi trên đồi: chọn bầu trời cùng ngắm, nhắn tin */
export function HillPanel({ choice, live, partnerHere, partnerName, onPick, onLeave, onLantern }: {
  choice: HillSky | 'real';
  live: Live;
  partnerHere: boolean;
  partnerName: string;
  onPick: (sky: HillSky | 'real') => void;
  onLeave: () => void;
  onLantern: (text: string) => void;
}) {
  const [text, setText] = useState('');
  return (
    <div className="room-bar">
      <div className="room-panel">
        <p className="muted small-note">
          {partnerHere ? `💗 Đang ngồi cùng ${partnerName} — ai đổi trời thì cả hai cùng thấy` : `Ngồi chờ ${partnerName} lên đồi ngắm cùng nhé`}
        </p>
        <div className="sky-chips">
          {SKIES.map(s => (
            <button key={s.id} className={`chip ${choice === s.id ? 'active' : ''}`} onClick={() => onPick(s.id)}>{s.label}</button>
          ))}
        </div>
        <div className="row wrap">
          <button className={`btn small ${live.mine.act === 'cuddle' ? '' : 'ghost'}`} onClick={() => { live.update({ act: live.mine.act === 'cuddle' ? null : 'cuddle' }); if (live.mine.act !== 'cuddle') live.say('💞'); }}>
            {live.mine.act === 'cuddle' ? '💞 Đang tựa vai' : '💞 Tựa vai nhau'}
          </button>
          <button className="btn small ghost" onClick={() => { onLantern(text.trim()); setText(''); }} title="Gõ điều ước vào ô bên dưới rồi thả đèn">🏮 Thả đèn trời{text.trim() ? ' kèm lời ước' : ''}</button>
          <button className="btn small ghost" onClick={() => live.say('🥂')}>🥂</button>
          <button className="btn small ghost" onClick={() => live.say('😘')}>😘</button>
        </div>
        {choice === 'meteor' && <p className="muted small-note">Chạm vào một ngôi sao băng để ước. Nếu cả hai cùng chạm trong 3 giây, điều ước sẽ được lưu vào sổ chung ✨</p>}
        <ul className="chat-log">
          {live.chat.slice(-3).map(c => <li key={c.at} className={c.from}>{c.text}</li>)}
        </ul>
        <form className="row" onSubmit={e => { e.preventDefault(); if (text.trim()) { live.say(text.trim()); setText(''); } }}>
          <input value={text} maxLength={120} onChange={e => setText(e.target.value)} placeholder="Nói gì đó dưới bầu trời này…" />
          <button className="btn small">Gửi</button>
        </form>
      </div>
      <button className="btn small ghost leave" onClick={onLeave}>🏘️ Về làng</button>
    </div>
  );
}
