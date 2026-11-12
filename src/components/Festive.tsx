// Nhật ký chung, hoạt động lễ hội (Tết, Trung Thu, Halloween, Giáng Sinh) và du lịch gửi bưu thiếp.
import { StampBook } from './TripExtras';
import { useState } from 'react';
import * as api from '../lib/api';
import { item } from '../lib/content';
import { notify } from '../lib/realtime';
import { toast, toastError } from '../lib/toast';
import { Sheet } from './Sheet';
import { TRIPS, type Trip, type TripId } from '../lib/trips';

const run = async (f: () => Promise<unknown>) => { try { await f(); return true; } catch (e) { toastError(e); return false; } };
const nameOf = (id: string, me: api.Profile, partner: api.Profile | null) => (id === me.id ? me.display_name : partner?.display_name ?? 'Người ấy');

// ───────── Nhật ký chung ─────────
export function DiarySheet({ me, partner, today, mems, onClose }: { me: api.Profile; partner: api.Profile | null; today: string; mems: api.Memory[]; onClose: () => void }) {
  const diary = mems.filter(m => m.kind === 'diary');
  const mine = diary.find(m => m.user_id === me.id && m.day === today);
  const [text, setText] = useState('');
  const months = [...new Set(diary.map(m => m.day.slice(0, 7)))];
  const [month, setMonth] = useState(today.slice(0, 7));
  const write = () => run(async () => { await api.addMemory(me, 'diary', { text: text.trim() }, today); notify('memories'); setText(''); toast('📓 Đã ghi vào nhật ký chung'); });
  const days = [...new Set(diary.filter(m => m.day.startsWith(month)).map(m => m.day))].sort();
  return (
    <Sheet title="📓 Nhật ký của hai đứa" onClose={onClose}>
      {mine ? <p className="muted">✅ Hôm nay bạn viết rồi: “{mine.data.text}”</p> : (
        <div className="row wrap">
          <input value={text} maxLength={200} onChange={e => setText(e.target.value)} placeholder="Hôm nay của bạn thế nào? (1 dòng)" style={{ flex: 1, minWidth: 180 }} />
          <button className="btn" disabled={!text.trim()} onClick={() => void write()}>✍️ Ghi</button>
        </div>
      )}
      <div className="row wrap" style={{ marginTop: 8 }}>
        {(months.includes(today.slice(0, 7)) ? months : [today.slice(0, 7), ...months]).map(m => (
          <button key={m} className={`chip ${m === month ? 'on' : ''}`} onClick={() => setMonth(m)}>Tháng {+m.slice(5)}/{m.slice(0, 4)}</button>
        ))}
      </div>
      <h4>📖 Tháng {+month.slice(5)} của tụi mình</h4>
      {!days.length && <p className="muted">Chưa có trang nào — mỗi ngày mỗi người viết một dòng nhé.</p>}
      <ul className="task-list">
        {days.map(d => (
          <li key={d} style={{ display: 'block' }}><b>{+d.slice(8)}/{+d.slice(5, 7)}</b>
            {diary.filter(m => m.day === d).map(m => <div key={m.id}><small className="muted">{nameOf(m.user_id, me, partner)}:</small> {m.data.text}</div>)}
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

// ───────── Lễ hội ─────────
export type FestKind = 'tet' | 'midautumn' | 'halloween' | 'xmas';
export const festKindOf = (ids: string[]): FestKind | null =>
  ids.some(i => i.startsWith('tet:')) ? 'tet' : ids.some(i => i.startsWith('midautumn:')) ? 'midautumn' : ids.some(i => i.startsWith('halloween:')) ? 'halloween' : ids.some(i => i.startsWith('xmas:')) ? 'xmas' : null;

const CHUNG_STEPS = [{ icon: '🍃', name: 'Lót lá dong' }, { icon: '🍚', name: 'Rải gạo nếp' }, { icon: '🟡', name: 'Thêm đỗ xanh' }, { icon: '🥓', name: 'Đặt thịt' }, { icon: '🍚', name: 'Phủ gạo lên' }, { icon: '📦', name: 'Gói vuông' }, { icon: '🎀', name: 'Buộc lạt' }];
const LANTERN_SHAPES = [{ id: 'star', icon: '⭐', name: 'Ông sao' }, { id: 'fish', icon: '🐟', name: 'Cá chép' }, { id: 'rabbit', icon: '🐰', name: 'Thỏ ngọc' }, { id: 'round', icon: '🏮', name: 'Lồng tròn' }];
const LANTERN_COLORS = ['#e8443a', '#f6c445', '#f59ab3', '#5aa8e0', '#8bc87a'];
const NPC_HOUSES = ['🏠 Nhà bà Tư', '🏡 Nhà chú Ba', '🏘️ Nhà cô giáo', '🛖 Nhà bác bảo vệ', '🏰 Nhà bạn Thỏ'];
const ORN_COLORS = ['#e8443a', '#f6c445', '#5aa8e0', '#f59ab3', '#ffffff'];

export function FestivalSheet({ kind, me, partner, today, mems, inventory, kids, onClose }: {
  kind: FestKind; me: api.Profile; partner: api.Profile | null; today: string; mems: api.Memory[]; inventory: api.InvRow[]; kids: api.Kid[]; onClose: () => void;
}) {
  const year = today.slice(0, 4);
  const have = (id: string) => inventory.find(r => r.item_id === id)?.qty ?? 0;
  const [step, setStep] = useState(0);
  const [shuffled] = useState(() => [...CHUNG_STEPS.keys()].sort(() => Math.random() - 0.5));
  const [shape, setShape] = useState('star');
  const [color, setColor] = useState(LANTERN_COLORS[0]);
  const [gift, setGift] = useState('');
  const [note, setNote] = useState('');

  if (kind === 'tet') {
    const tap = (i: number) => {
      if (i !== step) { toast(`❌ Chưa đúng — bước tiếp theo là “${CHUNG_STEPS[step].name}”`); return; }
      if (step + 1 < CHUNG_STEPS.length) { setStep(step + 1); return; }
      setStep(0);
      void run(async () => {
        const ok = await api.claim(`tet:chung:${today}:${me.id}`, [{ id: 'banh_chung', n: 2 }]);
        notify('inventory'); toast(ok ? '🟩 Gói xong bánh chưng! +2 bánh chưng vào túi' : '🟩 Gói đẹp lắm! (hôm nay đã nhận bánh rồi, mai gói tiếp nhé)');
      });
    };
    const lixi = (k: api.Kid) => run(async () => {
      if (!have('lixi')) return toast('🧧 Hết bao lì xì — mua ở chợ hoa bên dưới');
      await api.craft([{ id: 'lixi', n: 1 }]); notify('inventory'); toast(`🧧 ${k.name}: “Con chúc ba mẹ năm mới vui vẻ ạ!” 🥰`);
    });
    const buy = (id: string, price: number) => run(async () => { await api.buyItem(id, price); notify('inventory', 'profiles'); toast(`🌸 Mua ${item(id).icon} ${item(id).name}`); });
    return (
      <Sheet title="🧧 Tết Nguyên Đán" onClose={onClose}>
        <h4>🟩 Gói bánh chưng</h4>
        <p className="muted small-note">Bấm đúng thứ tự: {CHUNG_STEPS.map((s, i) => <span key={i} style={{ opacity: i < step ? 0.35 : 1 }}>{s.icon}</span>)}</p>
        <div className="row wrap">{shuffled.map(i => <button key={i} className="btn small" onClick={() => tap(i)}>{CHUNG_STEPS[i].icon} {CHUNG_STEPS[i].name}</button>)}</div>
        <h4>🧧 Lì xì cho các bé</h4>
        {kids.filter(k => k.name).length ? <div className="row wrap">{kids.filter(k => k.name).map(k => <button key={k.id} className="btn small" onClick={() => void lixi(k)}>🧧 {k.name}</button>)}</div> : <p className="muted">Nhà chưa có bé nào.</p>}
        <p className="muted small-note">Bao lì xì trong túi: {have('lixi')}</p>
        <h4>🌸 Chợ hoa Tết</h4>
        <div className="row wrap">
          <button className="btn small ghost" onClick={() => void buy('peach', 40)}>🌸 Cành đào · 40 xu</button>
          <button className="btn small ghost" onClick={() => void buy('lixi', 10)}>🧧 Bao lì xì · 10 xu</button>
          <button className="btn small ghost" onClick={() => void buy('lixi_treo', 25)}>{item('lixi_treo').icon} {item('lixi_treo').name} · 25 xu</button>
        </div>
      </Sheet>
    );
  }

  if (kind === 'midautumn') {
    const mine = mems.filter(m => m.kind === 'lantern' && m.day.startsWith(year));
    const make = () => run(async () => { await api.addMemory(me, 'lantern', { shape, color }, today); notify('memories'); toast('🏮 Làm xong đèn! Tối nay đèn sẽ đi rước quanh làng'); });
    return (
      <Sheet title="🏮 Trung Thu — làm đèn lồng" onClose={onClose}>
        <div className="row wrap">{LANTERN_SHAPES.map(s => <button key={s.id} className={`chip ${shape === s.id ? 'on' : ''}`} onClick={() => setShape(s.id)}>{s.icon} {s.name}</button>)}</div>
        <div className="row wrap" style={{ marginTop: 6 }}>{LANTERN_COLORS.map(c => <button key={c} className={`chip ${color === c ? 'on' : ''}`} style={{ background: c, width: 28, height: 28 }} onClick={() => setColor(c)} aria-label={c} />)}</div>
        <p style={{ fontSize: 48, textAlign: 'center', filter: `drop-shadow(0 0 10px ${color})` }}>{LANTERN_SHAPES.find(s => s.id === shape)!.icon}</p>
        <button className="btn" onClick={() => void make()}>✂️ Dán giấy, thắp nến — xong!</button>
        <h4>🏮 Đèn của hai đứa năm nay ({mine.length})</h4>
        <p style={{ fontSize: 26 }}>{mine.map(m => <span key={m.id} title={nameOf(m.user_id, me, partner)} style={{ filter: `drop-shadow(0 0 6px ${m.data.color})` }}>{LANTERN_SHAPES.find(s => s.id === m.data.shape)?.icon ?? '🏮'}</span>)}</p>
        <p className="muted small-note">Tối Trung Thu (sau 18h), đèn của hai bạn cùng đèn NPC sẽ rước quanh làng 🎑</p>
      </Sheet>
    );
  }

  if (kind === 'halloween') {
    const knock = (i: number) => run(async () => {
      const treat = Math.random() < 0.75;
      const ok = await api.claim(`halloween:${year}:${me.id}:${i}`, treat ? [{ id: 'candy_box', n: 1 }] : [{ id: 'pumpkin_pie', n: 1 }]);
      notify('inventory');
      toast(!ok ? `${NPC_HOUSES[i]}: “Năm nay cho kẹo rồi mà 😝”` : treat ? `${NPC_HOUSES[i]}: “Đây kẹo nè, đừng ghẹo cô nha!” 🍬` : `${NPC_HOUSES[i]}: “Hết kẹo rồi… cho bánh bí đỏ nhé!” 🥧`);
    });
    return (
      <Sheet title="🎃 Halloween — đi xin kẹo" onClose={onClose}>
        <p className="muted">“Trick or treat!” Gõ cửa từng nhà trong làng (mỗi nhà một lần mỗi năm). Muốn hoá trang thì ghé 🧵 tiệm may làm đồ nhé.</p>
        <div className="row wrap">{NPC_HOUSES.map((h, i) => <button key={i} className="btn small" onClick={() => void knock(i)}>{h} 🚪</button>)}</div>
      </Sheet>
    );
  }

  // Giáng Sinh: trang trí cây thông chung + đặt quà dưới gốc (sáng hôm sau mới mở)
  const orns = mems.filter(m => m.kind === 'ornament' && m.day.startsWith(year));
  const gifts = mems.filter(m => m.kind === 'xmasgift' && m.day.startsWith(year));
  const hang = () => run(async () => {
    if (orns.filter(o => o.user_id === me.id).length >= 12) return toast('🎄 Bạn treo đủ 12 quả rồi');
    await api.addMemory(me, 'ornament', { x: Math.random(), y: 0.15 + Math.random() * 0.75, c: ORN_COLORS[Math.floor(Math.random() * ORN_COLORS.length)] }, today); notify('memories');
  });
  const give = () => run(async () => {
    if (!gift || !have(gift)) return toast('🎁 Chọn món trong túi để gói');
    const tomorrow = new Date(Date.now() + 86400_000); tomorrow.setHours(7, 0, 0, 0);
    await api.craft([{ id: gift, n: 1 }]);
    await api.addMemory(me, 'xmasgift', { item: gift, note: note.trim(), to: partner?.id }, today, tomorrow.toISOString());
    notify('memories', 'inventory'); setGift(''); setNote(''); toast('🎁 Đã đặt quà dưới gốc thông — sáng mai người ấy mới mở được');
  });
  const open = (g: api.Memory) => run(async () => {
    const ok = await api.claim(`xmasgift:${g.id}`, [{ id: g.data.item, n: 1 }]);
    notify('inventory'); toast(ok ? `🎁 Mở quà: ${item(g.data.item).icon} ${item(g.data.item).name}${g.data.note ? ` — “${g.data.note}”` : ''}` : 'Quà này mở rồi 🥰');
  });
  return (
    <Sheet title="🎄 Giáng Sinh" onClose={onClose}>
      <div style={{ position: 'relative', width: 160, height: 180, margin: '0 auto' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 10, bottom: 20, background: '#2e8b57', clipPath: 'polygon(50% 0, 100% 100%, 0 100%)' }} />
        <div style={{ position: 'absolute', left: 72, width: 16, bottom: 0, height: 22, background: '#7a4a2a' }} />
        <span style={{ position: 'absolute', left: 68, top: -6, fontSize: 20 }}>⭐</span>
        {orns.map(o => { const y = o.data.y, half = y * 0.5; return <i key={o.id} style={{ position: 'absolute', width: 10, height: 10, borderRadius: '50%', background: o.data.c, boxShadow: '0 0 4px #fff8', top: 10 + y * 150, left: 80 + (o.data.x - 0.5) * 2 * half * 150 - 5 }} />; })}
        {gifts.slice(0, 5).map((g, i) => <span key={g.id} style={{ position: 'absolute', bottom: -4, left: 10 + i * 28, fontSize: 18 }}>🎁</span>)}
      </div>
      <button className="btn" onClick={() => void hang()}>🔴 Treo một quả châu</button>
      <h4>🎁 Đặt quà dưới gốc cho {partner?.display_name ?? 'người ấy'}</h4>
      <div className="row wrap">
        <select value={gift} onChange={e => setGift(e.target.value)}>
          <option value="">— chọn món trong túi —</option>
          {inventory.filter(r => r.qty > 0).map(r => <option key={r.item_id} value={r.item_id}>{item(r.item_id).icon} {item(r.item_id).name} ({r.qty})</option>)}
        </select>
        <input value={note} maxLength={120} onChange={e => setNote(e.target.value)} placeholder="Lời nhắn kèm theo" />
        <button className="btn small" onClick={() => void give()}>🎀 Gói quà</button>
      </div>
      <h4>Quà dưới gốc thông</h4>
      <ul className="task-list">
        {gifts.map(g => {
          const forMe = g.data.to === me.id, ready = !g.open_at || Date.parse(g.open_at) <= Date.now();
          return <li key={g.id}><b>🎁 {forMe ? `Quà của ${nameOf(g.user_id, me, partner)}` : `Quà bạn gửi`}</b>
            {forMe ? (ready ? <button className="btn small" onClick={() => void open(g)}>Mở quà</button> : <small className="muted">Sáng mai mới mở được 🤫</small>) : <small className="muted">{item(g.data.item).icon} {item(g.data.item).name}</small>}</li>;
        })}
      </ul>
    </Sheet>
  );
}

/** Rước đèn Trung Thu: đèn hai bạn làm + đèn NPC trôi qua màn hình (tối Trung Thu) */
export function LanternParade({ mems, year }: { mems: api.Memory[]; year: string }) {
  const mine = mems.filter(m => m.kind === 'lantern' && m.day.startsWith(year)).map(m => ({ icon: LANTERN_SHAPES.find(s => s.id === m.data.shape)?.icon ?? '🏮', c: m.data.color as string }));
  const all = [...mine, ...['⭐', '🐟', '🏮', '🐰', '⭐', '🏮'].map((icon, i) => ({ icon, c: LANTERN_COLORS[i % LANTERN_COLORS.length] }))];
  return <div className="lantern-parade">{all.map((l, i) => <span key={i} style={{ animationDelay: `${-i * 2.2}s`, filter: `drop-shadow(0 0 8px ${l.c})`, bottom: `${8 + (i % 3) * 5}%` }}>{l.icon}</span>)}</div>;
}

// ───────── Du lịch: đi một chuyến, mang về bưu thiếp + quà lưu niệm ─────────
export function TravelSheet({ me, partner, coins, mems, onClose, onFly, kids = [], kidWith = null }: { me: api.Profile; partner: api.Profile | null; coins: number; mems: api.Memory[]; today: string; onClose: () => void; onFly: (id: TripId, kid: string | null) => void; kids?: { id: string; name: string }[]; kidWith?: string | null }) {
  const cards = mems.filter(m => m.kind === 'postcard');
  const [kid, setKid] = useState<string | null>(kidWith);
  const all = kid === 'all', nKids = all ? kids.length : kid ? 1 : 0;
  const kidName = all ? `cả ${kids.length} bé` : kids.find(k => k.id === kid)?.name;
  const cost = (t: Trip) => t.price + nKids * Math.ceil(t.price / 2);
  const go = (t: Trip) => run(async () => {
    if (!confirm(`✈️ Mua vé đi ${t.name} hết ${cost(t)} xu${kidName ? ` (gồm vé trẻ em cho ${all ? kidName : `bé ${kidName}`})` : ''}? (kèm quà lưu niệm ${item(t.souvenir).icon}, về làng miễn phí)`)) return;
    await api.buyItem(t.souvenir, t.price);
    for (let k = 0; k < nKids; k++) await api.buyItem(t.souvenir, Math.ceil(t.price / 2));
    notify('inventory', 'profiles');
    onClose(); onFly(t.id, kid);
  });

  return (
    <Sheet title="✈️ Du lịch cùng nhau" onClose={onClose}>
      <p className="muted small-note">Hũ xu: 🪙 {coins} · bay tới nơi dạo chơi, ăn đặc sản, chụp bưu thiếp 📸</p>
      {kids.length > 0 && (
        <div className="chips" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '6px 0' }}>
          <span className="muted small-note">👶 Đưa bé đi cùng:</span>
          <button className={`btn small ${kid ? 'ghost' : ''}`} onClick={() => setKid(null)}>Không</button>
          {kids.map(k => <button key={k.id} className={`btn small ${kid === k.id ? '' : 'ghost'}`} onClick={() => setKid(k.id)}>{k.name}</button>)}
          {kids.length > 1 && <button className={`btn small ${all ? '' : 'ghost'}`} onClick={() => setKid('all')}>👨‍👩‍👧‍👦 Tất cả {kids.length} bé</button>}
        </div>
      )}
      <div className="bag-grid">
        {TRIPS.map(t => <button key={t.id} className="bag-item" disabled={coins < cost(t)} onClick={() => void go(t)}><span style={{ fontSize: 26 }}>{t.icon}</span><small>{t.name}</small><small>🪙 {cost(t)}</small></button>)}
      </div>
      <h4>✨ Trải nghiệm đặc biệt (hai đứa đi ngay)</h4>
      <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
        {([['balloon', '🎈 Khinh khí cầu Cappadocia'], ['icecastle', '🏰 Lâu đài băng Cáp Nhĩ Tân'], ['glowsea', '🚤 Biển phát sáng Maldives']] as const).map(([k, l]) => <button key={k} className="btn small" onClick={() => { onClose(); window.dispatchEvent(new CustomEvent('duo-start', { detail: k })); }}>{l}</button>)}
      </div>
      <StampBook me={me} partner={partner} />
      <h4>📮 Bưu thiếp ({cards.length})</h4>
      <div className="postcards">
        {cards.map(c => { const t = TRIPS.find(x => x.id === c.data.trip); if (!t) return null; return (
          <div key={c.id} className="postcard" style={{ background: t.bg }}>
            <b>{t.icon} {t.name}</b><p>{t.line}</p><small>— {me.display_name} & {partner?.display_name ?? '…'} · {c.day.split('-').reverse().join('/')}</small>
          </div>
        ); })}
      </div>
    </Sheet>
  );
}
