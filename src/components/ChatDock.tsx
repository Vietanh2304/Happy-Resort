// Khung chat chung: nút 💭 nổi ở góc (cả khi đang trong trò toàn màn hình), mở ra không che game.
// Tab 💬 Tin nhắn: lưu trong DB, người ấy offline vẫn đọc được khi vào. Tab 🔔 Thông báo: đọc lại các thông báo đã hiện.
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type * as api from '../lib/api';
import { notices, onNotices, type Notice } from '../lib/toast';

const hm = (d: Date) => d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
const dayLabel = (d: Date) => {
  const t = new Date(), y = new Date(Date.now() - 864e5);
  if (d.toDateString() === t.toDateString()) return 'Hôm nay';
  if (d.toDateString() === y.toDateString()) return 'Hôm qua';
  return d.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' });
};
const store = {
  get: (k: string) => { try { return Number(localStorage.getItem(k) ?? 0); } catch { return 0; } },
  set: (k: string, v: number) => { try { localStorage.setItem(k, String(v)); } catch { /* ẩn danh */ } },
};
const QUICK = ['❤️', '😘', '🥰', '😂', '🥺', 'Nhớ cậu 💕', 'Vào chơi không?', 'Ngủ ngon nha 🌙'];

export function ChatDock({ me, partnerName, messages: msgs, ready, onSend, onDelete }: {
  me: api.Profile; partnerName: string; messages: api.Message[] | null; ready: boolean;
  onSend: (text: string) => Promise<boolean>; onDelete: (m: api.Message) => void;
}) {
  const messages = msgs ?? [];   // null = chưa có bảng tin nhắn (chưa chạy 012_chat.sql)
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'chat' | 'notice'>('chat');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<Notice[]>(notices());
  useEffect(() => onNotices(setLog), []);
  const readKey = `hy:chatRead:${me.id}`, seenKey = `hy:noticeSeen:${me.id}`;
  const [readAt, setReadAt] = useState(() => store.get(readKey));
  const [seenAt, setSeenAt] = useState(() => store.get(seenKey));
  const unread = messages.filter(m => m.from_id !== me.id && Date.parse(m.created_at) > readAt).length;
  const newNotices = log.filter(n => n.at > seenAt).length;
  const listRef = useRef<HTMLDivElement>(null);

  // Đang mở tab nào thì coi như đã đọc tab đó
  const lastMsg = messages.length ? Date.parse(messages[messages.length - 1].created_at) : 0;
  const lastNotice = log.length ? log[log.length - 1].at : 0;
  useEffect(() => {
    if (!open) return;
    if (tab === 'chat' && lastMsg > readAt) { setReadAt(lastMsg); store.set(readKey, lastMsg); }
    if (tab === 'notice' && lastNotice > seenAt) { setSeenAt(lastNotice); store.set(seenKey, lastNotice); }
  }, [open, tab, lastMsg, lastNotice]); // eslint-disable-line react-hooks/exhaustive-deps
  // Tin mới → cuộn xuống cuối
  useEffect(() => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; }, [open, tab, messages.length, log.length]);

  const send = async (t = text) => {
    const body = t.trim().slice(0, 500);
    if (!body || busy) return;
    setBusy(true);
    if (await onSend(body)) setText('');
    setBusy(false);
  };

  const rows = useMemo(() => {
    const out: ({ day: string } | { m: api.Message })[] = [];
    let last = '';
    for (const m of messages) {
      const d = dayLabel(new Date(m.created_at));
      if (d !== last) { out.push({ day: d }); last = d; }
      out.push({ m });
    }
    return out;
  }, [messages]);

  const badge = unread;
  return createPortal(
    <>
      <button className={`chat-fab ${unread ? 'ping' : ''}`} onClick={() => setOpen(o => !o)} title={open ? 'Đóng khung chat' : 'Nhắn tin & thông báo'} aria-label="Nhắn tin">
        💭{!!badge && <i className="badge">{badge}</i>}{!badge && newNotices > 0 && <i className="badge dot" />}
      </button>
      {open && (
        <div className="chat-dock" role="dialog" aria-label="Khung chat">
          <div className="chat-tabs">
            <button className={tab === 'chat' ? 'active' : ''} onClick={() => setTab('chat')}>💬 Tin nhắn{unread ? ` (${unread})` : ''}</button>
            <button className={tab === 'notice' ? 'active' : ''} onClick={() => setTab('notice')}>🔔 Thông báo{newNotices ? ` (${newNotices})` : ''}</button>
            <button className="chat-x" onClick={() => setOpen(false)} aria-label="Đóng">✕</button>
          </div>
          <div className="chat-list" ref={listRef}>
            {tab === 'chat' ? (
              <>
                {!ready && <p className="muted chat-empty">Đang tải tin nhắn…</p>}
                {ready && msgs === null && <p className="muted chat-empty">⚠️ Chưa bật lưu tin nhắn: chạy file <b>012_chat.sql</b> trong Supabase. Tạm thời tin nhắn chỉ hiện khi người ấy đang online.</p>}
                {ready && msgs !== null && !messages.length && <p className="muted chat-empty">Chưa có tin nào. Nhắn {partnerName} một câu đi 💕<br /><small>Người ấy chưa online vẫn đọc được khi vào.</small></p>}
                {rows.map((r, i) => 'day' in r
                  ? <div key={`d${i}`} className="chat-day">{r.day}</div>
                  : (
                    <div key={r.m.id} className={`chat-msg ${r.m.from_id === me.id ? 'me' : 'them'}`}
                      onDoubleClick={() => r.m.from_id === me.id && confirm('Thu hồi tin nhắn này?') && onDelete(r.m)}
                      title={r.m.from_id === me.id ? 'Chạm đúp để thu hồi' : undefined}>
                      <span>{r.m.body}</span><small>{hm(new Date(r.m.created_at))}</small>
                    </div>
                  ))}
              </>
            ) : (
              <>
                {!log.length && <p className="muted chat-empty">Chưa có thông báo nào.</p>}
                {log.map((n, i) => <div key={`${n.at}${i}`} className={`chat-notice ${n.at > seenAt ? 'new' : ''}`}><span>{n.msg}</span><small>{dayLabel(new Date(n.at)) === 'Hôm nay' ? hm(new Date(n.at)) : `${dayLabel(new Date(n.at))} ${hm(new Date(n.at))}`}</small></div>)}
              </>
            )}
          </div>
          {tab === 'chat' && (
            <>
              <div className="chat-quick">{QUICK.map(q => <button key={q} className="chip" disabled={busy} onClick={() => send(q)}>{q}</button>)}</div>
              <form className="chat-input" onSubmit={e => { e.preventDefault(); void send(); }}>
                <input value={text} maxLength={500} onChange={e => setText(e.target.value)} placeholder={`Nhắn ${partnerName}…`} enterKeyHint="send" />
                <button className="btn small" disabled={busy || !text.trim()}>Gửi</button>
              </form>
            </>
          )}
        </div>
      )}
    </>,
    document.body,
  );
}
