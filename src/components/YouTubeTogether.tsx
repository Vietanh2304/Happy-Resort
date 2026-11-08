// Xem YouTube cùng nhau ở rạp phim: dán link, hai máy cùng phát một video, ai bấm phát/dừng/tua thì máy kia theo.
// Chạy trên mọi điện thoại (kể cả iPhone) vì mỗi máy tự phát video từ YouTube, chỉ đồng bộ thời điểm qua realtime.
import { useEffect, useRef } from 'react';

export interface YtState { id: string; playing: boolean; pos: number; at: number }

/** Lấy mã video từ link YouTube (watch?v=, youtu.be/, shorts/, embed/, live/) */
export function ytId(link: string): string | null {
  const s = link.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([\w-]{11})/);
  return m ? m[1] : null;
}
/** Vị trí (giây) mà video lẽ ra đang ở lúc này */
export const ytTarget = (y: YtState, now = Date.now()) => y.pos + (y.playing ? (now - y.at) / 1000 : 0);

export function YouTubeTogether({ yt, onChange, className = '' }: { yt: YtState; onChange: (v: YtState) => void; className?: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const cur = useRef({ time: 0, state: -1 });
  const commandedAt = useRef(0);
  const ytRef = useRef(yt);
  ytRef.current = yt;

  const cmd = (func: string, args: unknown[] = []) => {
    frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
  };
  const apply = () => {
    const y = ytRef.current;
    commandedAt.current = Date.now();
    cmd('seekTo', [ytTarget(y), true]);
    cmd(y.playing ? 'playVideo' : 'pauseVideo');
  };

  // Nghe trạng thái từ trình phát YouTube (thời gian hiện tại, đang phát/dừng)
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (typeof e.data !== 'string' || !e.origin.includes('youtube')) return;
      try {
        const d = JSON.parse(e.data);
        const info = d.info ?? {};
        if (typeof info.currentTime === 'number') cur.current.time = info.currentTime;
        if (typeof info.playerState === 'number') {
          const prev = cur.current.state;
          cur.current.state = info.playerState;
          // Người xem tự bấm dừng/phát ngay trên khung YouTube → báo cho máy kia (bỏ qua lúc mình vừa ra lệnh)
          if (prev !== info.playerState && Date.now() - commandedAt.current > 1500) {
            const y = ytRef.current;
            if (info.playerState === 2 && y.playing) onChange({ ...y, playing: false, pos: cur.current.time, at: Date.now() });
            if (info.playerState === 1 && !y.playing) onChange({ ...y, playing: true, pos: cur.current.time, at: Date.now() });
          }
        }
        if (d.event === 'onReady') apply();
      } catch { /* tin không phải của YouTube */ }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Có lệnh mới (ai đó bấm phát/dừng/tua) → làm theo
  useEffect(() => { apply(); }, [yt.at, yt.playing, yt.pos]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lệch quá 2.5 giây so với máy kia thì tua lại cho khớp
  useEffect(() => {
    const t = setInterval(() => {
      const y = ytRef.current;
      if (Math.abs(cur.current.time - ytTarget(y)) > 2.5 && Date.now() - commandedAt.current > 3000) apply();
    }, 3000);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onLoad = () => {
    frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 'hy' }), '*');
    setTimeout(apply, 800);
  };
  const origin = encodeURIComponent(location.origin);
  return (
    <iframe ref={frame} className={`yt-frame ${className}`} title="YouTube" onLoad={onLoad}
      src={`https://www.youtube.com/embed/${yt.id}?enablejsapi=1&playsinline=1&rel=0&modestbranding=1&origin=${origin}`}
      allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen />
  );
}

/** Nút điều khiển chung (cả hai cùng thấy kết quả) */
export function YtControls({ yt, onChange }: { yt: YtState; onChange: (v: YtState | null) => void }) {
  const now = () => ytTarget(yt);
  const set = (patch: Partial<YtState>) => onChange({ ...yt, pos: now(), ...patch, at: Date.now() });
  return (
    <span className="yt-controls">
      <button className="btn small" onClick={() => set({ playing: !yt.playing })}>{yt.playing ? '⏸ Dừng' : '▶️ Phát'}</button>
      <button className="btn small ghost" onClick={() => set({ pos: Math.max(0, now() - 10) })}>⏪ 10s</button>
      <button className="btn small ghost" onClick={() => set({ pos: now() + 10 })}>⏩ 10s</button>
      <button className="btn small ghost" onClick={() => set({})} title="Đồng bộ lại hai máy">🔄</button>
      <button className="btn small ghost" onClick={() => onChange(null)}>⏹ Tắt</button>
    </span>
  );
}
