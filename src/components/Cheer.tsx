// Góc cổ vũ người ấy: mở các màn lộng lẫy, quản lý ảnh cho show drone, hũ sao động viên (mỗi ngày mở một ngôi sao).
import { useEffect, useRef, useState } from 'react';
import * as api from '../lib/api';
import { notify } from '../lib/realtime';
import { toast, toastError } from '../lib/toast';
import { Sheet } from './Sheet';
import { picLayout, samplePic } from './duoCheer';

const run = async (f: () => Promise<unknown>) => { try { await f(); return true; } catch (e) { toastError(e); return false; } };
const MAX_PICS = 6;
const ACTS: [string, string][] = [
  ['greet', '💐 Tặng hoa & quà hôm nay'], ['drone', '🛸 Show đèn drone'], ['bubble', '🫧 Bong bóng xả stress'], ['fort', '🛋️ Đêm pháo đài gối'],
  ['tiny', '🔦 Thu nhỏ phiêu lưu vườn'], ['galaxy', '🚂 Chuyến tàu ngân hà'], ['candy', '🍭 Xứ bánh kẹo trên mây'],
];
const go = (k: string, close: () => void) => { close(); window.dispatchEvent(new CustomEvent('duo-start', { detail: k })); };

/** ảnh → thu nhỏ (cạnh dài tối đa 520px, giữ tỉ lệ, không cắt) → JPEG */
async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const im = await new Promise<HTMLImageElement>((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = url; });
    const k = Math.min(1, 480 / Math.max(im.width, im.height)), cv = document.createElement('canvas');
    cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k);
    const c = cv.getContext('2d')!; c.imageSmoothingQuality = 'high'; c.drawImage(im, 0, 0, cv.width, cv.height);
    for (const q of [0.85, 0.75, 0.65]) { const u = cv.toDataURL('image/jpeg', q); if (u.length < 110000) return u; }
    return cv.toDataURL('image/jpeg', 0.55);
  } finally { URL.revokeObjectURL(url); }
}

/** xem trước ảnh bằng chấm đèn drone (đúng số chấm sẽ bay trong show) */
function DotPreview({ src, w = 150 }: { src: string; w?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const im = new Image(); im.onload = () => {
      const cv = ref.current; if (!cv) return;
      const L = picLayout(im.width, im.height, 0, 0, 1000, 1000), sc = w / L.w, h = L.h * sc, Z = 2;
      cv.width = w * Z; cv.height = h * Z; cv.style.width = `${w}px`; cv.style.height = `${h}px`;
      const c = cv.getContext('2d')!; c.setTransform(Z, 0, 0, Z, 0, 0); c.fillStyle = '#05081e'; c.fillRect(0, 0, w, h);
      const pts = samplePic(im, { ...L, x0: -L.w / 2, y0: -L.h / 2 });
      c.globalCompositeOperation = 'lighter';
      for (const [x, y, col] of pts) { c.fillStyle = col; c.beginPath(); c.arc((x + L.w / 2) * sc, (y + L.h / 2) * sc, L.step * sc * 0.42, 0, Math.PI * 2); c.fill(); }
    };
    im.src = src;
  }, [src, w]);
  return <canvas ref={ref} style={{ borderRadius: 6, display: 'block' }} />;
}

