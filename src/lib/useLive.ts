// Trạng thái "đang diễn ra" của hai người, không lưu DB, gửi qua kênh realtime:
// đang ở cảnh nào của thế giới, vị trí nhân vật, đang câu cá, món trên bàn, biểu cảm & chat.
import { useCallback, useEffect, useRef, useState } from 'react';
import { onEvent, sendEvent } from './realtime';
import { ping } from './notify';
import type { BathWater } from './interiors';
import type { HillSky } from './townSprites';
import { SCENES, type SceneId } from './world';
import type { SeaSpot } from './seaView';
import type { Jump } from './skydive';
import type { YtState } from '../components/YouTubeTogether';

export interface LiveState {
  scene: SceneId;
  pos: { x: number; y: number };
  act: string | null;     // 'fishing' khi đang câu cá
  dish: string | null;    // icon món đang đặt trên bàn ăn
  drink: string | null;   // đồ uống trên bàn
  sky: HillSky | 'real';  // bầu trời chọn ngắm trên đồi
  skyAt: number;          // lúc chọn — ai chọn sau thì cả hai cùng ngắm trời đó
  bath: BathWater;        // loại nước tắm đang chọn (cùng kiểu "ai chọn sau thì theo")
  bathAt: number;
  cinema: 'movie' | 'karaoke';
  cinemaAt: number;
  mic?: boolean;          // đang bật mic / cam (để người ấy thấy biểu tượng)
  cam?: boolean;
  walkPet?: boolean;      // đang dắt thú cưng đi dạo
  ride?: number;          // lúc bấm quay vòng đu quay
  bed?: string | null;    // đang nằm trên giường nào (act = 'sleep' | 'intimate')
  walkKid?: string | null; // đang dắt bé nào đi chơi
  care?: string | null;
  horse?: boolean;
  petTrick?: { t: 'sit' | 'shake' | 'roll'; at: number } | null;   // thú cưng đang làm trò         // đang cưỡi ngựa    // đang chăm bé nào (bế, cho bú, ru, tắm)
  duck?: boolean;          // thả vịt cao su vào bồn tắm
  sea?: SeaSpot;           // đang ngắm biển ở đâu (ghế ngắm biển)
  seaAt?: number;
  jump?: Jump | null;      // đang nhảy dù: pha + mốc thời gian (bãi nhảy dù)
  sand?: { text: string; at: number } | null;   // chữ viết trên cát ở ghế ngắm biển (đang tạm tắt)
  yt?: YtState | null;     // xem YouTube cùng nhau ở rạp phim
  ytAt?: number;
  /** Lúc thao tác thật gần nhất của phiên này (mở game ở 2 nơi: tab bỏ quên gửi nhắc lại trạng thái cũ thì bị bỏ qua) */
  t?: number;
}
export interface ChatLine { from: 'me' | 'partner'; text: string; at: number }

const START: LiveState = { scene: 'town', pos: SCENES.town.spawn, act: null, dish: null, drink: null, sky: 'real', skyAt: 0, bath: 'bubble', bathAt: 0, cinema: 'movie', cinemaAt: 0 };
const BUBBLE_MS = 5000;

export function useLive(partnerOnline: boolean) {
  const [mine, setMine] = useState<LiveState>(() => ({ ...START, t: Date.now() }));
  const [theirs, setTheirs] = useState<LiveState | null>(null);
  const [bubbles, setBubbles] = useState<{ me?: string; partner?: string }>({});
  const [chat, setChat] = useState<ChatLine[]>([]);
  const mineRef = useRef(mine);
  mineRef.current = mine;
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const showBubble = useCallback((who: 'me' | 'partner', text: string) => {
    setBubbles(b => ({ ...b, [who]: text }));
    setChat(c => [...c.slice(-40), { from: who, text, at: Date.now() }]);
    clearTimeout(timers.current[who]);
    timers.current[who] = setTimeout(() => setBubbles(b => ({ ...b, [who]: undefined })), BUBBLE_MS);
  }, []);

  // Lần đầu nghe thấy người ấy (họ vừa vào, hoặc tin chào của mình bị lạc): gửi lại trạng thái của mình ngay
  const heardRef = useRef(false);
  const theirT = useRef(0);
  useEffect(() => onEvent('live', (s: LiveState) => {
    if (!heardRef.current) { heardRef.current = true; sendEvent('live', mineRef.current, 'live'); }
    // Chỉ nhận trạng thái mới nhất: tab cũ (mở game ở nơi khác rồi bỏ quên) nhắc lại vị trí cũ thì bỏ qua
    if ((s.t ?? 0) < theirT.current) return;
    theirT.current = s.t ?? 0;
    setTheirs(s);
  }), []);
  useEffect(() => onEvent('say', ({ text }: { text: string }) => { showBubble('partner', text); void ping('💬 Người ấy nhắn', text, 'say'); }), [showBubble]);
  // Người ấy vừa online: gửi trạng thái hiện tại của mình; offline thì ẩn nhân vật của họ
  useEffect(() => {
    if (partnerOnline) sendEvent('live', mineRef.current, 'live');
    else { setTheirs(null); heardRef.current = false; theirT.current = 0; }
  }, [partnerOnline]);
  // Nối lại kênh sau khi rớt: gửi lại vị trí của mình; thỉnh thoảng nhắc lại phòng khi người ấy lỡ tin
  useEffect(() => onEvent('link-up', () => sendEvent('live', mineRef.current, 'live')), []);
  useEffect(() => {
    if (!partnerOnline) return;
    const t = setInterval(() => sendEvent('live', mineRef.current, 'live'), 8000);
    return () => clearInterval(t);
  }, [partnerOnline]);

  const update = useCallback((patch: Partial<LiveState>) => {
    const next = { ...mineRef.current, ...patch, t: Date.now() };
    mineRef.current = next;
    setMine(next);
    sendEvent('live', next, 'live');
  }, []);

  const say = useCallback((text: string) => {
    showBubble('me', text);
    sendEvent('say', { text });
  }, [showBubble]);

  return { mine, theirs, update, say, bubbles, chat };
}
export type Live = ReturnType<typeof useLive>;

/** Lựa chọn chung của hai người: ai chọn sau thì cả hai cùng theo */
export function shared<K extends 'sky' | 'bath' | 'cinema' | 'sea' | 'yt'>(mine: LiveState, theirs: LiveState | null, key: K): LiveState[K] {
  const at = (key + 'At') as 'skyAt' | 'bathAt' | 'cinemaAt' | 'seaAt' | 'ytAt';
  return theirs && (theirs[at] ?? 0) > (mine[at] ?? 0) ? theirs[key] : mine[key];
}
