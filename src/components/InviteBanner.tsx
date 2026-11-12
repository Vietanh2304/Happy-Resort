// Lời rủ của người ấy: khung to giữa màn hình (thay cho chip nhỏ trên cao khó thấy)
import { createPortal } from 'react-dom';

export function InviteBanner({ text, yes, onYes, onNo }: { text: string; yes: string; onYes: () => void; onNo: () => void }) {
  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
  return createPortal(
    <div className="invite-banner" onClick={stop} onPointerDown={stop} onMouseDown={stop} onTouchStart={stop}>
      <b>{text}</b>
      <div className="row">
        <button className="btn" onClick={onYes}>{yes}</button>
        <button className="btn ghost" onClick={onNo}>Để sau</button>
      </div>
    </div>,
    document.body,
  );
}
