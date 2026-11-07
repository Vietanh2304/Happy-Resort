// Trạng thái "đang diễn ra" của hai người, không lưu DB, gửi qua kênh realtime:
// đang ở cảnh nào của thế giới, vị trí nhân vật, đang câu cá, món trên bàn, biểu cảm & chat.
import { useCallback, useEffect, useRef, useState } from 'react';
import { onEvent, sendEvent } from './realtime';
import { ping } from './notify';
import type { BathWater } from './interiors';
import type { HillSky } from './townSprites';
import { SCENES, type SceneId } from './world';

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
  duck?: boolean;          // thả vịt cao su vào bồn tắm
}
export interface ChatLine { from: 'me' | 'partner'; text: string; at: number }

const START: LiveState = { scene: 'town', pos: SCENES.town.spawn, act: null, dish: null, drink: null, sky: 'real', skyAt: 0, bath: 'bubble', bathAt: 0, cinema: 'movie', cinemaAt: 0 };
const BUBBLE_MS = 5000;

export function useLive(partnerOnline: boolean) {
  const [mine, setMine] = useState<LiveState>(START);
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

  useEffect(() => onEvent('live', (s: LiveState) => setTheirs(s)), []);
  useEffect(() => onEvent('say', ({ text }: { text: string }) => { showBubble('partner', text); void ping('💬 Người ấy nhắn', text, 'say'); }), [showBubble]);
  // Người ấy vừa online: gửi trạng thái hiện tại của mình; offline thì ẩn nhân vật của họ
  useEffect(() => {
    if (partnerOnline) sendEvent('live', mineRef.current, 'live');
    else setTheirs(null);
  }, [partnerOnline]);
  // Nối lại kênh sau khi rớt: gửi lại vị trí của mình; thỉnh thoảng nhắc lại phòng khi người ấy lỡ tin
  useEffect(() => onEvent('link-up', () => sendEvent('live', mineRef.current, 'live')), []);
  useEffect(() => {
    if (!partnerOnline) return;
    const t = setInterval(() => sendEvent('live', mineRef.current, 'live'), 8000);
    return () => clearInterval(t);
  }, [partnerOnline]);

  const update = useCallback((patch: Partial<LiveState>) => {
    const next = { ...mineRef.current, ...patch };
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
export function shared<K extends 'sky' | 'bath' | 'cinema'>(mine: LiveState, theirs: LiveState | null, key: K): LiveState[K] {
  const at = (key + 'At') as 'skyAt' | 'bathAt' | 'cinemaAt';
  return theirs && theirs[at] > mine[at] ? theirs[key] : mine[key];
}
