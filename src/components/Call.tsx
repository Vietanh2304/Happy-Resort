// Cuộc gọi suốt lúc chơi: nút Mic/Cam trên thanh trên, ô video nổi góc màn hình, phát tiếng người ấy.
import { useEffect, useRef, useState } from 'react';
import type { Call } from '../lib/useCall';
import { StreamVideo } from './Rooms';

export function CallButtons({ call, partnerName, partnerMic, partnerCam }: { call: Call; partnerName: string; partnerMic?: boolean; partnerCam?: boolean }) {
  return (
    <span className="call-btns">
      <button className={`chip mic ${call.mic ? 'on' : ''}`} onClick={call.toggleMic} title={call.mic ? 'Tắt mic' : 'Bật mic'}>
        {call.mic ? '🎙️ Mic' : '🔇 Mic'}
      </button>
      <button className={`chip mic ${call.cam ? 'on' : ''}`} onClick={call.toggleCam} title={call.cam ? 'Tắt camera' : 'Bật camera'}>
        {call.cam ? '📷 Cam' : '🚫 Cam'}
      </button>
      {(partnerMic || partnerCam) && (
        <span className="chip partner-call" title={`${partnerName} đang bật ${[partnerMic && 'mic', partnerCam && 'cam'].filter(Boolean).join(' và ')}`}>
          {partnerName}: {partnerMic ? (call.partnerTalking ? '🔊' : '🎙️') : ''}{partnerCam ? '📷' : ''}
        </span>
      )}
    </span>
  );
}

/** Ô video nổi: người ấy to, mình nhỏ (lật gương). Chạm để thu nhỏ/phóng to. */
export function CallTiles({ call, partnerName, hidden }: { call: Call; partnerName: string; hidden?: boolean }) {
  const [big, setBig] = useState(false);
  const [hideMe, setHideMe] = useState(false);
  if (hidden || (!call.remoteVideo && !call.cam)) return null;
  return (
    <div className={`call-tiles ${big ? 'big' : ''}`}>
      {call.remoteVideo && call.remote && (
        <div className="call-tile them" onClick={() => setBig(b => !b)} title="Chạm để phóng to / thu nhỏ">
          <StreamVideo stream={call.remote} muted />
          <span>{partnerName}</span>
        </div>
      )}
      {call.cam && call.local && !hideMe && (
        <div className="call-tile me" onClick={() => setHideMe(true)} title="Chạm để ẩn hình của mình">
          <StreamVideo stream={call.local} muted />
          <span>Bạn</span>
        </div>
      )}
      {call.cam && hideMe && <button className="chip" onClick={() => setHideMe(false)}>👁️ Hiện hình mình</button>}
    </div>
  );
}

/** Phát tiếng của người ấy */
export function RemoteAudio({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.srcObject = stream;
    el.play().catch(() => {
      // Trình duyệt chặn tự phát: phát lại ở lần chạm kế tiếp
      const retry = () => el.play().catch(() => {});
      window.addEventListener('pointerdown', retry, { once: true });
    });
  }, [stream]);
  return <audio ref={ref} autoPlay />;
}

/** Màn chào: một cú chạm để trình duyệt cho phát nhạc và tiếng (chỉ hiện khi trình duyệt chặn tự phát) */
export function EnterGate({ name, greeting, onEnter }: { name: string; greeting?: string; onEnter: () => void }) {
  return (
    <button className="enter-gate" onClick={onEnter} onKeyDown={onEnter} autoFocus>
      <span className="gate-card">
        <span className="gate-logo">🏝️ 💞 🏝️</span>
        <b>Chào {name}!</b>
        {greeting && <span className="gate-greet">{greeting}</span>}
        <span className="gate-tap">Chạm để vào resort 🎵</span>
      </span>
    </button>
  );
}
