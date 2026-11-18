// Giường: đi ngủ, hoặc thân mật (chỉ khi cả hai cùng đồng ý — một người mời, người kia chấp nhận).
import { useState } from 'react';
import { item } from '../lib/content';
import type { Live } from '../lib/useLive';
import { Sheet } from './Sheet';

/** Các vị Hy's Feel bán ở cửa hàng */
export const HYS_FEEL = ['hysfeel_ultra', 'hysfeel_strawberry', 'hysfeel_peach', 'hysfeel_mint', 'hysfeel_grape', 'hysfeel_choco', 'hysfeel_vanilla'];

export function BedSheet({ partnerHere, partnerInBed, callThem, canBaby, have, onSleep, onInvite, onBaby, onClose }: {
  partnerHere: boolean; partnerInBed: boolean; callThem: string; canBaby: boolean;
  /** số hộp Hy's Feel đang có theo từng vị */
  have: Record<string, number>;
  onSleep: () => void; onInvite: (protect: string | null) => void; onBaby: () => void; onClose: () => void;
}) {
  const [pick, setPick] = useState(false);
  const owned = HYS_FEEL.filter(id => (have[id] ?? 0) > 0);
  if (pick) return (
    <Sheet title="💞 Thân mật" onClose={onClose}>
      <p className="muted small-note">Dùng bao hay không? (mua Hy's Feel ở 🛍️ Cửa hàng → 💗 Hy's Feel)</p>
      <div className="bed-choices">
        {owned.map(id => (
          <button key={id} className="bed-choice love" onClick={() => onInvite(id)}>
            <span>{item(id).icon}</span><b>{item(id).name}</b><small>Còn {have[id]} cái</small>
          </button>
        ))}
        {owned.length === 0 && <p className="muted small-note">Túi chưa có Hy's Feel nào.</p>}
        <button className="bed-choice" onClick={() => onInvite(null)}>
          <span>🙈</span><b>Không dùng</b><small>Hai đứa tự quyết nha</small>
        </button>
      </div>
      <button className="btn small ghost" onClick={() => setPick(false)}>← Quay lại</button>
    </Sheet>
  );
  return (
    <Sheet title="🛏️ Giường" onClose={onClose}>
      <div className="bed-choices">
        <button className="bed-choice" onClick={onSleep}>
          <span>😴</span><b>Đi ngủ</b>
          <small>{partnerInBed ? `Chui vào chăn ngủ cạnh ${callThem}` : 'Đắp chăn, tắt đèn, nghe nhạc ru'}</small>
        </button>
        <button className="bed-choice love" disabled={!partnerHere} onClick={() => setPick(true)}>
          <span>💞</span><b>Thân mật</b>
          <small>{partnerHere ? `Gửi lời mời — ${callThem} đồng ý thì mới bắt đầu` : `Cần ${callThem} ở trong phòng cùng bạn`}</small>
        </button>
        <button className="bed-choice baby" disabled={!partnerHere || !canBaby} onClick={onBaby}>
          <span>👶</span><b>Muốn có em bé</b>
          <small>{!canBaby ? 'Cò đang mang bé tới, hoặc nhà đã đủ 3 bé' : partnerHere ? `Hỏi ${callThem} — cả hai đồng ý thì ngày mai cò mang bé tới` : `Cần ${callThem} ở trong phòng cùng bạn`}</small>
        </button>
      </div>
    </Sheet>
  );
}

/** Lời mời từ người ấy (thân mật, có em bé...): chỉ bắt đầu khi mình đồng ý */
export function InviteModal({ icon, text, onAccept, onDecline }: { icon: string; text: string; onAccept: () => void; onDecline: () => void }) {
  return (
    <div className="bed-invite">
      <div className="bed-invite-card">
        <span className="bed-invite-icon">{icon}</span>
        <b>{text}</b>
        <small>Chỉ bắt đầu khi bạn đồng ý</small>
        <div className="row center">
          <button className="btn" onClick={onAccept}>💕 Đồng ý</button>
          <button className="btn ghost" onClick={onDecline}>Để lúc khác nhé</button>
        </div>
      </div>
    </div>
  );
}

/** Thanh dưới khi đang nằm trên giường */
export function BedPanel({ live, mode, together, callThem, onWake }: { live: Live; mode: 'sleep' | 'intimate'; together: boolean; callThem: string; onWake: () => void }) {
  return (
    <div className="room-bar">
      <div className="room-panel">
        <p className="muted small-note">
          {mode === 'intimate' ? `💞 Chỉ có hai đứa mình thôi…` : together ? `💤 Đang ôm ${callThem} ngủ` : '💤 Đang ngủ… mơ đẹp nha'}
        </p>
        <div className="row wrap">
          {mode === 'sleep' ? (
            <>
              <button className="btn small ghost" onClick={() => live.say(`🌙 Ngủ ngon nha ${callThem}`)}>🌙 Chúc ngủ ngon</button>
              <button className="btn small ghost" onClick={() => live.say('😘')}>😘</button>
              <button className="btn small ghost" onClick={() => live.say('🤗')}>🤗</button>
            </>
          ) : (
            <>
              <button className="btn small ghost" onClick={() => live.say('💋')}>💋</button>
              <button className="btn small ghost" onClick={() => live.say('🤗')}>🤗</button>
              <button className="btn small ghost" onClick={() => live.say('🥰')}>🥰</button>
              <button className="btn small ghost" onClick={() => live.say(`💕 Yêu ${callThem}`)}>💕</button>
            </>
          )}
        </div>
      </div>
      <button className="btn small ghost leave" onClick={onWake}>☀️ Dậy thôi</button>
    </div>
  );
}
