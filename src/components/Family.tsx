// Em bé: đặt tên khi cò mang tới, chăm bé (ăn, vệ sinh, ngủ, chơi), mốc đáng nhớ, dắt bé đi chơi.
import { useState } from 'react';
import * as api from '../lib/api';
import { ACTIONS, KID_GARMENTS, KID_PATTERNS, kidAge, kidLook, kidMood, kidSprite, kidStage, MILESTONES, NEEDS, needLevel, STAGE_NAME, type CareAction, type KidDesign, type KidStage } from '../lib/kids';
import { item } from '../lib/content';
import { PALETTE } from '../lib/ranch';
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
  /** bộ đồ đã may cho các con & túi đồ (để lấy vải) */
  outfits?: api.OutfitRow[];
  inventory?: api.InvRow[];
}
export function KidSheet({ kids, me, partner, today, live, pick, onClose, onDo, outfits = [], inventory = [] }: KidSheetProps) {
  const [sew, setSew] = useState(false);
  const born = kids.filter(k => k.name && k.born_on <= today);
  const [sel, setSel] = useState(pick ?? born[0]?.id);
  const kid = born.find(k => k.id === sel) ?? born[0];
  if (!kid) return <Sheet title="👶 Em bé" onClose={onClose}><p className="muted">Chưa có bé nào.</p></Sheet>;
  const stage = kidStage(kid, today);
  const look = kidLook(kid, me, partner);
  const age = kidAge(kid, today);
  const mood = kidMood(kid);
  const walking = live.mine.walkKid === kid.id || !!live.mine.walkAll;
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
      if (onDo && (stage === 'baby' || ['bath', 'potty', 'nap', 'bedtime', 'study', 'homework', 'draw', 'card', 'puree', 'meal', 'toy', 'ball', 'talk', 'walk'].includes(a.id))) { onDo(a.id, kid); onClose(); }
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
      <button className={`btn small ${walking ? '' : 'ghost'}`} onClick={() => { live.update({ walkKid: walking ? null : kid.id, walkAll: false }); onClose(); toast(walking ? `🏠 Đưa bé ${kid.name} về nhà` : stage === 'baby' ? `👶 Đẩy xe cho bé ${kid.name} đi dạo` : `🧒 Bé ${kid.name} nắm tay ${callMe.toLowerCase()} đi chơi`); }}>
        {walking ? '🏠 Đưa bé về nhà' : stage === 'baby' ? '👶 Đẩy xe đưa bé đi dạo' : '🧒 Dắt bé đi chơi'}
      </button>
      {stage !== 'baby' && <button className={`btn small ${sew ? '' : 'ghost'}`} onClick={() => setSew(v => !v)}>🧵 Tủ đồ của bé {kid.outfit ? '· đang mặc đồ ba mẹ may' : ''}</button>}
      {sew && stage !== 'baby' && <KidCloset kid={kid} stage={stage} look={look} outfits={outfits} inventory={inventory} />}
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

/** Tủ đồ của bé: ba mẹ tự may (kiểu, màu, hoạ tiết) bằng 1 cuộn len hoặc 1 tấm lụa, rồi cho bé mặc — bé mặc thật trên bản đồ */
function KidCloset({ kid, stage, look, outfits, inventory }: { kid: api.Kid; stage: KidStage; look: ReturnType<typeof kidLook>; outfits: api.OutfitRow[]; inventory: api.InvRow[] }) {
  const [d, setD] = useState<KidDesign>({ type: kid.gender === 'f' ? 'dress' : 'tee', c1: '#f6c64e', c2: '#5a6ad0', pattern: 'dots' });
  const [fabric, setFabric] = useState<'yarn' | 'silk'>('yarn');
  const [name, setName] = useState('');
  const have = (id: string) => inventory.find(r => r.item_id === id)?.qty ?? 0;
  const girl = kid.gender === 'f';
  const prev = (dz: KidDesign | null) => kidSprite(stage, { ...look, cloth: dz?.c1 ?? look.cloth, design: dz }, 'idle', girl).url;
  const same = (a: KidDesign | null | undefined, b: KidDesign) => !!a && a.type === b.type && a.c1 === b.c1 && a.c2 === b.c2 && a.pattern === b.pattern;
  const sewIt = async () => {
    try {
      const title = name.trim() || `${KID_GARMENTS.find(g => g.id === d.type)?.name} cho ${kid.name}`;
      await api.outfitMake(title, { kid: true, ...d }, [{ id: fabric, n: 1 }]);
      notify('outfits', 'inventory'); setName('');
      toast(`✂️ May xong "${title}" — bấm 👕 Cho bé mặc nhé`);
    } catch (e) { toastError(e); }
  };
  const wear = async (dz: KidDesign | null) => {
    try { await api.kidWear(kid.id, dz); notify('kids'); toast(dz ? `👕 ${kid.name} mặc đồ mới rồi, xinh quá!` : `👕 ${kid.name} thay lại đồ thường`); } catch (e) { toastError(e); }
  };
  const sw = (v: string, on: (c: string) => void) => <div className="swatches">{PALETTE.map(c => <button key={c} className={v === c ? 'on' : ''} style={{ background: c }} onClick={() => on(c)} aria-label={c} />)}</div>;
  const kidsOutfits = outfits.map(o => ({ o, dz: { type: o.spec.type, c1: o.spec.c1, c2: o.spec.c2, pattern: o.spec.pattern } as KidDesign }));
  return (
    <div className="tailor">
      <div className="row center"><img src={prev(d)} className="px-img" style={{ width: 72, imageRendering: 'pixelated' }} alt="" /></div>
      <p className="tl-label">Kiểu</p>
      <div className="chips left">{KID_GARMENTS.map(g => <button key={g.id} className={`chip ${d.type === g.id ? 'active' : ''}`} onClick={() => setD({ ...d, type: g.id })}>{g.icon} {g.name}</button>)}</div>
      <p className="tl-label">Màu áo</p>{sw(d.c1, c => setD({ ...d, c1: c }))}
      <p className="tl-label">{d.type === 'skirt' ? 'Màu chân váy' : d.type === 'dress' ? 'Màu phụ' : 'Màu quần'}</p>{sw(d.c2, c => setD({ ...d, c2: c }))}
      <p className="tl-label">Hoạ tiết</p>
      <div className="chips left">{KID_PATTERNS.map(pt => <button key={pt.id} className={`chip ${d.pattern === pt.id ? 'active' : ''}`} onClick={() => setD({ ...d, pattern: pt.id })}>{pt.name}</button>)}</div>
      <div className="chips left">{(['yarn', 'silk'] as const).map(f => <button key={f} className={`chip ${fabric === f ? 'active' : ''}`} onClick={() => setFabric(f)}>{item(f).icon} {item(f).name} (có {have(f)})</button>)}</div>
      <input value={name} maxLength={30} onChange={e => setName(e.target.value)} placeholder={`Đặt tên bộ đồ… (vd: Váy đi chơi của ${kid.name})`} />
      <button className="btn" disabled={have(fabric) < 1} onClick={() => void sewIt()}>✂️ May cho bé (1 {item(fabric).name.toLowerCase()})</button>
      {have(fabric) < 1 && <p className="muted small-note">Chưa có vải: cừu ở trang trại cho lông → 🧶 cuộn len; tằm cho kén → 🧵 tấm lụa.</p>}
      {kidsOutfits.length > 0 && <p className="tl-label">Đồ đã may cho các con</p>}
      <div className="closet-grid">
        {kidsOutfits.map(({ o, dz }) => (
          <div key={o.id} className={`closet-item ${same(kid.outfit, dz) ? 'on' : ''}`}>
            <img src={prev(dz)} className="px-img" style={{ width: 48, imageRendering: 'pixelated' }} alt="" />
            <small>{o.name}</small>
            <button className="btn small" onClick={() => void wear(dz)}>{same(kid.outfit, dz) ? '✓ Đang mặc' : '👕 Cho bé mặc'}</button>
          </div>
        ))}
      </div>
      {kid.outfit && <button className="btn small ghost" onClick={() => void wear(null)}>↩️ Mặc lại đồ thường</button>}
    </div>
  );
}
