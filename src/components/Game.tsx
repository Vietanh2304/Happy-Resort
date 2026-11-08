import { useEffect, useRef, useState } from 'react';
import * as api from '../lib/api';
import { animal, content, item, type Combo } from '../lib/content';
import {
  activeCombos, beachPickups, catchFishQ, daysUntil, needsWater, WISH_WINDOW, type Pickup,
} from '../lib/game';
import { useNow, useSynced, useWeather } from '../lib/hooks';
import { joinCouple, notify, onEvent, onLink, sendEvent, type LinkState } from '../lib/realtime';
import { clock, localTime, phaseOf } from '../lib/time';
import { toast, toastError } from '../lib/toast';
import { useDecorEditor } from '../lib/useDecorEditor';
import type { HillSky } from '../lib/townSprites';
import { useGuests } from '../lib/useGuests';
import { shared, useLive } from '../lib/useLive';
import { useCall } from '../lib/useCall';
import { loadMusicPref, music, saveMusicPref, type Mood } from '../lib/music';
import { occupant } from '../lib/placement';
import { weatherIcon } from '../lib/weather';
import { villageWeather } from '../lib/villageWeather';
import { BATH, BEACH, BUILDINGS, RIDE_MS, SCENES, TOWN, farmCell, type GameId, type Pt, type SceneId } from '../lib/world';
import { addDays, festivalsOn, mainTheme, THEMES, type CustomDay } from '../lib/festivals';
import { BedPanel, BedSheet, InviteModal } from './Bed';
import { KidNameSheet, KidSheet } from './Family';
import { captureWorld } from '../lib/photo';
import { findPath } from '../lib/pathing';
import { ping } from '../lib/notify';
import { kidMood } from '../lib/kids';
import { AlbumSheet, BookSheet, CalendarSheet, FestTray, PetSheet, PhotoSheet } from './Love';
import { ReefPanel } from './Reef';
import { SkyPanel } from './Skydive';
import { SchoolPanel } from './School';
import { CampusPanel, StallSheet } from './Campus';
import { CAMPUS } from '../lib/campusArt';
import type { StallId } from '../lib/school';
import { DailyGift, DailyQuiz } from './Daily';
import { AnimalSheet, RanchShopSheet, WorkshopSheet } from './Ranch';
import { TailorSheet } from './Tailor';
import { WorkSheet } from './Work';
import { bragClassGrade, MeetingSheet, StudySheet } from './Study';
import { meetingDay, studyTime, subjectsOn } from '../lib/study';
import { kidStage } from '../lib/kids';
import { newJob, type JobData } from '../lib/work';
import { atSchool, SCHOOL } from '../lib/school';
import { logName } from '../lib/reef';
import { CafePanel, LoungePanel, CampPanel, WheelPanel, Chat, status as placeStatus } from './Places';
import { PLANE_NOTES, Postcard, type TwinPlane } from './Twin';
import { FishMeter, type Zone } from './FishMeter';
import { DanceBar } from './Disco';
import type { CityKind } from '../lib/places';
import { AvatarEditor } from './AvatarEditor';
import { BagSheet } from './BagSheet';
import { CollectionSheet } from './CollectionSheet';
import { DecorTray } from './DecorTray';
import { GuestbookSheet } from './GuestbookSheet';
import { KitchenRoom } from './Kitchen';
import type { Act, AnimName } from '../lib/acts';
import { Boat } from './play/Boat';
import { Golf } from './play/Golf';
import { HideSeek } from './play/HideSeek';
import { Snowball } from './play/Snowball';
import { Mailbox } from './Mailbox';
import { Fireworks, MeetupSheet } from './MeetupSheet';
import { QuestionSheet } from './QuestionSheet';
import { CinemaScreen, DinnerTiles, RoomPanel, useRtc } from './Rooms';
import type { YtState } from './YouTubeTogether';
import { HillPanel } from './HillPanel';
import { BathPanel } from './BathPanel';
import { EmoteMenu, liveStatus } from './SeedSheet';
import { PlotSheet, SeedSheet } from './FarmSheets';
import { GameSheet, TITLES } from './Games';
import { Settings } from './Settings';
import { Sheet } from './Sheet';
import { ShopSheet } from './ShopSheet';
import { WishSheet } from './WishSheet';
import { World, type Lantern, type View } from './World';
import { CallButtons, CallTiles, EnterGate, RemoteAudio } from './Call';
import { ChatDock } from './ChatDock';

type SheetState =
  | { kind: 'games' | 'mail' | 'settings' | 'question' | 'collection' | 'meetup' | 'wish' | 'bag' | 'shop' | 'map' | 'avatar' | 'emote' | 'guestbook' | 'album' | 'calendar' | 'pet' | 'book' | 'photo' }
  | { kind: 'seed' | 'plot'; cell: number }
  | { kind: 'game'; game: GameId }
  | { kind: 'bed'; bed: string }
  | { kind: 'kid'; id?: string }
  | { kind: 'kidname'; id: string }
  | { kind: 'gift' }
  | { kind: 'animal'; id: string }
  | { kind: 'ranchshop' }
  | { kind: 'stall'; id: StallId }
  | { kind: 'workshop' }
  | { kind: 'tailor' }
  | { kind: 'work' }
  | { kind: 'study' }
  | { kind: 'meeting' }
  | { kind: 'quizday' }
  | { kind: 'postcard'; city: CityKind; i: number; name: string }
  | null;

/** Trò chơi mở toàn màn hình (không nằm trong bảng) */
const FULLSCREEN: GameId[] = ['golf', 'snow', 'boat', 'hide'];

