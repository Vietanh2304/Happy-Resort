import { useEffect, useRef, useState } from 'react';
import * as api from '../lib/api';
import { item } from '../lib/content';
import { addDays, diffDays } from '../lib/festivals';
import { notify } from '../lib/realtime';
import { toast, toastError } from '../lib/toast';
import { Sheet } from './Sheet';

interface Props {
  me: api.Profile;
  partner: api.Profile | null;
  notes: api.Note[];
  capsules: api.Capsule[];
  today: string;
  meetupDay: string | null;
  anniversary: string | null;
  onClose: () => void;
}
const fmt = (d: string) => `${+d.slice(8, 10)}/${+d.slice(5, 7)}/${d.slice(0, 4)}`;
const nextYearly = (today: string, md: string) => (`${today.slice(0, 4)}-${md}` > today ? `${today.slice(0, 4)}-${md}` : `${+today.slice(0, 4) + 1}-${md}`);

export function Mailbox({ me, partner, notes, capsules, today, meetupDay, anniversary, onClose }: Props) {
  const ready = capsules.filter(c => c.to_id === me.id && !c.opened_at && c.body !== null).length;
  const [tab, setTab] = useState<'notes' | 'capsule'>(ready ? 'capsule' : 'notes');
  return (
    <Sheet title="📮 Hòm thư" onClose={onClose}>
      <div className="tabs">
        <button className={tab === 'notes' ? 'active' : ''} onClick={() => setTab('notes')}>✉️ Thư thường</button>
        <button className={tab === 'capsule' ? 'active' : ''} onClick={() => setTab('capsule')}>⏳ Thư hẹn giờ{ready ? ` (${ready})` : ''}</button>
      </div>
      {tab === 'notes'
        ? <Notes me={me} partner={partner} notes={notes} />
        : <Capsules me={me} partner={partner} capsules={capsules} today={today} meetupDay={meetupDay} anniversary={anniversary} />}
    </Sheet>
  );
}

function Notes({ me, partner, notes }: { me: api.Profile; partner: api.Profile | null; notes: api.Note[] }) {
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const unread = notes.some(n => n.to_id === me.id && !n.read_at);

  // Mở hòm thư là đã đọc
  useEffect(() => {
    if (unread) api.markNotesRead(me).then(() => notify('notes'), console.error);
  }, [unread, me]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!partner || !body.trim()) return;
    setBusy(true);
    try {
      await api.sendNote(me, partner.id, body.trim());
      setBody('');
      notify('notes');
    } catch (err) {
      toastError(err);
    }
    setBusy(false);
  }

  return (
    <>
      {partner ? (
        <form className="stack" onSubmit={send}>
          <textarea rows={3} maxLength={300} value={body} onChange={e => setBody(e.target.value)} placeholder={`Viết vài dòng cho ${partner.display_name || 'người ấy'}…`} />
          <button className="btn" disabled={busy || !body.trim()}>Thả vào hòm thư bên kia ✉️</button>
          <VoiceRecorder me={me} partner={partner} />
        </form>
      ) : (
        <p className="muted">Khi người ấy vào resort, hai bạn có thể gửi thư cho nhau.</p>
      )}
      <ul className="notes">
        {notes.length === 0 && <li className="muted">Chưa có lá thư nào.</li>}
        {notes.map(n => (
          <li key={n.id} className={n.from_id === me.id ? 'from-me' : 'from-them'}>
            {n.gift_item && <span className="gift-tag">🎁 Kèm quà: {item(n.gift_item).icon} {item(n.gift_item).name}</span>}
            {n.voice_path ? <VoicePlay path={n.voice_path} secs={n.voice_secs ?? 0} /> : <p>{n.body}</p>}
            <small>{new Date(n.created_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</small>
          </li>
        ))}
      </ul>
    </>
  );
}

function Capsules({ me, partner, capsules, today, meetupDay, anniversary }: { me: api.Profile; partner: api.Profile | null; capsules: api.Capsule[]; today: string; meetupDay: string | null; anniversary: string | null }) {
  const [body, setBody] = useState('');
  const [day, setDay] = useState(addDays(today, 7));
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState<api.Capsule | null>(null);
  const pname = partner?.display_name ?? 'người ấy';
  const presets: [string, string][] = [
    ['1 tuần nữa', addDays(today, 7)], ['1 tháng nữa', addDays(today, 30)], ['100 ngày nữa', addDays(today, 100)], ['1 năm nữa', addDays(today, 365)],
    ...(meetupDay && meetupDay > today ? [['✈️ Ngày gặp nhau', meetupDay] as [string, string]] : []),
    ...(partner?.birthday ? [[`🎂 Sinh nhật ${pname}`, nextYearly(today, partner.birthday.slice(5))] as [string, string]] : []),
    ...(anniversary ? [['💍 Ngày kỷ niệm', nextYearly(today, anniversary.slice(5))] as [string, string]] : []),
  ];

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!partner || !body.trim() || day <= today) return;
    setBusy(true);
    try {
      await api.sendCapsule(me, partner.id, body.trim(), day);
      setBody('');
      notify('capsules');
      toast(`⏳ Đã niêm phong — ${pname} sẽ mở được vào ${fmt(day)}`);
    } catch (err) { toastError(err); }
    setBusy(false);
  }
  async function open(c: api.Capsule) {
    setReading(c);
    if (!c.opened_at && c.to_id === me.id) { await api.openCapsule(c.id).catch(console.error); notify('capsules'); }
  }

  const received = capsules.filter(c => c.to_id === me.id);
  const sent = capsules.filter(c => c.from_id === me.id);
  return (
    <>
      {partner ? (
        <form className="stack" onSubmit={send}>
          <textarea rows={4} maxLength={2000} value={body} onChange={e => setBody(e.target.value)} placeholder={`Viết một lá thư cho ${pname} của tương lai… Lá thư sẽ bị khóa tới đúng ngày hẹn.`} />
          <div className="chips left">{presets.map(([l, d]) => <button type="button" key={l} className={`chip ${day === d ? 'active' : ''}`} onClick={() => setDay(d)}>{l}</button>)}</div>
          <label className="row"><span>Mở vào ngày</span><input type="date" value={day} min={addDays(today, 1)} onChange={e => setDay(e.target.value)} /></label>
          <button className="btn" disabled={busy || !body.trim() || day <= today}>🔒 Niêm phong và gửi</button>
        </form>
      ) : <p className="muted">Khi người ấy vào resort, hai bạn có thể gửi thư hẹn giờ cho nhau.</p>}

      <h3 className="mini-h">📥 Thư gửi bạn</h3>
      <ul className="capsules">
        {received.length === 0 && <li className="muted">Chưa có thư hẹn giờ nào.</li>}
        {received.map(c => c.body === null ? (
          <li key={c.id} className="sealed">🔒 Thư từ {pname} · mở vào <b>{fmt(c.open_on)}</b> <small>(còn {diffDays(today, c.open_on)} ngày)</small></li>
        ) : (
          <li key={c.id} className={c.opened_at ? 'opened' : 'ready'}>
            {c.opened_at ? '💌' : '✨💌'} Thư từ {pname} viết ngày {fmt(c.created_at.slice(0, 10))}
            <button className="btn small" onClick={() => open(c)}>{c.opened_at ? 'Đọc lại' : 'Mở thư'}</button>
          </li>
        ))}
      </ul>
      <h3 className="mini-h">📤 Thư bạn đã gửi</h3>
      <ul className="capsules">
        {sent.length === 0 && <li className="muted">Bạn chưa gửi thư hẹn giờ nào.</li>}
        {sent.map(c => (
          <li key={c.id} className="sent">
            {c.opened_at ? `💞 ${pname} đã mở` : c.open_on <= today ? '📬 Đã tới ngày, chờ mở' : `🔒 Mở vào ${fmt(c.open_on)}`}
            <button className="link" onClick={() => setReading(c)}>xem</button>
          </li>
        ))}
      </ul>
      {reading && (
        <Sheet title="💌 Thư hẹn giờ" onClose={() => setReading(null)}>
          <div className="letter">
            <p>{reading.body}</p>
            <small>— {reading.from_id === me.id ? 'Bạn' : pname}, viết ngày {fmt(reading.created_at.slice(0, 10))}, hẹn mở {fmt(reading.open_on)}</small>
          </div>
        </Sheet>
      )}
    </>
  );
}

