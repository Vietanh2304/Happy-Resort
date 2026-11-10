// Nhật ký chung, hoạt động lễ hội (Tết, Trung Thu, Halloween, Giáng Sinh) và du lịch gửi bưu thiếp.
import { useState } from 'react';
import * as api from '../lib/api';
import { item } from '../lib/content';
import { notify } from '../lib/realtime';
import { toast, toastError } from '../lib/toast';
import { Sheet } from './Sheet';

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
const TRIPS = [
  { id: 'hoian', name: 'Phố cổ Hội An', icon: '🏮', bg: 'linear-gradient(#f6c445,#e8743a)', price: 120, souvenir: 'lantern', line: 'Đèn lồng sáng cả con phố, tụi mình đi thuyền thả hoa đăng.' },
  { id: 'dalat', name: 'Đà Lạt mộng mơ', icon: '🌲', bg: 'linear-gradient(#9ad0f0,#6a9a7a)', price: 100, souvenir: 'peach_tea', line: 'Sương mù buổi sáng, một ly trà nóng và hai đôi tay đan vào nhau.' },
  { id: 'halong', name: 'Vịnh Hạ Long', icon: '⛰️', bg: 'linear-gradient(#8ad0e8,#2a7a9a)', price: 150, souvenir: 'coral', line: 'Ngủ đêm trên du thuyền, sáng dậy thấy núi đá giữa biển.' },
  { id: 'sapa', name: 'Sa Pa tuyết', icon: '🏔️', bg: 'linear-gradient(#e8f0ff,#8aa0c8)', price: 140, souvenir: 'fern', line: 'Ruộng bậc thang phủ mây, tối ngồi bên bếp lửa nướng khoai.' },
  { id: 'seoul', name: 'Seoul', icon: '🗼', bg: 'linear-gradient(#f5b0c8,#7a6ad0)', price: 300, souvenir: 'teapot', line: 'Mặc hanbok dạo cung điện, tối lên tháp ngắm thành phố.' },
  { id: 'tokyo', name: 'Tokyo mùa hoa', icon: '🗾', bg: 'linear-gradient(#ffd8e8,#f08aa6)', price: 320, souvenir: 'sakura_bloom', line: 'Hoa anh đào rơi trên vai, tụi mình ăn ramen đến no căng.' },
  { id: 'taichung', name: 'Đài Trung', icon: '🌈', bg: 'linear-gradient(#ffd27a,#7ac8e8)', price: 260, souvenir: 'peach_tea', line: 'Làng Cầu Vồng sặc sỡ, chợ đêm Phùng Giáp với ly trà sữa trân châu chính gốc.' },
  { id: 'gwangju', name: 'Gwangju', icon: '🍂', bg: 'linear-gradient(#f6c48a,#c8604a)', price: 260, souvenir: 'teapot', line: 'Leo núi Mudeung mùa lá đỏ, tối ăn gà nướng phố Chungjang.' },
  { id: 'paris', name: 'Paris', icon: '🗼', bg: 'linear-gradient(#c8d8f8,#f0b8c8)', price: 450, souvenir: 'rose_bloom', line: 'Hôn nhau dưới tháp Eiffel lúc đèn bật sáng, sáng ra ăn croissant bên sông Seine.' },
  { id: 'venice', name: 'Venice', icon: '🛶', bg: 'linear-gradient(#f8e0a8,#4a8ab8)', price: 420, souvenir: 'bouquet', line: 'Ngồi thuyền gondola qua những cây cầu nhỏ, người lái thuyền hát cho tụi mình nghe.' },
  { id: 'santorini', name: 'Santorini', icon: '🏛️', bg: 'linear-gradient(#ffffff,#3a7ad0)', price: 480, souvenir: 'coral', line: 'Nhà trắng mái xanh, ngắm hoàng hôn đẹp nhất thế giới ở Oia.' },
  { id: 'swiss', name: 'Thuỵ Sĩ', icon: '🏔️', bg: 'linear-gradient(#e8f4ff,#5a9a6a)', price: 500, souvenir: 'chocolate', line: 'Tàu đỏ chạy qua núi tuyết, uống sô-cô-la nóng trong nhà gỗ.' },
  { id: 'iceland', name: 'Iceland', icon: '🌌', bg: 'linear-gradient(#0a1a3a,#3ac88a)', price: 550, souvenir: 'star_lantern', line: 'Nằm giữa trời lạnh ngắm cực quang nhảy múa, tay trong tay.' },
  { id: 'maldives', name: 'Maldives', icon: '🏝️', bg: 'linear-gradient(#a8f0f0,#2ab8c8)', price: 520, souvenir: 'coral', line: 'Nhà gỗ trên mặt nước trong vắt, cá nhỏ bơi ngay dưới sàn kính.' },
  { id: 'newyork', name: 'New York', icon: '🗽', bg: 'linear-gradient(#f8d878,#5a5a8a)', price: 480, souvenir: 'gift_box', line: 'Trượt băng ở Central Park, đêm giao thừa đếm ngược ở Quảng trường Thời Đại.' },
  { id: 'bali', name: 'Bali', icon: '🌴', bg: 'linear-gradient(#b8f0a8,#e8a04a)', price: 380, souvenir: 'lotus', line: 'Ruộng bậc thang Tegallalang, xích đu giữa rừng dừa và massage đôi.' },
];
export function TravelSheet({ me, partner, coins, mems, today, onClose }: { me: api.Profile; partner: api.Profile | null; coins: number; mems: api.Memory[]; today: string; onClose: () => void }) {
  const cards = mems.filter(m => m.kind === 'postcard');
  const go = (t: typeof TRIPS[number]) => run(async () => {
    if (!confirm(`✈️ Đi ${t.name} hết ${t.price} xu? Mang về bưu thiếp và quà lưu niệm ${item(t.souvenir).icon}`)) return;
    await api.buyItem(t.souvenir, t.price);
    await api.addMemory(me, 'postcard', { trip: t.id }, today);
    notify('memories', 'inventory', 'profiles');
    toast(`✈️ Chuyến ${t.name} thật vui! Bưu thiếp đã dán vào sổ`);
  });
  return (
    <Sheet title="✈️ Du lịch cùng nhau" onClose={onClose}>
      <p className="muted small-note">Hũ xu: 🪙 {coins} · mỗi chuyến mang về 1 bưu thiếp + 1 món quà lưu niệm</p>
      <div className="bag-grid">
        {TRIPS.map(t => <button key={t.id} className="bag-item" disabled={coins < t.price} onClick={() => void go(t)}><span style={{ fontSize: 26 }}>{t.icon}</span><small>{t.name}</small><small>🪙 {t.price}</small></button>)}
      </div>
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
