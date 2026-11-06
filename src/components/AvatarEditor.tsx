import { useState } from 'react';
import * as api from '../lib/api';
import { notify } from '../lib/realtime';
import { ACCS, characterSprite, GLASSES, HAIR_COLORS, HAIR_STYLES, OUTFITS, PRESETS, SHIRTS, SKINS, type AvatarLook } from '../lib/sprites';
import { toastError } from '../lib/toast';
import { Sheet } from './Sheet';

type Tab = 'preset' | 'outfit' | 'acc' | 'hair';

/** Tủ đồ: thay trang phục, phụ kiện, tóc — có gợi ý theo hoạt động (hẹn hò, làm vườn, câu cá...) */
export function AvatarEditor({ me, onSaved, onClose }: { me: api.Profile; onSaved: () => void; onClose: () => void }) {
  const [look, setLook] = useState<AvatarLook>({ skin: 0, hair: 0, hairColor: 0, shirt: 0, outfit: 0, acc: 0, ...me.avatar });
  const [tab, setTab] = useState<Tab>('preset');
  const preview = characterSprite(look, 'idle');
  const set = (patch: Partial<AvatarLook>) => setLook(l => ({ ...l, ...patch }));
  // Chọn giới tính lần đầu: gợi ý luôn kiểu tóc và trang phục hợp
  const pickGender = (g: 'm' | 'f') => set(look.gender ? { gender: g } : g === 'm' ? { gender: g, hair: 7, outfit: 0 } : { gender: g, hair: 1, outfit: 1 });

  async function save() {
    try {
      await api.updateProfile(me.id, { avatar: look });
      notify('profiles');
      onSaved();
      onClose();
    } catch (e) {
      toastError(e);
    }
  }

  const tile = (l: AvatarLook, label: string, active: boolean, onClick: () => void) => {
    const sp = characterSprite(l, 'idle');
    return (
      <button key={label} className={`wardrobe-item ${active ? 'active' : ''}`} onClick={onClick}>
        <img src={sp.url} className="px-img" alt="" style={{ width: sp.w * 3, height: sp.h * 3 }} />
        <small>{label}</small>
      </button>
    );
  };

  return (
    <Sheet title="👗 Tủ đồ" onClose={onClose}>
      <div className="avatar-preview">
        <img src={preview.url} className="px-img" alt="Nhân vật" style={{ width: preview.w * 6, height: preview.h * 6 }} />
        <img src={characterSprite(look, 'idle', undefined, 'side').url} className="px-img" alt="" style={{ width: preview.w * 3, height: preview.h * 3 }} />
      </div>
      <div className={`gender-pick ${look.gender ? '' : 'need'}`}>
        <span>Giới tính:</span>
        <button className={`chip ${look.gender === 'm' ? 'active' : ''}`} onClick={() => pickGender('m')}>👦 Nam</button>
        <button className={`chip ${look.gender === 'f' ? 'active' : ''}`} onClick={() => pickGender('f')}>👧 Nữ</button>
        {!look.gender && <small>Chọn để game xưng hô anh/em cho đúng</small>}
      </div>
      <div className="tabs">
        {([['preset', '✨ Theo hoạt động'], ['outfit', '👕 Trang phục'], ['acc', '🎀 Phụ kiện'], ['hair', '💇 Tóc & da']] as [Tab, string][]).map(([id, label]) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === 'preset' && (
        <div className="wardrobe-grid">
          {PRESETS.map(pr => tile({ ...look, outfit: pr.outfit, acc: pr.acc }, pr.name, look.outfit === pr.outfit && look.acc === pr.acc, () => set({ outfit: pr.outfit, acc: pr.acc })))}
        </div>
      )}
      {tab === 'outfit' && (
        <>
          <Swatches label="Màu đồ" colors={SHIRTS} value={look.shirt ?? 0} onPick={v => set({ shirt: v })} />
          <div className="wardrobe-grid">
            {OUTFITS.map((name, i) => tile({ ...look, outfit: i }, name, look.outfit === i, () => set({ outfit: i })))}
          </div>
        </>
      )}
      {tab === 'acc' && (
        <>
          <div className="wardrobe-grid">
            {ACCS.map((name, i) => (i === 4 ? null : tile({ ...look, acc: i }, name, look.acc === i, () => set({ acc: i }))))}
          </div>
          <div className="field"><span>👓 Kính (đeo cùng mũ, nơ được)</span></div>
          <div className="wardrobe-grid">
            {GLASSES.map((name, i) => tile({ ...look, glasses: i, acc: look.acc === 4 ? 0 : look.acc }, name, (look.glasses ?? (look.acc === 4 ? 1 : 0)) === i, () => set({ glasses: i, ...(look.acc === 4 ? { acc: 0 } : {}) })))}
          </div>
        </>
      )}
      {tab === 'hair' && (
        <>
          <div className="wardrobe-grid">
            {HAIR_STYLES.map((name, i) => tile({ ...look, hair: i, acc: 0 }, name, look.hair === i, () => set({ hair: i })))}
          </div>
          <Swatches label="Màu tóc" colors={HAIR_COLORS} value={look.hairColor ?? 0} onPick={v => set({ hairColor: v })} />
          <Swatches label="Màu da" colors={SKINS} value={look.skin ?? 0} onPick={v => set({ skin: v })} />
        </>
      )}
      <button className="btn" disabled={!look.gender} onClick={save}>{look.gender ? '💾 Mặc bộ này' : 'Chọn giới tính trước nhé'}</button>
    </Sheet>
  );
}

function Swatches({ label, colors, value, onPick }: { label: string; colors: string[]; value: number; onPick: (i: number) => void }) {
  return (
    <div className="field">
      <span>{label}</span>
      <div className="choice-row">
        {colors.map((c, i) => (
          <button key={c} className={`swatch ${value === i ? 'active' : ''}`} style={{ background: c }} onClick={() => onPick(i)} aria-label={`${label} ${i + 1}`} />
        ))}
      </div>
    </div>
  );
}
