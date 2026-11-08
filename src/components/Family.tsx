// Em bé: đặt tên khi cò mang tới, chăm bé (ăn, vệ sinh, ngủ, chơi), mốc đáng nhớ, dắt bé đi chơi.
import { useState } from 'react';
import * as api from '../lib/api';
import { ACTIONS, kidAge, kidLook, kidMood, kidSprite, kidStage, MILESTONES, NEEDS, needLevel, STAGE_NAME, type CareAction } from '../lib/kids';
import { notify } from '../lib/realtime';
import { toast, toastError } from '../lib/toast';
import type { Live } from '../lib/useLive';
import { Sheet } from './Sheet';

export function KidNameSheet({ kid, onClose }: { kid: api.Kid; onClose: () => void }) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'m' | 'f'>('f');
  return (
    <Sheet title="🐦 Cò mang em bé tới rồi!" onClose={onClose}>
      <p className="kid-hello">👶 Một em bé bé xíu đang ngủ ngon trong chiếc nôi ở phòng ngủ.</p>
      <div className="row center">
        <button className={`chip ${gender === 'm' ? 'active' : ''}`} onClick={() => setGender('m')}>👦 Bé trai</button>
        <button className={`chip ${gender === 'f' ? 'active' : ''}`} onClick={() => setGender('f')}>👧 Bé gái</button>
      </div>
      <input value={name} maxLength={20} onChange={e => setName(e.target.value)} placeholder="Đặt tên cho bé… (vd: Bông, Su, Mây)" />
      <button className="btn" disabled={!name.trim()} onClick={async () => {
        try {
          await api.nameKid(kid.id, name.trim(), gender);
          await api.kidMilestone(kid.id, 'born');
          notify('kids');
          toast(`👶 Chào mừng bé ${name.trim()} về nhà! 💕`);
          onClose();
        } catch (e) { toastError(e); }
      }}>💕 Đón bé về nhà</button>
    </Sheet>
  );
}

