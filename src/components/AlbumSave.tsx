// Nút "Lưu vào album" dùng chung ở cuối các hoạt động (ảnh chụp trong màn → album chung của hai đứa)
import { useState } from 'react';
import * as api from '../lib/api';
import { notify } from '../lib/realtime';
import { toast, toastError } from '../lib/toast';

/** Game cập nhật: hồ sơ của mình (để lưu ảnh vào album chung) */
export const albumCtx: { me: api.Profile | null } = { me: null };

export function AlbumSave({ photos, scene, caption }: { photos: string[]; scene: string; caption: string }) {
  const [saved, setSaved] = useState(0);
  const [busy, setBusy] = useState(false);
  if (!photos.length || !albumCtx.me) return null;
  const save = async () => {
    const me = albumCtx.me; if (!me) return;
    setBusy(true);
    try {
      for (const p of photos.slice(saved)) await api.addPhoto(me, scene, caption, p);
      notify('photos'); toast(`📔 Đã lưu ${photos.length - saved} ảnh vào album chung`); setSaved(photos.length);
    } catch (e) { toastError(e); }
    setBusy(false);
  };
  return <button className="btn small" disabled={busy || saved >= photos.length} onClick={() => void save()}>{saved >= photos.length ? '✓ Đã lưu vào album' : `📔 Lưu ${photos.length > 1 ? `${photos.length} ảnh` : 'ảnh'} vào album`}</button>;
}
