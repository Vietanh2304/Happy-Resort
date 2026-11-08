import { useState } from 'react';
import { BATH_WATERS, type BathWater } from '../lib/interiors';
import type { Live } from '../lib/useLive';

/** Bảng dưới cảnh phòng tắm: chọn nước tắm (cả hai cùng thấy), vào/ra bồn, nhắn tin */
export function BathPanel({ water, live, partnerHere, partnerInTub, partnerName, onEnter, onLeaveTub, onLeaveRoom, onSplash, onToilet }: {
  water: BathWater;
  live: Live;
  partnerHere: boolean;
  partnerInTub: boolean;
  partnerName: string;
  onEnter: () => void;
  onLeaveTub: () => void;
  onLeaveRoom: () => void;
  onSplash: () => void;
  onToilet: (kind: 'pee' | 'poop') => void;
}) {
  const [text, setText] = useState('');
  const inTub = live.mine.act === 'bath';
  return (
    <div className="room-bar">
      <div className="room-panel">
        <p className="muted small-note">
          {inTub ? (partnerInTub ? `💗 Đang ngâm bồn cùng ${partnerName}` : '🛁 Thư giãn nào… bồn còn một chỗ cho người ấy')
            : partnerInTub ? `${partnerName} đang ngâm bồn — vào cùng không?` : partnerHere ? `💗 ${partnerName} đang ở đây` : 'Chọn loại nước rồi vào bồn nhé'}
        </p>
        <div className="sky-chips">
          {BATH_WATERS.map(w => (
            <button key={w.id} className={`chip ${water === w.id ? 'active' : ''}`} onClick={() => live.update({ bath: w.id, bathAt: Date.now() })}>{w.name}</button>
          ))}
        </div>
        <div className="row wrap">
          {inTub
            ? <button className="btn small ghost" onClick={onLeaveTub}>🚿 Ra khỏi bồn</button>
            : <button className="btn small" onClick={onEnter}>🛁 Vào bồn</button>}
          <button className="btn small ghost" disabled={!inTub} title={inTub ? undefined : 'Vào bồn rồi mới té nước được'} onClick={onSplash}>💦 Té nước</button>
          <button className={`btn small ${live.mine.duck ? '' : 'ghost'}`} onClick={() => live.update({ duck: !live.mine.duck })}>🦆 {live.mine.duck ? 'Cất vịt' : 'Thả vịt cao su'}</button>
          <button className="btn small ghost" onClick={() => live.say('😌')}>😌</button>
          <button className="btn small ghost" disabled={inTub} onClick={() => onToilet('pee')}>🚽 Đi tè</button>
          <button className="btn small ghost" disabled={inTub} onClick={() => onToilet('poop')}>💩 Đi nặng</button>
        </div>
        <ul className="chat-log">
          {live.chat.slice(-3).map(c => <li key={c.at} className={c.from}>{c.text}</li>)}
        </ul>
        <form className="row" onSubmit={e => { e.preventDefault(); if (text.trim()) { live.say(text.trim()); setText(''); } }}>
          <input value={text} maxLength={120} onChange={e => setText(e.target.value)} placeholder="Thì thầm gì đó…" />
          <button className="btn small">Gửi</button>
        </form>
      </div>
      <button className="btn small ghost leave" onClick={onLeaveRoom}>🛏️ Về phòng ngủ</button>
    </div>
  );
}
