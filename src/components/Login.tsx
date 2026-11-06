import { useState } from 'react';
import * as api from '../lib/api';
import { supabase } from '../lib/supabase';
import { Splash } from './Splash';

/**
 * Vào game bằng tên (+ mã resort). Không email, không mật khẩu:
 * trình duyệt có một phiên ẩn danh, server nối phiên đó với người chơi theo mã + tên.
 */
export function Login({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<'enter' | 'create'>('enter');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
      }
      if (mode === 'create') await api.createResort(name);
      else await api.enterResort(code, name);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi, thử lại nhé');
      setBusy(false);
    }
  }

  return (
    <Splash>
      <p className="muted">Hai resort nhỏ, hai bờ biển, một cây cầu.</p>
      <div className="tabs">
        <button className={mode === 'enter' ? 'active' : ''} onClick={() => setMode('enter')}>Vào resort</button>
        <button className={mode === 'create' ? 'active' : ''} onClick={() => setMode('create')}>Tạo resort mới</button>
      </div>
      <form className="stack" onSubmit={submit}>
        {mode === 'enter' && (
          <input
            placeholder="Mã resort (6 ký tự)" value={code} maxLength={6} required
            onChange={e => setCode(e.target.value.toUpperCase())} className="code-input"
          />
        )}
        <input
          required maxLength={30} placeholder="Tên của bạn" value={name}
          onChange={e => setName(e.target.value)} autoComplete="nickname"
        />
        <button className="btn" disabled={busy || !name.trim() || (mode === 'enter' && code.length < 6)}>
          {busy ? 'Đang mở cửa…' : mode === 'enter' ? 'Vào resort' : 'Tạo resort'}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
      <p className="muted small-note">
        {mode === 'enter'
          ? 'Lần đầu vào resort của người ấy, hoặc vào lại từ máy khác: nhập mã resort và đúng tên của bạn.'
          : 'Tạo xong bạn sẽ có mã resort. Gửi mã cho người ấy, và giữ lại để vào lại từ máy khác.'}
      </p>
    </Splash>
  );
}
