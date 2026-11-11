// Mọi truy vấn Supabase gom ở đây. RLS phía server lo việc chỉ thấy dữ liệu của cặp đôi mình.
import { supabase } from './supabase';
import type { Gift } from './content';
import type { Plot } from './game';
import type { AvatarLook } from './sprites';
import type { CustomDay } from './festivals';

export interface Profile {
  id: string;
  couple_id: string;
  display_name: string;
  city: string | null;
  lat: number | null;
  lon: number | null;
  tz: string | null;
  avatar: AvatarLook;
  birthday?: string | null;
  status?: string | null;
  status_at?: string | null;
}
export interface Couple { id: string; invite_code: string; coins: number; anniversary?: string | null }
export interface Decor { id: string; owner_id: string; island: string; item_id: string; x: number; y: number; rot?: number }
export interface InvRow { item_id: string; qty: number }
export interface Note { id: string; from_id: string; to_id: string; body: string; gift_item: string | null; read_at: string | null; created_at: string; voice_path?: string | null; voice_secs?: number | null }

const EXPIRED = /jwt expired|token is expired|invalid jwt/i;
let refreshing: Promise<unknown> | null = null;
/** Làm mới phiên đăng nhập (nhiều lệnh cùng lỗi thì chỉ làm mới một lần) */
const refresh = () => (refreshing ??= supabase.auth.refreshSession().finally(() => { refreshing = null; }));

