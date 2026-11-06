// Album ảnh chung, lịch ngày đặc biệt, thú cưng, đọc sách cùng nhau, khay bày đồ ngày lễ.
import { useMemo, useState } from 'react';
import * as api from '../lib/api';
import { content, item } from '../lib/content';
import { addDays, CUSTOM_ICONS, diffDays, festivalsOn, loveDays, THEMES, upcoming, type CustomDay, type Theme } from '../lib/festivals';
import { PET_KINDS, petSprite } from '../lib/places';
import { download, polaroid } from '../lib/photo';
import { notify } from '../lib/realtime';
import { toast, toastError } from '../lib/toast';
import { Sheet } from './Sheet';

const fmt = (d: string) => `${+d.slice(8, 10)}/${+d.slice(5, 7)}/${d.slice(0, 4)}`;
async function act(f: () => Promise<unknown>) {
  try { await f(); return true; } catch (e) { toastError(e); return false; }
}

// ───────── Ảnh vừa chụp ─────────

export function PhotoSheet({ me, shot, scene, place, onClose, onRetake }: { me: api.Profile; shot: HTMLCanvasElement; scene: string; place: string; onClose: () => void; onRetake: () => void }) {
  const [caption, setCaption] = useState('');
  const sub = `${place} · ${new Date().toLocaleDateString('vi-VN')}`;
  const url = useMemo(() => polaroid(shot, caption.trim(), sub), [shot, caption, sub]);
  const [busy, setBusy] = useState(false);
  return (
    <Sheet title="📸 Khoảnh khắc vừa chụp" onClose={onClose}>
      <img src={url} className="photo-preview" alt="Ảnh vừa chụp" />
      <input value={caption} maxLength={60} onChange={e => setCaption(e.target.value)} placeholder="Viết chú thích… (vd: Hoàng hôn đầu tiên trên đồi)" />
      <div className="row wrap">
        <button className="btn" disabled={busy} onClick={async () => {
          setBusy(true);
          if (await act(() => api.addPhoto(me, scene, caption.trim(), url))) { notify('photos'); toast('📔 Đã cất vào album chung'); onClose(); }
          setBusy(false);
        }}>💾 Lưu vào album</button>
        <button className="btn ghost" onClick={() => download(url, `happy-resort-${Date.now()}.jpg`)}>⬇️ Tải về máy</button>
        <button className="btn ghost" onClick={onRetake}>🔄 Chụp lại</button>
      </div>
    </Sheet>
  );
}

// ───────── Album chung ─────────

