// Bài hát của tụi mình: file nhạc và lời lưu trong kho riêng của cặp đôi (Supabase), không nằm trong repo.
// Phát thì tạm tắt nhạc nền lo-fi; có thể phát cho cả hai cùng nghe.
import { useEffect, useRef, useState } from 'react';
import * as api from '../lib/api';
import { notify, sendEvent } from '../lib/realtime';
import { toast, toastError } from '../lib/toast';
import { Sheet } from './Sheet';

export interface Song { id: string; title: string; path: string; lyrics: string; by: string }
export const songsOf = (mems: api.Memory[]): Song[] =>
  mems.filter(m => m.kind === 'song' && m.data?.path).map(m => ({ id: m.id, title: m.data.title || 'Bài hát', path: m.data.path, lyrics: m.data.lyrics || '', by: m.user_id }));

const SECTION = /^\[(intro|verse|pre-?chorus|chorus|final chorus|bridge|outro|breakdown|instrumental break|hook|post-?chorus)[^\]]*\]$/i;
/** Bỏ các tag gợi ý phong cách (Suno), giữ tên đoạn làm tiêu đề nhỏ */
export function lyricLines(text: string) {
  return text.split(/\r?\n/).map(l => l.trim()).filter(l => l && !/^\[end\]$/i.test(l))
    .flatMap(l => (l.startsWith('[') ? (SECTION.test(l) && !/instrumental/i.test(l) ? [{ head: true, text: l.slice(1, -1) }] : []) : [{ head: false, text: l }]));
}

/** Một trình phát dùng chung cho cả game (để mở sheet khác nhạc vẫn chạy) */
export const songPlayer = new Audio();
songPlayer.preload = 'auto';

export function SongSheet({ me, partnerName, songs, playing, onPlay, onStop, onClose }: {
  me: api.Profile; partnerName: string; songs: Song[];
  playing: string | null; onPlay: (s: Song, together: boolean) => void; onStop: () => void; onClose: () => void;
}) {
  const [adding, setAdding] = useState(songs.length === 0);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(playing ?? songs[0]?.id ?? null);
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick(x => x + 1), 500); return () => clearInterval(t); }, []);
  const cur = songs.find(s => s.id === open);

  async function save() {
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) return toast('File lớn quá (tối đa 30 MB) — xuất MP3 cho nhẹ nhé');
    setBusy(true);
    try {
      const id = await api.addSong(me, file, title.trim() || file.name.replace(/\.[^.]+$/, ''), lyrics.trim());
      notify('memories'); toast('💿 Đã cất bài hát vào kho riêng của hai đứa');
      setAdding(false); setFile(null); setTitle(''); setLyrics(''); if (id) setOpen(id);
    } catch (e) { toastError(e); }
    setBusy(false);
  }
  async function remove(s: Song) {
    if (!confirm(`Xoá bài "${s.title}"?`)) return;
    try { if (playing === s.id) onStop(); await api.deleteSong(s.id, s.path); notify('memories'); toast('Đã xoá bài hát'); }
    catch (e) { toastError(e); }
  }
  const t = songPlayer.currentTime, d = songPlayer.duration || 0;
  const fmt = (x: number) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`;

  return (
    <Sheet title="💿 Bài hát của tụi mình" onClose={onClose}>
      {songs.length > 0 && (
        <div className="song-list">
          {songs.map(s => (
            <div key={s.id} className={`song-row ${open === s.id ? 'on' : ''}`} onClick={() => setOpen(s.id)}>
              <b>{playing === s.id ? '🔊' : '🎵'} {s.title}</b>
              <span className="row">
                {playing === s.id
                  ? <button className="btn small" onClick={e => { e.stopPropagation(); onStop(); }}>⏸ Dừng</button>
                  : <>
                    <button className="btn small" onClick={e => { e.stopPropagation(); setOpen(s.id); onPlay(s, false); }}>▶ Nghe</button>
                    <button className="btn small ghost" onClick={e => { e.stopPropagation(); setOpen(s.id); onPlay(s, true); }}>💞 Cùng {partnerName} nghe</button>
                  </>}
                {s.by === me.id && <button className="btn small ghost" title="Xoá" onClick={e => { e.stopPropagation(); void remove(s); }}>🗑️</button>}
              </span>
            </div>
          ))}
        </div>
      )}
      {cur && playing === cur.id && d > 0 && (
        <div className="song-seek">
          <small>{fmt(t)}</small>
          <input type="range" min={0} max={d} step={0.5} value={t} aria-label="Tua bài hát" onChange={e => { songPlayer.currentTime = Number(e.target.value); }} />
          <small>{fmt(d)}</small>
        </div>
      )}
      {cur && cur.lyrics && (
        <div className="song-lyrics">
          {lyricLines(cur.lyrics).map((l, i) => (l.head ? <h5 key={i}>{l.text}</h5> : <p key={i}>{l.text}</p>))}
        </div>
      )}
      {adding ? (
        <div className="song-add">
          <h4>➕ Thêm bài hát</h4>
          <input type="file" accept="audio/*,.mp3,.m4a,.wav" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          <input value={title} maxLength={60} onChange={e => setTitle(e.target.value)} placeholder="Tên bài hát" style={{ width: '100%' }} />
          <textarea value={lyrics} maxLength={2500} onChange={e => setLyrics(e.target.value)} rows={6} placeholder="Dán lời bài hát vào đây (không bắt buộc)" style={{ width: '100%' }} />
          <p className="muted small-note">File và lời chỉ lưu trong kho riêng của hai bạn.</p>
          <div className="row">
            <button className="btn" disabled={!file || busy} onClick={() => void save()}>{busy ? 'Đang tải lên…' : '💾 Lưu bài hát'}</button>
            {songs.length > 0 && <button className="btn ghost small" onClick={() => setAdding(false)}>Huỷ</button>}
          </div>
        </div>
      ) : <button className="btn small ghost" onClick={() => setAdding(true)}>➕ Thêm bài hát</button>}
    </Sheet>
  );
}

/** Điều khiển phát: tạm tắt lo-fi khi hát, bật lại khi xong; phát cùng nhau gửi sự kiện cho người ấy */
export function useSongPlayer(onLofi: (on: boolean) => void) {
  const [playing, setPlaying] = useState<string | null>(null);
  const lofiRef = useRef(onLofi); lofiRef.current = onLofi;
  useEffect(() => {
    const end = () => { setPlaying(null); lofiRef.current(true); };
    songPlayer.addEventListener('ended', end);
    return () => songPlayer.removeEventListener('ended', end);
  }, []);
  async function play(s: Song, together: boolean, at = 0) {
    try {
      const url = (await api.fileUrls([s.path]))[s.path];
      if (!url) throw new Error('Không mở được file bài hát');
      lofiRef.current(false);
      songPlayer.src = url; songPlayer.currentTime = at;
      await songPlayer.play();
      setPlaying(s.id);
      if (together) sendEvent('song-play', { id: s.id, start: Date.now() });
    } catch (e) { toastError(e); }
  }
  function stop(share = false) {
    songPlayer.pause(); setPlaying(null); lofiRef.current(true);
    if (share) sendEvent('song-stop', {});
  }
  return { playing, play, stop };
}
