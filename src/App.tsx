import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { configured, supabase } from './lib/supabase';
import * as api from './lib/api';
import { Login } from './components/Login';
import { CitySetup } from './components/CitySetup';
import { Game } from './components/Game';
import { Toasts } from './components/Toasts';
import { Splash } from './components/Splash';

export default function App() {
  return (
    <>
      {configured ? <Root /> : (
        <Splash>
          <p>Chưa cấu hình Supabase.</p>
          <p className="muted">Tạo file <code>.env</code> từ <code>.env.example</code> rồi chạy lại.</p>
        </Splash>
      )}
      <Toasts />
    </>
  );
}

function Root() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  // undefined = đang tải, null = trình duyệt này chưa vào resort nào
  const [profile, setProfile] = useState<api.Profile | null | undefined>(undefined);
  const userId = session?.user.id;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // Lúc vừa đăng nhập có thể có hai lần tải chồng nhau: chỉ nhận kết quả của lần mới nhất
  const latest = useRef(0);
  // (đọc phiên ngay lúc gọi, vì Login có thể giữ bản hàm từ trước khi đăng nhập)
  const reloadProfile = useCallback(async () => {
    const n = ++latest.current;
    let me: api.Profile | null = null;
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) me = await api.getMe();
    } catch (e) {
      console.error(e);
    }
    if (n === latest.current) setProfile(me);
  }, []);
  useEffect(() => { reloadProfile(); }, [reloadProfile, userId]);

  if (session === undefined || profile === undefined) return <Splash>Đang mở cửa resort…</Splash>;
  if (!profile) return <Login onDone={reloadProfile} />;
  if (profile.lat == null) return <CitySetup profile={profile} onDone={reloadProfile} />;
  return <Game me={profile} reloadMe={reloadProfile} />;
}