export function AlbumSheet({ photos, me, partner, onClose, onShoot }: { photos: api.Photo[]; me: api.Profile; partner: api.Profile | null; onClose: () => void; onShoot: () => void }) {
  const [open, setOpen] = useState<api.Photo | null>(null);
  const who = (id: string) => (id === me.id ? 'Bạn' : partner?.display_name ?? 'Người ấy');
  return (
    <Sheet title="📔 Album của hai đứa" onClose={onClose}>
      <p className="muted">Bấm 📸 trên thanh trên cùng ở bất cứ đâu — đếm ngược 3 giây cho cả hai cùng tạo dáng.</p>
      <button className="btn small" onClick={onShoot}>📸 Chụp ngay</button>
      {photos.length === 0 && <p className="muted">Chưa có tấm ảnh nào. Ra đồi ngắm hoàng hôn rồi chụp tấm đầu tiên nhé!</p>}
      <div className="album">
        {photos.map((ph, i) => (
          <button key={ph.id} className="album-item" style={{ transform: `rotate(${((i * 37) % 7) - 3}deg)` }} onClick={() => setOpen(ph)}>
            <img src={ph.data} alt={ph.caption} />
          </button>
        ))}
      </div>
      {open && (
        <Sheet title={open.caption || 'Khoảnh khắc'} onClose={() => setOpen(null)}>
          <img src={open.data} className="photo-preview" alt={open.caption} />
          <p className="muted small-note">Chụp bởi {who(open.taken_by)} · {new Date(open.created_at).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
          <div className="row wrap">
            <button className="btn" onClick={() => download(open.data, `happy-resort-${open.created_at.slice(0, 10)}.jpg`)}>⬇️ Tải về</button>
            <button className="btn ghost" onClick={async () => {
              if (!confirm('Xóa tấm ảnh này khỏi album chung?')) return;
              if (await act(() => api.deletePhoto(open))) { notify('photos'); setOpen(null); }
            }}>🗑️ Xóa</button>
          </div>
        </Sheet>
      )}
    </Sheet>
  );
}

// ───────── Lịch ngày đặc biệt ─────────

interface CalProps {
  me: api.Profile;
  partner: api.Profile | null;
  couple: api.Couple | null;
  days: CustomDay[];
  today: string;
  meetup: api.Meetup | null;
  onSaved: () => void;
  onClose: () => void;
}
const WEEK = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export function CalendarSheet({ me, partner, couple, days, today, meetup, onSaved, onClose }: CalProps) {
  const people = { meName: me.display_name, partnerName: partner?.display_name ?? 'người ấy', myBirthday: me.birthday, partnerBirthday: partner?.birthday, anniversary: couple?.anniversary, custom: days };
  const [month, setMonth] = useState(today.slice(0, 7));
  const [picked, setPicked] = useState(today);
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('💕');
  const [theme, setTheme] = useState<Theme>('romantic');
  const [yearly, setYearly] = useState(true);
  const [anniv, setAnniv] = useState(couple?.anniversary ?? '');
  const [bday, setBday] = useState(me.birthday ?? '');

  const clearMeet = async () => {
    if (confirm('Xóa ngày gặp đã hẹn?') && await act(() => api.clearMeetup(me))) { notify('meetup'); toast('🗑️ Đã xóa ngày hẹn'); }
  };
  const clearAnniv = async () => {
    if (!confirm('Xóa ngày bắt đầu yêu nhau khỏi lịch?')) return;
    if (await act(() => api.setAnniversary(null))) { notify('profiles'); onSaved(); setAnniv(''); toast('🗑️ Đã xóa ngày yêu nhau'); }
  };
  const clearBday = async () => {
    if (!confirm('Xóa sinh nhật của bạn khỏi lịch?')) return;
    if (await act(() => api.updateProfile(me.id, { birthday: null }))) { notify('profiles'); onSaved(); setBday(''); toast('🗑️ Đã xóa sinh nhật'); }
  };
  const first = `${month}-01`;
  const lead = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7;
  const nDays = new Date(Date.UTC(+month.slice(0, 4), +month.slice(5, 7), 0)).getUTCDate();
  const shift = (n: number) => { const d = new Date(Date.UTC(+month.slice(0, 4), +month.slice(5, 7) - 1 + n, 1)); setMonth(d.toISOString().slice(0, 7)); };
  const marks = (d: string) => [...festivalsOn(d, people).map(f => f.icon), ...(meetup?.day === d ? ['✈️'] : [])];
  const pickedFests = festivalsOn(picked, people);
  const soon = upcoming(today, people, 180).slice(0, 6);

  return (
    <Sheet title="📅 Lịch của hai đứa" onClose={onClose}>
      {couple?.anniversary && couple.anniversary <= today && (
        <p className="love-days">💞 Hôm nay là ngày thứ <b>{loveDays(couple.anniversary, today)}</b> hai bạn yêu nhau</p>
      )}
      <div className="cal-head">
        <button className="btn small ghost" onClick={() => shift(-1)}>‹</button>
        <b>Tháng {+month.slice(5, 7)} / {month.slice(0, 4)}</b>
        <button className="btn small ghost" onClick={() => shift(1)}>›</button>
      </div>
      <div className="cal-grid">
        {WEEK.map(w => <span key={w} className="cal-w">{w}</span>)}
        {Array.from({ length: lead }, (_, i) => <span key={`e${i}`} />)}
        {Array.from({ length: nDays }, (_, i) => {
          const d = `${month}-${String(i + 1).padStart(2, '0')}`;
          const m = marks(d);
          return (
            <button key={d} className={`cal-d ${d === today ? 'today' : ''} ${d === picked ? 'picked' : ''} ${m.length ? 'marked' : ''}`} onClick={() => setPicked(d)}>
              <small>{i + 1}</small><span>{m.slice(0, 2).join('')}</span>
            </button>
          );
        })}
      </div>

      <div className="cal-day">
        <b>{fmt(picked)}</b>
        {pickedFests.length === 0 && meetup?.day !== picked && <span className="muted"> — chưa có gì, ghi chú một ngày đáng nhớ nhé</span>}
        <ul className="cal-events">
          {meetup?.day === picked && <li>✈️ Ngày gặp nhau
 <button className="link" onClick={clearMeet}>xóa</button></li>}
          {pickedFests.map(f => {
            const c = f.custom ? days.find(x => f.id.startsWith(`custom:${x.id}:`)) : null;
            return (
              <li key={f.id}>{f.icon} {f.name} <small className="muted">· {THEMES[f.theme].label}</small>
                {c && <button className="link" onClick={async () => { if (confirm(`Xóa "${c.title}" khỏi lịch?`) && await act(() => api.deleteDay(c.id))) notify('days'); }}>xóa</button>}
                {!c && /^(anniv|day\d)/.test(f.id) && <button className="link" onClick={clearAnniv}>xóa</button>}
                {!c && f.id.startsWith('bday-me') && <button className="link" onClick={clearBday}>xóa</button>}
              </li>
            );
          })}
        </ul>
        <form className="stack" onSubmit={async e => {
          e.preventDefault();
          if (!title.trim()) return;
          if (await act(() => api.addDay(me, { day: picked, title: title.trim(), icon, theme, yearly }))) {
            notify('days'); setTitle(''); toast(`📌 Đã ghi "${title.trim()}" vào ${fmt(picked)}`);
          }
        }}>
          <input value={title} maxLength={40} onChange={e => setTitle(e.target.value)} placeholder="Ghi chú ngày này… (vd: Lần đầu nắm tay)" />
          <div className="chips left">{CUSTOM_ICONS.map(i => <button type="button" key={i} className={`chip ${icon === i ? 'active' : ''}`} onClick={() => setIcon(i)}>{i}</button>)}</div>
          <div className="chips left">
            {(Object.keys(THEMES) as Theme[]).map(t => <button type="button" key={t} className={`chip ${theme === t ? 'active' : ''}`} onClick={() => setTheme(t)}>{THEMES[t].label}</button>)}
          </div>
          <label className="check"><input type="checkbox" checked={yearly} onChange={e => setYearly(e.target.checked)} /> Lặp lại mỗi năm</label>
          <button className="btn small" disabled={!title.trim()}>📌 Ghi vào lịch</button>
          <small className="muted">Đúng ngày đó cả làng sẽ đổi cảnh theo phong cách bạn chọn, và hai bạn có thể tự bày thêm đồ trang trí.</small>
        </form>
      </div>

      <div className="field">
        <span>💞 Ngày bắt đầu yêu nhau</span>
        <div className="row">
          <input type="date" value={anniv} max={today} onChange={e => setAnniv(e.target.value)} />
          <button className="btn small" disabled={anniv === (couple?.anniversary ?? '')} onClick={async () => {
            if (await act(() => api.setAnniversary(anniv || null))) { notify('profiles'); onSaved(); toast('💞 Đã lưu ngày yêu nhau'); }
          }}>Lưu</button>
          {couple?.anniversary && <button className="btn small ghost" onClick={clearAnniv}>🗑️ Xóa</button>}
        </div>
      </div>
      <div className="field">
        <span>🎂 Sinh nhật của bạn{partner?.birthday ? ` · của ${partner.display_name}: ${+partner.birthday.slice(8, 10)}/${+partner.birthday.slice(5, 7)}` : ''}</span>
        <div className="row">
          <input type="date" value={bday} onChange={e => setBday(e.target.value)} />
          <button className="btn small" disabled={bday === (me.birthday ?? '')} onClick={async () => {
            if (await act(() => api.updateProfile(me.id, { birthday: bday || null }))) { notify('profiles'); onSaved(); toast('🎂 Đã lưu sinh nhật'); }
          }}>Lưu</button>
          {me.birthday && <button className="btn small ghost" onClick={clearBday}>🗑️ Xóa</button>}
        </div>
      </div>

      <div className="field">
        <span>⏳ Sắp tới</span>
        <ul className="cal-events">
          {meetup && meetup.day >= today && <li>✈️ Ngày gặp nhau — {fmt(meetup.day)} ({diffDays(today, meetup.day) === 0 ? 'hôm nay!' : `còn ${diffDays(today, meetup.day)} ngày`}) <button className="link" onClick={clearMeet}>xóa</button></li>}
          {soon.map(u => <li key={u.name + u.date}>{u.icon} {u.name} — {fmt(u.date)} ({u.inDays === 0 ? 'hôm nay!' : `còn ${u.inDays} ngày`})</li>)}
          {soon.length === 0 && <li className="muted">Chưa có dịp nào trong 6 tháng tới — thêm ngày yêu nhau hoặc sinh nhật nhé.</li>}
        </ul>
      </div>
    </Sheet>
  );
}

// ───────── Khay bày đồ ngày lễ ─────────

export function FestTray({ theme, icon, onPick, onDone }: { theme: Theme; icon: string; onPick: (i: string) => void; onDone: () => void }) {
  return (
    <div className="tray">
      <p className="tray-hint ok">🎀 Chọn món rồi chạm vào chỗ bất kỳ trong làng để bày. Chạm vào món đã bày để gỡ. Đồ chỉ hiện trong ngày hôm nay.</p>
      <div className="tray-row">
        <div className="tray-items">
          {THEMES[theme].palette.map(i => <button key={i} className={`tray-item ${i === icon ? 'active' : ''}`} onClick={() => onPick(i)}><span>{i}</span></button>)}
        </div>
        <button className="btn small" onClick={onDone}>Xong</button>
      </div>
    </div>
  );
}

// ───────── Thú cưng ─────────

interface PetProps {
  pet: api.Pet | null;
  inventory: api.InvRow[];
  date: string;
  walking: boolean;
  partnerWalking: boolean;
  partnerName: string;
  onWalk: () => void;
  onClose: () => void;
}
export function PetSheet({ pet, inventory, date, walking, partnerWalking, partnerName, onWalk, onClose }: PetProps) {
  const [kind, setKind] = useState('cat');
  const [name, setName] = useState('');
  const [rename, setRename] = useState<string | null>(null);
  const have = (id: string) => inventory.find(r => r.item_id === id)?.qty ?? 0;

  if (!pet) {
    return (
      <Sheet title="🐾 Nhận nuôi một bé" onClose={onClose}>
        <p className="muted">Bé sẽ là thú cưng chung của hai bạn: ai cũng cho ăn, vuốt ve, dắt đi dạo được. Chăm càng nhiều, bé càng quấn.</p>
        <div className="pet-pick">
          {PET_KINDS.map(k => (
            <button key={k.id} className={`bag-item ${kind === k.id ? 'active' : ''}`} onClick={() => setKind(k.id)}>
              <img src={petSprite(k.id, 'sit').url} className="px-img pet-art" alt="" /><small>{k.name}</small>
            </button>
          ))}
        </div>
        <input value={name} maxLength={20} onChange={e => setName(e.target.value)} placeholder="Đặt tên cho bé… (vd: Mochi)" />
        <button className="btn" disabled={!name.trim()} onClick={async () => {
          if (await act(() => api.adoptPet(kind as api.PetKind, name.trim()))) {
            await api.claim('pet-kit', content.petKit).catch(() => false);
            notify('pets', 'inventory');
            toast(`🐾 Chào mừng ${name.trim()} về nhà! Có sẵn pate, ổ nằm và bóng trong túi`);
          }
        }}>💕 Nhận nuôi</button>
      </Sheet>
    );
  }

  const hours = pet.fed_at ? (Date.now() - new Date(pet.fed_at).getTime()) / 3600e3 : 99;
  const hunger = hours < 8 ? '😊 No căng bụng' : hours < 24 ? '🥺 Hơi đói rồi' : '😿 Đói lắm — cho bé ăn đi';
  const level = Math.floor(pet.love / 10) + 1;
  const care = (key: string | null, love: number, feed: boolean, msg: string, use?: string) => act(async () => {
    if (use) await api.craft([{ id: use, n: 1 }]);
    const first = key ? await api.claim(`${key}:${date}`) : true;
    await api.petCare(first ? love : 0, feed);
    notify('pets', 'inventory');
    toast(first ? msg : `${msg} (hôm nay bạn đã làm rồi, bé vẫn vui lắm)`);
  });

  return (
    <Sheet title={`🐾 ${pet.name}`} onClose={onClose}>
      <div className="pet-card">
        <img src={petSprite(pet.kind, hours > 24 ? 'sleep' : 'sit').url} className="px-img pet-big" alt="" />
        <div>
          {rename === null
            ? <b>{pet.name} <button className="link" onClick={() => setRename(pet.name)}>đổi tên</button></b>
            : <form className="row" onSubmit={async e => { e.preventDefault(); if (rename.trim() && await act(() => api.renamePet(rename.trim()))) { notify('pets'); setRename(null); } }}>
              <input value={rename} maxLength={20} onChange={e => setRename(e.target.value)} /><button className="btn small">Lưu</button>
            </form>}
          <p>{'💗'.repeat(Math.min(5, level))}{'🤍'.repeat(Math.max(0, 5 - level))} <small className="muted">thân thiết cấp {level} · {pet.love} điểm</small></p>
          <p>{hunger}</p>
          <p className="muted small-note">Về nhà được {Math.max(1, diffDays(pet.adopted_at.slice(0, 10), date) + 1)} ngày</p>
        </div>
      </div>
      <div className="row wrap">
        <button className="btn small" disabled={!have('pet_food')} onClick={() => care('pet:feed', 2, true, `🥫 ${pet.name} ăn ngon lành!`, 'pet_food')}>🥫 Cho ăn ({have('pet_food')})</button>
        <button className="btn small ghost" disabled={!have('pet_treat')} onClick={() => care(null, 1, false, `🍖 ${pet.name} vẫy đuôi rối rít`, 'pet_treat')}>🍖 Bánh thưởng ({have('pet_treat')})</button>
        <button className="btn small ghost" onClick={() => care('pet:pat', 1, false, `🤲 ${pet.name} lim dim vì sướng 💕`)}>🤲 Vuốt ve</button>
        <button className="btn small ghost" onClick={() => care('pet:play', 1, false, `🎾 ${pet.name} chạy theo bóng hớn hở`)}>🎾 Chơi bóng</button>
        <button className={`btn small ${walking ? '' : 'ghost'}`} disabled={partnerWalking} onClick={() => { onWalk(); onClose(); }}>
          {walking ? '🏠 Đưa bé về nhà' : partnerWalking ? `🦮 ${partnerName} đang dắt bé` : '🦮 Dắt đi dạo'}
        </button>
      </div>
      <p className="muted small-note">Dắt bé đi dạo ngoài trời một lúc, bé có thể đánh hơi ra đồ hay ho. Hết pate thì mua ở cửa hàng (mục 🐾 Thú cưng).</p>
      {!have('pet_food') && <p className="muted small-note">Trong túi hết {item('pet_food').name} rồi.</p>}
    </Sheet>
  );
}

// ───────── Đọc sách cùng nhau ─────────

export function BookSheet({ book, page, onPage, onPick, onClose, partnerHere }: { book: number | null; page: number; onPage: (p: number) => void; onPick: (b: number) => void; onClose: () => void; partnerHere: boolean }) {
  const b = book === null ? null : content.books[book];
  return (
    <Sheet title={b ? `${b.icon} ${b.title}` : '📚 Kệ sách của quán'} onClose={onClose}>
      {!b ? (
        <>
          <p className="muted">{partnerHere ? 'Chọn một cuốn — hai bạn sẽ cùng lật từng trang.' : 'Chọn một cuốn để đọc. Khi người ấy ở quán, cả hai sẽ cùng lật trang.'}</p>
          <ul className="places">
            {content.books.map((x, i) => (
              <li key={x.title}><span className="place-icon">{x.icon}</span><div><b>{x.title}</b><p className="muted">{x.pages.length} trang</p></div>
                <button className="btn small" onClick={() => onPick(i)}>Đọc</button></li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <div className="book-page"><p>{b.pages[page]}</p><small>— {page + 1} / {b.pages.length} —</small></div>
          <div className="row">
            <button className="btn small ghost" disabled={page === 0} onClick={() => onPage(page - 1)}>‹ Trang trước</button>
            <button className="btn small" disabled={page >= b.pages.length - 1} onClick={() => onPage(page + 1)}>Trang sau ›</button>
          </div>
        </>
      )}
    </Sheet>
  );
}

export const nextYearly = (today: string, md: string) => {
  const y = +today.slice(0, 4);
  const d = `${y}-${md}`;
  return d >= today ? d : `${y + 1}-${md}`;
};
export { addDays };