export function Game({ me, reloadMe }: { me: api.Profile; reloadMe: () => void }) {
  const coupleId = me.couple_id;
  const now = useNow(30_000);
  const myTime = localTime(me.tz, now);

  // Presence: ai đang online
  const [online, setOnline] = useState<string[]>([]);
  useEffect(() => joinCouple(coupleId, me.id, setOnline), [coupleId, me.id]);
  const [link, setLinkState] = useState<LinkState>('connecting');
  useEffect(() => onLink(setLinkState), []);

  const [couple] = useSynced('profiles', () => api.getCouple(coupleId), null as api.Couple | null);
  const [partner, reloadPartner] = useSynced('profiles', () => api.getPartner(me), null as api.Profile | null);
  const [decor, reloadDecor, decorLoaded] = useSynced('decor', api.loadDecor, [] as api.Decor[]);
  const [inventory] = useSynced('inventory', () => api.loadInventory(me.id), [] as api.InvRow[]);
  const [animals] = useSynced('ranch', api.loadRanch, [] as api.Animal[]);
  const [outfits] = useSynced('outfits', api.loadOutfits, [] as api.OutfitRow[]);
  const [jobs, reloadJobs] = useSynced('jobs', api.loadJobs, [] as api.JobRow[]);
  const [scores] = useSynced('scores', api.loadScores, [] as api.Score[]);
  const myJob: JobData = jobs.find(j => j.user_id === me.id)?.data ?? newJob(myTime.date);
  const [notes] = useSynced('notes', api.loadNotes, [] as api.Note[]);
  // Tin nhắn chung; null = chưa chạy migration 012 (bảng messages chưa có)
  const [messages, , messagesReady] = useSynced('chat', () => api.loadMessages().catch(e => { if (/messages|schema cache|does not exist/i.test(String(e?.message ?? e))) return null; throw e; }), [] as api.Message[] | null);
  const [bridge, reloadBridge] = useSynced('checkins', () => api.loadBridge(myTime.date), { planks: 0, todayIds: [] as string[] }, [myTime.date]);
  const [affection] = useSynced('claims', () => api.loadAffection([me.id, ...(partner ? [partner.id] : [])]), 0, [partner?.id]);
  const [claimed, , claimsLoaded] = useSynced('claims', () => api.loadClaimsOn(me.id, myTime.date), [] as string[], [myTime.date]);
  // Quà mỗi ngày: lần đầu vào game trong ngày thì hộp quà tự hiện
  const giftOpen = !claimed.includes(`gift:${myTime.date}`);
  const quizRight = [0, 1, 2, 3, 4].filter(i => claimed.includes(`quiz:${myTime.date}:${i}`)).length;
  const quizLeft = [0, 1, 2, 3, 4].filter(i => !claimed.includes(`quiz:${myTime.date}:${i}`) && !claimed.includes(`quizx:${myTime.date}:${i}`)).length;
  const [owned] = useSynced('collection', () => api.loadCollection(me.id), new Set<string>());
  const [answers] = useSynced('answers', api.loadAnswers, [] as api.Answer[]);
  const [wishes] = useSynced('wishes', api.loadWishes, [] as api.Wish[]);
  const [meetup] = useSynced('meetup', api.loadMeetup, null as api.Meetup | null);
  const [farm, , farmLoaded] = useSynced('farm', api.loadFarm, [] as api.FarmRow[]);
  const [photos] = useSynced('photos', api.loadPhotos, [] as api.Photo[]);
  const [capsules] = useSynced('capsules', api.loadCapsules, [] as api.Capsule[]);
  const [pet, , petLoaded] = useSynced('pets', api.loadPet, null as api.Pet | null);
  const [days] = useSynced('days', api.loadDays, [] as CustomDay[]);
  const [kids] = useSynced('kids', api.loadKids, [] as api.Kid[]);
  const [festDecor] = useSynced('festdecor', () => api.loadFestDecor(myTime.date), [] as api.FestDecor[], [myTime.date]);

  const partnerOnline = !!partner && online.includes(partner.id);
  const live = useLive(partnerOnline);
  const scene = live.mine.scene;
  const theirs = partnerOnline ? live.theirs : null;
  const partnerHere = theirs?.scene === scene;
  const partnerName = partner?.display_name || 'người ấy';

  // Người ấy vừa vào: có thể đã đổi gì đó trước khi kênh realtime kịp nối
  useEffect(() => {
    if (online.length > 1) { reloadPartner(); reloadBridge(); reloadDecor(); }
  }, [online.length, reloadPartner, reloadBridge, reloadDecor]);

  // Mở game = điểm danh hôm nay; cả hai cùng ghé thì hũ xu được thưởng
  useEffect(() => {
    api.checkin(me, myTime.date).then(() => notify('checkins'), console.error);
    // Lương mỗi ngày vào hũ chung (và quà mở hũ lần đầu)
    (async () => {
      const e = content.economy;
      if (await api.grantCoins('coins:welcome', e.welcome)) toast(`🪙 Quà mở hũ: +${e.welcome} xu để sắm đồ thật nhiều!`);
      if (await api.grantCoins(`coins:${myTime.date}`, e.daily)) toast(`🪙 Lương hôm nay +${e.daily} xu vào hũ chung`);
      notify('profiles');
    })().catch(console.error);
  }, [me, myTime.date]);
  const bothToday = !!partner && bridge.todayIds.includes(me.id) && bridge.todayIds.includes(partner.id);
  useEffect(() => {
    if (!bothToday) return;
    api.togetherBonus(myTime.date, content.economy.togetherBonus).then(ok => {
      if (ok) { toast(`💞 Hôm nay cả hai cùng ghé — hũ xu +${content.economy.togetherBonus}`); notify('profiles'); }
    }, console.error);
  }, [bothToday, myTime.date]);

  const [sheet, setSheet] = useState<SheetState>(null);
  const [editing, setEditing] = useState(false);

  // Quà chào mừng (một lần) và tạo nhân vật lần đầu
  useEffect(() => {
    api.claim('starter', content.starterKit).then(ok => {
      if (ok) { toast('🎁 Quà chào mừng đã vào túi!'); notify('inventory', 'collection'); }
    }, console.error);
    api.claim('starter-farm', content.farmKit).then(ok => {
      if (ok) { toast('🎁 Quà mở nông trại: phân bón và đồ trang trí trại đã vào túi!'); notify('inventory', 'collection'); }
    }, console.error);
    api.claim('starter-cozy', content.cozyKit).then(ok => {
      if (ok) { toast('🎁 Quà mừng nhà mới: đồ nội thất và đồ vườn đã vào túi!'); notify('inventory', 'collection'); }
    }, console.error);
    if (!me.avatar || Object.keys(me.avatar).length === 0 || !me.avatar.gender) {
      setSheet({ kind: 'avatar' });
      if (me.avatar?.outfit !== undefined) toast('👫 Chọn giới tính cho nhân vật để game xưng hô anh/em cho đúng nhé');
    }
  }, [me.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Trời thật của hai thành phố: chỉ hiện ở Đài quan sát (và hiện tượng hai bờ)
  const realWeather = useWeather(me.lat, me.lon);
  const partnerWeather = useWeather(partner?.lat, partner?.lon);
  const realView: View = { weather: realWeather, time: myTime, phase: phaseOf(myTime.hour) };
  // Trời chung trong làng: random theo mùa, hai người thấy giống nhau, quyết định ô/khăn/áo
  const myWeather = villageWeather(coupleId, now.getTime(), myTime.month);
  const myView: View = { ...realView, weather: myWeather };
  const partnerTime = partner?.tz ? localTime(partner.tz, now) : null;
  const partnerView: View | null = partnerTime ? { weather: partnerWeather, time: partnerTime, phase: phaseOf(partnerTime.hour) } : null;
  const myShore = { weather: myWeather?.type ?? 'clear', phase: myView.phase } as const;

  // Khách thú ghé làng
  const guests = useGuests(me, myTime, now, decor, decorLoaded, []);
  const activeGuests = guests.filter(g => !g.left_at && g.island === 'home');

  // ───── Đi lại ─────
  const pending = useRef<(() => void) | null>(null);
  const route = useRef<Pt[]>([]);
  // Đi vòng qua đồ đạc, nhà cửa, cây cối: đi lần lượt qua từng điểm dừng
  function go(to: Pt, then?: () => void) {
    cancelFishing();
    const cur = live.mine.pos;
    const path = findPath(scene, decor, cur, to);
    const end = path[path.length - 1];
    if (Math.hypot(cur.x - end.x, cur.y - end.y) < 0.5) { route.current = []; then?.(); return; }
    pending.current = then ?? null;
    route.current = path.slice(1);
    live.update({ pos: path[0], act: null });
  }
  function arrived() {
    const next = route.current.shift();
    if (next) { live.update({ pos: next }); return; }
    const f = pending.current;
    pending.current = null;
    f?.();
  }
  function enter(target: SceneId, at?: Pt) {
    cancelFishing();
    pending.current = null;
    route.current = [];
    setEditing(false);
    editor.setSelection(null);
    live.update({ scene: target, pos: at ?? SCENES[target].spawn, act: null, dish: null, jump: null });
  }

  async function run(f: () => Promise<unknown>) {
    try { await f(); } catch (e) { toastError(e); }
  }

  // ───── Nhặt đồ, vuốt ve khách ─────
  const pickups = myWeather ? beachPickups(me.id, myTime.date, myWeather.type, myTime.month).filter(p => !claimed.includes(p.key)) : [];
  const pickUp = (p: Pickup) => run(async () => {
    if (await api.claim(p.key, [{ id: p.itemId, n: 1 }])) {
      const it = item(p.itemId);
      live.say(it.icon);
      toast(`Bạn nhặt được ${it.icon} ${it.name}!`);
      notify('claims', 'inventory', 'collection');
    }
  });
  const patGuest = (g: api.Guest) => run(async () => {
    const a = animal(g.animal_id);
    const first = await api.claim(`pet:${g.id}`);
    live.say('💕');
    toast(first ? `${a?.icon} ${a?.name} thích lắm! Lúc về sẽ khen hết lời 💕` : `${a?.icon} ${a?.name} đang lim dim vì sướng`);
  });

  // ───── Câu cá ─────
  const [fishing, setFishing] = useState<'wait' | 'bite' | null>(null);
  const fishTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const castsUsed = claimed.filter(k => k.startsWith(`fish:${myTime.date}:`)).length;
  function cancelFishing() {
    fishTimers.current.forEach(clearTimeout);
    fishTimers.current = [];
    setFishing(null);
  }
  function startFishing() {
    live.update({ act: 'fishing' });
    setFishing('wait');
    fishTimers.current.push(setTimeout(() => setFishing('bite'), 1500 + Math.random() * 3500));
  }
  /** Kéo khi phao chưa giật */
  function pullEarly() {
    cancelFishing();
    live.update({ act: null });
    toast('Kéo sớm quá, cá chưa cắn câu 😅');
  }
  /** Kết quả thanh căn chuẩn */
  function land(z: Zone) {
    cancelFishing();
    live.update({ act: null });
    if (z === 'gray') return toast('🐟💨 Hụt rồi, cá chạy mất — thả câu lại nhé');
    if (z === 'red') { live.say('💥'); return toast('💥 Kéo mạnh quá, đứt dây! Buộc lại rồi thả câu nhé'); }
    const n = castsUsed;
    const fishId = catchFishQ(me.id, myTime.date, n, myShore, z === 'green' ? 'good' : 'junk');
    run(async () => {
      await api.claim(`fish:${myTime.date}:${n}`, [{ id: fishId, n: 1 }]);
      live.say(item(fishId).icon);
      toast(`${z === 'green' ? '🎯 Chuẩn! ' : '😅 '}Câu được ${item(fishId).icon} ${item(fishId).name}!`);
      notify('claims', 'inventory', 'collection');
    });
  }

  // ───── Nông trại chung ─────
  const fertilizer = inventory.find(r => r.item_id === 'fertilizer')?.qty ?? 0;
  function farmTap(x: number, y: number) {
    const cell = farmCell(x, y);
    if (farm.some(r => r.cell === cell)) return setSheet({ kind: 'plot', cell });
    if (occupant('farm', decor, x, y)) return;
    setSheet({ kind: 'seed', cell });
  }
  const sow = (cell: number, cropId: string) => run(async () => {
    await api.farmPlant(cell, cropId);
    setSheet(null);
    live.say('🌱');
    toast(`🌱 Đã gieo ${item(cropId).name}. Nhớ tưới nước và bón phân để cây lên cấp nhé!`);
    notify('inventory');
    notify('farm');
  });
  const farmDo = (kind: 'water' | 'fertilize' | 'harvest' | 'clear', cell: number) => run(async () => {
    const row = farm.find(r => r.cell === cell);
    if (!row) return setSheet(null);
    if (kind === 'water') {
      live.update({ act: 'water' });
      setTimeout(() => { if (live.mine.act === 'water') live.update({ act: null }); }, 1800);
      await api.farmWater(cell, myTime.date);
    }
    if (kind === 'fertilize') { await api.farmFertilize(cell); toast('🧪 Đã bón phân — cây sẵn sàng lên cấp!'); notify('inventory'); }
    if (kind === 'harvest') {
      const n = content.garden.harvest * (row.fertilized ? 2 : 1);
      await api.farmHarvest(cell, content.garden.harvest);
      live.say(item(row.crop_id).icon);
      toast(`🧺 Thu hoạch ${n} ${item(row.crop_id).icon} ${item(row.crop_id).name}!`);
      notify('inventory', 'collection');
    }
    if (kind === 'clear') await api.farmClear(cell);
    setSheet(null);
    notify('farm');
  });
  // Trời thật đang mưa/tuyết → ruộng tự được tưới
  const rainWatered = useRef('');
  useEffect(() => {
    const wet = myWeather?.type === 'rain' || myWeather?.type === 'snow';
    if (!wet || !farmLoaded || rainWatered.current === myTime.date) return;
    const dry = farm.filter(r => needsWater(r, myTime.date));
    rainWatered.current = myTime.date;
    if (!dry.length) return;
    Promise.all(dry.map(r => api.farmWater(r.cell, myTime.date)))
      .then(() => { toast('🌧️ Trời mưa đã tưới nông trại giúp hai bạn'); notify('farm'); }, console.error);
  }, [myWeather?.type, farmLoaded, myTime.date]); // eslint-disable-line react-hooks/exhaustive-deps

  // ───── Gọi nhau (mic + cam) & nhạc nền ─────
  const call = useCall(me, partner);
  useEffect(() => { live.update({ mic: call.mic, cam: call.cam }); }, [call.mic, call.cam]); // eslint-disable-line react-hooks/exhaustive-deps
  const [musicPref, setMusicPref] = useState(loadMusicPref);
  const [musicPanel, setMusicPanel] = useState(false);
  const [hudOpen, setHudOpen] = useState(false);
  const [gate, setGate] = useState(false);
  useEffect(() => {
    if (!musicPref.on) { music.stop(); return; }
    // Vào game là phát nhạc; nếu trình duyệt chặn (chưa chạm trang lần nào) thì hiện màn chào "Chạm để vào"
    music.start();
    const t = setTimeout(() => { if (music.blocked) setGate(true); }, 400);
    const kick = () => { music.unlock(); setGate(false); };
    window.addEventListener('pointerdown', kick, { once: true });
    window.addEventListener('keydown', kick, { once: true });
    return () => { clearTimeout(t); window.removeEventListener('pointerdown', kick); window.removeEventListener('keydown', kick); };
  }, [musicPref.on]);
  useEffect(() => { music.setVolume(call.partnerTalking || call.mic ? musicPref.vol * 0.45 : musicPref.vol); }, [musicPref.vol, call.partnerTalking, call.mic]);
  function setMusic(p: { on: boolean; vol: number }) {
    setMusicPref(p);
    saveMusicPref(p);
    if (p.on) { music.start(); music.unlock(); } else music.stop();
  }

  // ───── Khu vui chơi: người ấy mở trò nào thì báo cho mình ─────
  useEffect(() => onEvent('game', (m: { g: GameId; t: string; by: string }) => {
    if (m.t === 'open' && m.by !== me.id) void ping('🎮 Rủ chơi', `${partner?.display_name ?? 'Người ấy'} đang rủ bạn chơi cùng`);
    if (m.t === 'open' && m.by !== me.id) { toast(`🎮 ${partner?.display_name ?? 'Người ấy'} rủ bạn chơi ${TITLES[m.g] ?? 'cùng'}!`); setGameInvite(m.g); setTimeout(() => setGameInvite(g => (g === m.g ? null : g)), 30000); }
  }), [me.id, partner?.display_name]);
  const [gameInvite, setGameInvite] = useState<GameId | null>(null);
  const ARCADE_GAMES: GameId[] = ['cook', 'snow', 'boat', 'golf', 'hide', 'cards', 'quiz', 'puzzle', 'dance', 'focus', 'fishrace', 'castle', 'caro', 'rps', 'memory', 'draw'];
  // ───── Động tác (té nước, búng tai…): mình làm thì máy người ấy cũng thấy ─────
  const [acts, setActs] = useState<{ me?: Act; them?: Act }>({});
  const inTubRef = useRef({ me: false, them: false });
  // Ai đang ở phòng tắm (trong bồn hay đứng cạnh) đều có thể bị té nước
  inTubRef.current = { me: scene === 'bathroom', them: !!partnerHere && scene === 'bathroom' };
  const sayRef = useRef(live.say); sayRef.current = live.say;
  // Té nước: nước bay sang người kia, ~nửa giây sau người bị té giơ tay che mặt
  const hitLater = (who: 'me' | 'them') => setTimeout(() => {
    setActs(a => ({ ...a, [who]: { n: 'ouch', at: Date.now() } }));
    if (who === 'me') sayRef.current('💦 Á! Ướt hết rồi!');
  }, 480);
  const doAct = (n: AnimName) => {
    setActs(a => ({ ...a, me: { n, at: Date.now() } }));
    sendEvent('act', { n });
    if (n === 'splash' && inTubRef.current.them) hitLater('them');
  };
  useEffect(() => onEvent('act', ({ n }: { n: AnimName }) => {
    setActs(a => ({ ...a, them: { n, at: Date.now() } }));
    if (n === 'splash' && inTubRef.current.me) hitLater('me');
  }), []); // eslint-disable-line react-hooks/exhaustive-deps
  // Ôm / hôn: đi tới sát người ấy rồi cả hai cùng quay vào nhau (người ấy cũng thấy)
  const [hugAct, setHugAct] = useState<{ kind: 'hug' | 'kiss'; at: number; mySide: 'L' | 'R' } | null>(null);
  const coupleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const showCouple = (c: { kind: 'hug' | 'kiss'; at: number; mySide: 'L' | 'R' }) => {
    setHugAct(c);
    clearTimeout(coupleTimer.current);
    coupleTimer.current = setTimeout(() => setHugAct(null), c.kind === 'hug' ? 5000 : 4500);
  };
  useEffect(() => onEvent('couple-act', (d: { kind: 'hug' | 'kiss'; side: 'L' | 'R' }) => {
    showCouple({ kind: d.kind, at: Date.now(), mySide: d.side === 'L' ? 'R' : 'L' });
  }), []); // eslint-disable-line react-hooks/exhaustive-deps
  function coupleDo(kind: 'hug' | 'kiss') {
    const icon = kind === 'hug' ? '🤗' : '😘💋';
    if (!partnerHere || !theirs) return toast(`${icon} ${partnerName} cần ở cùng chỗ với bạn mới ${kind === 'hug' ? 'ôm' : 'hôn'} được`);
    if (!SCENES[scene].walk) { live.say(`${icon} 💕`); return; }   // đang ngồi ghế cố định: gửi cử chỉ thôi
    const side: 'L' | 'R' = live.mine.pos.x <= theirs.pos.x ? 'L' : 'R';
    const gap = kind === 'hug' ? 8 : 9;
    go({ x: theirs.pos.x + (side === 'L' ? -gap : gap), y: theirs.pos.y }, () => {
      const at = Date.now();
      showCouple({ kind, at, mySide: side });
      sendEvent('couple-act', { kind, side });
      live.say(kind === 'hug' ? '🤗💕' : '💋');
    });
  }
  const [kitchenOpen, setKitchenOpen] = useState(false);
  const [playing, setPlaying] = useState<GameId | null>(null);
  function openGame(g: GameId, invite = true) {
    if (FULLSCREEN.includes(g)) {               // trò toàn màn hình
      setSheet(null);
      setPlaying(g);
      if (invite) sendEvent('game', { g, t: 'open', by: me.id });
      return;
    }
    if (g === 'cook') {                        // nấu ăn: vào phòng bếp chung
      setSheet(null);
      setKitchenOpen(true);
      if (invite) sendEvent('game', { g, t: 'open', by: me.id });
      return;
    }
    if (g === 'dance') {                       // khiêu vũ chơi ngay trong phòng sàn nhảy
      setSheet(null);
      enter('disco');
      if (invite) sendEvent('game', { g, t: 'open', by: me.id });
      return;
    }
    setSheet({ kind: 'game', game: g });
    if (invite) sendEvent('game', { g, t: 'open', by: me.id });
  }

  // ───── Hiện tượng khi thời tiết hai nơi kết hợp ─────
  const combos = realWeather && partnerView?.weather
    ? activeCombos({ weather: realWeather.type, phase: myView.phase }, { weather: partnerView.weather.type, phase: partnerView.phase })
    : [];
  const claimCombo = (c: Combo) => run(async () => {
    if (await api.claim(`combo:${c.id}:${myTime.date}`, [{ id: c.reward, n: 1 }], [`combo:${c.id}`])) {
      toast(`${c.icon} ${c.name}! Bạn nhận được ${item(c.reward).icon} ${item(c.reward).name}`);
      notify('claims', 'inventory', 'collection');
    }
  });
  const myTap = useRef(0);
  const partnerTap = useRef(0);
  const onStarsMatched = useRef(() => {});
  onStarsMatched.current = () => {
    const stars = content.combos.find(c => c.effect === 'stars');
    if (stars) claimCombo(stars);
    setSheet({ kind: 'wish' });
  };
  useEffect(() => onEvent('star-tap', () => {
    partnerTap.current = Date.now();
    if (partnerTap.current - myTap.current <= WISH_WINDOW) onStarsMatched.current();
  }), []);
  function tapStar() {
    myTap.current = Date.now();
    sendEvent('star-tap');
    if (myTap.current - partnerTap.current <= WISH_WINDOW) onStarsMatched.current();
    else toast('🌠 Bạn đã chạm! Người ấy chạm trong 3 giây là được ước…');
  }
  const saveWish = (text: string) => run(async () => {
    await api.addWish(me, text.trim());
    notify('wishes');
    toast('✨ Điều ước đã bay lên trời');
    setSheet(null);
  });

  // Hẹn gặp: đúng ngày có pháo hoa + kỷ vật
  const meetupLeft = meetup ? daysUntil(myTime.date, meetup.day) : null;
  const [fireworksSeen, setFireworksSeen] = useState(false);
  useEffect(() => {
    if (meetupLeft !== 0 || !meetup) return;
    api.claim(`meetup:${meetup.day}`, [{ id: content.meetup.keepsake, n: 1 }]).then(ok => ok && notify('inventory', 'collection'), console.error);
  }, [meetupLeft, meetup]);

  // Người ấy vừa vào rạp/nhà hàng → rủ mình
  const theirScene = theirs?.scene;
  useEffect(() => {
    if (theirScene && ['cinema', 'restaurant', 'cafe', 'wheel', 'camp', 'hill', 'lounge', 'reef', 'sky', 'school', 'campus', 'gym'].includes(theirScene) && theirScene !== scene) {
      toast(`${SCENES[theirScene].icon} ${partnerName} đang đợi bạn ở ${SCENES[theirScene].name}`);
    }
  }, [theirScene]); // eslint-disable-line react-hooks/exhaustive-deps

  // ───── Ngày đặc biệt: làng đổi cảnh, quà một lần, tự bày đồ ─────
  const people = { meName: me.display_name, partnerName, myBirthday: me.birthday, partnerBirthday: partner?.birthday, anniversary: couple?.anniversary, custom: days };
  const fests = festivalsOn(myTime.date, people);
  const theme = mainTheme(fests);
  const festKey = fests.map(f => f.id).join(',');
  useEffect(() => {
    for (const f of fests) {
      api.claim(`fest:${f.id}`, f.gift).then(ok => {
        if (!ok) return;
        toast(`${f.icon} ${f.greet}${f.gift.length ? ' 🎁 Quà đã vào túi!' : ''}`);
        notify('inventory', 'collection');
      }, console.error);
    }
  }, [festKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const [festIcon, setFestIcon] = useState<string | null>(null);
  const festPlace = (x: number, y: number) => festIcon && run(async () => {
    await api.addFestDecor(me, myTime.date, festIcon, x, y + 6);
    notify('festdecor');
  });
  const festRemove = (d: api.FestDecor) => run(async () => { await api.removeFestDecor(d.id); notify('festdecor'); });
  function startFestDecor() {
    if (!theme) return;
    if (scene !== 'town') enter('town');
    setFestIcon(THEMES[theme].palette[0]);
  }

  // ───── Thú cưng chung ─────
  const petWith: 'me' | 'partner' | null = live.mine.walkPet ? 'me' : theirs?.walkPet ? 'partner' : null;
  useEffect(() => {
    if (petLoaded && !pet) toast('🐾 Ở nhà gỗ có một chiếc ổ trống… vào nhận nuôi một bé nhé');
  }, [petLoaded]); // eslint-disable-line react-hooks/exhaustive-deps
  // Dắt đi dạo ngoài trời một lúc: bé thân hơn và có khi đánh hơi ra đồ hay
  useEffect(() => {
    if (!pet || !live.mine.walkPet || !SCENES[scene].outdoor) return;
    const t = setTimeout(() => {
      const finds = ['shell', 'pebble', 'feather', 'leaf', 'seaglass', 'starfish', 'mushroom'];
      const found = finds[Math.floor(Math.random() * finds.length)];
      api.claim(`pet:walk:${myTime.date}`, [{ id: found, n: 1 }]).then(async ok => {
        if (!ok) return;
        await api.petCare(3, false);
        live.say('🐾');
        toast(`🐾 ${pet.name} đi dạo vui quá, còn đánh hơi ra ${item(found).icon} ${item(found).name}!`);
        notify('pets', 'inventory', 'claims', 'collection');
      }, console.error);
    }, 40_000);
    return () => clearTimeout(t);
  }, [pet?.name, live.mine.walkPet, scene, myTime.date]); // eslint-disable-line react-hooks/exhaustive-deps

  // ───── Chụp ảnh chung: đếm ngược 3 giây cho cả hai cùng tạo dáng ─────
  const [count, setCount] = useState<{ n: number; by: 'me' | 'partner' } | null>(null);
  const [flash, setFlash] = useState(false);
  const [shot, setShot] = useState<HTMLCanvasElement | null>(null);
  function countdown(by: 'me' | 'partner') {
    [3, 2, 1].forEach((n, i) => setTimeout(() => setCount({ n, by }), i * 1000));
    setTimeout(async () => {
      setCount(null);
      if (by === 'me') {
        try {
          const cv = await captureWorld();
          setShot(cv);
          setSheet({ kind: 'photo' });
        } catch (e) { toastError(e); }
      } else toast(`📸 ${partnerName} vừa chụp hai bạn — xem trong 📔 Album nhé`);
      setFlash(true);
      setTimeout(() => setFlash(false), 450);
    }, 3000);
  }
  useEffect(() => onEvent('photo', () => { countdown('partner'); void ping('📸 Cười lên nào!', `${partnerName} đang chụp ảnh hai bạn`); }), []); // eslint-disable-line react-hooks/exhaustive-deps
  function shoot() {
    if (count) return;
    setSheet(null);
    sendEvent('photo');
    countdown('me');
  }

  // ───── Quán cà phê: đọc sách cùng nhau (cùng lật trang) ─────
  const [book, setBook] = useState<{ b: number | null; page: number }>({ b: null, page: 0 });
  const turnBook = (b: number | null, page: number) => { setBook({ b, page }); sendEvent('book', { b, page }); };
  useEffect(() => onEvent('book', (m: { b: number | null; page: number }) => {
    setBook(m);
    if (scene === 'cafe' && m.b !== null) setSheet(sh => sh ?? { kind: 'book' });
  }), [scene]);

  // ───── Sàn nhảy: động tác của hai nhân vật khi bấm trúng nhịp ─────
  const [danceMv, setDanceMv] = useState<{ me?: { m: number; at: number; both?: boolean }; them?: { m: number; at: number; both?: boolean } }>({});
  const danceMove = (who: 'me' | 'them', m: number, both: boolean) => {
    const at = Date.now();
    setDanceMv(d => ({ ...d, [who]: { m, at, both } }));
    setTimeout(() => setDanceMv(d => (d[who]?.at === at ? { ...d, [who]: undefined } : d)), 750);
  };

  // ───── Đài quan sát: máy bay giấy, chạm tay qua kính ─────
  const [planes, setPlanes] = useState<TwinPlane[]>([]);
  const flyPlane = (fromMe: boolean, text: string) => {
    const id = Date.now() + Math.random();
    setPlanes(ps => [...ps, { id, fromMe, text }]);
    setTimeout(() => setPlanes(ps => ps.filter(x => x.id !== id)), 3400);
  };
  useEffect(() => onEvent('twin-plane', (m: { text: string }) => {
    flyPlane(false, m.text);
    toast(`✈️ ${partnerName} gửi máy bay giấy: “${m.text}”`);
    void ping('✈️ Máy bay giấy', `${partnerName}: ${m.text}`);
  }), []); // eslint-disable-line react-hooks/exhaustive-deps
  const sendPlane = (text: string) => { flyPlane(true, text); sendEvent('twin-plane', { text }); };
  const [touch, setTouch] = useState({ me: false, them: false });
  useEffect(() => onEvent('twin-touch', (m: { on: boolean }) => setTouch(t => ({ ...t, them: m.on }))), []);
  const holdTouch = (on: boolean) => { setTouch(t => (t.me === on ? t : { ...t, me: on })); sendEvent('twin-touch', { on }); };
  const touched = touch.me && touch.them;
  useEffect(() => {
    if (!touched) return;
    live.say('💞');
    api.grantCoins(`coins:touch:${myTime.date}`, 50).then(ok => { toast(ok ? '🤚💞 Hai bàn tay chạm nhau qua kính! +50 xu (mỗi ngày một lần)' : '🤚💞 Chạm tay qua kính'); if (ok) notify('profiles'); }, console.error);
  }, [touched]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (scene !== 'twin' && touch.me) holdTouch(false); }, [scene]); // eslint-disable-line react-hooks/exhaustive-deps

  // ───── Vòng đu quay: hôn nhau ở đỉnh ─────
  const ride = Math.max(live.mine.ride ?? 0, partnerHere ? theirs?.ride ?? 0 : 0);
  const myKiss = useRef(0), theirKiss = useRef(0);
  const onKissMatch = useRef(() => {});
  onKissMatch.current = () => {
    live.say('💞');
    api.claim('wheel-kiss', [{ id: 'eternal_lock', n: 1 }], ['wheel-kiss']).then(ok => {
      toast(ok ? '💞 Hai bạn đã hôn nhau trên đỉnh vòng đu quay — theo truyền thuyết, sẽ bên nhau mãi mãi! (+ kỷ vật trong túi)' : '💞 Lại một nụ hôn trên đỉnh vòng quay…');
      if (ok) notify('inventory', 'collection');
    }, console.error);
  };
  useEffect(() => onEvent('wheel-kiss', () => {
    theirKiss.current = Date.now();
    if (theirKiss.current - myKiss.current < 5000) onKissMatch.current();
  }), []);
  function kiss() {
    myKiss.current = Date.now();
    live.say('💋');
    sendEvent('wheel-kiss');
    if (myKiss.current - theirKiss.current < 5000) onKissMatch.current();
    else if (partnerHere) toast('💋 Chờ người ấy cùng bấm…');
  }

  // ───── Lửa trại: câu hỏi chung ─────
  const [campQ, setCampQ] = useState<number | null>(null);
  const [campHeat, setCampHeat] = useState<number | null>(null);
  useEffect(() => onEvent('camp-q', (m: { i: number }) => setCampQ(m.i)), []);
  function askCamp() {
    const i = Math.floor(Math.random() * content.campfire.length);
    setCampQ(i);
    sendEvent('camp-q', { i });
  }

  // ───── Giường: ngủ / thân mật / có em bé (thân mật & em bé cần cả hai đồng ý) ─────
  const callThem = partner?.avatar?.gender === 'm' ? 'anh' : partner?.avatar?.gender === 'f' ? 'em' : partnerName;
  const inBed = (live.mine.act === 'sleep' || live.mine.act === 'intimate') && !!live.mine.bed;
  const [invite, setInvite] = useState<{ kind: 'love' | 'baby'; bed: string } | null>(null);
  useEffect(() => onEvent('bed-invite', (m: { kind: 'love' | 'baby'; bed: string }) => { setInvite(m); void ping(m.kind === 'love' ? '💞 Lời mời' : '👶 Lời mời', m.kind === 'love' ? `${partnerName} đang đợi bạn ở phòng ngủ` : `${partnerName} muốn hai đứa có một em bé`); }), []);
  const answerRef = useRef((_m: { kind: 'love' | 'baby'; ok: boolean; bed: string }) => {});
  answerRef.current = m => {
    if (!m.ok) return toast(m.kind === 'love' ? `😊 ${callThem} bảo để lúc khác nhé` : `😊 ${callThem} muốn đợi thêm chút nữa`);
    if (m.kind === 'love') { goToBed(m.bed); toast('💞 …'); }
    else toast(`🐦 ${callThem} đồng ý rồi! Ngày mai cò sẽ mang em bé tới nhà mình 💕`);
  };
  useEffect(() => onEvent('bed-answer', (m: { kind: 'love' | 'baby'; ok: boolean; bed: string }) => answerRef.current(m)), []);
  function askBed(kind: 'love' | 'baby', bed: string) {
    setSheet(null);
    sendEvent('bed-invite', { kind, bed });
    toast(kind === 'love' ? `💌 Đã gửi lời mời — chờ ${callThem} đồng ý…` : `💌 Đã hỏi ${callThem} — chờ trả lời nhé…`);
  }
  async function answerInvite(ok: boolean) {
    const inv = invite;
    setInvite(null);
    if (!inv) return;
    if (ok && inv.kind === 'love') goToBed(inv.bed);
    if (ok && inv.kind === 'baby') {
      try { await api.planKid(addDays(myTime.date, 1)); notify('kids'); toast('🐦 Ngày mai cò sẽ mang em bé tới nhà mình 💕'); }
      catch (e) { toastError(e); return sendEvent('bed-answer', { kind: inv.kind, ok: false, bed: inv.bed }); }
    }
    sendEvent('bed-answer', { kind: inv.kind, ok, bed: inv.bed });
  }
  const wake = () => live.update({ act: null, bed: null });
  // Đồng ý thân mật: cả hai cùng vào đúng phòng có chiếc giường đó (đang ở chỗ khác thì đi tới luôn), rồi mới kéo rèm
  function goToBed(bedId: string) {
    const bed = decor.find(d => d.id === bedId);
    const room = (bed?.island ?? 'bedroom') as SceneId;
    cancelFishing(); setEditing(false);
    live.update({ scene: room, pos: scene === room ? live.mine.pos : SCENES[room].spawn, act: 'intimate', bed: bedId, dish: null, jump: null });
  }

  // ───── Em bé ─────
  const expecting = kids.find(k => k.born_on > myTime.date);
  // Ngày đầu tiên đi học: ghé trường đúng lúc bé đang học thì ghi vào kỷ niệm
  const firstDay = scene === 'school' || scene === 'campus' ? kids.find(k => k.name && atSchool(k, myTime.date, myTime.hour, myTime.minute) && !k.milestones.includes('school')) : undefined;
  useEffect(() => {
    if (!firstDay) return;
    api.kidMilestone(firstDay.id, 'school').then(ok => { if (ok) { toast(`🌟 Mốc đáng nhớ: 🏫 Ngày đầu tiên đi học của bé ${firstDay.name}!`); notify('kids'); } }, console.error);
  }, [firstDay?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const unnamed = kids.find(k => !k.name && k.born_on <= myTime.date);
  // Con đi học: tối dạy con học, chiều tan học về khoe điểm, 10 ngày họp phụ huynh một lần
  const students = kids.filter(k => k.name && kidStage(k, myTime.date) === 'student');
  const studyLeft = students.reduce((n, k) => n + subjectsOn(myTime.date).filter(s => !scores.some(x => x.kid_id === k.id && x.day === myTime.date && x.subject === s)).length, 0);
  const bragged = useRef('');
  useEffect(() => {
    const dow = new Date(`${myTime.date}T12:00:00`).getDay();
    if (!students.length || dow === 0 || dow === 6 || myTime.hour + myTime.minute / 60 < 16.5 || bragged.current === myTime.date) return;
    bragged.current = myTime.date;
    for (const k of students) {
      if (scores.some(x => x.kid_id === k.id && x.day === myTime.date && x.subject.startsWith('lop'))) continue;
      void bragClassGrade(me, k, myTime.date, scores).then(r => { if (r) toast(`🎒 Bé ${k.name} tan học về khoe: "Hôm nay con được ${r.sc} điểm ${r.subj} đó!"`); });
    }
  }, [students.length, myTime.date, myTime.hour, scores.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const giftShown = useRef('');
  useEffect(() => {
    if (!claimsLoaded || !giftOpen || giftShown.current === myTime.date) return;
    giftShown.current = myTime.date;
    toast('🎁 Hôm nay có quà bất ngờ — bấm “🎁 Quà hôm nay” trên thanh trên để mở nhé!');
  }, [claimsLoaded, giftOpen, myTime.date]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (unnamed) setSheet(sh => sh ?? { kind: 'kidname', id: unnamed.id });
  }, [unnamed?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Phòng hẹn hò
  const room = scene === 'cinema' || scene === 'restaurant' ? scene : null;
  const rtc = useRtc(scene === 'cinema' ? 'cinema' : null, me, partner);

  // ───── Nhà có sẵn nội thất cơ bản (giường, tủ, sofa, tivi...) ─────
  const furnishing = useRef(false);
  useEffect(() => {
    if (!decorLoaded || furnishing.current) return;
    if (decor.some(d => d.island === 'bedroom' || d.island === 'house')) return;
    furnishing.current = true;
    const items = content.homeKit;
    api.claim('home-furnish', items.map(i => ({ id: i.id, n: 1 }))).then(async ok => {
      if (!ok) return;
      for (const i of items) await api.placeDecor(i.id, i.island, i.x, i.y).catch(() => {});
      toast('🏡 Nhà đã có sẵn giường, tủ, sofa, tivi… vào xem nhé!');
      notify('decor', 'inventory');
    }, console.error);
  }, [decorLoaded, decor]);

  // ───── Đồi ngắm cảnh: ai chọn trời sau thì cả hai cùng ngắm ─────
  const skyChoice = shared(live.mine, partnerHere ? theirs : null, 'sky');
  const bathWater = shared(live.mine, partnerHere ? theirs : null, 'bath');
  const seaSpot = shared(live.mine, partnerHere ? theirs : null, 'sea') ?? 'home';
  const [barMenu, setBarMenu] = useState(false);
  // Lặn biển: sổ lặn (những loài đã chạm, lưu trên máy) + rương báu mỗi ngày một viên ngọc trai
  const [reefSeen, setReefSeen] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('hy:reef') ?? '[]'); } catch { return []; } });
  const seeReef = (id: string) => {
    const c = logName(id);
    if (!c) return;
    live.say(`${c.icon} ${c.name}!`);
    toast(`${c.icon} ${c.name} — ${c.fact}`);
    if (!reefSeen.includes(id)) {
      const next = [...reefSeen, id];
      setReefSeen(next);
      try { localStorage.setItem('hy:reef', JSON.stringify(next)); } catch { /* bộ nhớ bị chặn */ }
    }
  };
  const chestKey = `reef-chest:${myTime.date}`;
  const openChest = () => run(async () => {
    if (claimed.includes(chestKey)) { toast('💎 Rương hôm nay mở rồi — mai quay lại nhé'); return; }
    if (await api.claim(chestKey, [{ id: 'pearl', n: 1 }])) { live.say('💎 Tìm được ngọc trai!'); toast('💎 Rương báu có một viên Ngọc trai — đã vào túi!'); notify('claims', 'inventory', 'collection'); }
  });
  const cinemaMode = shared(live.mine, partnerHere ? theirs : null, 'cinema');
  const yt = shared(live.mine, partnerHere ? theirs : null, 'yt') ?? null;
  const setYt = (v: YtState | null) => live.update({ yt: v, ytAt: Date.now() });
  const PHASE_SKY = { dawn: 'dawn', day: 'day', sunset: 'sunset', night: 'night' } as const;
  const hillSky: HillSky = skyChoice === 'real' ? PHASE_SKY[myView.phase] : skyChoice;
  // Đèn trời: thả lên cùng lời ước, người ấy cũng thấy bay lên
  const [lanterns, setLanterns] = useState<Lantern[]>([]);
  const addLantern = (l: Lantern) => {
    setLanterns(ls => [...ls.slice(-12), l]);
    setTimeout(() => setLanterns(ls => ls.filter(x => x.id !== l.id)), 16000);
  };
  useEffect(() => onEvent('lantern', (l: Lantern) => addLantern({ ...l, mine: false })), []);
  function releaseLantern(text: string) {
    const l = { id: Date.now() + Math.random(), x: 15 + Math.random() * 70, text, mine: true };
    addLantern(l);
    sendEvent('lantern', l);
    if (text) toast('🏮 Đèn trời mang điều ước bay lên rồi…');
  }
  function tapMeteor() {
    if (partnerHere) tapStar();
    else setSheet({ kind: 'wish' });
  }

  // ───── Hiển thị ─────
  const [discoMood, setDiscoMood] = useState<Mood>('waltz');
  const editIsland = scene === 'house' || scene === 'bedroom' || scene === 'bathroom' ? scene : scene === 'town' ? 'garden' : scene === 'farm' ? 'farm' : null;
  const plantedAt = (x: number, y: number) => farm.some(r => r.cell === farmCell(x, y));
  const editor = useDecorEditor(inventory, { island: editing ? editIsland : null, decor, blocked: editIsland === 'farm' ? plantedAt : undefined });
  useEffect(() => {
    music.setMood(scene === 'disco' ? discoMood : live.mine.act === 'intimate' ? 'love' : live.mine.act === 'sleep' ? 'night' : scene === 'cafe' ? 'cafe' : scene === 'camp' ? 'camp' : scene === 'beach' || scene === 'lounge' ? 'sea' : scene === 'reef' ? 'deep' : scene === 'sky' ? 'sky' : ['hill', 'bathroom', 'restaurant', 'wheel'].includes(scene) || theme === 'romantic' ? 'love' : myView.phase === 'night' || myView.phase === 'sunset' ? 'night' : 'day');
  }, [myView.phase, scene, theme, live.mine.act, discoMood]);
  const capsulesReady = capsules.filter(c => c.to_id === me.id && !c.opened_at && c.body !== null).length;
  const unread = notes.filter(n => n.to_id === me.id && !n.read_at).length + capsulesReady;
  // ───── Thông báo khi đang chạy nền ─────
  const lastNote = notes.find(n => n.to_id === me.id && !n.read_at)?.id;
  useEffect(() => { if (lastNote) void ping('📮 Thư mới', `${partnerName} vừa gửi thư cho bạn`, 'note'); }, [lastNote]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (partnerOnline) void ping('💗 Người ấy vào resort', `${partnerName} vừa vào làng — vào chơi cùng nhé!`, 'online'); }, [partnerOnline]); // eslint-disable-line react-hooks/exhaustive-deps
  const kidNeeds = kids.filter(k => k.name && k.born_on <= myTime.date && kidMood(k).low.length).map(k => k.name).join(', ');
  useEffect(() => { if (kidNeeds) void ping('👶 Bé cần ba mẹ', `Bé ${kidNeeds} đang đói hoặc buồn ngủ rồi`, 'kid'); }, [kidNeeds, Math.floor(+now / 3 / 3600e3)]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (capsulesReady) toast(`💌 Có ${capsulesReady} thư hẹn giờ đã tới ngày mở — ghé 📮 Hòm thư nhé`); }, [capsulesReady > 0]); // eslint-disable-line react-hooks/exhaustive-deps
  const answeredToday = answers.some(a => a.user_id === me.id && a.day === myTime.date);
  const firstSeat = !partner || me.id < partner.id;
  const close = () => setSheet(null);
  // Nút ra luôn hiện ở các nơi chỉ có cửa vẽ trên nền (dễ bị bỏ sót): công ty, thành phố, cửa hàng, khu vui chơi, nhà, trang trại…
  const EXITS: Partial<Record<SceneId, [SceneId, Pt, string]>> = {
    office: ['city', { x: 128, y: 112 }, '🚪 Ra phố'],
    city: ['town', { x: TOWN.bus.x + 10, y: TOWN.bus.y + 4 }, '🚌 Về làng'],
    shop: ['town', BUILDINGS[1].door, '🚪 Ra ngoài'],
    arcade: ['town', TOWN.toArcade, '🚪 Ra ngoài'],
    house: ['town', BUILDINGS[0].door, '🚪 Ra ngoài'],
    bedroom: ['house', SCENES.bedroom.spawn, '🚪 Ra phòng khách'],
    ranch: ['farm', { x: 230, y: 180 }, '🌾 Về nông trại'],
    farm: ['town', TOWN.toFarm, '🏘️ Về làng'],
    beach: ['town', { x: TOWN.toBeach.x, y: TOWN.toBeach.y - 6 }, '🏘️ Về làng'],
  };
  const liveNow = useRef(live);
  liveNow.current = live;
  // Rửa tay ở bồn rửa mặt (đứng quay lưng, xà phòng + nước)
  // Bồn rửa mặt cạnh gương bị bồn tắm + chậu cây vây quanh: đi tới cạnh bồn cầu rồi bước thẳng vào bồn rửa
  const atSink = (act: 'wash' | 'brush' | 'face') => {
    const [say, ms, done] = act === 'wash' ? ['🧼💦', 4000, '🧼 Tay sạch thơm rồi!'] : act === 'brush' ? ['🪥🫧', 6000, '🪥 Răng trắng tinh, hơi thở thơm mát!'] : ['🫧💦', 5000, '🫧 Mặt mũi tươi tỉnh rồi!'] as const;
    const step = () => {
      live.update({ pos: BATH.sink, act }); live.say(say);
      setTimeout(() => { if (liveNow.current.mine.act === act) { live.update({ act: null }); live.say('✨'); toast(done); } }, ms);
    };
    if (Math.hypot(live.mine.pos.x - BATH.sink.x, live.mine.pos.y - BATH.sink.y) < 3) step(); else go(BATH.toiletStand, step);
  };
  const washHands = () => atSink('wash');
  const exit = !editing && !fishing && !inBed && !festIcon ? EXITS[scene] : undefined;
  // Nhà thể chất: ném bóng rổ (vui thôi, đôi khi vào rổ)
  const shoot3 = () => { const ok = Math.random() < 0.45; live.say(ok ? '🏀 Vàoooo! 🎉' : '🏀 Ối, trượt rồi 😅'); };
  const wxIcon = (v: View | null) => (v?.weather ? (v.weather.type === 'clear' && v.phase === 'night' ? '🌙' : weatherIcon[v.weather.type]) : '');

  return (
    <div className={`game scene-${scene}`}>
      <header className="hud">
        <span className="hud-place">{SCENES[scene].icon} {SCENES[scene].name}</span>
        <span title="Hũ xu chung">🪙 {couple?.coins ?? '…'}</span>
        {partner && partnerView && (
          <span title={`Trời chỗ ${partnerName}`}>
            <i className={`dot ${partnerOnline ? 'on' : ''}`} /> {partnerName}: {clock(partnerView.time)}{liveStatus(partner) ? ` · ${liveStatus(partner)}` : ''}
          </span>
        )}
        {!partner && couple && <span>Mã resort: <b className="code">{couple.invite_code}</b></span>}
        <CallButtons call={call} partnerName={partnerName} partnerMic={!!theirs?.mic} partnerCam={!!theirs?.cam} />
        {call.remote && <RemoteAudio stream={call.remote} />}
        {students.length > 0 && studyTime(myTime.hour) && <button className={`chip ${studyLeft ? 'glow' : ''}`} onClick={() => setSheet({ kind: 'study' })}>📚 Dạy con học{studyLeft ? ` (còn ${studyLeft})` : ' ✓'}</button>}
        {students.length > 0 && meetingDay(myTime.date) && myTime.hour >= 17 && <button className="chip glow" onClick={() => { if (scene !== 'school') enter('school'); setSheet({ kind: 'meeting' }); }}>📣 Họp phụ huynh</button>}
        {unnamed && <button className="chip glow ping" onClick={() => setSheet({ kind: 'kidname', id: unnamed.id })}>🐦 Đón bé về · đặt tên</button>}
        {giftOpen && claimsLoaded && <button className="chip glow ping" onClick={() => setSheet({ kind: 'gift' })}>🎁 Quà hôm nay</button>}
        {/* Trên điện thoại gom phần còn lại vào nút ☰ cho gọn */}
        <button className={`chip hud-toggle ${fests.length || combos.length || expecting || quizLeft ? 'ping' : ''}`} onClick={() => setHudOpen(v => !v)} aria-label="Thêm">{hudOpen ? '✕' : '☰'}</button>
        <span className={`hud-more ${hudOpen ? 'open' : ''}`} onClick={e => { if ((e.target as HTMLElement).closest('button:not([data-keep])')) setHudOpen(false); }}>
        <span title="Số ngày cả hai cùng ghé">💞 {bridge.planks}</span>
        <span title="Điểm thiện cảm — mỗi lần ăn một món +1">💗 {affection}</span>
        <button className={`chip ${quizLeft ? 'glow' : ''}`} onClick={() => setSheet({ kind: 'quizday' })}>🧠 Đố vui {quizRight}/5</button>
        <span title="Trời trong làng">{wxIcon(myView)} {myWeather.temp}° · {clock(myTime)}</span>
        {combos.map(c => {
          const done = claimed.includes(`combo:${c.id}:${myTime.date}`);
          return c.effect === 'stars'
            ? <span key={c.id} className="chip">{c.icon} Ra ngoài cùng chạm sao băng!</span>
            : <button key={c.id} className={`chip ${done ? 'done' : 'glow'}`} disabled={done} onClick={() => claimCombo(c)}>{c.icon} {c.name}{done ? ' ✓' : ' · nhận quà'}</button>;
        })}
        <button data-keep className={`chip ${musicPref.on ? 'on' : ''}`} onClick={() => setMusicPanel(v => !v)} title="Nhạc nền">{musicPref.on ? '🎵' : '🔇'}</button>
        {musicPanel && (
          <span className="music-pop">
            <button data-keep className="chip" onClick={() => setMusic({ ...musicPref, on: !musicPref.on })}>{musicPref.on ? '⏸ Tắt nhạc' : '▶ Bật nhạc lo-fi'}</button>
            <input type="range" min={0} max={1} step={0.05} value={musicPref.vol} aria-label="Âm lượng nhạc"
              onChange={e => setMusic({ ...musicPref, vol: Number(e.target.value) })} />
          </span>
        )}
        <button className="chip" onClick={shoot} title="Chụp ảnh khoảnh khắc (đếm ngược 3 giây)">📸</button>
        <button className="chip" onClick={() => setSheet({ kind: 'calendar' })}>📅 Lịch</button>
        {expecting && <span className="chip glow">🐦 Cò sắp mang bé tới</span>}
        {kids.some(k => k.name && k.born_on <= myTime.date) && <button className="chip" onClick={() => setSheet({ kind: 'kid' })}>👶 Bé</button>}
        {fests.map(f => (
          <button key={f.id} className="chip glow" onClick={startFestDecor} title="Bày thêm đồ trang trí cho ngày hôm nay">{f.icon} {f.name} · 🎀</button>
        ))}
        <button className="chip" onClick={() => setSheet({ kind: 'meetup' })}>
          {meetupLeft === null || meetupLeft < 0 ? '✈️ Hẹn ngày gặp' : meetupLeft === 0 ? '💞 Hôm nay gặp nhau!' : `✈️ Còn ${meetupLeft} ngày`}
        </button>
        </span>
      </header>

      <main className="world">
        <World
          scene={scene} me={me} partner={partner} myView={myView} realView={realView} partnerView={partnerView}
          live={live} partnerHere={!!partnerHere} firstSeat={firstSeat}
          decor={decor} lanterns={lanterns} editing={editing} ghost={editing ? editor.ghost : null} edit={editor.cell} hillSky={hillSky} seaSpot={seaSpot} couple={hugAct} animals={animals} job={myJob} stall={id => setSheet({ kind: 'stall', id })} work={{ desk: () => setSheet({ kind: 'work' }), talk: (n, line) => toast(`💬 ${n}: “${line}”`) }} ranch={{ animal: id => setSheet({ kind: 'animal', id }), shop: () => setSheet({ kind: 'ranchshop' }), workshop: () => setSheet({ kind: 'workshop' }), tailor: () => setSheet({ kind: 'tailor' }) }} onBar={() => setBarMenu(true)} onSee={seeReef} chestOpen={claimed.includes(chestKey)} onChest={openChest} hillReal={skyChoice === 'real'} bath={bathWater} cinemaMode={cinemaMode}
          selectedId={editor.selection?.kind === 'decor' ? editor.selection.id : undefined}
          farm={farm} guests={activeGuests} pickups={pickups} fishing={fishing} combos={combos}
          daysTogether={bridge.planks}
          theme={theme} festDecor={festDecor} festIcon={scene === 'town' ? festIcon : null}
          twin={{ planes, touch }}
          dance={danceMv}
          acts={acts}
          kids={kids} meetupLeft={meetupLeft} pet={pet} petWith={petWith} ride={ride} campHeat={live.mine.act === 'roast' ? campHeat : null}
          screen={scene === 'cinema' ? <CinemaScreen rtc={rtc} mode={cinemaMode} bubbles={live.bubbles} onReact={e => live.say(e)} yt={yt} onYt={setYt} /> : scene === 'restaurant' ? <DinnerTiles remote={call.remoteVideo ? call.remote : null} local={call.cam ? call.local : null} firstSeat={firstSeat} /> : null}
          go={go} enter={enter} arrived={arrived}
          on={{
            farmCell: farmTap,
            game: openGame,
            guest: patGuest,
            pickup: pickUp,
            dock: startFishing,
            kitchen: () => setKitchenOpen(true),
            festPlace,
            festRemove,
            pet: () => setSheet({ kind: 'pet' }),
            bed: d => setSheet({ kind: 'bed', bed: d.id }),
            makeup: seat => go({ x: seat.x, y: seat.y + 6 }, () => {
              live.update({ pos: seat, act: 'makeup' }); live.say('💄');
              setTimeout(() => { if (liveNow.current.mine.act === 'makeup') live.say('✨'); }, 2500);
              setTimeout(() => { if (liveNow.current.mine.act === 'makeup') { live.say('💋'); toast('💄 Trang điểm xong — xinh quá đi!'); } }, 5000);
            }),
            kid: id => setSheet(kids.find(k => k.id === id && !k.name) ? { kind: 'kidname', id } : { kind: 'kid', id }),
            postcard: (city, i, name) => setSheet({ kind: 'postcard', city, i, name }),
            games: () => setSheet({ kind: 'games' }),
            counter: () => setSheet({ kind: 'shop' }),
            mail: () => setSheet({ kind: 'mail' }),
            meteor: tapMeteor,
            wardrobe: () => setSheet({ kind: 'avatar' }),
            pickDecor: d => { setEditing(true); editor.selectDecor(d); toast(`✋ Đã cầm ${item(d.item_id).name}: kéo/chạm chỗ mới, 🔄 xoay, hoặc 📦 cất vào túi`); },
            self: () => setSheet({ kind: 'emote' }),
            star: tapStar,
          }}
        />
        {exit && <button className="exit-chip" onClick={() => enter(exit[0], exit[1])}>{exit[2]}</button>}
      </main>
      {link === 'down' && <div className="link-down">📡 Mất kết nối đồng bộ với người ấy — đang thử nối lại… (kiểm tra mạng, hoặc tải lại trang)</div>}
      {gameInvite && sheet?.kind !== 'game' && <button className="invite-chip" onClick={() => { openGame(gameInvite, false); setGameInvite(null); }}>🎮 Vào chơi {TITLES[gameInvite]}</button>}

      {room ? (
        <div className="room-bar">
          <RoomPanel scene={room} rtc={rtc} call={call} live={live} cinemaMode={cinemaMode} yt={yt} onYt={setYt} inventory={inventory} partnerHere={!!partnerHere} partnerName={partnerName} />
          <button className="btn small ghost leave" onClick={() => enter('town', SCENES.town.spawn)}>🚪 Ra ngoài</button>
        </div>
      ) : scene === 'bathroom' && !editing ? (
        <BathPanel
          water={bathWater} live={live} partnerHere={!!partnerHere} partnerInTub={!!partnerHere && theirs?.act === 'bath'} partnerName={partnerName}
          onEnter={() => go(BATH.stand, () => { live.update({ act: 'bath' }); live.say('🛁'); })}
          onLeaveTub={() => live.update({ act: null, pos: BATH.stand })}
          onSplash={() => doAct('splash')}
          onLeaveRoom={() => enter('bedroom', BATH.toBath)}
          onWash={washHands} onBrush={() => atSink('brush')} onFace={() => atSink('face')}
          onToilet={kind => {
            const sit = kind === 'poop' || me.avatar.gender !== 'm';     // nam tè đứng, nữ tè ngồi, đi nặng thì cùng ngồi
            go(BATH.toiletStand, () => {
              live.update({ act: kind === 'poop' ? 'poop' : sit ? 'peesit' : 'pee', pos: sit ? BATH.toilet : BATH.peeStand });
              live.say(kind === 'poop' ? '💩' : '💧');
              setTimeout(() => { if (['pee', 'peesit', 'poop'].includes(liveNow.current.mine.act ?? '')) { live.update({ act: null, pos: BATH.toiletStand }); toast('🚽 Xong! Ra bồn rửa tay nào 🧼'); setTimeout(washHands, 400); } }, kind === 'poop' ? 6000 : 3500);
            });
          }}
        />
      ) : inBed ? (
        <BedPanel live={live} mode={live.mine.act === 'intimate' ? 'intimate' : 'sleep'} together={!!partnerHere && theirs?.bed === live.mine.bed} callThem={callThem} onWake={wake} />
      ) : festIcon && theme && scene === 'town' ? (
        <FestTray theme={theme} icon={festIcon} onPick={setFestIcon} onDone={() => setFestIcon(null)} />
      ) : scene === 'disco' ? (
        <DanceBar onSong={setDiscoMood} me={me} them={partner?.id ?? ''} themName={partnerName} date={myTime.date} onMove={danceMove} onLeave={() => enter('town', { x: TOWN.fountain.x, y: TOWN.fountain.y + 28 })} />
      ) : scene === 'twin' ? (
        <div className="room-bar">
          <div className="room-panel">
            <p className="muted small-note">🔭 Trời và giờ ở đây là thật của mỗi bên · 📍 chạm ghim trên khung để xem bưu thiếp</p>
            <div className="row wrap">
              <button className={`btn small touch-btn ${touch.me ? 'on' : 'ghost'}`}
                onPointerDown={e => { e.preventDefault(); holdTouch(true); }} onPointerUp={() => holdTouch(false)} onPointerLeave={() => { if (touch.me) holdTouch(false); }} onContextMenu={e => e.preventDefault()}>
                🤚 Giữ để chạm tay qua kính{touched ? ' 💞' : touch.them ? ' · người ấy đang chạm!' : ''}
              </button>
              <button className="btn small ghost" onClick={() => live.say(`🌤️ Bên mình đang ${realWeather ? `${weatherIcon[realWeather.type]} ${realWeather.temp}°` : ''} ${clock(myTime)}`)}>🌤️ Kể trời bên mình</button>
            </div>
            <div className="row wrap">
              {PLANE_NOTES.map(t => <button key={t} className="btn small ghost" onClick={() => sendPlane(t)}>✈️ {t}</button>)}
            </div>
          </div>
          <button className="btn small ghost leave" onClick={() => enter('town', { x: TOWN.twin.x - 10, y: TOWN.twin.y + 4 })}>🚪 Ra ngoài</button>
        </div>
      ) : scene === 'school' ? (
        <SchoolPanel live={live} kids={kids} when={myTime} partnerHere={!!partnerHere} partnerName={partnerName} onLeave={() => enter('campus', CAMPUS.door)}
          onStudy={() => setSheet({ kind: 'study' })} onMeeting={() => (myTime.hour >= 17 ? setSheet({ kind: 'meeting' }) : toast('📣 Họp phụ huynh bắt đầu lúc 17:00 — tới giờ quay lại nhé'))}
          onPickup={k => { enter('town', SCHOOL.door); live.update({ walkKid: k.id }); toast(`🎒 Đón bé ${k.name} tan học — bé nắm tay đi về cùng bạn`); }} />
      ) : scene === 'campus' ? (
        <CampusPanel live={live} kids={kids} when={myTime} partnerHere={!!partnerHere} partnerName={partnerName}
          onClass={() => enter('school')} onStall={id => setSheet({ kind: 'stall', id })} onLeave={() => enter('town', SCHOOL.door)}
          onPickup={k => { enter('town', SCHOOL.door); live.update({ walkKid: k.id }); toast(`🎒 Đón bé ${k.name} tan học — bé nắm tay đi về cùng bạn`); }} />
      ) : scene === 'gym' ? (
        <div className="room-bar">
          <div className="room-panel">
            {placeStatus(!!partnerHere, partnerName, `Rủ ${partnerName} vào nhà thể chất chơi bóng rổ nhé 🏀`)}
            <p className="muted small-note">🏀 Giờ thể dục (14:30–15:30) các môn nhảy dây, bóng rổ, nhịp điệu học trong này; trời mưa hay có tuyết thì cả lớp đều vào đây.</p>
            <div className="row wrap">
              <button className="btn small" onClick={shoot3}>🏀 Ném bóng rổ</button>
              <button className="btn small ghost" onClick={() => live.say('🤸 Lộn một vòng trên đệm!')}>🤸 Nhào lộn</button>
              <button className="btn small ghost" onClick={() => live.say('🏃 Chạy một vòng sân nè!')}>🏃 Chạy vòng</button>
            </div>
            <Chat live={live} placeholder="Nói gì đó…" />
          </div>
          <button className="btn small ghost leave" onClick={() => enter('campus', CAMPUS.gym.door)}>🚪 Ra sân trường</button>
        </div>
      ) : scene === 'reef' ? (
        <ReefPanel live={live} partnerHere={!!partnerHere} partnerName={partnerName} seen={reefSeen} onLeave={() => enter('lounge')} />
      ) : scene === 'sky' ? (
        <SkyPanel live={live} partnerHere={!!partnerHere} partnerName={partnerName} onLeave={() => enter('town', TOWN.fountain)} />
      ) : scene === 'lounge' ? (
        <div className="room-bar">
          <LoungePanel live={live} meName={me.display_name} partnerHere={!!partnerHere} partnerName={partnerName} spot={seaSpot}
            onSpot={sea => live.update({ sea, seaAt: Date.now() })} menu={barMenu} onMenu={setBarMenu} onDive={() => enter('reef')} />
          <button className="btn small ghost leave" onClick={() => { live.update({ act: null, drink: null, dish: null }); enter('beach', { x: BEACH.loungers[0].x, y: BEACH.loungers[0].y + 6 }); }}>🚶 Về bãi biển</button>
        </div>
      ) : scene === 'cafe' || scene === 'wheel' || scene === 'camp' ? (
        <div className="room-bar">
          {scene === 'cafe' && <CafePanel live={live} partnerHere={!!partnerHere} partnerName={partnerName} onBooks={() => setSheet({ kind: 'book' })} />}
          {scene === 'cafe' && <button className="btn small" onClick={() => openGame('focus')}>📚 Cùng học</button>}
          {scene === 'wheel' && (
            <WheelPanel live={live} partnerHere={!!partnerHere} partnerName={partnerName} ride={ride} sky={skyChoice}
              onSky={sky => live.update({ sky, skyAt: Date.now() })}
              onStart={() => { if (Date.now() - ride > RIDE_MS) live.update({ ride: Date.now() }); }} onKiss={kiss} />
          )}
          {scene === 'camp' && <CampPanel live={live} partnerHere={!!partnerHere} partnerName={partnerName} date={myTime.date} claimed={claimed} question={campQ === null ? null : content.campfire[campQ]} onAsk={askCamp} onHeat={setCampHeat} />}
          <button className="btn small ghost leave" onClick={() => (scene === 'cafe' ? enter('town', TOWN.cafe.door) : scene === 'wheel' ? enter('town', TOWN.wheel.stand) : enter('town', { x: 16, y: 62 }))}>🚪 Ra ngoài</button>
        </div>
      ) : scene === 'hill' ? (
        <HillPanel
          choice={skyChoice} live={live} partnerHere={!!partnerHere} partnerName={partnerName}
          onPick={sky => live.update({ sky, skyAt: Date.now() })}
          onLeave={() => enter('town', { x: 352, y: 62 })}
          onLantern={releaseLantern}
        />
      ) : editing && editIsland ? (
        <DecorTray
          island={editIsland} inventory={inventory} editor={editor}
          onDone={() => { setEditing(false); editor.setSelection(null); }}
        />
      ) : fishing ? (
        <div className="fish-bar">
          {fishing === 'bite' ? <FishMeter onResult={land} /> : (
            <>
              <span>🎣 Đang chờ cá cắn câu… phao giật thì canh mũi tên vào đoạn xanh</span>
              <button className="btn" onClick={pullEarly}>Kéo!</button>
            </>
          )}
          <button className="btn small ghost" onClick={() => { cancelFishing(); live.update({ act: null }); }}>Thôi</button>
        </div>
      ) : (
        <nav className="dock">
          <DockButton icon="🗺️" label="Bản đồ" onClick={() => setSheet({ kind: 'map' })} />
          <DockButton icon="🎨" label="Trang trí" onClick={() => (editIsland ? setEditing(true) : toast('🏡 Vào nhà gỗ, phòng ngủ, hoặc ra làng để trang trí vườn nhé'))} />
          <DockButton icon="🎒" label="Túi đồ" onClick={() => setSheet({ kind: 'bag' })} />
          <DockButton icon="📮" label="Thư" badge={unread} onClick={() => setSheet({ kind: 'mail' })} />
          <DockButton icon="💬" label="Câu hỏi" badge={answeredToday ? 0 : 1} onClick={() => setSheet({ kind: 'question' })} />
          <DockButton icon="📔" label="Album" onClick={() => setSheet({ kind: 'album' })} />
          <DockButton icon="📖" label="Sổ tay" onClick={() => setSheet({ kind: 'collection' })} />
          <DockButton icon="⚙️" label="Cài đặt" onClick={() => setSheet({ kind: 'settings' })} />
        </nav>
      )}

      {sheet?.kind === 'map' && (
        <Sheet title="🗺️ Đi đâu đây?" onClose={close}>
          <ul className="places">
            {(Object.keys(SCENES) as SceneId[]).map(id => (
              <li key={id}>
                <span className="place-icon">{SCENES[id].icon}</span>
                <div>
                  <b>{SCENES[id].name}</b>
                  {theirs?.scene === id && <p className="here">💗 {partnerName} đang ở đây</p>}
                </div>
                <button className="btn small" disabled={id === scene} onClick={() => { close(); enter(id); }}>{id === scene ? 'Đang ở đây' : 'Đi'}</button>
              </li>
            ))}
          </ul>
          <button className="btn ghost small" onClick={() => setSheet({ kind: 'guestbook' })}>📒 Sổ khách của làng</button>
        </Sheet>
      )}
      {sheet?.kind === 'mail' && <Mailbox me={me} partner={partner} notes={notes} capsules={capsules} today={myTime.date} meetupDay={meetup?.day ?? null} anniversary={couple?.anniversary ?? null} onClose={close} />}
      {sheet?.kind === 'bed' && (
        <BedSheet partnerHere={!!partnerHere} partnerInBed={!!partnerHere && theirs?.bed === sheet.bed} callThem={callThem}
          canBaby={kids.length < 3 && !expecting}
          onSleep={() => { live.update({ act: 'sleep', bed: sheet.bed }); setSheet(null); toast('😴 Chúc ngủ ngon…'); }}
          onInvite={() => askBed('love', sheet.bed)} onBaby={() => askBed('baby', sheet.bed)} onClose={close} />
      )}
      {sheet?.kind === 'kid' && <KidSheet kids={kids} me={me} partner={partner} today={myTime.date} live={live} pick={sheet.id} onClose={close} />}
      {sheet?.kind === 'animal' && animals.find(a => a.id === sheet.id) && <AnimalSheet animal={animals.find(a => a.id === sheet.id)!} inventory={inventory} onClose={close} />}
      {sheet?.kind === 'stall' && <StallSheet id={sheet.id} coins={couple?.coins ?? 0} onClose={close} />}
      {sheet?.kind === 'ranchshop' && <RanchShopSheet count={animals.length} coins={couple?.coins ?? 0} onClose={close} />}
      {sheet?.kind === 'workshop' && <WorkshopSheet inventory={inventory} together={!!partnerHere} partnerName={partnerName} onClose={close} />}
      {sheet?.kind === 'tailor' && <TailorSheet me={me} partnerName={partnerName} inventory={inventory} outfits={outfits} wearing={me.avatar.design}
        onWear={d => run(async () => { await api.updateProfile(me.id, { avatar: { ...me.avatar, design: d } }); reloadMe(); notify('profiles'); toast(d ? '👕 Đã mặc bộ đồ tự may' : '↩️ Đã mặc lại đồ cũ'); })} onClose={close} />}
      {sheet?.kind === 'work' && <WorkSheet me={me} partner={partner} jobs={jobs} date={myTime.date} onClose={close}
        onSave={async j => { await api.saveJob(me, j); reloadJobs(); notify('jobs'); }}
        onPaid={pay => { notify('profiles'); toast(`💰 Tan làm! Lương hôm nay +${pay} xu — đưa ${partnerName} giữ hết nè 💕`); live.say(`💼 Tan làm rồi, lương +${pay} xu 💰`); void api.sendMessage(me, `💼 Mình tan làm rồi! Lương hôm nay +${pay} xu, đưa ${partnerName} giữ nè 💰💕`).then(() => notify('chat'), () => {}); }}
        onTell={text => { void api.sendMessage(me, text).then(() => { notify('chat'); toast(`💬 Đã kể cho ${partnerName} nghe`); }, toastError); live.say('📢 Kể chuyện công ty nè!'); }} />}
      {sheet?.kind === 'study' && <StudySheet me={me} partner={partner} kids={kids} scores={scores} date={myTime.date} onClose={close} />}
      {sheet?.kind === 'meeting' && <MeetingSheet kids={kids} scores={scores} date={myTime.date} onClose={close} />}
      {sheet?.kind === 'gift' && <DailyGift me={me} date={myTime.date} onClose={close} />}
      {sheet?.kind === 'quizday' && <DailyQuiz date={myTime.date} claimed={claimed} onClose={close} />}
      {sheet?.kind === 'kidname' && kids.find(k => k.id === sheet.id) && <KidNameSheet kid={kids.find(k => k.id === sheet.id)!} onClose={close} />}
      {invite && (
        <InviteModal icon={invite.kind === 'love' ? '💞' : '👶'}
          text={invite.kind === 'love' ? `${partnerName} muốn thân mật với bạn` : `${partnerName} muốn hai đứa có một em bé`}
          onAccept={() => answerInvite(true)} onDecline={() => answerInvite(false)} />
      )}
      {sheet?.kind === 'album' && <AlbumSheet photos={photos} me={me} partner={partner} onClose={close} onShoot={shoot} />}
      {sheet?.kind === 'photo' && shot && <PhotoSheet me={me} shot={shot} scene={scene} place={`${SCENES[scene].icon} ${SCENES[scene].name}`} onClose={close} onRetake={shoot} />}
      {sheet?.kind === 'postcard' && <Postcard city={sheet.city} cityName={sheet.name} i={sheet.i} onClose={close}
        onWish={body => run(async () => { await api.addWish(me, body); notify('wishes'); toast('💌 Đã thêm vào danh sách "Muốn cùng làm"'); close(); })} />}
      {sheet?.kind === 'games' && (
        <Sheet title="🕹️ Trò chơi đôi" onClose={close}>
          <p className="muted">Chọn một trò — người ấy sẽ nhận lời mời vào chơi cùng.</p>
          <div className="games-menu">
            {ARCADE_GAMES.map(g => <button key={g} className="btn ghost" onClick={() => openGame(g)}>{TITLES[g]}</button>)}
          </div>
        </Sheet>
      )}
      {sheet?.kind === 'calendar' && <CalendarSheet me={me} partner={partner} couple={couple} days={days} today={myTime.date} meetup={meetup} onSaved={() => { reloadMe(); reloadPartner(); }} onClose={close} />}
      {sheet?.kind === 'pet' && (
        <PetSheet pet={pet} inventory={inventory} date={myTime.date} walking={!!live.mine.walkPet} partnerWalking={petWith === 'partner'} partnerName={partnerName}
          onWalk={() => { const on = !live.mine.walkPet; live.update({ walkPet: on }); if (on && pet) toast(`🦮 ${pet.name} đi theo bạn rồi — ra ngoài dạo một vòng nhé`); }} onClose={close} />
      )}
      {sheet?.kind === 'book' && <BookSheet book={book.b} page={book.page} partnerHere={!!partnerHere} onPick={b => { turnBook(b, 0); live.update({ act: 'read' }); }} onPage={pg => turnBook(book.b, pg)} onClose={() => { close(); if (live.mine.act === 'read') live.update({ act: null }); setBook({ b: null, page: 0 }); }} />}
      {sheet?.kind === 'settings' && (
        <Settings me={me} couple={couple} onSaved={reloadMe} onClose={close} onAvatar={() => setSheet({ kind: 'avatar' })} />
      )}
      {sheet?.kind === 'avatar' && <AvatarEditor me={me} onSaved={reloadMe} onClose={close} />}
      {sheet?.kind === 'emote' && <EmoteMenu onPick={e => live.say(e)} onClose={close} onEdit={() => setSheet({ kind: 'avatar' })} status={liveStatus(me)} onCouple={partner ? coupleDo : undefined}
        onStatus={st => run(async () => { await api.setStatus(me, st); reloadMe(); notify('profiles'); if (st) toast(`💭 ${partnerName} sẽ thấy: ${st}`); })} />}
      {sheet?.kind === 'bag' && <BagSheet inventory={inventory} partner={partner} onClose={close} />}
      {playing && (() => {
        const pp = { me, partner, date: myTime.date, onLeave: () => setPlaying(null) };
        // Ném tuyết vào mùa đông hoặc lúc làng có tuyết; các mùa khác té nước ở bãi biển
        const winter = myWeather?.type === 'snow' || [12, 1, 2].includes(myTime.month);
        return playing === 'golf' ? <Golf {...pp} /> : playing === 'snow' ? <Snowball {...pp} theme={winter ? 'snow' : 'water'} />
          : playing === 'boat' ? <Boat {...pp} /> : playing === 'hide' ? <HideSeek {...pp} /> : null;
      })()}
      {kitchenOpen && <KitchenRoom me={me} partner={partner} inventory={inventory} date={myTime.date} onLeave={() => setKitchenOpen(false)} />}
      {sheet?.kind === 'shop' && <ShopSheet coins={couple?.coins ?? 0} inventory={inventory} onClose={close} />}
      {sheet?.kind === 'seed' && <SeedSheet inventory={inventory} onPick={c => sow(sheet.cell, c)} onClose={close} />}
      {sheet?.kind === 'plot' && farm.find(r => r.cell === sheet.cell) && (
        <PlotSheet row={farm.find(r => r.cell === sheet.cell)!} today={myTime.date} fertilizer={fertilizer}
          onWater={() => farmDo('water', sheet.cell)} onFertilize={() => farmDo('fertilize', sheet.cell)}
          onHarvest={() => farmDo('harvest', sheet.cell)} onClear={() => farmDo('clear', sheet.cell)} onClose={close} />
      )}
      {sheet?.kind === 'game' && (
        <GameSheet game={sheet.game} me={me} partner={partner} partnerOnline={partnerOnline} date={myTime.date} onClose={close} say={live.say} act={doAct} />
      )}
      {sheet?.kind === 'question' && <QuestionSheet me={me} partner={partner} date={myTime.date} answers={answers} onClose={close} />}
      {sheet?.kind === 'collection' && <CollectionSheet me={me} partner={partner} owned={owned} wishes={wishes} onClose={close} />}
      {sheet?.kind === 'meetup' && <MeetupSheet me={me} meetup={meetup} today={myTime.date} onClose={close} />}
      {sheet?.kind === 'wish' && <WishSheet onSave={saveWish} onClose={close} />}
      {sheet?.kind === 'guestbook' && <GuestbookSheet title="📒 Sổ khách của làng" guests={guests} onClose={close} />}
      <CallTiles call={call} partnerName={partnerName} hidden={scene === 'restaurant'} />
      <ChatDock me={me} partnerName={partnerName} messages={messages} ready={messagesReady}
        onSend={async text => {
          // Bong bóng trên đầu nhân vật + báo người ấy ngay; lưu lại để offline vẫn đọc được
          live.say(text);
          if (messages === null) return true;
          try { await api.sendMessage(me, text); notify('chat'); return true; } catch (e) { toastError(e); return false; }
        }}
        onDelete={m => api.deleteMessage(m.id).then(() => notify('chat'), toastError)} />
      {count && <div className="photo-count"><b>{count.n}</b><span>{count.by === 'me' ? '📸 Tạo dáng nào!' : `📸 ${partnerName} đang chụp — cười lên nào!`}</span></div>}
      {flash && <div className="photo-flash" />}
      {gate && <EnterGate name={me.display_name} greeting={fests[0]?.greet} onEnter={() => { music.unlock(); setGate(false); }} />}
      {meetupLeft === 0 && !fireworksSeen && <Fireworks onClose={() => setFireworksSeen(true)} />}
    </div>
  );
}

function DockButton({ icon, label, badge, onClick }: { icon: string; label: string; badge?: number; onClick: () => void }) {
  return (
    <button className="dock-btn" onClick={onClick}>
      <span className="dock-icon">{icon}{!!badge && <i className="badge">{badge}</i>}</span>
      <small>{label}</small>
    </button>
  );
}