function DronePhotos({ me, pics }: { me: api.Profile; pics: api.Memory[] }) {
  const [draft, setDraft] = useState<string | null>(null);
  const [view, setView] = useState<'dots' | 'photo'>('dots');
  const pick = (e: React.ChangeEvent<HTMLInputElement>) => { const fl = e.target.files?.[0]; e.target.value = ''; if (fl) void run(async () => setDraft(await shrink(fl))); };
  const save = () => run(async () => { if (!draft) return; await api.addMemory(me, 'dronepic', { img: draft }); notify('memories'); setDraft(null); toast('🛸 Đã thêm ảnh vào show drone'); });
  const del = (id: string) => { if (confirm('Bỏ ảnh này khỏi show drone?')) void run(async () => { await api.delMemory(id); notify('memories'); }); };
  return (
    <>
      <h4>📸 Ảnh cho show drone ({pics.length}/{MAX_PICS})</h4>
      <p className="muted small-note">Drone xếp lại từng ảnh bằng ~4200 chấm đèn, rồi ảnh thật hiện lên trong khung sáng — giữ nguyên tỉ lệ, không cắt. Ảnh chỉ lưu riêng cho hai đứa.</p>
      <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
        {pics.map(p => (
          <div key={p.id} style={{ position: 'relative' }}>
            {view === 'dots' ? <DotPreview src={p.data.img} w={96} /> : <img src={p.data.img} alt="" style={{ width: 96, borderRadius: 6, display: 'block' }} />}
            {p.user_id === me.id && <button className="btn small ghost" style={{ position: 'absolute', top: 2, right: 2, padding: '0 6px' }} onClick={() => del(p.id)}>✖</button>}
          </div>
        ))}
      </div>
      <div className="row" style={{ gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
        {pics.length < MAX_PICS && <label className="btn small">➕ Thêm ảnh<input type="file" accept="image/*" hidden onChange={pick} /></label>}
        {pics.length > 0 && <button className="btn small ghost" onClick={() => setView(v => (v === 'dots' ? 'photo' : 'dots'))}>{view === 'dots' ? '🖼️ Xem ảnh gốc' : '✨ Xem bằng đèn'}</button>}
      </div>
      {draft && (
        <div className="card" style={{ marginTop: 8, padding: 8 }}>
          <p className="small-note">Drone sẽ xếp thành thế này:</p>
          <div className="row" style={{ gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <DotPreview src={draft} w={160} />
            <img src={draft} alt="" style={{ width: 160, borderRadius: 6 }} />
          </div>
          <div className="row" style={{ gap: 6, marginTop: 6 }}><button className="btn small" onClick={() => void save()}>✅ Thêm vào show</button><button className="btn small ghost" onClick={() => setDraft(null)}>Thôi</button></div>
        </div>
      )}
    </>
  );
}

const MSG_IDEAS = ['EM GIỎI LẮM! / CỐ LÊN NHA 💗', 'ANH THƯƠNG EM / NHIỀU LẮM', 'TỰ HÀO VỀ EM ✨', 'EM VẤT VẢ RỒI / NGHỈ NGƠI NHA', 'MÃI BÊN NHAU 💗', 'CÔNG CHÚA CỦA ANH 👑'];
const pretty = (m: string) => m.replace(/ ?\/ ?/g, ' · ');
/** lời nhắn drone xếp chữ trên trời (dùng "/" để xuống dòng) */
function DroneMsg({ me, mems }: { me: api.Profile; mems: api.Memory[] }) {
  const cur = mems.find(m => m.kind === 'dronemsg');
  const [text, setText] = useState<string>(cur?.data?.text ?? '');
  const save = (v: string) => run(async () => { const t = v.trim().slice(0, 80); if (!t) return; await api.addMemory(me, 'dronemsg', { text: t }); notify('memories'); setText(t); toast('🛸 Drone sẽ xếp chữ: ' + pretty(t)); });
  return (
    <>
      <h4>💬 Lời nhắn drone xếp trên trời</h4>
      <p className="muted small-note">Đang dùng: <b>{pretty(cur?.data?.text ?? 'EM GIỎI LẮM! / CỐ LÊN NHA 💗')}</b> — gõ dấu “/” để xuống dòng; lời dài sẽ được drone xếp lần lượt từng cụm (tối đa ~80 chữ). Lúc đang xem vẫn đổi được bằng nút “Lời cho drone”.</p>
      <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>{MSG_IDEAS.map(m => <button key={m} className="btn small ghost" onClick={() => void save(m)}>{pretty(m)}</button>)}</div>
      <div className="row" style={{ gap: 6, marginTop: 6 }}><input value={text} maxLength={80} onChange={e => setText(e.target.value)} placeholder="Tự viết lời nhắn…" style={{ flex: 1 }} /><button className="btn small" disabled={!text.trim()} onClick={() => void save(text)}>Lưu</button></div>
    </>
  );
}

/** hũ sao: viết nhiều lời động viên, người ấy mỗi ngày mở một ngôi sao */
function StarJar({ me, partner, mems, today }: { me: api.Profile; partner: api.Profile | null; mems: api.Memory[]; today: string }) {
  const [text, setText] = useState('');
  const [opened, setOpened] = useState<string[]>([]);
  const [show, setShow] = useState<string | null>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  useEffect(() => { void api.loadClaimKeys([me.id], 'star:').then(r => setOpened(r.map(x => x.key))).catch(() => {}); }, [me.id]);
  const mine = mems.filter(m => m.kind === 'star' && m.data.to === me.id);
  const ready = mine.filter(m => m.day <= today && !opened.includes(`star:${m.id}`)).sort((a, b) => (a.day < b.day ? -1 : 1));
  const waiting = mine.filter(m => !opened.includes(`star:${m.id}`)).length;
  const sent = partner ? mems.filter(m => m.kind === 'star' && m.data.to === partner.id) : [];
  // vẽ hũ thuỷ tinh với các ngôi sao giấy (số sao = số sao còn chờ mở)
  useEffect(() => {
    const c = cv.current?.getContext('2d'); if (!c) return; const Z = 3; c.setTransform(Z, 0, 0, Z, 0, 0); c.clearRect(0, 0, 90, 100);
    c.fillStyle = '#c8e8ff40'; c.strokeStyle = '#a8d0f0'; c.lineWidth = 1.5; c.beginPath(); c.roundRect(15, 22, 60, 72, 12); c.fill(); c.stroke();
    c.fillStyle = '#c88a5a'; c.fillRect(22, 12, 46, 10); c.fillStyle = '#e8b07a'; c.fillRect(22, 12, 46, 3);
    c.fillStyle = '#ff8ab0'; c.fillRect(20, 21, 50, 3);
    const cols = ['#ffd24a', '#ff8ab0', '#8ad8ff', '#b88aff', '#7aff9a', '#ffa860'];
    for (let i = 0; i < Math.min(waiting, 40); i++) { const x = 24 + ((i * 37) % 42), y = 88 - Math.floor(i / 6) * 8 - ((i * 13) % 5), r = 4;
      c.fillStyle = cols[i % cols.length]; c.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5 + i, rr = k % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.fill(); }
    c.fillStyle = '#ffffff70'; c.fillRect(20, 30, 4, 50);
  }, [waiting]);
  const add = () => run(async () => {
    if (!partner) return; const lines = text.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 60); if (!lines.length) return;
    const last = sent.map(m => m.day).sort().pop(); const d = new Date(`${!last || last < today ? today : last}T12:00:00`); if (last && last >= today) d.setDate(d.getDate() + 1);
    for (const l of lines) { await api.addMemory(me, 'star', { text: l.slice(0, 200), to: partner.id }, d.toLocaleDateString('sv')); d.setDate(d.getDate() + 1); }
    notify('memories'); setText(''); toast(`⭐ Đã gấp ${lines.length} ngôi sao vào hũ — mỗi ngày người ấy mở được một ngôi sao`);
  });
  const open = () => run(async () => { const s = ready[0]; if (!s) return; await api.claim(`star:${s.id}`); setOpened(o => [...o, `star:${s.id}`]); setShow(s.data.text); notify('claims'); });
  return (
    <>
      <h4>⭐ Hũ sao động viên</h4>
      <div className="row" style={{ gap: 10, alignItems: 'center' }}>
        <canvas ref={cv} width={270} height={300} style={{ width: 90, height: 100 }} />
        <div>
          <p className="small-note">{ready.length ? `Hôm nay có ${ready.length > 1 ? `${ready.length} ngôi sao` : 'một ngôi sao'} chờ bạn mở 💗` : waiting ? `Còn ${waiting} ngôi sao — mai mở tiếp nha` : 'Hũ đang trống, chờ người ấy gấp sao nhé'}</p>
          {ready.length > 0 && <button className="btn small" onClick={() => void open()}>✨ Mở ngôi sao hôm nay</button>}
        </div>
      </div>
      {show && (
        <div className="star-open" onClick={() => setShow(null)}>
          <div className="star-fly" />
          <div className="star-card"><p>{show}</p><small className="muted">bấm để đóng</small></div>
        </div>
      )}
      {partner && (<>
        <p className="muted small-note" style={{ marginTop: 8 }}>Gấp sao cho người ấy — mỗi dòng là một ngôi sao, mỗi ngày mở một ngôi (đã gấp {sent.length}):</p>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={4} placeholder={'Hôm nay em làm tốt lắm\nNhớ uống nước nha\nCuối tuần mình đi ăn lẩu nhé'} style={{ width: '100%' }} />
        <button className="btn small" disabled={!text.trim()} onClick={() => void add()}>⭐ Gấp vào hũ</button>
      </>)}
    </>
  );
}

export function CheerSheet({ me, partner, mems, pics, today, onClose }: { me: api.Profile; partner: api.Profile | null; mems: api.Memory[]; pics: api.Memory[]; today: string; onClose: () => void }) {
  return (
    <Sheet title="💝 Cổ vũ người ấy" onClose={onClose}>
      <h4>✨ Cùng xem những màn lộng lẫy</h4>
      <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
        {ACTS.map(([k, l]) => <button key={k} className="btn small" onClick={() => go(k, onClose)}>{l}</button>)}
      </div>
      <DronePhotos me={me} pics={pics} />
      <DroneMsg me={me} mems={mems} />
      <StarJar me={me} partner={partner} mems={mems} today={today} />
    </Sheet>
  );
}
