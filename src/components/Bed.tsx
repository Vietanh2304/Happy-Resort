// Giường: đi ngủ, hoặc thân mật (chỉ khi cả hai cùng đồng ý — một người mời, người kia chấp nhận).
import { useState } from 'react';
import { item } from '../lib/content';
import { emojiSprite } from '../lib/pixel';
import { LOVE_CAPTIONS, LOVE_STYLES, type LoveStyle } from './LoveNight';
import type { Live } from '../lib/useLive';
import { Sheet } from './Sheet';

/** Các vị Hy's Feel bán ở cửa hàng */
export const HYS_FEEL = ['hysfeel_classic', 'hysfeel_strawberry', 'hysfeel_choco', 'hysfeel_warm',
  /* vị cũ, không bán nữa */ 'hysfeel_ultra', 'hysfeel_peach', 'hysfeel_mint', 'hysfeel_grape', 'hysfeel_vanilla'];

export function BedSheet({ partnerHere, partnerInBed, callThem, canBaby, have, onSleep, onInvite, onBaby, onClose }: {
  partnerHere: boolean; partnerInBed: boolean; callThem: string; canBaby: boolean;
  /** số hộp Hy's Feel đang có theo từng vị */
  have: Record<string, number>;
  onSleep: () => void; onInvite: (plan: LovePlan) => void; onBaby: () => void; onClose: () => void;
}) {
  const [pick, setPick] = useState(false);
  const [prot, setProt] = useState<string | null | undefined>(undefined);
  const [style, setStyle] = useState<LoveStyle>('candle');
  const [caption, setCaption] = useState(LOVE_CAPTIONS[0]);
  const owned = HYS_FEEL.filter(id => (have[id] ?? 0) > 0);
  if (pick) return (
    <Sheet title="💞 Thân mật" onClose={onClose}>
      <h4>1. Dùng bao hay không?</h4>
      <p className="muted small-note">Mua Hy's Feel ở 🛍️ Cửa hàng → 💗 Hy's Feel</p>
      <div className="love-pick">
        {owned.map(id => (
          <button key={id} className={`chip ${prot === id ? 'on' : ''}`} onClick={() => setProt(id)}>
            <img src={emojiSprite(item(id).icon).url} className="px-img" alt="" /> {item(id).name} <small>×{have[id]}</small>
          </button>
        ))}
        <button className={`chip ${prot === null ? 'on' : ''}`} onClick={() => setProt(null)}>🙈 Không dùng</button>
      </div>
      <h4>2. Kiểu đêm nay</h4>
      <div className="love-pick">
        {LOVE_STYLES.map(st => (
          <button key={st.id} className={`chip ${style === st.id ? 'on' : ''}`} title={st.note} onClick={() => setStyle(st.id)}>{st.icon} {st.name}</button>
        ))}
      </div>
      <h4>3. Lời nhắn hiện lúc tắt đèn</h4>
      <input value={caption} maxLength={80} onChange={e => setCaption(e.target.value)} style={{ width: '100%' }} />
      <div className="love-pick">
        {LOVE_CAPTIONS.map(c => <button key={c} className="chip" onClick={() => setCaption(c)}>{c}</button>)}
      </div>
      <div className="row">
        <button className="btn" disabled={prot === undefined} onClick={() => onInvite({ protect: prot ?? null, style, caption: caption.trim() || LOVE_CAPTIONS[0] })}>💌 Gửi lời mời</button>
        <button className="btn small ghost" onClick={() => setPick(false)}>← Quay lại</button>
      </div>
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

/** Kế hoạch cho đêm thân mật — người mời chọn, gửi kèm lời mời */
export interface LovePlan { protect: string | null; style: LoveStyle; caption: string }

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
              {['😳', '💓', '🌹', '🫶', '🔥'].map(e => <button key={e} className="btn small ghost" onClick={() => live.say(e)}>{e}</button>)}
            </>
          )}
        </div>
      </div>
      <button className="btn small ghost leave" onClick={onWake}>☀️ Dậy thôi</button>
    </div>
  );
}