interface KidSheetProps {
  kids: api.Kid[];
  me: api.Profile;
  partner: api.Profile | null;
  today: string;
  live: Live;
  pick?: string;
  onClose: () => void;
  /** Làm động tác thật (đi tới nôi, bế, cho bú, ru, tắm…) */
  onDo?: (actionId: string, kid: api.Kid) => void;
}
export function KidSheet({ kids, me, partner, today, live, pick, onClose, onDo }: KidSheetProps) {
  const born = kids.filter(k => k.name && k.born_on <= today);
  const [sel, setSel] = useState(pick ?? born[0]?.id);
  const kid = born.find(k => k.id === sel) ?? born[0];
  if (!kid) return <Sheet title="👶 Em bé" onClose={onClose}><p className="muted">Chưa có bé nào.</p></Sheet>;
  const stage = kidStage(kid, today);
  const look = kidLook(kid, me, partner);
  const age = kidAge(kid, today);
  const mood = kidMood(kid);
  const walking = live.mine.walkKid === kid.id;
  const callMe = me.avatar?.gender === 'm' ? 'Ba' : me.avatar?.gender === 'f' ? 'Mẹ' : 'Ba mẹ';

  async function act(a: CareAction) {
    try {
      const first = await api.claim(`kid:${kid.id}:${a.id}:${today}`);
      await api.careKid(kid.id, a.kind, first ? 1 : 0);
      let say = a.say;
      if (a.milestone && await api.kidMilestone(kid.id, a.milestone)) {
        if (a.milestone === 'talk') say = `🗣️ "${callMe}… ${callMe}!" — bé gọi ${callMe.toLowerCase()} lần đầu tiên!`;
        toast(`🌟 Mốc đáng nhớ: ${MILESTONES[a.milestone]} của bé ${kid.name}!`);
        // Bé tặng quà: tranh vẽ ba mẹ (treo tường), thiệp tự làm
        const gift = a.milestone === 'draw' ? 'kid_drawing' : a.milestone === 'card' ? 'kid_card' : null;
        if (gift && await api.claim(`kid-gift:${kid.id}:${gift}`, [{ id: gift, n: 1 }])) {
          toast(gift === 'kid_drawing' ? '🖍️ Bé tặng ba mẹ bức tranh — vào 🎨 Trang trí treo lên tường nhé!' : '💌 Bé tặng ba mẹ tấm thiệp tự làm — đã vào túi đồ');
          notify('inventory', 'collection');
        }
      } else if (a.id === 'talk') say = `🗣️ "${callMe}!"`;
      live.say(say);
      if (stage === 'baby' && onDo) { onDo(a.id, kid); onClose(); }
      else if (a.id === 'hold') { live.update({ act: 'carry' }); setTimeout(() => live.update({ act: null }), 9000); onClose(); }
      notify('kids');
    } catch (e) { toastError(e); }
  }

  return (
    <Sheet title={`👶 Bé ${kid.name}`} onClose={onClose}>
      {born.length > 1 && (
        <div className="tabs">{born.map(k => <button key={k.id} className={k.id === kid.id ? 'active' : ''} onClick={() => setSel(k.id)}>{k.gender === 'm' ? '👦' : '👧'} {k.name}</button>)}</div>
      )}
      <div className="pet-card">
        <img src={kidSprite(stage, look, mood.low.some(n => n.kind === 'sleep') ? 'sleep' : 'idle', kid.gender === 'f').url} className="px-img kid-big" alt="" />
        <div>
          <b>{kid.name}</b> <small className="muted">· {kid.gender === 'm' ? 'bé trai' : 'bé gái'} · {STAGE_NAME[stage]} · {age === 0 ? 'mới chào đời' : `${age} ngày tuổi`}</small>
          <p>{mood.low.length === 0 ? '😊 Bé đang rất vui' : `🥺 Bé cần: ${mood.low.map(n => n.label.toLowerCase()).join(', ')}`}</p>
          <p className="muted small-note">💗 Thương ba mẹ: {kid.love} · {stage === 'baby' ? `còn ${7 - age} ngày nữa bé tập đi` : stage === 'toddler' ? `còn ${21 - age} ngày nữa thành bé con` : stage === 'child' ? `còn ${45 - age} ngày nữa bé đi học` : 'bé đi học rồi!'}</p>
        </div>
      </div>
      <div className="needs">
        {NEEDS.map(n => { const v = needLevel(kid, n.field, n.hours); return (
          <div key={n.kind} className="need"><span>{n.icon} {n.label}</span><i><b style={{ width: `${v}%`, background: v < 30 ? '#e86a7a' : v < 60 ? '#f6c64e' : '#7ac86a' }} /></i></div>
        ); })}
      </div>
      <div className="care-grid">
        {ACTIONS[stage].map(a => <button key={a.id} className="bag-item" onClick={() => act(a)}><span className="care-icon">{a.icon}</span><small>{a.label}</small></button>)}
      </div>
      <button className={`btn small ${walking ? '' : 'ghost'}`} onClick={() => { live.update({ walkKid: walking ? null : kid.id }); onClose(); toast(walking ? `🏠 Đưa bé ${kid.name} về nhà` : stage === 'baby' ? `👶 Đẩy xe cho bé ${kid.name} đi dạo` : `🧒 Bé ${kid.name} nắm tay ${callMe.toLowerCase()} đi chơi`); }}>
        {walking ? '🏠 Đưa bé về nhà' : stage === 'baby' ? '👶 Đẩy xe đưa bé đi dạo' : '🧒 Dắt bé đi chơi'}
      </button>
      <div className="field">
        <span>📒 Sổ của bé</span>
        <ul className="cal-events">
          <li>🐦 Về nhà ngày {kid.born_on.split('-').reverse().join('/')}</li>
          {kid.milestones.filter(m => m !== 'born').map(m => <li key={m}>{MILESTONES[m] ?? m}</li>)}
          {age >= 30 && <li>🎂 Tròn {Math.floor(age / 30)} tháng</li>}
        </ul>
      </div>
    </Sheet>
  );
}
