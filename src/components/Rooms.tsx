// Rạp phim (chia sẻ màn hình) và nhà hàng (dọn món, camera) — phần hình trong cảnh + bảng điều khiển bên dưới.
import { YouTubeTogether, YtControls, ytId, type YtState } from './YouTubeTogether';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as api from '../lib/api';
import { content, item } from '../lib/content';
import { tripCtx, tripOf, TRIP_MENU } from '../lib/trips';
import { emojiSprite } from '../lib/pixel';
import { notify } from '../lib/realtime';
import { RtcRoom } from '../lib/rtc';
import { toast, toastError } from '../lib/toast';
import { SEATS } from '../lib/world';
import type { Live } from '../lib/useLive';
import type { Call } from '../lib/useCall';
import { Sheet } from './Sheet';
import { useScale } from './Stage';

/** Kết nối video với người ấy, chỉ sống khi mình đang ở trong phòng */
export function useRtc(room: string | null, me: api.Profile, partner: api.Profile | null) {
  const [remote, setRemote] = useState<MediaStream | null>(null);
  const [local, setLocal] = useState<MediaStream | null>(null);
  const rtc = useRef<RtcRoom | null>(null);
  const localRef = useRef<MediaStream | null>(null);
  localRef.current = local;

  useEffect(() => {
    if (!room) return;
    // Chưa có người ấy trong resort thì vẫn chiếu được cho mình xem; có người ấy thì nối WebRTC
    const r = partner ? new RtcRoom(room, me.id > partner.id, setRemote, setLocal) : null;
    rtc.current = r;
    return () => {
      r?.close();
      rtc.current = null;
      localRef.current?.getTracks().forEach(t => t.stop());
      setRemote(null); setLocal(null);
    };
  }, [room, me.id, partner?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fileVideo = useRef<HTMLVideoElement | null>(null);
  async function start(kind: 'screen' | 'camera' | 'file', opt: { audio?: boolean; file?: File } = {}) {
    const md = navigator.mediaDevices;
    if (!md) return toastError(new Error('Trình duyệt chặn chia sẻ vì trang không chạy qua https (hoặc localhost). Mở bằng link https đã deploy nhé.'));
    try {
      let stream: MediaStream;
      if (kind === 'file') {
        // Chiếu video có sẵn trong máy (điện thoại Android, máy tính): phát file rồi lấy luồng hình + tiếng của nó
        const v = document.createElement('video');
        v.src = URL.createObjectURL(opt.file!);
        v.playsInline = true;
        v.className = 'file-source';
        document.body.appendChild(v);
        await v.play();
        const cap = (v as HTMLVideoElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream });
        const s = cap.captureStream?.() ?? cap.mozCaptureStream?.();
        if (!s) { v.remove(); throw new Error('Trình duyệt này chưa chiếu được video trong máy — thử Chrome trên Android/máy tính, hoặc dùng "Xem YouTube cùng nhau".'); }
        fileVideo.current?.remove();
        fileVideo.current = v;
        v.onended = () => stop();
        stream = s;
      } else if (kind === 'screen') {
        try {
          stream = await md.getDisplayMedia({ video: { width: { max: 1280 }, height: { max: 720 }, frameRate: { max: 20 } }, audio: opt.audio !== false });
        } catch (e) {
          // Một số trình duyệt (Safari, Firefox) không cho lấy tiếng khi chia sẻ màn hình → thử lại chỉ hình
          if ((e as Error).name === 'NotAllowedError' || (e as Error).name === 'AbortError') throw e;
          stream = await md.getDisplayMedia({ video: { width: { max: 1280 }, height: { max: 720 }, frameRate: { max: 20 } } });
        }
      } else {
        stream = await md.getUserMedia({ video: { width: 640, height: 480 }, audio: false }); // tiếng nói đi qua nút 🎙️ Mic
      }
      if (rtc.current) rtc.current.start(stream);
      else {
        localRef.current?.getTracks().forEach(t => t.stop());
        stream.getTracks().forEach(t => { t.onended = () => setLocal(null); });
        setLocal(stream);
      }
    } catch (e) {
      const name = (e as Error).name;
      if (name === 'NotAllowedError') toast(kind === 'screen' ? '🖥️ Chưa chia sẻ: bạn đã huỷ, hoặc máy chưa cấp quyền ghi màn hình cho trình duyệt.' : '📷 Chưa bật camera: cần cho phép trình duyệt dùng camera.');
      else if (name !== 'AbortError') toastError(e);
    }
  }
  function stop() {
    if (fileVideo.current) { fileVideo.current.pause(); URL.revokeObjectURL(fileVideo.current.src); fileVideo.current.remove(); fileVideo.current = null; }
    if (rtc.current) rtc.current.stop();
    else { localRef.current?.getTracks().forEach(t => t.stop()); setLocal(null); }
  }
  return { remote, local, start, stop };
}
export type Rtc = ReturnType<typeof useRtc>;

export function StreamVideo({ stream, muted, className }: { stream: MediaStream; muted?: boolean; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [blocked, setBlocked] = useState(false);
  // Chrome chặn tự phát video CÓ TIẾNG khi chưa bấm gì → màn đen. Phát tắt tiếng trước, bấm để bật tiếng.
  useEffect(() => {
    const v = ref.current; if (!v) return;
    v.srcObject = stream; v.muted = !!muted;
    const go = () => v.play().catch(() => { v.muted = true; setBlocked(!muted); return v.play().catch(() => {}); });
    void go();
    // Track hình tới sau (thương lượng lại) → phát lại
    stream.onaddtrack = () => void go();
    return () => { stream.onaddtrack = null; };
  }, [stream, muted]);
  const unmute = () => { const v = ref.current; if (v) { v.muted = false; void v.play(); } setBlocked(false); };
  return (
    <div style={{ position: 'relative' }} className={className} onClick={blocked ? unmute : undefined}>
      <video ref={ref} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} autoPlay playsInline muted={muted} />
      {blocked && <button className="btn small" style={{ position: 'absolute', left: '50%', top: 8, transform: 'translateX(-50%)' }} onClick={unmute}>🔊 Bấm để bật tiếng</button>}
    </div>
  );
}

/** Màn hình rạp phim (vẽ trong cảnh): phóng to trong rạp, hoặc xem toàn màn hình kèm thả cảm xúc */
const REACTS = ['❤️', '😂', '😱', '😭', '🥰', '🍿'];
export function CinemaScreen({ rtc, mode, bubbles, onReact, yt, onYt }: { rtc: Rtc; mode: 'movie' | 'karaoke'; bubbles: { me?: string; partner?: string }; onReact: (e: string) => void; yt: YtState | null; onYt: (v: YtState | null) => void }) {
  const s = useScale();
  const screen = rtc.remote ?? rtc.local;
  const [big, setBig] = useState(false);
  const [full, setFull] = useState(false);
  const fsRef = useRef<HTMLDivElement>(null);

  // Mở toàn màn hình thật (máy tính, Android); iPhone không hỗ trợ thì vẫn phủ kín cửa sổ
  useEffect(() => {
    if (!full) return;
    const el = fsRef.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
    try { void (el?.requestFullscreen?.() ?? el?.webkitRequestFullscreen?.()); } catch { /* phủ cửa sổ là đủ */ }
    const onChange = () => { if (!document.fullscreenElement) setFull(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFull(false); };
    document.addEventListener('fullscreenchange', onChange);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      window.removeEventListener('keydown', onKey);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    };
  }, [full]);

  const box = big ? { left: 2 * s, top: 2 * s, width: 156 * s, height: 88 * s } : { left: 14 * s, top: 8 * s, width: 132 * s, height: 66 * s };
  const hint = mode === 'karaoke' ? 'Dán link karaoke YouTube hoặc chia sẻ màn hình để hát cùng nhau 🎤' : 'Xem YouTube cùng nhau, chiếu video trong máy, hoặc chia sẻ màn hình 🍿';
  return (
    <>
      <div className={`cinema-screen ${mode} ${big ? 'big' : ''}`} style={box}>
        {yt && !full ? <YouTubeTogether yt={yt} onChange={onYt} /> : screen && !full ? <StreamVideo stream={screen} muted={!rtc.remote} className="screen-video" /> : !full && <p className="screen-hint">{hint}</p>}
        {full && <p className="screen-hint">📺 Đang xem toàn màn hình</p>}
        <div className="screen-tools">
          <button title={big ? 'Thu nhỏ' : 'Phóng to trong rạp'} onClick={e => { e.stopPropagation(); setBig(b => !b); }}>{big ? '🔽' : '🔍'}</button>
          <button title="Xem toàn màn hình" onClick={e => { e.stopPropagation(); setFull(true); }}>⛶</button>
        </div>
      </div>
      {full && createPortal(
        <div className="cinema-full" ref={fsRef}>
          {yt ? <YouTubeTogether yt={yt} onChange={onYt} className="full" /> : screen ? <StreamVideo stream={screen} muted={!rtc.remote} className="screen-video" /> : <p className="screen-hint">{hint}</p>}
          <div className="cinema-full-bubbles">
            {bubbles.partner && <span className="them">{bubbles.partner}</span>}
            {bubbles.me && <span className="me">{bubbles.me}</span>}
          </div>
          <div className="cinema-full-bar">
            {REACTS.map(e => <button key={e} onClick={() => onReact(e)}>{e}</button>)}
            <button className="exit" onClick={() => setFull(false)}>✕ Thoát</button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

/** Camera ở nhà hàng: hình người ấy hiện trong khung vàng cao phía trên ghế đối diện (không che bóng chat), hình mình nhỏ ở góc (dùng chung cuộc gọi) */
export function DinnerTiles({ remote, local, firstSeat }: { remote: MediaStream | null; local: MediaStream | null; firstSeat: boolean }) {
  const s = useScale();
  const [left, right] = SEATS.restaurant!;
  const other = firstSeat ? right : left, mine = firstSeat ? left : right;
  return (
    <>
      {remote && (
        <div className="dinner-frame" style={{ left: (other.x - 23) * s, top: 20 * s, width: 46 * s, height: 36 * s }}>
          <StreamVideo stream={remote} muted className="tile-remote" />
        </div>
      )}
      {local && (
        <div className="dinner-frame small" style={{ left: (mine.x - 13) * s, top: 44 * s, width: 26 * s, height: 20 * s }}>
          <StreamVideo stream={local} muted className="tile-local" />
        </div>
      )}
    </>
  );
}

/** Bảng điều khiển dưới cảnh khi đang ở rạp phim / nhà hàng */
export function RoomPanel({ scene, rtc, call, live, inventory, partnerHere, partnerName, cinemaMode, yt, onYt }: {
  yt?: YtState | null;
  onYt?: (v: YtState | null) => void;
  scene: 'cinema' | 'restaurant';
  cinemaMode: 'movie' | 'karaoke';
  rtc: Rtc;
  call: Call;
  live: Live;
  inventory: api.InvRow[];
  partnerHere: boolean;
  partnerName: string;
}) {
  const [text, setText] = useState('');
  const [menu, setMenu] = useState(false);
  const canShare = typeof navigator.mediaDevices?.getDisplayMedia === 'function' || !window.isSecureContext;
  const canFile = typeof (HTMLVideoElement.prototype as HTMLVideoElement & { captureStream?: unknown }).captureStream === 'function';
  const [withAudio, setWithAudio] = useState(true);
  const [link, setLink] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const canCam = typeof navigator.mediaDevices?.getUserMedia === 'function';
  const dishes = inventory.filter(r => item(r.item_id).kind === 'dish');

  const [cat, setCat] = useState(tripCtx.at ? -2 : 0);
  async function serve(name: string, icon: string, itemId?: string, drink = false) {
    try {
      if (itemId) { await api.craft([{ id: itemId, n: 1 }]); notify('inventory'); }
      live.update(drink ? { drink: name } : { dish: name });
      live.say(drink ? `${icon} Cạn ly nhé ${partnerName}!` : `${icon} Mời ${partnerName}!`);
      setMenu(false);
    } catch (e) {
      toastError(e);
    }
  }

  return (
    <div className="room-panel">
      <p className="muted small-note">{partnerHere ? `💗 ${partnerName} đang ở đây cùng bạn` : `Đang chờ ${partnerName} tới…`}</p>
      {scene === 'cinema' && (
        <div className="sky-chips">
          <button className={`chip ${cinemaMode === 'movie' ? 'active' : ''}`} onClick={() => live.update({ cinema: 'movie', cinemaAt: Date.now() })}>🎬 Xem phim (tắt đèn)</button>
          <button className={`chip ${cinemaMode === 'karaoke' ? 'active' : ''}`} onClick={() => live.update({ cinema: 'karaoke', cinemaAt: Date.now() })}>🎤 Karaoke</button>
        </div>
      )}
      {scene === 'cinema' ? (
        <div className="cinema-share">
          {yt ? <YtControls yt={yt} onChange={v => onYt?.(v)} /> : (
            <form className="row yt-link" onSubmit={e => { e.preventDefault(); const id = ytId(link); if (!id) return toast('▶️ Dán link YouTube (vd: https://youtu.be/…)'); rtc.local && rtc.stop(); onYt?.({ id, playing: true, pos: 0, at: Date.now() }); setLink(''); live.say('▶️ Mở YouTube xem cùng nè!'); }}>
              <input value={link} onChange={e => setLink(e.target.value)} placeholder="Dán link YouTube để xem cùng…" />
              <button className="btn small">▶️ Xem cùng</button>
            </form>
          )}
          <div className="row wrap">
            {rtc.local
              ? <button className="btn small ghost" onClick={rtc.stop}>⏹ Dừng chia sẻ</button>
              : <>
                {canShare && <button className="btn small" onClick={() => { onYt?.(null); void rtc.start('screen', { audio: withAudio }); }}>🖥️ Chia sẻ màn hình</button>}
                {canShare && <button className={`chip ${withAudio ? 'active' : ''}`} onClick={() => setWithAudio(v => !v)} title="Chia sẻ cả tiếng của tab/màn hình">{withAudio ? '🔊 Kèm tiếng' : '🔇 Không tiếng'}</button>}
                {canFile && <button className="btn small ghost" onClick={() => fileInput.current?.click()}>📁 Chiếu video trong máy</button>}
                <input ref={fileInput} type="file" accept="video/*" hidden onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) { onYt?.(null); void rtc.start('file', { file: f }); } }} />
              </>}
          </div>
          {!canShare && <p className="muted small-note">📱 Điện thoại không chia sẻ màn hình được (trình duyệt không cho) — dùng ▶️ YouTube cùng nhau{canFile ? ' hoặc 📁 chiếu video trong máy' : ''} nhé.</p>}
        </div>
      ) : (
        <div className="row wrap">
          <button className="btn small" onClick={() => setMenu(true)}>🍽️ Gọi món</button>
          <button className="btn small ghost" onClick={() => live.say('🥂 Cụng ly!')}>🥂 Cụng ly</button>
          <button className="btn small ghost" onClick={() => live.say('🌹 Tặng em/anh bông hồng')}>🌹 Tặng hoa</button>
          <button className="btn small ghost" onClick={() => live.say('💕')}>💕</button>
          {canCam && <button className="btn small ghost" onClick={call.toggleCam}>{call.cam ? '📷 Tắt camera' : '📷 Bật camera'}</button>}
          {canCam && <button className="btn small ghost" onClick={call.toggleMic}>{call.mic ? '🎙️ Tắt mic' : '🎙️ Bật mic'}</button>}
        </div>
      )}
      {scene === 'cinema' && <p className="muted small-note">{cinemaMode === 'karaoke' ? 'Mẹo: mở video karaoke trên YouTube, chia sẻ tab đó (tick “Chia sẻ âm thanh”), rồi bật 🎙️ Mic để hát cho nhau nghe.' : 'Mẹo: chọn đúng tab phim và tick “Chia sẻ âm thanh”. Netflix và web có bản quyền thường hiện màn đen.'}</p>}

      <ul className="chat-log">
        {live.chat.slice(-4).map(c => <li key={c.at} className={c.from}>{c.text}</li>)}
      </ul>
      <form className="row" onSubmit={e => { e.preventDefault(); if (text.trim()) { live.say(text.trim()); setText(''); } }}>
        <input value={text} maxLength={120} onChange={e => setText(e.target.value)} placeholder="Nhắn gì đó…" />
        <button className="btn small">Gửi</button>
      </form>

      {menu && (
        <Sheet title="🍽️ Thực đơn tối nay" onClose={() => setMenu(false)}>
          <div className="tabs scroll">
            {tripCtx.at && <button className={cat === -2 ? 'active' : ''} onClick={() => setCat(-2)}>📍 Đặc sản {tripOf(tripCtx.at)?.name}</button>}
            {content.dinner.menu.map((c, i) => <button key={c.cat} className={cat === i ? 'active' : ''} onClick={() => setCat(i)}>{c.cat}</button>)}
            <button className={cat === -1 ? 'active' : ''} onClick={() => setCat(-1)}>👩‍🍳 Món tự nấu</button>
          </div>
          <div className="bag-grid">
            {cat === -2 && tripCtx.at ? TRIP_MENU[tripCtx.at].map(f => (
              <button key={f.name} className="bag-item" onClick={() => serve(f.name, f.icon, undefined, f.drink)}>
                <img src={emojiSprite(f.icon).url} className="px-img" alt="" /><small>{f.name}</small><i>{f.drink ? 'đồ uống' : 'đặc sản'}</i>
              </button>
            )) : cat === -1 ? (
              <>
                {dishes.length === 0 && <p className="muted">Chưa có món tự nấu — vào bếp nhà gỗ nấu từ rau nông trại và cá câu được nhé.</p>}
                {dishes.map(r => (
                  <button key={r.item_id} className="bag-item" onClick={() => serve(item(r.item_id).name, item(r.item_id).icon, r.item_id)}>
                    <img src={emojiSprite(item(r.item_id).icon).url} className="px-img" alt="" />
                    <small>{item(r.item_id).name}</small><i>×{r.qty}</i>
                  </button>
                ))}
              </>
            ) : content.dinner.menu[cat].items.map(f => (
              <button key={f.name} className="bag-item" onClick={() => serve(f.name, f.icon, undefined, f.drink)}>
                <img src={emojiSprite(f.icon).url} className="px-img" alt="" />
                <small>{f.name}</small><i>{f.drink ? 'đồ uống' : 'món'}</i>
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}
