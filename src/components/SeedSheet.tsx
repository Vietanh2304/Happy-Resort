import { useState } from 'react';
import { content } from '../lib/content';

export const STATUSES = ['📚 Đang học', '💼 Đang làm', '😴 Đang ngủ', '🍜 Đang ăn', '🚌 Đang trên đường', '🎮 Đang rảnh', '🏋️ Đang tập thể dục', '🛁 Đang tắm', '🤒 Hơi mệt', '🥺 Nhớ cậu'];

/** Trạng thái còn hiệu lực (đặt trong vòng 12 tiếng) */
export function liveStatus(p?: { status?: string | null; status_at?: string | null } | null) {
  if (!p?.status || !p.status_at) return null;
  return Date.now() - Date.parse(p.status_at) < 12 * 3600e3 ? p.status : null;
}

/** Bảng khi chạm vào nhân vật của mình: biểu cảm + trạng thái "đang làm gì" */
export function EmoteMenu({ onPick, onClose, onEdit, status, onStatus, onCouple, onSnow, onCamera }: {
  onSnow?: () => void; onCamera?: () => void;
  onPick: (e: string) => void; onClose: () => void; onEdit: () => void; status: string | null; onStatus: (s: string | null) => void;
  onCouple?: (kind: 'hug' | 'kiss') => void;
}) {
  const [text, setText] = useState('');
  return (
    <div className="emote-menu" onClick={onClose}>
      <div className="emote-box" onClick={e => e.stopPropagation()}>
        {onCamera && <button className="btn small" style={{ width: '100%', marginBottom: 6 }} onClick={() => { onCamera(); }}>📸 Mở máy ảnh chụp kỉ niệm</button>}
        {onCouple && (
          <div className="couple-acts">
            <button className="btn small" onClick={() => { onCouple('hug'); onClose(); }}>🤗 Ôm người ấy</button>
            <button className="btn small" onClick={() => { onCouple('kiss'); onClose(); }}>😘 Hôn người ấy</button>
            {onSnow && <button className="btn small" onClick={() => { onSnow(); onClose(); }}>❄️ Ném tuyết</button>}
          </div>
        )}
        {content.emotes.map(e => <button key={e} onClick={() => { onPick(e); onClose(); }}>{e}</button>)}
        <div className="status-pick">
          <b>💭 Bạn đang làm gì?</b>
          <div className="chips left">
            {STATUSES.map(st => <button key={st} className={`chip ${status === st ? 'active' : ''}`} onClick={() => { onStatus(status === st ? null : st); onClose(); }}>{st}</button>)}
          </div>
          <form className="row" onSubmit={e => { e.preventDefault(); if (text.trim()) { onStatus(text.trim()); onClose(); } }}>
            <input value={text} maxLength={40} onChange={e => setText(e.target.value)} placeholder="Hoặc tự viết…" />
            <button className="btn small">Đặt</button>
          </form>
          {status && <button className="link" onClick={() => { onStatus(null); onClose(); }}>Xóa trạng thái</button>}
        </div>
        <button className="emote-edit" onClick={() => { onEdit(); onClose(); }}>🎨 Đổi nhân vật</button>
      </div>
    </div>
  );
}
