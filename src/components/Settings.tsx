import { useState } from 'react';
import { liteOn, setLite } from '../lib/lite';
import * as api from '../lib/api';
import { supabase } from '../lib/supabase';
import { notify } from '../lib/realtime';
import { toast, toastError } from '../lib/toast';
import { Sheet } from './Sheet';
import { CityPicker, placeFields } from './CityPicker';
import { canInstall, enableNotify, installApp, notifyOn, notifySupported } from '../lib/notify';

interface Props {
  me: api.Profile;
  couple: api.Couple | null;
  onSaved: () => void;
  onClose: () => void;
  onAvatar: () => void;
}

export function Settings({ me, couple, onSaved, onClose, onAvatar }: Props) {
  const [name, setName] = useState(me.display_name);
  const [changingCity, setChangingCity] = useState(false);
  const [noti, setNoti] = useState(notifyOn());
  const [lite, setLiteS] = useState(liteOn());
  const ios = /iphone|ipad/i.test(navigator.userAgent);

  async function save(fields: Parameters<typeof api.updateProfile>[1]) {
    try {
      await api.updateProfile(me.id, fields);
      onSaved();
      notify('profiles');
      toast('Đã lưu ✓');
    } catch (e) {
      toastError(e);
    }
  }

  return (
    <Sheet title="⚙️ Cài đặt" onClose={onClose}>
      <div className="stack">
        <button className="btn ghost" onClick={onAvatar}>🧑‍🎨 Đổi nhân vật</button>
        <label className="field">
          <span>Tên hiển thị</span>
          <div className="row">
            <input value={name} maxLength={30} onChange={e => setName(e.target.value)} />
            <button className="btn small" disabled={!name.trim() || name === me.display_name} onClick={() => save({ display_name: name.trim() })}>Lưu</button>
          </div>
        </label>

        <div className="field">
          <span>Thành phố: <b>{me.city}</b></span>
          {changingCity ? (
            <CityPicker onPick={p => { save(placeFields(p)); setChangingCity(false); }} />
          ) : (
            <button className="btn ghost small" onClick={() => setChangingCity(true)}>Đổi thành phố</button>
          )}
        </div>

        {couple && (
          <div className="field">
            <span>Mã resort</span>
            <b className="code big">{couple.invite_code}</b>
            <span>Vào lại từ máy khác bằng mã này và tên <b>{me.display_name}</b>. Đổi tên thì lần sau nhập tên mới.</span>
          </div>
        )}

        {notifySupported() && (
          <label className="check">
            <input type="checkbox" checked={noti} onChange={async e => { const ok = await enableNotify(e.target.checked); setNoti(ok); if (e.target.checked && !ok) toast('🔔 Trình duyệt đang chặn thông báo — mở lại quyền trong cài đặt trình duyệt nhé'); }} />
            🔔 Báo khi người ấy vào làng, nhắn tin, gửi thư, rủ chơi (lúc game đang mở nền)
          </label>
        )}
        <label className="check">
          <input type="checkbox" checked={lite} onChange={e => { setLite(e.target.checked); setLiteS(e.target.checked); toast(e.target.checked ? '🔋 Đã bật tiết kiệm pin — ít lấp lánh hơn, máy mát & mượt hơn' : '✨ Đã tắt tiết kiệm pin — hiệu ứng đầy đủ'); }} />
          🔋 Tiết kiệm pin: giảm hiệu ứng lấp lánh trang trí cho máy đỡ nóng, đỡ giật (điện thoại tự bật)
        </label>
        {canInstall()
          ? <button className="btn ghost" onClick={() => installApp()}>📲 Cài game ra màn hình chính</button>
          : <p className="muted small-note">📲 Muốn mở như một app: {ios ? 'trên Safari bấm Chia sẻ → "Thêm vào MH chính"' : 'trong menu trình duyệt chọn "Cài đặt ứng dụng" / "Thêm vào màn hình chính"'}.</p>}

        <button className="btn ghost" onClick={() => supabase.auth.signOut()}>Đăng xuất</button>
      </div>
    </Sheet>
  );
}