async function run<T>(query: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<T> {
  let { data, error } = await query;
  // Máy ngủ / tab để lâu: token hết hạn mà chưa kịp làm mới → làm mới rồi gửi lại lệnh (builder gửi lại mỗi lần await)
  if (error && EXPIRED.test(error.message)) {
    await refresh();
    ({ data, error } = await query);
  }
  if (error) throw new Error(EXPIRED.test(error.message) ? 'Phiên đăng nhập hết hạn — tải lại trang (Ctrl+F5) giúp mình nhé' : error.message);
  return data as T;
}

// Người chơi & resort
/** Người chơi gắn với trình duyệt này (null nếu chưa vào resort nào) */
export async function getMe() {
  const id = await run<string | null>(supabase.rpc('my_id'));
  return id ? run<Profile | null>(supabase.from('profiles').select('*').eq('id', id).maybeSingle()) : null;
}
export const getPartner = (me: Profile) =>
  run<Profile | null>(supabase.from('profiles').select('*').eq('couple_id', me.couple_id).neq('id', me.id).maybeSingle());
export const getCouple = (id: string) =>
  run<Couple>(supabase.from('couples').select('*').eq('id', id).single());
export const updateProfile = (id: string, fields: Partial<Omit<Profile, 'id' | 'couple_id'>>) =>
  run(supabase.from('profiles').update(fields).eq('id', id));
export const createResort = (name: string) => run<string>(supabase.rpc('create_resort', { p_name: name.trim() }));
export const enterResort = (code: string, name: string) =>
  run<string>(supabase.rpc('enter_resort', { p_code: code, p_name: name.trim() }));

// Trang trí & túi đồ
export const loadDecor = () => run<Decor[]>(supabase.from('decor').select('id, owner_id, island, item_id, x, y, rot'));
export const loadInventory = (userId: string) =>
  run<InvRow[]>(supabase.from('inventory').select('item_id, qty').eq('user_id', userId).gt('qty', 0));
export const placeDecor = (itemId: string, island: string, x: number, y: number, rot = 0) =>
  run<string>(supabase.rpc('place_decor2', { p_item: itemId, p_island: island, p_x: x, p_y: y, p_rot: rot }));
export const moveDecor = (id: string, x: number, y: number, rot = 0) =>
  run(supabase.rpc('move_decor2', { p_id: id, p_x: x, p_y: y, p_rot: rot }));
export const removeDecor = (id: string) => run(supabase.rpc('remove_decor', { p_id: id }));

/** Nhận thưởng một lần theo key; false nếu đã nhận */
export const claim = (key: string, items: Gift[] = [], entries: string[] = []) =>
  run<boolean>(supabase.rpc('claim', { p_key: key, p_items: items, p_entries: entries }));

// Điểm danh & cầu
export const checkin = (me: Profile, day: string) =>
  run(supabase.from('checkins').upsert(
    { user_id: me.id, couple_id: me.couple_id, day },
    { onConflict: 'user_id,day', ignoreDuplicates: true },
  ));
export async function loadBridge(day: string) {
  const [planks, today] = await Promise.all([
    run<number>(supabase.rpc('bridge_planks')),
    run<{ user_id: string }[]>(supabase.from('checkins').select('user_id').eq('day', day)),
  ]);
  return { planks, todayIds: today.map(r => r.user_id) };
}

// Thư
export const loadNotes = () =>
  run<Note[]>(supabase.from('notes').select('*').order('created_at', { ascending: false }).limit(100));
export const sendNote = (me: Profile, toId: string, body: string) =>
  run(supabase.from('notes').insert({ couple_id: me.couple_id, from_id: me.id, to_id: toId, body }));
export const markNotesRead = (me: Profile) =>
  run(supabase.from('notes').update({ read_at: new Date().toISOString() }).eq('to_id', me.id).is('read_at', null));

// ───────── Phase 2 ─────────

export interface Guest {
  id: string;
  user_id: string;
  day: string;
  animal_id: string;
  island: string;
  arrived_at: string;
  left_at: string | null;
  review: string | null;
  stars: number | null;
}
export interface Answer { user_id: string; day: string; question_id: string; answer: string }
export interface Wish { id: string; user_id: string; body: string; created_at: string }
export interface Meetup { day: string; set_by: string }

/** Key các phần thưởng mình đã nhận trong một ngày (nhặt đồ, combo, đảo...) */
/** Điểm thiện cảm: mỗi lần ăn một món = 1 điểm (đếm claim 'aff:' của cả hai người) */
export const loadAffection = (ids: string[]) =>
  run<{ key: string }[]>(supabase.from('claims').select('key').in('user_id', ids).like('key', 'aff:%')).then(r => r.length);
/** Lò nướng của tiệm bánh: các khoá 'oven:…' và 'ovenout:…' của mình (không theo ngày) */
export const loadOven = (userId: string) =>
  run<{ key: string }[]>(supabase.from('claims').select('key').eq('user_id', userId).like('key', 'oven%')).then(r => r.map(x => x.key));
export const loadClaimsOn = (userId: string, day: string) =>
  run<{ key: string }[]>(supabase.from('claims').select('key').eq('user_id', userId).like('key', `%${day}%`))
    .then(rows => rows.map(r => r.key));
export const loadClaimKeys = (ids: string[], prefix: string) =>
  run<{ user_id: string; key: string }[]>(supabase.from('claims').select('user_id, key').in('user_id', ids).like('key', `${prefix}%`));
export const hasClaim = (userId: string, key: string) =>
  run<{ key: string }[]>(supabase.from('claims').select('key').eq('user_id', userId).eq('key', key)).then(r => r.length > 0);
export const collect = (entries: string[]) => run(supabase.rpc('collect', { p_entries: entries }));
export const loadCollection = (userId: string) =>
  run<{ entry_id: string }[]>(supabase.from('collection').select('entry_id').eq('user_id', userId))
    .then(rows => new Set(rows.map(r => r.entry_id)));

export const loadGuests = () =>
  run<Guest[]>(supabase.from('guests').select('*').order('arrived_at', { ascending: false }).limit(400));
export const addGuest = (me: Profile, day: string, animalId: string, island: string) =>
  run(supabase.from('guests').insert({ user_id: me.id, couple_id: me.couple_id, day, animal_id: animalId, island }));
export const farewellGuest = (id: string, review: string, stars: number) =>
  run(supabase.from('guests').update({ left_at: new Date().toISOString(), review, stars }).eq('id', id));

export const loadAnswers = () =>
  run<Answer[]>(supabase.from('question_answers').select('user_id, day, question_id, answer').order('day', { ascending: false }));
export const partnerAnswered = (day: string) => run<boolean>(supabase.rpc('partner_answered', { p_day: day }));
export const sendAnswer = (me: Profile, day: string, questionId: string, answer: string) =>
  run(supabase.from('question_answers').insert({ user_id: me.id, couple_id: me.couple_id, day, question_id: questionId, answer }));

export const loadWishes = () =>
  run<Wish[]>(supabase.from('wishes').select('id, user_id, body, created_at').order('created_at', { ascending: false }));
export const addWish = (me: Profile, body: string) =>
  run(supabase.from('wishes').insert({ couple_id: me.couple_id, user_id: me.id, body }));

// ───── Kỷ niệm chung (020): nhật ký, quà Giáng Sinh, đèn Trung Thu, trang trí cây thông, bưu thiếp ─────
export interface Memory { id: string; couple_id: string; user_id: string; kind: string; day: string; data: Record<string, any>; open_at: string | null; created_at: string } // eslint-disable-line @typescript-eslint/no-explicit-any
export const loadMemories = () => soft(run<Memory[]>(supabase.from('memories').select('*').order('created_at', { ascending: false }).limit(500)), [] as Memory[]);
export const addMemory = (me: Profile, kind: string, data: object, day?: string, openAt?: string) =>
  run(supabase.from('memories').insert({ couple_id: me.couple_id, user_id: me.id, kind, data, ...(day ? { day } : {}), ...(openAt ? { open_at: openAt } : {}) }));
export const delMemory = (id: string) => run(supabase.from('memories').delete().eq('id', id));

export const loadMeetup = () => run<Meetup | null>(supabase.from('meetup').select('day, set_by').maybeSingle());
export const setMeetup = (me: Profile, day: string) =>
  run(supabase.from('meetup').upsert({ couple_id: me.couple_id, day, set_by: me.id, updated_at: new Date().toISOString() }));
export const clearMeetup = (me: Profile) => run(supabase.from('meetup').delete().eq('couple_id', me.couple_id));

// ───────── Nhân vật, vườn, quà, nấu ăn ─────────

export interface GardenRow extends Plot { user_id: string; planted_at: string }

export const loadGarden = () => run<GardenRow[]>(supabase.from('garden').select('*'));
export const plant = (me: Profile, plot: number, cropId: string) =>
  run(supabase.from('garden').insert({ user_id: me.id, couple_id: me.couple_id, plot, crop_id: cropId }));
export const water = (me: Profile, plot: GardenRow, day: string) =>
  run(supabase.from('garden').update({ water_days: plot.water_days + 1, last_watered: day }).eq('user_id', me.id).eq('plot', plot.plot));
export const clearPlot = (me: Profile, plot: number) =>
  run(supabase.from('garden').delete().eq('user_id', me.id).eq('plot', plot));

export const sendGift = (itemId: string, body: string) => run(supabase.rpc('send_gift', { p_item: itemId, p_body: body }));
// ───────── Khung chat chung ─────────
export interface Message { id: string; from_id: string; body: string; created_at: string }
/** 200 tin gần nhất, cũ → mới */
export const loadMessages = async () =>
  (await run<Message[]>(supabase.from('messages').select('id, from_id, body, created_at').order('created_at', { ascending: false }).limit(200))).reverse();
export const sendMessage = (me: Profile, body: string) =>
  run(supabase.from('messages').insert({ couple_id: me.couple_id, from_id: me.id, body }));
export const deleteMessage = (id: string) => run(supabase.from('messages').delete().eq('id', id));

// ───────── Tủ lạnh chung trong bếp ─────────
export const loadFridge = () => run<InvRow[]>(supabase.from('fridge').select('item_id, qty').gt('qty', 0));
export const fridgePut = (items: Gift[]) => run(supabase.rpc('fridge_put', { p_items: items }));
export const fridgeTake = (itemId: string, n = 1) => run(supabase.rpc('fridge_take', { p_item: itemId, p_n: n }));
export const fridgeUse = (items: Gift[]) => run(supabase.rpc('fridge_use', { p_items: items }));
export const craft = (take: Gift[], give: Gift[] = []) => run(supabase.rpc('craft', { p_take: take, p_give: give }));

// ───────── Hũ xu chung ─────────
export const sellItem = (itemId: string, n: number, price: number) =>
  run<number>(supabase.rpc('sell_item', { p_item: itemId, p_n: n, p_price: price }));
export const buyItem = (itemId: string, price: number) => run<number>(supabase.rpc('buy_item', { p_item: itemId, p_price: price }));
export async function buyItems(itemId: string, price: number, n: number) {
  if (n <= 1) return buyItem(itemId, price);
  const r = await supabase.rpc('buy_items', { p_item: itemId, p_price: price, p_n: n });
  if (!r.error) return r.data as number;
  if (!/buy_items|function/i.test(r.error.message)) throw new Error(r.error.message);
  let left = 0; for (let i = 0; i < n; i++) left = await buyItem(itemId, price);
  return left;
}
export const togetherBonus = (day: string, amount: number) =>
  run<boolean>(supabase.rpc('together_bonus', { p_day: day, p_amount: amount }));

// Nông trại chung
export interface FarmRow { cell: number; crop_id: string; planted_by: string; planted_at: string; water_days: number; last_watered: string | null; fertilized: boolean; fert_n?: number; watered_at?: string | null }
export const loadFarm = () => run<FarmRow[]>(supabase.from('farm').select('*'));
export const farmPlant = (cell: number, crop: string) => run(supabase.rpc('farm_plant', { p_cell: cell, p_crop: crop }));
export const farmWater = (cell: number, day: string) => run<boolean>(supabase.rpc('farm_water', { p_cell: cell, p_day: day }));
export const farmFertilize = (cell: number) => run(supabase.rpc('farm_fertilize', { p_cell: cell }));
export const farmHarvest = (cell: number, n: number) => run<string>(supabase.rpc('farm_harvest', { p_cell: cell, p_n: n }));
export const farmClear = (cell: number) => run(supabase.rpc('farm_clear', { p_cell: cell }));

// ───────── Ngày đặc biệt, album, thư hẹn giờ, thú cưng ─────────
export const setAnniversary = (day: string | null) => run(supabase.rpc('set_anniversary', { p_day: day }));

// Kho file riêng của cặp đôi: memories/<couple_id>/<thư mục>/...
const BUCKET = 'memories';
async function upload(me: Profile, folder: string, blob: Blob, ext: string) {
  const path = `${me.couple_id}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type || undefined });
  if (error) throw new Error(error.message);
  return path;
}
/** Link xem file riêng tư (hết hạn sau 1 giờ) */
export async function fileUrls(paths: string[]): Promise<Record<string, string>> {
  if (!paths.length) return {};
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600);
  if (error) throw new Error(error.message);
  return Object.fromEntries((data ?? []).filter(d => d.signedUrl).map(d => [d.path, d.signedUrl]));
}

export interface Photo { id: string; taken_by: string; scene: string; caption: string; data: string; path?: string | null; created_at: string }
export async function loadPhotos() {
  const rows = await run<Photo[]>(supabase.from('photos').select('*').order('created_at', { ascending: false }).limit(120));
  const urls = await fileUrls(rows.filter(r => r.path).map(r => r.path!)).catch(() => ({} as Record<string, string>));
  return rows.map(r => (r.path ? { ...r, data: urls[r.path] ?? '' } : r)).filter(r => r.data);
}
/** Ảnh lưu vào Storage cho nhẹ; nếu chưa tạo kho (chưa chạy 009) thì lưu thẳng trong bảng như cũ */
export async function addPhoto(me: Profile, scene: string, caption: string, dataUrl: string) {
  try {
    const path = await upload(me, 'photos', await (await fetch(dataUrl)).blob(), 'jpg');
    return await run(supabase.from('photos').insert({ couple_id: me.couple_id, taken_by: me.id, scene, caption, path }));
  } catch {
    return run(supabase.from('photos').insert({ couple_id: me.couple_id, taken_by: me.id, scene, caption, data: dataUrl }));
  }
}
export const captionPhoto = (id: string, caption: string) => run(supabase.from('photos').update({ caption }).eq('id', id));
export async function deletePhoto(ph: Photo) {
  if (ph.path) await supabase.storage.from(BUCKET).remove([ph.path]);
  return run(supabase.from('photos').delete().eq('id', ph.id));
}

// Tin nhắn thoại & trạng thái
export async function sendVoice(me: Profile, toId: string, blob: Blob, secs: number) {
  const ext = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : 'webm';
  const path = await upload(me, 'voice', blob, ext);
  return run(supabase.from('notes').insert({ couple_id: me.couple_id, from_id: me.id, to_id: toId, body: `🎙️ Tin nhắn thoại (${secs} giây)`, voice_path: path, voice_secs: secs }));
}
export const setStatus = (me: Profile, status: string | null) =>
  run(supabase.from('profiles').update({ status, status_at: status ? new Date().toISOString() : null }).eq('id', me.id));

export interface Capsule { id: string; from_id: string; to_id: string; body: string | null; open_on: string; created_at: string; opened_at: string | null }
export const loadCapsules = () => run<Capsule[]>(supabase.rpc('my_capsules'));
export const sendCapsule = (me: Profile, toId: string, body: string, openOn: string) =>
  run(supabase.from('capsules').insert({ couple_id: me.couple_id, from_id: me.id, to_id: toId, body, open_on: openOn }));
export const openCapsule = (id: string) => run(supabase.rpc('open_capsule', { p_id: id }));

export type PetKind = 'cat' | 'dog' | 'bunny' | 'corgi' | 'hamster';
export interface Pet { kind: PetKind; name: string; love: number; fed_at: string | null; adopted_at: string }
export const loadPet = () => run<Pet | null>(supabase.from('pets').select('*').maybeSingle());
export const adoptPet = (kind: PetKind, name: string) => run(supabase.rpc('pet_adopt', { p_kind: kind, p_name: name }));
export const petCare = (love: number, feed: boolean) => run<number>(supabase.rpc('pet_care', { p_love: love, p_feed: feed }));
export const renamePet = (name: string) => run(supabase.rpc('pet_rename', { p_name: name }));

// Lịch tự ghi & đồ trang trí ngày lễ
export const loadDays = () => run<CustomDay[]>(supabase.from('special_days').select('*').order('day'));
export const addDay = (me: Profile, d: Omit<CustomDay, 'id' | 'created_by'>) =>
  run(supabase.from('special_days').insert({ ...d, couple_id: me.couple_id, created_by: me.id }));
export const deleteDay = (id: string) => run(supabase.from('special_days').delete().eq('id', id));
export interface FestDecor { id: string; day: string; icon: string; x: number; y: number; placed_by: string }
export const loadFestDecor = (day: string) => run<FestDecor[]>(supabase.from('fest_decor').select('*').eq('day', day));
export const addFestDecor = (me: Profile, day: string, icon: string, x: number, y: number) =>
  run(supabase.from('fest_decor').insert({ couple_id: me.couple_id, placed_by: me.id, day, icon, x: Math.round(x), y: Math.round(y) }));
export const removeFestDecor = (id: string) => run(supabase.from('fest_decor').delete().eq('id', id));

// Em bé
export type CareKind = 'feed' | 'clean' | 'sleep' | 'play';
export interface Kid { id: string; name: string; gender: 'm' | 'f' | null; born_on: string; love: number; fed_at: string | null; bathed_at: string | null; slept_at: string | null; played_at: string | null; milestones: string[]; created_at: string }
// ───── Chăn nuôi, xưởng may, công ty, điểm học (013_life.sql) ─────
/** Bảng chưa tạo (chưa chạy SQL 013) thì trả về rỗng thay vì báo lỗi */
const soft = <T,>(p: Promise<T>, empty: T) => p.catch(e => { if (/relation|does not exist|schema cache|404/i.test(String((e as Error)?.message ?? e))) return empty; throw e; });
export interface Animal { id: string; couple_id: string; kind: string; name: string; fed_at: string | null; collected_at: string | null; bought_by: string | null; created_at: string; feeds?: number; spawned?: number }
export const loadRanch = () => soft(run<Animal[]>(supabase.from('ranch').select('*').order('created_at')), [] as Animal[]);
export const ranchBuy = (kind: string, price: number, name = '') => run<string>(supabase.rpc('ranch_buy', { p_kind: kind, p_price: price, p_name: name }));
export const ranchFeed = (id: string) => run(supabase.rpc('ranch_feed', { p_id: id }));
export const ranchCollect = async (id: string, item: string, n: number, hours: number) => {
  const r = await supabase.rpc('ranch_collect2', { p_id: id, p_item: item, p_n: n, p_minutes: Math.max(1, Math.round(hours * 60)) });
  if (!r.error) return r.data as boolean;
  if (!/ranch_collect2|function/i.test(r.error.message)) throw new Error(r.error.message);
  return run<boolean>(supabase.rpc('ranch_collect', { p_id: id, p_item: item, p_n: Math.min(5, n), p_hours: Math.max(2, Math.round(hours)) }));   // chưa chạy 018
};
export const ranchSpawn = (id: string) => run<string>(supabase.rpc('ranch_spawn', { p_id: id }));
export const ranchSell = (id: string, price: number) => run(supabase.rpc('ranch_sell', { p_id: id, p_price: price }));
export interface OutfitRow { id: string; couple_id: string; user_id: string; name: string; spec: import('./ranch').Design; created_at: string }
export const loadOutfits = () => soft(run<OutfitRow[]>(supabase.from('outfits').select('*').order('created_at')), [] as OutfitRow[]);
export const outfitMake = (name: string, spec: object, take: Gift[]) => run<string>(supabase.rpc('outfit_make', { p_name: name, p_spec: spec, p_take: take }));
export const outfitSell = (id: string, price: number) => run(supabase.rpc('outfit_sell', { p_id: id, p_price: price }));
export interface JobRow { user_id: string; couple_id: string; data: import('./work').JobData; updated_at: string }
export const loadJobs = () => soft(run<JobRow[]>(supabase.from('jobs').select('*')), [] as JobRow[]);
export const saveJob = (me: Profile, data: object) => run(supabase.from('jobs').upsert({ user_id: me.id, couple_id: me.couple_id, data, updated_at: new Date().toISOString() }));
export interface Score { id: string; kid_id: string; day: string; subject: string; score: number; by_user: string | null; created_at: string }
export const loadScores = () => soft(run<Score[]>(supabase.from('kid_scores').select('*').order('day')), [] as Score[]);
export const addScore = (me: Profile, kidId: string, day: string, subject: string, score: number) =>
  run(supabase.from('kid_scores').insert({ couple_id: me.couple_id, kid_id: kidId, day, subject, score, by_user: me.id }));

export const loadKids = () => run<Kid[]>(supabase.from('kids').select('*').order('created_at'));
export const planKid = (due: string) => run<string>(supabase.rpc('kid_plan', { p_due: due }));
export const nameKid = (id: string, name: string, gender: 'm' | 'f') => run(supabase.rpc('kid_name', { p_id: id, p_name: name, p_gender: gender }));
export const careKid = (id: string, kind: CareKind, love: number) => run(supabase.rpc('kid_care', { p_id: id, p_kind: kind, p_love: love }));
export const kidMilestone = (id: string, m: string) => run<boolean>(supabase.rpc('kid_milestone', { p_id: id, p_m: m }));

/** Thưởng xu vào hũ chung (mỗi key nhận một lần) */
export const grantCoins = (key: string, amount: number) => run<boolean>(supabase.rpc('grant_coins', { p_key: key, p_amount: amount }));