// ───────── Tin nhắn thoại ─────────

const MAX_SECS = 60;
function VoiceRecorder({ me, partner }: { me: api.Profile; partner: api.Profile }) {
  const [recording, setRecording] = useState(false);
  const [secs, setSecs] = useState(0);
  const [clip, setClip] = useState<{ blob: Blob; url: string; secs: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const rec = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); rec.current?.stream.getTracks().forEach(t => t.stop()); }, []);

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') return toast('🎙️ Trình duyệt chưa ghi âm được (cần https hoặc localhost)');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const type = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg'].find(t => MediaRecorder.isTypeSupported(t));
      const r = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      const chunks: Blob[] = [];
      const t0 = Date.now();
      r.ondataavailable = e => e.data.size && chunks.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: r.mimeType || 'audio/webm' });
        setClip({ blob, url: URL.createObjectURL(blob), secs: Math.max(1, Math.round((Date.now() - t0) / 1000)) });
      };
      r.start();
      rec.current = r;
      setRecording(true); setSecs(0); setClip(null);
      timer.current = setInterval(() => setSecs(v => v + 1), 1000);
    } catch {
      toast('🎙️ Chưa ghi âm được: cần cho phép trình duyệt dùng micro');
    }
  }
  function stop() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (rec.current?.state === 'recording') rec.current.stop();
    setRecording(false);
  }
  useEffect(() => { if (recording && secs >= MAX_SECS) stop(); }, [secs]); // eslint-disable-line react-hooks/exhaustive-deps
  async function send() {
    if (!clip) return;
    setBusy(true);
    try {
      await api.sendVoice(me, partner.id, clip.blob, clip.secs);
      notify('notes');
      toast('🎙️ Đã gửi tin nhắn thoại');
      setClip(null);
    } catch (e) { toastError(e); }
    setBusy(false);
  }
  return (
    <div className="voice-rec">
      {recording ? (
        <button type="button" className="btn small rec-on" onClick={stop}>⏹ Dừng ({secs}s / {MAX_SECS}s)</button>
      ) : clip ? (
        <>
          <audio src={clip.url} controls />
          <button type="button" className="btn small" disabled={busy} onClick={send}>📨 Gửi lời nhắn</button>
          <button type="button" className="btn small ghost" onClick={() => setClip(null)}>Ghi lại</button>
        </>
      ) : (
        <button type="button" className="btn small ghost" onClick={start}>🎙️ Ghi âm lời nhắn (tối đa {MAX_SECS} giây)</button>
      )}
    </div>
  );
}

function VoicePlay({ path, secs }: { path: string; secs: number }) {
  const [url, setUrl] = useState<string | null>(null);
  return url ? <audio src={url} controls autoPlay /> : (
    <button className="btn small ghost voice-play" onClick={async () => {
      try { const u = (await api.fileUrls([path]))[path]; if (u) setUrl(u); else toast('Không mở được ghi âm'); } catch (e) { toastError(e); }
    }}>▶️ Nghe lời nhắn ({secs} giây)</button>
  );
}
