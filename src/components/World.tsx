import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Decor, FarmRow, FestDecor, Guest, Kid, Pet, Profile } from '../lib/api';
import { cradleSprite, kidLook, kidMood, kidSprite, kidStage, strollerSprite } from '../lib/kids';
import { HEIGHT_K, HH, HW } from '../lib/iso';
import { cupSprite, drinkProp, foodProp, marshmallow, wareSprite, type Hold } from '../lib/props';
import { characterSprite } from '../lib/sprites';
import { THEMES, type Theme } from '../lib/festivals';
import type { TwinPlane } from './Twin';
import { discoRoom, hotAirBalloonSprite, kiteSprite, happeningOf, seasonOfMonth, LANDMARKS, PIN_AT, type CityKind, cityKind, citySprite, distanceKm, observatoryRoom, telescopeSprite, cafeBuildingSprite, cafeChairSprite, cafeRoom, cafeTableSprite, campBackground, campfireSprite, ferrisCabinSprite, ferrisFrameSprite, ferrisRimSprite, logSeatSprite, petSprite, tentSprite, wheelCabinSprite, wheelPanorama } from '../lib/places';
import { animal, content, item, type Combo, type Phase, type WeatherType } from '../lib/content';
import { ART, BED_PILLOWS, bedQuiltSprite, emojiPx } from '../lib/furniture';
import { cropDays, needsWater, STAR_PERIOD, starVisible, type Pickup } from '../lib/game';
import { arcadeRoom, picnicSprite, BATH_WATERS, tubBackSprite, tubFrontSprite, type BathWater, chandelierSprite, dinnerTableSprite, farmBackground, farmGateSprite, gameTentSprite, plantSprite, restaurantRoom, shopRoom, soilSprite, velvetChairSprite } from '../lib/interiors';
import { emojiSprite, makeSprite, type Sprite } from '../lib/pixel';
import type { Act } from '../lib/acts';
import { dropSprite } from '../lib/playSprites';
import { cellsOf, floorDepth, isWallCell, rotSize } from '../lib/placement';
import type { Ghost } from '../lib/useDecorEditor';
import { SKY } from '../lib/sky';
import { bobberSprite, cinemaBackground, cloudSprite, dockSprite, palmSprite } from '../lib/sprites';
import { clock, type LocalTime } from '../lib/time';
import {
  beachBackground, bushSprite, cabinSprite, cherrySprite, cinemaSprite, fountainSprite, hillBackground, hillBenchSprite,
  mailboxSprite, moonSprite, pineSprite, restaurantSprite, roomBackground, shopSprite, signSprite,
  sparkleSprite, sunSprite, townBackground, treeSprite, type HillSky,
} from '../lib/townSprites';
import type { Live } from '../lib/useLive';
import { weatherIcon, type Weather } from '../lib/weather';
import {
  ARCADE, BATH, BEACH, RIDE_MS, BUILDINGS, FARM, GARDEN, HOUSE, ROOM, SCENES, SEATS, SHOP, TOWN, WALL_L, WALL_R, RESERVED, farmCell, roomGrid, roomPt, walkTarget, wallSlot,
  type GameId, type Pt, type SceneId,
} from '../lib/world';
import { Avatar, avatarPx } from './Avatar';
import { Spr, Stage, Tag, useScale } from './Stage';
import { LoungeContent } from './Lounge';
import { SeaLife } from './SeaLife';
import { ReefContent } from './Reef';
import { SkyContent } from './Skydive';
import { reefBackground } from '../lib/reef';
import { atSchool, classroomSprite, SCHOOL, schoolSprite } from '../lib/school';
import { SchoolContent } from './School';
import { beachSetSprite, loungeBackground, type SeaSpot } from '../lib/seaView';
import { liveStatus } from './SeedSheet';

export interface Lantern { id: number; x: number; text: string; mine: boolean }

export interface CellEdit {
  down: (x: number, y: number, e?: React.PointerEvent) => void;
  enter: (x: number, y: number, e?: React.PointerEvent) => void;
  up: (x: number, y: number, e?: React.PointerEvent) => void;
}

/** Sự kiện chuột/cảm ứng cho một ô khi đang trang trí, kèm màu xanh/đỏ nếu bóng đang phủ ô đó */
function cellBind(p: { edit: CellEdit; ghost: Ghost | null }, x: number, y: number) {
  const g = p.ghost;
  const hit = g?.cells.some(([cx, cy]) => cx === x && cy === y);
  return {
    hint: hit ? (g!.why ? 'bad' : 'ok') : '',
    events: {
      onPointerDown: (e: React.PointerEvent) => { e.stopPropagation(); p.edit.down(x, y, e); },
      onPointerEnter: (e: React.PointerEvent) => p.edit.enter(x, y, e),
      onPointerUp: (e: React.PointerEvent) => { e.stopPropagation(); p.edit.up(x, y, e); },
      onClick: (e: React.MouseEvent) => e.stopPropagation(),
    },
  };
}

export interface View { weather: Weather | null; time: LocalTime; phase: Phase }

export interface WorldProps {
  scene: SceneId;
  me: Profile;
  partner: Profile | null;
  /** Trời chung trong làng (random theo mùa) */
  myView: View;
  /** Trời thật thành phố mình — chỉ dùng ở Đài quan sát */
  realView: View;
  /** Giờ và trời thật thành phố người ấy */
  partnerView: View | null;
  live: Live;
  partnerHere: boolean;
  firstSeat: boolean;            // mình là "người thứ nhất" (ghế trái, hàng rau trên)
  decor: Decor[];
  editing: boolean;
  ghost: Ghost | null;             // món đang cầm để đặt (xem trước xanh/đỏ)
  edit: CellEdit;
  selectedId?: string;
  farm: FarmRow[];
  guests: Guest[];
  pickups: Pickup[];
  fishing: 'wait' | 'bite' | null;
  combos: Combo[];
  daysTogether: number;
  hillSky: HillSky;              // bầu trời đang ngắm trên đồi
  seaSpot?: SeaSpot;             // nơi đang ngắm biển (ghế ngắm biển)
  onBar?: () => void;            // mở thực đơn quầy bar dừa
  onSee?: (id: string) => void;  // lặn: chạm vào một sinh vật/san hô
  chestOpen?: boolean;           // lặn: rương báu hôm nay đã mở
  onChest?: () => void;
  hillReal: boolean;             // đang chọn "Giờ thật" (theo thời tiết thật)
  bath: BathWater;               // nước tắm đang chọn
  cinemaMode: 'movie' | 'karaoke';
  lanterns: Lantern[];            // đèn trời đang bay trên đồi
  screen?: ReactNode;            // màn hình rạp phim / camera ở nhà hàng
  theme: Theme | null;           // hôm nay là ngày đặc biệt → làng đổi cảnh
  festDecor: FestDecor[];        // đồ hai bạn tự bày cho ngày đặc biệt
  festIcon: string | null;       // đang chọn món để bày (chạm vào làng để đặt)
  pet: Pet | null;
  petWith: 'me' | 'partner' | null; // ai đang dắt bé đi dạo
  ride: number;                  // lúc bắt đầu vòng đu quay (0 = chưa quay)
  campHeat: number | null;       // mình đang nướng kẹo dẻo: độ chín 0..100
  kids: Kid[];                   // các bé đã về nhà
  meetupLeft: number | null;     // còn mấy ngày tới ngày gặp nhau
  dance: { me?: { m: number; at: number; both?: boolean }; them?: { m: number; at: number; both?: boolean } };
  /** Động tác đang làm (té nước, búng tai…) của mình và người ấy */
  acts: { me?: Act; them?: Act };
  twin: { planes: TwinPlane[]; touch: { me: boolean; them: boolean } };
  go: (to: Pt, then?: () => void) => void;
  enter: (scene: SceneId, at?: Pt) => void;
  arrived: () => void;
  on: {
    farmCell: (x: number, y: number) => void;
    game: (g: GameId) => void;
    guest: (g: Guest) => void;
    pickup: (p: Pickup) => void;
    dock: () => void;
    kitchen: () => void;
    counter: () => void;
    mail: () => void;
    self: () => void;
    star: () => void;
    meteor: () => void;
    wardrobe: () => void;
    pickDecor: (d: Decor) => void;   // nhấn giữ / bấm đúp đồ đã bày → cầm lên dời, xoay hoặc cất
    festPlace: (x: number, y: number) => void;
    festRemove: (d: FestDecor) => void;
    pet: () => void;
    bed: (d: Decor) => void;
    kid: (id: string) => void;
    postcard: (city: CityKind, i: number, name: string) => void;
    games: () => void;
  };
}

/** Cảnh cận: nhân vật to hơn cho khớp tỉ lệ với ghế, bàn, đồ đạc vẽ phóng to */
const ZOOM: Partial<Record<SceneId, number>> = { wheel: 1.9, restaurant: 1.5, cafe: 1.2, disco: 1.25 };

const TAN = 'skewY(26.565deg)', TAN_NEG = 'skewY(-26.565deg)';

export function World(props: WorldProps) {
  const { scene, myView, editing } = props;
  const def = SCENES[scene];
  const bg = {
    town: () => townBackground(),
    beach: () => beachBackground(myView.phase),
    lounge: () => loungeBackground(myView.phase, props.seaSpot ?? 'home'),
    reef: () => reefBackground(myView.phase),
    sky: () => undefined,
    school: classroomSprite,
    hill: () => hillBackground(props.hillSky),
    house: () => roomBackground('house'),
    bedroom: () => roomBackground('bedroom'),
    bathroom: () => roomBackground('bath'),
    farm: farmBackground,
    arcade: arcadeRoom,
    shop: shopRoom,
    cinema: cinemaBackground,
    restaurant: restaurantRoom,
    cafe: cafeRoom,
    wheel: wheelCabinBg,
    camp: () => campBackground(myView.phase),
    twin: observatoryRoom,
    disco: discoRoom,
  }[scene]();

  const walkable = (!!def.walk && !editing) || (!!props.festIcon && scene === 'town');
  const follow = editing && scene === 'town'
    ? { x: GARDEN.x + (GARDEN.cols * GARDEN.cw) / 2, y: GARDEN.y + (GARDEN.rows * GARDEN.ch) / 2 }
    : editing && scene === 'farm' ? { x: FARM.x + (FARM.cols * FARM.cw) / 2, y: FARM.y + (FARM.rows * FARM.ch) / 2 }
    : walkable ? props.live.mine.pos : undefined;

  function tap(x: number, y: number) {
    if (props.festIcon && scene === 'town') { props.on.festPlace(x, y); return; }
    // Nông trại: chạm vào ô ruộng → đi tới cạnh ô rồi mở việc của ô đó
    if (scene === 'farm') {
      const cx = Math.floor((x - FARM.x) / FARM.cw), cy = Math.floor((y - FARM.y) / FARM.ch);
      if (cx >= 0 && cy >= 0 && cx < FARM.cols && cy < FARM.rows) {
        props.go({ x: FARM.x + (cx + 0.5) * FARM.cw, y: FARM.y + (cy + 1) * FARM.ch + 3 }, () => props.on.farmCell(cx, cy));
        return;
      }
    }
    const t = walkTarget(scene, { x, y });
    if (t) props.go(t);
  }

  return (
    <Stage
      key={scene}
      w={def.w} h={def.h} bg={bg} className={`world-stage scene-${scene}`}
      onTap={walkable ? tap : undefined}
      follow={follow}
    >
      <SceneContent {...props} />
    </Stage>
  );
}

/** Vùng chạm trong suốt (cửa, quầy, bếp...) */
function Hot({ x, y, w, h, title, onClick }: { x: number; y: number; w: number; h: number; title: string; onClick: () => void }) {
  const s = useScale();
  return (
    <button className="hot" title={title} aria-label={title}
      style={{ left: x * s, top: y * s, width: w * s, height: h * s }}
      onClick={e => { e.stopPropagation(); onClick(); }} />
  );
}

/** Quầng sáng đèn khi trời tối */
function Glow({ x, y, r = 18 }: { x: number; y: number; r?: number }) {
  const s = useScale();
  return <i className="lightglow" style={{ left: (x - r) * s, top: (y - r) * s, width: 2 * r * s, height: 2 * r * s }} />;
}

function itemSprite(itemId: string): Sprite {
  return ART[itemId]?.sprite() ?? emojiSprite(item(itemId).icon, emojiPx(itemId));
}
const decorSprite = (d: Decor) => itemSprite(d.item_id);
/** Chân đế của món đặt trên sàn phòng (đồ vẽ tay neo ở góc trước, đồ emoji ở giữa ô) */
const roomFoot = (d: Decor): Pt => {
  if (ART[d.item_id]) return roomPt(d.x + 1, d.y + 1);
  const c = roomPt(d.x + 0.5, d.y + 0.5);
  return { x: c.x, y: c.y + 4 };
};
/** Thứ tự lớp của đồ trên sàn phòng: món đứng trước luôn vẽ đè món đứng sau (kể cả giường to) */
const roomDepth = (scene: string, decor: Decor[]) =>
  floorDepth(scene, decor.filter(d => d.island === scene && !isWallCell(scene, d.y) && !ART[d.item_id]?.flat), d => Math.round(roomFoot(d).y));

function SceneContent(p: WorldProps) {
  const { scene, me, partner, live, go, enter, on } = p;
  const s = useScale();
  const wx: WeatherType = p.myView.weather?.type ?? 'clear';
  const def = SCENES[scene];
  const seats = SEATS[scene];
  const theirs = live.theirs;
  // Trên đồi: cả hai cùng bấm "Tựa vai" thì ngồi sát lại
  const cuddle = scene === 'hill' && p.partnerHere && live.mine.act === 'cuddle' && theirs?.act === 'cuddle';
  const nudge = (seat: (Pt & { left: boolean }) | undefined) => (seat && cuddle ? { ...seat, x: seat.x + (seat.left ? -4 : 4) } : seat);
  const mySeat = nudge(seats?.[p.firstSeat ? 0 : 1]);
  const theirSeat = nudge(seats?.[p.firstSeat ? 1 : 0]);
  const phase = p.myView.phase;
  const dark = phase === 'night' || phase === 'sunset';
  const realSky = scene !== 'hill' || p.hillReal;
  const sitting = ['cinema', 'hill', 'restaurant', 'cafe', 'wheel', 'camp', 'twin'].includes(scene);
  const inTub = (who: typeof live.mine | null) => scene === 'bathroom' && who?.act === 'bath';
  const bathLook = (look: Profile['avatar']) => ({ ...look, outfit: 15, acc: 12 });
  const myTub = inTub(live.mine) ? BATH.seats[p.firstSeat ? 0 : 1] : null;
  const theirTub = inTub(theirs) ? BATH.seats[p.firstSeat ? 1 : 0] : null;
  const hillDark = ['night', 'meteor', 'aurora'].includes(p.hillSky);
  // Cầm đồ & động tác: nướng kẹo, đọc sách, ăn, nhấp đồ uống
  const holdFor = (who: typeof live.mine | null, mine: boolean): Hold | undefined => {
    if (!who) return undefined;
    if (scene === 'camp' && who.act === 'roast') return { spec: { kind: 'stick', color: marshmallow(mine ? p.campHeat : 55) }, mode: 'roast' };
    if (who.act === 'carry') return { spec: { kind: 'baby', color: '#f7b8cc' }, mode: 'carry' };
    if (scene === 'beach' && who.act === 'fishing') return { spec: { kind: 'rod', color: '#c98a52' }, mode: 'fish' };
    if (scene === 'farm' && who.act === 'water') return { spec: { kind: 'can', color: '#7ac8e8' }, mode: 'pour' };
    if (scene === 'cafe' && who.act === 'read') return { spec: { kind: 'book', color: '#8db8ef' }, mode: 'read' };
    if (scene === 'restaurant' || scene === 'cafe') {
      if (who.dish) return { spec: foodProp(who.dish).utensil, mode: 'eat' };
      if (who.drink) return { spec: drinkProp(who.drink), mode: 'sip' };
    }
    return undefined;
  };
  // Mặc theo trời chung trong làng: mưa che ô, lạnh quàng khăn, rét mặc áo khoác, nắng nóng đội mũ
  const dress = (look: Profile['avatar'], v: View | null) => {
    const w = v?.weather;
    if (scene === 'reef') return { look: { ...look, outfit: 18, acc: 0, glasses: 3 }, umbrella: false };
    if (!def.outdoor || !w || (scene === 'hill' && !p.hillReal) || scene === 'sky') return { look, umbrella: false };
    if ((scene === 'beach' || scene === 'lounge') && w.type !== 'rain' && w.type !== 'snow')
      return { look: { ...look, outfit: 18, acc: 0, glasses: v?.phase === 'night' ? look.glasses ?? 0 : 3 }, umbrella: false };
    let l = look;
    if (w.temp < 3) l = { ...look, outfit: 11, acc: 3 };
    else if (w.temp < 10) l = { ...look, acc: 10 };
    else if (w.temp >= 30 && w.type === 'clear') l = { ...look, acc: look.acc ? look.acc : 6 };
    return { look: l, umbrella: w.type === 'rain' };
  };
  const myDress = dress(me.avatar, p.myView), theirDress = dress(partner?.avatar ?? {}, p.myView);
  const bedOf = (who: typeof live.mine | null) => (who && (who.act === 'sleep' || who.act === 'intimate') && who.bed ? p.decor.find(d => d.id === who.bed && d.island === scene) : undefined);
  const myBed = bedOf(live.mine), theirBed = p.partnerHere ? bedOf(theirs) : undefined;
  // Trong phòng: đứng ở phía trước một món (bên phải hoặc bên dưới chân đồ) thì luôn vẽ đè lên món đó
  const roomItems = def.walk === 'room' ? p.decor.filter(d => d.island === scene && !isWallCell(scene, d.y) && !ART[d.item_id]?.flat) : [];
  const depth = def.walk === 'room' ? roomDepth(scene, p.decor) : new Map<string, number>();
  const zAt = def.walk === 'room' ? (x: number, y: number) => {
    const g = roomGrid({ x, y });
    let z = Math.round(y) + 1;
    for (const d of roomItems) {
      const cells = cellsOf(scene, d.item_id, d.x, d.y, d.rot ?? 0);
      const maxX = Math.max(...cells.map(c => c[0])) + 1, maxY = Math.max(...cells.map(c => c[1])) + 1;
      if (g.gx >= maxX - 0.05 || g.gy >= maxY - 0.05) z = Math.max(z, (depth.get(d.id) ?? Math.round(roomFoot(d).y)) + 1);
    }
    return z;
  } : undefined;

  return (
    <>
      {scene === 'beach' && <Sky phase={phase} wx={wx} combos={p.combos} onStar={on.star} />}

      {scene === 'town' && <TownContent {...p} dark={dark} />}

      {scene === 'lounge' && (
        <LoungeContent phase={phase} hour={p.myView.time.hour} minute={p.myView.time.minute} firstSeat={p.firstSeat} spot={p.seaSpot ?? 'home'} onBar={() => p.onBar?.()}
          me={{ look: myDress.look, live: live.mine, bubble: live.bubbles.me, name: me.display_name }}
          them={p.partnerHere && partner && theirs ? { look: theirDress.look, live: theirs, bubble: live.bubbles.partner, name: partner.display_name } : null} />
      )}

      {scene === 'school' && (
        <>
          <SchoolContent kids={p.kids} me={me} partner={partner} when={p.myView.time} walking={[live.mine.walkKid, theirs?.walkKid]} onKid={id => on.kid(id)} />
          <Hot x={82} y={140} w={28} h={4} title="Ra ngoài" onClick={() => enter('town', SCHOOL.door)} />
        </>
      )}
      {scene === 'reef' && <ReefContent phase={phase} go={go} onSee={id => p.onSee?.(id)} chestOpen={!!p.chestOpen} onChest={() => p.onChest?.()} />}
      {scene === 'sky' && (
        <SkyContent phase={phase} firstSeat={p.firstSeat}
          me={{ look: me.avatar, jump: live.mine.jump, bubble: live.bubbles.me }}
          them={p.partnerHere && partner && theirs ? { look: partner.avatar, jump: theirs.jump, bubble: live.bubbles.partner, name: partner.display_name } : null} />
      )}

      {scene === 'beach' && (
        <>
          {BEACH.loungers.map((l, i) => (
            <Spr key={`lg${i}`} sprite={beachSetSprite(i)} x={l.x} y={l.y} title="⛱️ Ghế dài dưới dù — nằm ngắm biển"
              onClick={() => go({ x: l.x, y: l.y + 6 }, () => enter('lounge'))} />
          ))}
          <Tag x={40} y={58} className="label" onClick={() => go({ x: BEACH.loungers[0].x, y: BEACH.loungers[0].y + 6 }, () => enter('lounge'))}>⛱️ Nằm ngắm biển{theirs?.scene === 'lounge' ? ' 💗' : ''}</Tag>
          <Spr sprite={palmSprite(0)} x={180} y={62} className="palm-sway" />
          <Spr sprite={palmSprite(1)} x={134} y={64} className="palm-sway" />
          <SeaLife phase={phase} spot="home" beach />
          <Spr sprite={signSprite()} x={110} y={54} title="🏘️ Lên làng" onClick={() => go(BEACH.toTown, () => enter('town', { x: TOWN.toBeach.x, y: TOWN.toBeach.y - 6 }))} />
          <Tag x={110} y={44} className="label">🏘️</Tag>
          <Spr sprite={dockSprite()} x={BEACH.dock.x} y={BEACH.dock.y} z={BEACH.water} title="Cầu tàu — ra câu cá" onClick={() => go(BEACH.dock.stand, on.dock)} />
          <Tag x={BEACH.dock.x - 6} y={BEACH.dock.y - 36} className="label" onClick={() => go(BEACH.dock.stand, () => on.game('fishrace'))}>🏁 Câu cá thi</Tag>
          <Tag x={92} y={98} className="label" onClick={() => go({ x: 92, y: 104 }, () => on.game('castle'))}>🏰 Xây lâu đài cát</Tag>
          <Tag x={130} y={112} className="label" onClick={() => go({ x: 130, y: 118 }, () => enter('reef'))}>🤿 Lặn ngắm san hô{theirs?.scene === 'reef' ? ' 💗' : ''}</Tag>
          {p.pickups.map(pk => (
            <Spr key={pk.key} sprite={sparkleSprite()} x={(pk.x / 100) * 192} y={BEACH.wet + 3} className="twinkle" title="Có gì đó lấp lánh"
              onClick={() => go({ x: (pk.x / 100) * 192, y: BEACH.wet + 4 }, () => on.pickup(pk))} />
          ))}
          {p.fishing && <Spr sprite={bobberSprite(p.fishing === 'bite')} x={BEACH.bobber.x} y={BEACH.bobber.y} z={BEACH.water + 1} />}
          {p.fishing === 'bite' && <Tag x={BEACH.bobber.x} y={BEACH.bobber.y - 12} className="alert">!</Tag>}
          {p.partnerHere && theirs?.act === 'fishing' && <Spr sprite={bobberSprite(false)} x={BEACH.bobber.x - 20} y={BEACH.bobber.y + 2} z={BEACH.water + 1} />}
          {p.combos.some(c => c.effect === 'whale') && <div className="fx-whale" style={{ top: (BEACH.water + 2) * s }}>🐋</div>}
          {p.combos.some(c => c.effect === 'frozen') && <div className="fx-ice" style={{ top: BEACH.water * s }} />}
        </>
      )}

      {scene === 'hill' && (
        <>
          <Spr sprite={treeSprite(0)} x={18} y={118} className={hillDark ? 'dim' : p.hillSky === 'sunset' ? 'warm' : ''} />
          <Spr sprite={cherrySprite()} x={176} y={124} className={hillDark ? 'dim' : p.hillSky === 'sunset' ? 'warm' : ''} />
          <Spr sprite={hillBenchSprite()} x={96} y={126} z={110} className={hillDark ? 'dim' : p.hillSky === 'sunset' ? 'warm' : ''} />
          <Spr sprite={picnicSprite()} x={52} y={140} z={112} className={hillDark ? 'dim' : p.hillSky === 'sunset' ? 'warm' : ''} />
          {(hillDark || p.hillSky === 'sunset') && <FairyLights />}
          {hillDark && p.partnerHere && <HeartStars />}
          {cuddle && <Tag x={96} y={92} className="float-hearts">💕</Tag>}
          {p.lanterns.map(l => (
            <div key={l.id} className={`sky-lantern ${l.mine ? 'mine' : ''}`} style={{ left: `${l.x}%` }} title={l.text}>
              <i />{l.text && <span>{l.text}</span>}
            </div>
          ))}
          {(p.hillSky === 'meteor' || (realSky && p.combos.some(c => c.effect === 'stars'))) && <MeteorShower dense={p.hillSky === 'meteor'} onTap={on.meteor} />}
          {p.hillSky === 'aurora' && <div className="fx-aurora" />}
          {['night', 'meteor', 'aurora'].includes(p.hillSky) && <Fireflies n={10} area={[0, 100, 192, 44]} />}
          {realSky && p.combos.some(c => c.effect === 'rainbow') && <Rainbow />}
          <Hot x={0} y={130} w={40} h={14} title="Về làng" onClick={() => enter('town', { x: TOWN.toHill.x, y: TOWN.toHill.y + 4 })} />
          <Tag x={20} y={134} className="label">🏘️ Về làng</Tag>
        </>
      )}

      {(scene === 'house' || scene === 'bedroom' || scene === 'bathroom') && <RoomContent {...p} dark={phase === 'night'} />}

      {scene === 'shop' && (
        <>
          <Spr sprite={emojiSprite('🐱')} x={96} y={63} z={50} title="Mèo bán hàng" className="bob" />
          <Hot x={60} y={50} w={72} h={38} title="Quầy hàng — mua & bán" onClick={() => go(SHOP.counter.stand, on.counter)} />
          <Tag x={96} y={44} className="label">🪙 Mua · Bán</Tag>
          <Glow x={36} y={16} r={16} /><Glow x={156} y={16} r={16} />
          <Hot x={82} y={134} w={28} h={10} title="Ra ngoài" onClick={() => go(SHOP.door, () => enter('town', BUILDINGS[1].door))} />
        </>
      )}

      {scene === 'arcade' && (
        <>
          {ARCADE.map(a => (
            <div key={a.game}>
              <Hot x={a.hot.x0} y={a.hot.y0} w={a.hot.x1 - a.hot.x0} h={a.hot.y1 - a.hot.y0} title={`${a.icon} ${a.name}`} onClick={() => go(a.stand, () => on.game(a.game))} />
              <Tag x={(a.hot.x0 + a.hot.x1) / 2} y={a.hot.y0 - 2} className="label">{a.icon} {a.name}</Tag>
            </div>
          ))}
          <Glow x={96} y={19} r={40} />
          <Tag x={96} y={124} className="label big-tag" onClick={() => on.games()}>🕹️ Tất cả trò chơi đôi</Tag>
          <Hot x={82} y={134} w={28} h={10} title="Ra ngoài" onClick={() => enter('town', TOWN.toArcade)} />
        </>
      )}

      {scene === 'farm' && <FarmContent {...p} />}

      {p.screen}
      {scene === 'cinema' && (p.cinemaMode === 'movie' ? <div className="cinema-dark" /> : <Karaoke />)}
      {scene === 'restaurant' && <RestaurantContent {...p} />}
      {scene === 'cafe' && <CafeContent {...p} dark={dark} />}
      {scene === 'wheel' && <WheelContent {...p} />}
      {scene === 'twin' && <TwinContent {...p} />}
      {scene === 'disco' && <div className="ballroom-lights"><i /><b /></div>}
      {scene === 'camp' && <CampContent {...p} dark={phase === 'night' || phase === 'sunset'} />}
      {p.pet && <PetLayer {...p} mySeat={mySeat} theirSeat={theirSeat} />}

      {/* Nhân vật */}
      {(myBed || theirBed) && <BedLayer {...p} myBed={myBed} theirBed={theirBed} />}
      <KidLayer {...p} mySeat={mySeat} theirSeat={theirSeat} />
      {!myBed && scene !== 'lounge' && scene !== 'sky' && <Avatar
        key={`${scene}-me`} look={myTub ? bathLook(me.avatar) : myDress.look} umbrella={myDress.umbrella}
        x={myTub?.x ?? mySeat?.x ?? live.mine.pos.x} y={myTub?.y ?? mySeat?.y ?? live.mine.pos.y} faceLeft={myTub?.left ?? mySeat?.left}
        sitting={sitting || !!myTub} bubble={live.bubbles.me} onArrive={p.arrived} onClick={scene === 'farm' ? undefined : on.self} hold={holdFor(live.mine, true)} status={liveStatus(me)} zAt={myTub ? undefined : zAt} dance={scene === 'disco' ? p.dance.me : undefined} act={p.acts.me} duo={scene === 'disco' ? { side: p.firstSeat ? 'L' : 'R', together: p.partnerHere } : undefined} swim={scene === 'reef'} torch={scene === 'reef' && phase === 'night'} zoom={ZOOM[scene]}
      />}
      {p.partnerHere && partner && theirs && !theirBed && scene !== 'lounge' && scene !== 'sky' && (
        <Avatar
          key={`${scene}-partner`} look={theirTub ? bathLook(partner.avatar) : theirDress.look} umbrella={theirDress.umbrella} name={partner.display_name}
          x={theirTub?.x ?? theirSeat?.x ?? theirs.pos.x} y={theirTub?.y ?? theirSeat?.y ?? theirs.pos.y} faceLeft={theirTub?.left ?? theirSeat?.left}
          sitting={sitting || !!theirTub} bubble={live.bubbles.partner} hold={holdFor(theirs, false)} status={liveStatus(partner)} zAt={theirTub ? undefined : zAt} dance={scene === 'disco' ? p.dance.them : undefined} act={p.acts.them} duo={scene === 'disco' ? { side: p.firstSeat ? 'R' : 'L', together: true } : undefined} swim={scene === 'reef'} torch={scene === 'reef' && phase === 'night'} zoom={ZOOM[scene]}
        />
      )}

      {def.outdoor && realSky && wx === 'rain' && <div className="px-rain" style={{ '--s': s } as CSSProperties} />}
      {def.outdoor && realSky && wx === 'snow' && <div className="px-snow" style={{ '--s': s } as CSSProperties} />}
      {def.outdoor && realSky && wx === 'fog' && <div className="px-fog" />}
      {def.outdoor && scene !== 'hill' && <div className={`tint tint-${phase}`} />}
      {p.theme && (def.outdoor || scene === 'house') && <FestFall theme={p.theme} />}
      {p.theme && def.outdoor && <div className={`fest-tint fest-${p.theme}`} />}
    </>
  );
}

// ───────── Làng ─────────

function TownContent(p: WorldProps & { dark: boolean }) {
  const { go, enter, on, live, dark } = p;
  const season = seasonOfMonth(p.myView.time.month);
  const theirs = live.theirs;
  const tree = (kind: string) => (kind === 'cherry' ? cherrySprite() : kind === 'pine' ? pineSprite() : treeSprite(Number(kind.slice(-1))));

  return (
    <>
      {TOWN.trees.map(([k, x, y], i) => <Spr key={`t${i}`} sprite={tree(k)} x={x} y={y} className={season === 'autumn' && k !== 'round0' && k !== 'round1' && k !== 'round2' ? '' : `season-${season}`} />)}
      {TOWN.bushes.map(([x, y, v], i) => <Spr key={`b${i}`} sprite={bushSprite(v)} x={x} y={y} className={`season-${season}`} />)}
      <Happening kind={happeningOf(p.myView.time.date)} dark={dark} />
      {season === 'winter' && <div className="season-snow" />}
      {TOWN.lamps.map(([x, y], i) => <Spr key={`l${i}`} sprite={ART.lamp_post.sprite()} x={x} y={y} />)}
      <FerrisWheel x={TOWN.wheel.x} y={TOWN.wheel.y} riding={theirs?.scene === 'wheel'} onClick={() => go(TOWN.wheel.stand, () => enter('wheel'))} />
      <Tag x={TOWN.wheel.x - 4} y={TOWN.wheel.y - 96} className="label" onClick={() => go(TOWN.wheel.stand, () => enter('wheel'))}>🎡 Đu quay{theirs?.scene === 'wheel' ? ' 💗' : ''}</Tag>
      {dark && TOWN.lamps.map(([x, y], i) => <Glow key={`g${i}`} x={x} y={y - 26} />)}
      {TOWN.benches.map(([x, y], i) => <Spr key={`n${i}`} sprite={ART.garden_bench.sprite()} x={x} y={y} />)}
      <Spr sprite={fountainSprite()} x={TOWN.fountain.x} y={TOWN.fountain.y + 12} />
      <Spr sprite={sparkleSprite()} x={TOWN.fountain.x} y={TOWN.fountain.y - 12} className="twinkle" z={TOWN.fountain.y + 13} />
      <Tag x={TOWN.fountain.x} y={TOWN.fountain.y + 36} className="label" onClick={() => go({ x: TOWN.fountain.x, y: TOWN.fountain.y + 28 }, () => enter('disco'))}>💃 Sàn khiêu vũ{theirs?.scene === 'disco' ? ' 💗' : ''}</Tag>

      {BUILDINGS.map(b => {
        const sprite = b.scene === 'house' ? cabinSprite(dark) : b.scene === 'shop' ? shopSprite()
          : b.scene === 'cinema' ? cinemaSprite(dark) : restaurantSprite(dark);
        return (
          <Spr key={b.scene} sprite={sprite} x={b.x} y={b.y} title={`${SCENES[b.scene].icon} ${SCENES[b.scene].name}`}
            onClick={() => go(b.door, () => enter(b.scene))} />
        );
      })}
      {dark && BUILDINGS.map(b => <Glow key={`bg-${b.scene}`} x={b.x} y={b.y - 20} r={30} />)}
      {BUILDINGS.map(b => (theirs?.scene === b.scene || (b.scene === 'house' && theirs?.scene === 'bedroom')) && (
        <Tag key={b.scene} x={b.x} y={b.y - 66} className="hint">💗</Tag>
      ))}

      <Spr sprite={mailboxSprite()} x={TOWN.mailbox.x} y={TOWN.mailbox.y - 2} title="📮 Hộp thư" onClick={() => go(TOWN.mailbox, on.mail)} />
      <Spr sprite={signSprite()} x={TOWN.toBeach.x + 14} y={TOWN.toBeach.y - 4} title="🏖️ Xuống bãi biển" onClick={() => go(TOWN.toBeach, () => enter('beach'))} />
      <Tag x={TOWN.toBeach.x + 14} y={TOWN.toBeach.y - 20} className="label">🏖️</Tag>
      <Spr sprite={signSprite()} x={TOWN.toHill.x - 16} y={TOWN.toHill.y + 6} title="⛰️ Lên đồi ngắm cảnh" onClick={() => go(TOWN.toHill, () => enter('hill'))} />
      <Tag x={TOWN.toHill.x - 16} y={TOWN.toHill.y - 10} className="label">⛰️{theirs?.scene === 'hill' ? ' 💗' : ''}</Tag>
      <Hot x={TOWN.toHill.x - 10} y={0} w={20} h={46} title="⛰️ Lên đồi ngắm cảnh" onClick={() => go(TOWN.toHill, () => enter('hill'))} />

      <Spr sprite={farmGateSprite()} x={TOWN.toFarm.x} y={TOWN.toFarm.y - 4} title="🌾 Nông trại" onClick={() => go(TOWN.toFarm, () => enter('farm'))} />
      <Tag x={TOWN.toFarm.x} y={TOWN.toFarm.y - 42} className="label">🌾 Nông trại{theirs?.scene === 'farm' ? ' 💗' : ''}</Tag>
      <Spr sprite={gameTentSprite()} x={TOWN.toArcade.x} y={TOWN.toArcade.y - 4} title="🎮 Khu vui chơi" onClick={() => go(TOWN.toArcade, () => enter('arcade'))} />
      <Tag x={TOWN.toArcade.x} y={TOWN.toArcade.y - 46} className="label">🎮 Vui chơi{theirs?.scene === 'arcade' ? ' 💗' : ''}</Tag>

      <Spr sprite={cafeBuildingSprite(dark)} x={TOWN.cafe.x} y={TOWN.cafe.y} title="☕ Quán cà phê sách" onClick={() => go(TOWN.cafe.door, () => enter('cafe'))} />
      {dark && <Glow x={TOWN.cafe.x} y={TOWN.cafe.y - 20} r={26} />}
      <Tag x={TOWN.cafe.x} y={TOWN.cafe.y - 68} className="label">☕ Cà phê sách{theirs?.scene === 'cafe' ? ' 💗' : ''}</Tag>
      <Spr sprite={signSprite()} x={TOWN.toSky.x} y={TOWN.toSky.y} title="🪂 Bãi nhảy dù — lên máy bay nhảy dù" onClick={() => go({ x: TOWN.toSky.x - 8, y: TOWN.toSky.y + 6 }, () => enter('sky'))} />
      <Tag x={TOWN.toSky.x} y={TOWN.toSky.y - 16} className="label" onClick={() => go({ x: TOWN.toSky.x - 8, y: TOWN.toSky.y + 6 }, () => enter('sky'))}>🪂 Nhảy dù{theirs?.scene === 'sky' ? ' 💗' : ''}</Tag>
      <Spr sprite={signSprite()} x={34} y={64} title="⛺ Bãi cắm trại" onClick={() => go(TOWN.toCamp, () => enter('camp'))} />
      <Tag x={16} y={30} className="label">⛺ Cắm trại{theirs?.scene === 'camp' ? ' 💗' : ''}</Tag>
      <Hot x={4} y={0} w={24} h={48} title="⛺ Đi theo lối mòn tới bãi cắm trại" onClick={() => go(TOWN.toCamp, () => enter('camp'))} />
      {p.theme && <FestTown {...p} theme={p.theme} />}
      <Spr sprite={schoolSprite()} x={SCHOOL.x} y={SCHOOL.y} title="🏫 Trường học của các bé" onClick={() => go(SCHOOL.door, () => enter('school'))} />
      <Tag x={SCHOOL.x} y={SCHOOL.y - 52} className="label" onClick={() => go(SCHOOL.door, () => enter('school'))}>🏫 Trường học{theirs?.scene === 'school' ? ' 💗' : ''}</Tag>
      <Spr sprite={telescopeSprite()} x={TOWN.twin.x} y={TOWN.twin.y} title="🔭 Đài quan sát hai bờ" onClick={() => go({ x: TOWN.twin.x - 10, y: TOWN.twin.y + 4 }, () => enter('twin'))} />
      <Tag x={TOWN.twin.x} y={TOWN.twin.y - 24} className="label" onClick={() => go({ x: TOWN.twin.x - 10, y: TOWN.twin.y + 4 }, () => enter('twin'))}>🔭{theirs?.scene === 'twin' ? ' 💗' : ''}</Tag>
      {p.meetupLeft !== null && p.meetupLeft >= 0 && <div className="plane-fly"><span>✈️</span><b>{p.meetupLeft === 0 ? '💞 Hôm nay gặp nhau rồi!' : `Còn ${p.meetupLeft} ngày nữa gặp nhau 💕`}</b></div>}

      {/* Vườn hoa trang trí */}
      <GridDecor {...p} island="garden" grid={GARDEN} dark={dark} />
      {p.editing && <GridCells {...p} grid={GARDEN} label="Ô vườn" />}

      {p.guests.map((g, i) => {
        const a = animal(g.animal_id);
        const spot = TOWN.guestSpots[i % TOWN.guestSpots.length];
        return a && <Spr key={g.id} sprite={emojiSprite(a.icon)} x={spot.x} y={spot.y} className="bob" title={a.name} onClick={() => go({ x: spot.x - 12, y: spot.y }, () => on.guest(g))} />;
      })}

      {!dark && season !== 'winter' && <Butterflies />}
      {!dark && !p.theme && <SeasonFall season={season} />}
      {p.myView.phase === 'night' && <Fireflies n={12} area={[286, 206, 90, 60]} />}
    </>
  );
}

type Grid = { x: number; y: number; cw: number; ch: number; cols: number; rows: number };

/** Đồ trang trí trên lưới vuông (vườn hoa, nông trại), có xoay và bóng xem trước */
function GridDecor(p: WorldProps & { island: string; grid: Grid; dark: boolean }) {
  const g = p.grid;
  const place = (itemId: string, x: number, y: number, rot: number) => {
    const [w] = rotSize(itemId, rot);
    return { x: g.x + (x + 1 - w / 2) * g.cw, y: g.y + (y + 1) * g.ch };
  };
  const ghost = p.editing && p.ghost && p.decor.length >= 0 ? p.ghost : null;
  return (
    <>
      {p.decor.filter(d => d.island === p.island).map(d => {
        const at = place(d.item_id, d.x, d.y, d.rot ?? 0);
        return (
          <div key={d.id}>
            <Spr sprite={decorSprite(d)} x={at.x} y={at.y} z={ART[d.item_id]?.flat ? g.y : undefined} flip={!!d.rot}
              onHold={p.editing ? undefined : () => p.on.pickDecor(d)}
              className={`decor ${d.id === p.selectedId ? 'selected' : ''} ${d.id === ghost?.movingId ? 'moving' : ''}`} title={item(d.item_id).name} />
            {p.dark && ART[d.item_id]?.glow && <Glow x={at.x} y={at.y - 26} />}
          </div>
        );
      })}
      {ghost && (() => {
        const at = place(ghost.itemId, ghost.x, ghost.y, ghost.rot);
        return <Spr sprite={itemSprite(ghost.itemId)} x={at.x} y={at.y} z={460} flip={!!ghost.rot} className={`ghost ${ghost.why ? 'bad' : 'ok'}`} />;
      })()}
    </>
  );
}

function GridCells(p: WorldProps & { grid: Grid; label: string; planted?: (x: number, y: number) => boolean }) {
  const s = useScale();
  const g = p.grid;
  return (
    <>
      {Array.from({ length: g.cols * g.rows }, (_, i) => {
        const cx = i % g.cols, cy = Math.floor(i / g.cols);
        const { hint, events } = cellBind(p, cx, cy);
        return (
          <button key={i} className={`px-cell ${hint} ${p.planted?.(cx, cy) ? 'planted' : ''}`} aria-label={`${p.label} ${cx + 1},${cy + 1}`}
            style={{ left: (g.x + cx * g.cw) * s, top: (g.y + cy * g.ch) * s, width: g.cw * s, height: g.ch * s }} {...events} />
        );
      })}
    </>
  );
}

// ───────── Nông trại ─────────

function farmStage(r: FarmRow): 'seed' | 'sprout' | 'grow' | 'ripe' {
  const days = cropDays(r.crop_id);
  if (r.water_days >= days) return 'ripe';
  if (r.water_days === 0) return 'seed';
  return r.water_days * 2 >= days ? 'grow' : 'sprout';
}

function FarmContent(p: WorldProps) {
  const { go, enter, editing } = p;
  const today = p.myView.time.date;
  const dark = p.myView.phase === 'night' || p.myView.phase === 'sunset';
  return (
    <>
      {p.farm.map(r => {
        const cx = r.cell % FARM.cols, cy = Math.floor(r.cell / FARM.cols);
        const x = FARM.x + (cx + 0.5) * FARM.cw, y = FARM.y + (cy + 1) * FARM.ch - 1;
        const stage = farmStage(r);
        const flower = !!content.garden.crops.find(c => c.id === r.crop_id)?.flower;
        return (
          <div key={r.cell}>
            <Spr sprite={soilSprite(r.last_watered === today, r.fertilized)} x={x} y={y} z={FARM.y} />
            {stage === 'ripe'
              ? <><Spr sprite={plantSprite('grow', flower)} x={x} y={y - 2} /><Spr sprite={emojiSprite(item(r.crop_id).icon, 12)} x={x} y={y - 7} className="bob" title={item(r.crop_id).name} /></>
              : <Spr sprite={plantSprite(stage, flower)} x={x} y={y - 2} title={item(r.crop_id).name} />}
            {needsWater(r, today) && !editing && <Tag x={x} y={y - 16} className="hint">💧</Tag>}
          </div>
        );
      })}
      <GridDecor {...p} island="farm" grid={FARM} dark={dark} />
      {editing && <GridCells {...p} grid={FARM} label="Ô ruộng" planted={(x, y) => p.farm.some(r => r.cell === farmCell(x, y))} />}
      <Spr sprite={treeSprite(1)} x={236} y={88} /><Spr sprite={cherrySprite()} x={16} y={96} /><Spr sprite={pineSprite()} x={244} y={150} />
      {!editing && <Hot x={112} y={178} w={32} h={14} title="Về làng" onClick={() => go(FARM.exit, () => enter('town', TOWN.toFarm))} />}
      <Tag x={128} y={176} className="label">🏘️ Về làng</Tag>
      {!dark && <Butterflies />}
    </>
  );
}

// ───────── Nhà hàng ─────────

function RestaurantContent(p: WorldProps) {
  const { live } = p;
  const theirs = live.theirs;
  const [left, right] = SEATS.restaurant!;
  const mine = p.firstSeat ? left : right, other = p.firstSeat ? right : left;
  const plate = (seat: typeof left) => (seat === left ? 84 : 108);
  const cup = (seat: typeof left) => plate(seat) + (seat === left ? -10 : 10);
  return (
    <>
      <Spr sprite={chandelierSprite()} x={96} y={30} z={6} />
      <Glow x={96} y={22} r={46} />
      <Glow x={22} y={40} r={18} /><Glow x={170} y={40} r={18} />
      <Glow x={96} y={100} r={26} />
      <Spr sprite={velvetChairSprite()} x={left.x - 6} y={129} z={100} />
      <Spr sprite={velvetChairSprite()} x={right.x + 6} y={129} z={100} flip />
      <Spr sprite={dinnerTableSprite()} x={96} y={134} z={140} />
      <TableWare who={live.mine} plateX={plate(mine)} cupX={cup(mine)} y={109} />
      {p.partnerHere && theirs && <TableWare who={theirs} plateX={plate(other)} cupX={cup(other)} y={109} />}
      <div className="rest-ambient" />
    </>
  );
}

// ───────── Quán cà phê sách ─────────

function CafeContent(p: WorldProps & { dark: boolean }) {
  const { live } = p;
  const s = useScale();
  const theirs = live.theirs;
  const [left, right] = SEATS.cafe!;
  const mine = p.firstSeat ? left : right, other = p.firstSeat ? right : left;
  const cup = (seat: typeof left) => (seat === left ? 86 : 106);
  const wx = p.myView.weather?.type;
  return (
    <>
      <Spr sprite={cafeChairSprite()} x={left.x - 4} y={128} z={100} />
      <Spr sprite={cafeChairSprite()} x={right.x + 4} y={128} z={100} flip />
      <Spr sprite={cafeTableSprite()} x={96} y={136} z={140} />
      <Spr sprite={emojiSprite('🐈', 10)} x={110} y={63} z={70} className="breathe" title="Mèo nhà quán đang ngủ" />
      <TableWare who={live.mine} plateX={cup(mine)} cupX={cup(mine) + (mine === left ? -9 : 9)} y={112} />
      {p.partnerHere && theirs && <TableWare who={theirs} plateX={cup(other)} cupX={cup(other) + (other === left ? -9 : 9)} y={112} />}
      {(wx === 'rain' || wx === 'snow') && <div className={`win-${wx}`} style={{ position: 'absolute', left: 58 * s, top: 12 * s, width: 76 * s, height: 50 * s, zIndex: 3 }} />}
      {[16, 48, 80, 112, 144, 176].map(x => <Glow key={x} x={x} y={10} r={10} />)}
      <Glow x={96} y={110} r={30} />
      <div className="cafe-ambient" />
    </>
  );
}

/** Bát đĩa trên bàn: món ăn đặt trước mặt; đồ uống đặt cạnh khi tay đang cầm đũa/nĩa (còn không thì đang cầm trên tay) */
function TableWare({ who, plateX, cupX, y }: { who: { dish: string | null; drink: string | null }; plateX: number; cupX: number; y: number }) {
  return (
    <>
      {who.dish && <Spr sprite={wareSprite(foodProp(who.dish).ware)} x={plateX} y={y} z={141} className="pop" />}
      {who.dish && who.drink && <Spr sprite={cupSprite(drinkProp(who.drink))} x={cupX} y={y - 1} z={141} className="pop" />}
    </>
  );
}

// ───────── Đài quan sát hai bờ ─────────

function TwinContent(p: WorldProps) {
  const s = useScale();
  const views = [
    { who: p.me, view: p.realView, x: 8, label: 'Bên bạn', hand: p.twin.touch.me, mine: true },
    { who: p.partner, view: p.partnerView, x: 100, label: p.partner?.display_name ?? 'Người ấy', hand: p.twin.touch.them, mine: false },
  ];
  const km = distanceKm(p.me, p.partner);
  const diff = p.partnerView ? Math.round(((p.partnerView.time.hour * 60 + p.partnerView.time.minute) - (p.myView.time.hour * 60 + p.myView.time.minute)) / 60) : null;
  const both = p.twin.touch.me && p.twin.touch.them;
  const mini = s * 0.75;
  return (
    <>
      {views.map(v => {
        if (!v.who || !v.view) return null;
        const who = v.who;
        const kind = cityKind(who.city);
        const sp = citySprite(kind, v.view.phase, who.city ?? who.id);
        const wx = v.view.weather?.type;
        const av = characterSprite(who.avatar ?? {}, 'idle', undefined, 'front', 0);
        const here = v.mine || p.partnerHere;
        return (
          <div key={v.x} className="twin-panel" style={{ left: (v.x + 2) * s, top: 10 * s, width: 80 * s, height: 70 * s, backgroundImage: `url(${sp.url})`, backgroundSize: '100% 100%' }}>
            {(wx === 'rain' || wx === 'snow') && <i className={`win-${wx}`} />}
            {wx === 'fog' && <i className="twin-fog" />}
            {LANDMARKS[kind].map((l, i) => (
              <button key={l.name} className="twin-pin" title={l.name} style={{ left: PIN_AT[i][0] * s, top: PIN_AT[i][1] * s }}
                onClick={e => { e.stopPropagation(); p.on.postcard(kind, i, who.city ?? ''); }}>{l.icon}</button>
            ))}
            <img src={av.url} alt="" className={`twin-me ${here ? 'wave' : 'away'}`} draggable={false}
              style={{ width: av.w * mini, height: av.h * mini, left: (v.mine ? 60 : 6) * s, bottom: 1 * s }} />
            {v.hand && <span className={`twin-hand ${v.mine ? 'r' : 'l'} ${both ? 'joined' : ''}`}>🤚</span>}
            <span className="twin-label">{v.label} · {who.city ?? ''}<br /><b>{clock(v.view.time)}</b> {v.view.weather ? `${weatherIcon[v.view.weather.type]} ${Math.round(v.view.weather.temp)}°` : ''}</span>
          </div>
        );
      })}
      {both && (
        <div className="twin-beam" style={{ left: 82 * s, top: 26 * s, width: 28 * s, height: 34 * s }}>
          {['💗', '💕', '💞', '💗', '💕'].map((h, i) => <i key={i} style={{ left: `${(i * 23) % 80}%`, animationDelay: `${i * 0.25}s` }}>{h}</i>)}
        </div>
      )}
      {p.twin.planes.map(pl => (
        <div key={pl.id} className={`twin-plane ${pl.fromMe ? 'ltr' : 'rtl'}`} style={{ left: 48 * s, top: 30 * s, '--dx': `${92 * s}px` } as CSSProperties}>
          <span>✈️</span><b>{pl.text}</b>
        </div>
      ))}
      <Tag x={96} y={88} className="twin-link">{km !== null ? `💗 ${km.toLocaleString('vi-VN')} km` : '💗'}{diff ? ` · lệch ${Math.abs(diff)} tiếng` : ''}</Tag>
      {!both && <div className="twin-heart" style={{ left: 50 * s, top: 40 * s, width: 92 * s }}><i>💗</i></div>}
    </>
  );
}

// ───────── Vòng đu quay ─────────

/** Đu quay quay thật: vành + nan hoa xoay chậm (1 vòng = 1 lượt đi), các khoang luôn treo thẳng đứng */
function FerrisWheel({ x, y, riding, onClick }: { x: number; y: number; riding: boolean; onClick: () => void }) {
  const s = useScale();
  const frame = ferrisFrameSprite(), rim = ferrisRimSprite();
  const R = 32, hub = 37;   // tâm vành trong ảnh khung (đã tính viền)
  return (
    <div className="ferris tappable" title="🎡 Vòng đu quay — lên khoang ngắm cảnh" style={{ left: Math.round((x - frame.w / 2) * s), top: Math.round((y - frame.h) * s), width: frame.w * s, height: frame.h * s, zIndex: Math.round(y) }}
      onClick={e => { e.stopPropagation(); onClick(); }}>
      <img src={frame.url} alt="" draggable={false} style={{ width: frame.w * s, height: frame.h * s }} />
      <div className="ferris-rot" style={{ left: (hub - rim.w / 2) * s, top: (hub - rim.h / 2) * s, width: rim.w * s, height: rim.h * s, animationDuration: `${RIDE_MS / 1000}s` }}>
        <img src={rim.url} alt="" draggable={false} style={{ width: rim.w * s, height: rim.h * s }} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2, cab = ferrisCabinSprite(i);
          return (
            <i key={i} className="ferris-arm" style={{ left: (rim.w / 2 + Math.cos(a) * R) * s, top: (rim.h / 2 + Math.sin(a) * R) * s }}>
              <img src={cab.url} alt="" draggable={false} className={riding && i === 0 ? 'ferris-cab ours' : 'ferris-cab'}
                style={{ width: cab.w * s, height: cab.h * s, left: -(cab.w / 2) * s, top: -1.5 * s, animationDuration: `${RIDE_MS / 1000}s` }} />
            </i>
          );
        })}
      </div>
    </div>
  );
}

function wheelCabinBg() {
  return wheelPanorama('night');
}

function WheelContent(p: WorldProps) {
  const s = useScale();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 300);
    return () => clearInterval(t);
  }, []);
  const t = p.ride ? (now - p.ride) / RIDE_MS : -1;
  const h = t >= 0 && t <= 1 ? Math.sin(Math.PI * t) : 0;
  const pano = wheelPanorama(p.hillSky);
  const top = 216 - h * 130;
  const dark = ['night', 'meteor', 'aurora'].includes(p.hillSky);
  return (
    <>
      <div className="wheel-view" style={{ width: 192 * s, height: 144 * s, backgroundImage: `url(${pano.url})`, backgroundSize: `${192 * s}px ${360 * s}px`, backgroundPosition: `0 ${-Math.round(top * s)}px` }} />
      {dark && h > 0.4 && <HeartStars />}
      {p.hillSky === 'meteor' && h > 0.3 && <MeteorShower dense onTap={p.on.meteor} />}
      <Spr sprite={wheelCabinSprite()} x={96} y={144} z={2} className={t >= 0 && t <= 1 ? 'sway' : ''} />
      {h > 0.9 && <Tag x={96} y={20} className="wheel-top">✨ Đỉnh vòng quay ✨</Tag>}
      <Glow x={96} y={6} r={20} />
    </>
  );
}

// ───────── Bãi cắm trại ─────────

function CampContent(p: WorldProps & { dark: boolean }) {
  const s = useScale();
  const [left, right] = SEATS.camp!;
  return (
    <>
      <Spr sprite={tentSprite()} x={156} y={100} />
      <Spr sprite={logSeatSprite()} x={left.x} y={124} z={124} />
      <Spr sprite={logSeatSprite()} x={right.x} y={124} z={124} />
      <Spr sprite={campfireSprite()} x={96} y={128} z={128} />
      <div className="campfire-flame" style={{ left: 88 * s, top: 104 * s, width: 16 * s, height: 22 * s, zIndex: 129 }}><i /><i /><i /></div>
      <div className="sparks" style={{ left: 80 * s, top: 70 * s, width: 32 * s, height: 50 * s }}>{Array.from({ length: 8 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${i * 0.35}s` }} />)}</div>
      <Glow x={96} y={116} r={p.dark ? 56 : 30} />
      {p.dark && <Fireflies n={14} area={[0, 70, 192, 60]} />}
      {p.myView.phase === 'night' && <HeartStars />}
    </>
  );
}

// ───────── Thú cưng chung ─────────

function PetLayer(p: WorldProps & { mySeat?: Pt & { left: boolean }; theirSeat?: Pt & { left: boolean } }) {
  const pet = p.pet!;
  const { scene, live } = p;
  const hungry = !pet.fed_at || Date.now() - new Date(pet.fed_at).getTime() > 12 * 3600e3;
  // Đang được dắt đi dạo: đi theo người dắt; không ai dắt thì ở nhà gỗ
  if (p.petWith === 'me' || (p.petWith === 'partner' && p.partnerHere)) {
    const seat = p.petWith === 'me' ? p.mySeat : p.theirSeat;
    const who = p.petWith === 'me' ? live.mine : live.theirs!;
    const inTub = scene === 'bathroom';
    if (inTub) return null;
    const target = seat ? { x: seat.x + (seat.left ? 13 : -13), y: seat.y + 3 } : { x: who.pos.x - 11, y: who.pos.y + 1 };
    return <PetSprite pet={pet} x={target.x} y={target.y} onClick={p.on.pet} sit={!!seat} />;
  }
  if (scene !== 'house' || p.petWith) return null;
  return <PetAtHome pet={pet} hungry={hungry} onClick={p.on.pet} />;
}

function PetAtHome({ pet, hungry, onClick }: { pet: Pet; hungry: boolean; onClick: () => void }) {
  const spots = useMemo(() => [roomPt(6.4, 6.2), roomPt(3.4, 6.8), roomPt(6.9, 4.8), roomPt(5.6, 6.9), roomPt(4.4, 6)], []);
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI(v => (v + 1 + Math.floor(Math.random() * 3)) % spots.length), 6000);
    return () => clearInterval(t);
  }, [spots.length]);
  const at = spots[i];
  return (
    <>
      <PetSprite pet={pet} x={at.x} y={at.y} onClick={onClick} sleepy={i === 2} />
      {hungry && <Tag x={at.x} y={at.y - 26} className="hint">🍖?</Tag>}
    </>
  );
}

function PetSprite({ pet, x, y, onClick, sit, sleepy }: { pet: Pet; x: number; y: number; onClick: () => void; sit?: boolean; sleepy?: boolean }) {
  const [shown, setShown] = useState({ x, y, ms: 0, left: false });
  const [moving, setMoving] = useState(false);
  const [step, setStep] = useState(false);
  const cur = useRef(shown);
  cur.current = shown;
  useEffect(() => {
    const c = cur.current, dist = Math.hypot(x - c.x, y - c.y);
    if (dist < 0.5) return;
    const ms = (dist / 45) * 1000;
    const t0 = setTimeout(() => { setShown({ x, y, ms, left: x < c.x }); setMoving(true); }, 250);
    const t1 = setTimeout(() => setMoving(false), ms + 260);
    return () => { clearTimeout(t0); clearTimeout(t1); };
  }, [x, y]);
  useEffect(() => {
    if (!moving) return;
    const t = setInterval(() => setStep(v => !v), 150);
    return () => clearInterval(t);
  }, [moving]);
  const sprite = petSprite(pet.kind, moving && step ? 'walk' : sleepy && !sit ? 'sleep' : 'sit');
  const s = useScale();
  return (
    <img src={sprite.url} alt={pet.name} title={`🐾 ${pet.name}`} draggable={false} className="spr tappable pet"
      onClick={e => { e.stopPropagation(); onClick(); }}
      style={{
        left: Math.round((shown.x - sprite.w / 2) * s), top: Math.round((shown.y - sprite.h) * s), width: sprite.w * s, height: sprite.h * s,
        zIndex: Math.round(shown.y) + 2, transform: shown.left ? undefined : 'scaleX(-1)',
        transition: `left ${shown.ms}ms linear, top ${shown.ms}ms linear`,
      }} />
  );
}

// ───────── Giường: ngủ, thân mật ─────────

/** Vị trí gối thứ `slot` trên một chiếc giường đã bày (tọa độ cảnh) */
function pillow(d: Decor, slot: number) {
  const foot = roomPt(d.x + 1, d.y + 1);
  const [lx, ly] = BED_PILLOWS[slot];
  const ox = lx - 2, oy = ly - 3;
  const [gx, gy] = d.rot ? [oy, ox] : [ox, oy];
  return { x: foot.x + (gx - gy) * HW, y: foot.y + (gx + gy) * HH - Math.round(12 * (HEIGHT_K.bed ?? 1)), z: Math.round(foot.y) };
}

function BedLayer(p: WorldProps & { myBed?: Decor; theirBed?: Decor }) {
  const s = useScale();
  const { live } = p;
  const theirs = live.theirs;
  const beds = [...new Map([p.myBed, p.theirBed].filter((d): d is Decor => !!d).map(d => [d.id, d])).values()];
  const intimate = !!p.myBed && p.myBed.id === p.theirBed?.id && live.mine.act === 'intimate' && theirs?.act === 'intimate';
  const sleeping = live.mine.act === 'sleep' && !!p.myBed;
  const head = (look: Profile['avatar'], bed: Decor, slot: number, sleepy: boolean, bubble?: string) => {
    const at = pillow(bed, slot);
    const sp = characterSprite(look, 'sleep');
    const ps = avatarPx(s);
    return (
      <div key={`${bed.id}-${slot}`}>
        <img src={sp.url} alt="" draggable={false} className="spr in-bed"
          style={{ left: Math.round(at.x * s - (sp.w * ps) / 2), top: Math.round(at.y * s - 17 * ps), width: sp.w * ps, height: sp.h * ps, zIndex: at.z + 3, clipPath: 'inset(0 0 50% 0)' }} />
        {sleepy && !intimate && <Tag x={at.x + 6} y={at.y - 14} className="zzz">💤</Tag>}
        {bubble && <Tag x={at.x} y={at.y - 16} className="bed-bubble">{bubble}</Tag>}
      </div>
    );
  };
  const mySlot = p.firstSeat ? 0 : 1, theirSlot = p.firstSeat ? 1 : 0;
  return (
    <>
      {p.myBed && head(p.me.avatar, p.myBed, mySlot, live.mine.act === 'sleep', live.bubbles.me)}
      {p.theirBed && p.partner && head(p.partner.avatar, p.theirBed, theirSlot, theirs?.act === 'sleep', live.bubbles.partner)}
      {beds.map(d => { const f = roomPt(d.x + 1, d.y + 1); return <Spr key={`q-${d.id}`} sprite={bedQuiltSprite()} x={f.x} y={f.y} z={Math.round(f.y) + 2} flip={!!d.rot} />; })}
      {sleeping && !intimate && <div className="sleep-dim" />}
      {intimate && (
        <>
          <div className="love-haze">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ left: `${(i * 23) % 96}%`, animationDelay: `${i * 0.6}s` }}>{['💕', '💗', '✨', '💞'][i % 4]}</i>)}</div>
          <div className="love-curtain"><i /><i /></div>
        </>
      )}
    </>
  );
}

// ───────── Em bé ─────────

function KidLayer(p: WorldProps & { mySeat?: Pt & { left: boolean }; theirSeat?: Pt & { left: boolean } }) {
  const { scene, live } = p;
  const today = p.myView.time.date;
  const born = p.kids.filter(k => k.name && k.born_on <= today);
  if (!born.length) return null;
  const theirs = p.partnerHere ? live.theirs : null;
  const out: ReactNode[] = [];
  let homeIdx = 0;
  for (const k of born) {
    const stage = kidStage(k, today);
    const look = kidLook(k, p.me, p.partner);
    const girl = k.gender === 'f';
    const sad = kidMood(k).low.length > 0;
    const walker = live.mine.walkKid === k.id ? 'me' : live.theirs?.walkKid === k.id ? 'partner' : null;
    if (walker) {
      const who = walker === 'me' ? live.mine : theirs;
      if (!who || (walker === 'partner' && !p.partnerHere) || scene === 'bathroom') continue;
      const seat = walker === 'me' ? p.mySeat : p.theirSeat;
      const at = seat ? { x: seat.x + (seat.left ? -12 : 12), y: seat.y + 3 } : { x: who.pos.x + 10, y: who.pos.y + 1 };
      out.push(<Follower key={k.id} sprite={stage === 'baby' ? strollerSprite() : kidSprite(stage, look, 'idle', girl)} walk={stage === 'baby' ? undefined : kidSprite(stage, look, 'walk', girl)} x={at.x} y={at.y} title={`👶 ${k.name}`} onClick={() => p.on.kid(k.id)} />);
      continue;
    }
    if (stage === 'baby' && scene === 'bedroom') {
      const c = roomPt(4.6, 2.6);
      out.push(
        <div key={k.id}>
          <Spr sprite={cradleSprite()} x={c.x} y={c.y} title={`👶 Nôi của bé ${k.name}`} onClick={() => p.on.kid(k.id)} className="rock" />
          <Spr sprite={kidSprite('baby', look, sad ? 'idle' : 'sleep', girl)} x={c.x - 1} y={c.y - 6} z={Math.round(c.y) + 1} onClick={() => p.on.kid(k.id)} />
          {sad && <Tag x={c.x} y={c.y - 22} className="hint">🍼?</Tag>}
        </div>,
      );
    } else if (stage !== 'baby' && scene === 'house' && !atSchool(k, today, p.myView.time.hour, p.myView.time.minute)) {
      out.push(<KidAtHome key={k.id} idx={homeIdx++} sprite={kidSprite(stage, look, 'idle', girl)} walk={kidSprite(stage, look, 'walk', girl)} sad={sad} onClick={() => p.on.kid(k.id)} name={k.name} />);
    }
  }
  return <>{out}</>;
}

function KidAtHome({ idx, sprite, walk, sad, onClick, name }: { idx: number; sprite: Sprite; walk: Sprite; sad: boolean; onClick: () => void; name: string }) {
  const spots = useMemo(() => [roomPt(2.6, 6.2), roomPt(5.2, 6.4), roomPt(3.6, 5.4), roomPt(6.2, 5.6), roomPt(1.8, 5.2)], []);
  const [i, setI] = useState(idx);
  useEffect(() => {
    const t = setInterval(() => setI(v => (v + 1 + Math.floor(Math.random() * 2)) % spots.length), 5000 + idx * 900);
    return () => clearInterval(t);
  }, [spots.length, idx]);
  const at = spots[i];
  return (
    <>
      <Follower sprite={sprite} walk={walk} x={at.x} y={at.y} title={`👶 ${name}`} onClick={onClick} />
      {sad && <Tag x={at.x} y={at.y - 24} className="hint">🥺</Tag>}
    </>
  );
}

/** Nhân vật nhỏ đi theo (bé, xe đẩy): trễ một nhịp, có bước chân */
function Follower({ sprite, walk, x, y, title, onClick }: { sprite: Sprite; walk?: Sprite; x: number; y: number; title: string; onClick: () => void }) {
  const s = useScale();
  const [shown, setShown] = useState({ x, y, ms: 0, left: false });
  const [moving, setMoving] = useState(false);
  const [step, setStep] = useState(false);
  const cur = useRef(shown);
  cur.current = shown;
  useEffect(() => {
    const c = cur.current, dist = Math.hypot(x - c.x, y - c.y);
    if (dist < 0.5) return;
    const ms = (dist / 45) * 1000;
    const t0 = setTimeout(() => { setShown({ x, y, ms, left: x < c.x }); setMoving(true); }, 300);
    const t1 = setTimeout(() => setMoving(false), ms + 310);
    return () => { clearTimeout(t0); clearTimeout(t1); };
  }, [x, y]);
  useEffect(() => {
    if (!moving) return;
    const t = setInterval(() => setStep(v => !v), 170);
    return () => clearInterval(t);
  }, [moving]);
  const sp = moving && step && walk ? walk : sprite;
  return (
    <img src={sp.url} alt={title} title={title} draggable={false} className="spr tappable"
      onClick={e => { e.stopPropagation(); onClick(); }}
      style={{
        left: Math.round((shown.x - sp.w / 2) * s), top: Math.round((shown.y - sp.h) * s), width: sp.w * s, height: sp.h * s,
        zIndex: Math.round(shown.y) + 2, transform: shown.left ? 'scaleX(-1)' : undefined,
        transition: `left ${shown.ms}ms linear, top ${shown.ms}ms linear`,
      }} />
  );
}

// ───────── Mùa & điều bất ngờ mỗi ngày ─────────

function SeasonFall({ season }: { season: ReturnType<typeof seasonOfMonth> }) {
  if (season === 'spring') return <Petals />;
  if (season === 'summer') return null;
  const items = season === 'autumn' ? ['🍂', '🍁', '🍂'] : ['❄', '❅', '❆'];
  return (
    <div className={`fest-fall season-fall ${season}`} aria-hidden>
      {Array.from({ length: 9 }, (_, i) => <i key={i} style={{ left: `${(i * 23 + 7) % 100}%`, animationDelay: `${i * 1.4}s`, animationDuration: `${10 + (i % 3) * 3}s` }}>{items[i % items.length]}</i>)}
    </div>
  );
}

function Happening({ kind, dark }: { kind: ReturnType<typeof happeningOf>; dark: boolean }) {
  const s = useScale();
  if (kind === 'balloons' && !dark) return (
    <>
      {['#f59ab3', '#f6c64e', '#8db8ef'].map((c, i) => (
        <div key={c} className="drift-balloon" style={{ top: (6 + i * 9) * s, animationDelay: `${-i * 9}s`, animationDuration: `${38 + i * 6}s` }}>
          <img src={hotAirBalloonSprite(c).url} alt="" style={{ width: 16 * s, height: 24 * s }} />
        </div>
      ))}
    </>
  );
  if (kind === 'birds' && !dark) return (
    <div className="bird-flock" style={{ top: 18 * s }}>
      {Array.from({ length: 7 }, (_, i) => <i key={i} style={{ left: `${i * 14}px`, top: `${Math.abs(3 - i) * 6}px`, animationDelay: `${i * 0.1}s` }}>︶</i>)}
    </div>
  );
  if (kind === 'kites' && !dark) return (
    <>
      <Spr sprite={kiteSprite('#e86a7a')} x={70} y={176} z={600} className="kite" />
      <Spr sprite={kiteSprite('#8db8ef')} x={128} y={168} z={600} className="kite k2" />
    </>
  );
  if (kind === 'cat') return (
    <>
      <Spr sprite={petSprite('cat', dark ? 'sleep' : 'sit')} x={TOWN.benches[1][0] + 4} y={TOWN.benches[1][1] - 5} title="Mèo hoang ghé chơi" className="bob" />
      {!dark && <Tag x={TOWN.benches[1][0] + 4} y={TOWN.benches[1][1] - 22} className="hint">meo~</Tag>}
    </>
  );
  return null;
}

// ───────── Ngày đặc biệt: cảnh làng ─────────

function FestTown(p: WorldProps & { theme: Theme }) {
  const th = THEMES[p.theme];
  const props: [number, number][] = [[150, 150], [234, 150], [176, 206], [210, 206], [120, 176], [266, 180]];
  return (
    <>
      {TOWN.lamps.map(([x, y], i) => <Spr key={`fh${i}`} sprite={emojiSprite(th.hang, 9)} x={x + 5} y={y - 22} z={y + 1} className="swing" />)}
      {props.map(([x, y], i) => <Spr key={`fp${i}`} sprite={emojiSprite(th.props[i % th.props.length], 14)} x={x} y={y} className={i % 2 ? 'bob' : ''} />)}
      {p.theme === 'romantic' && <Spr sprite={emojiSprite('💞', 22)} x={TOWN.fountain.x} y={TOWN.fountain.y - 18} z={TOWN.fountain.y + 14} className="bob" />}
      {p.theme === 'winter' && <Spr sprite={emojiSprite('🎄', 34)} x={150} y={146} />}
      {p.theme === 'party' && <Spr sprite={emojiSprite('🎂', 22)} x={TOWN.fountain.x} y={TOWN.fountain.y - 16} z={TOWN.fountain.y + 14} className="bob" />}
      <Tag x={TOWN.fountain.x} y={84} className={`fest-banner fest-${p.theme}`}>{({ romantic: '💕 Ngày của hai đứa 💕', party: '🎉 Hôm nay vui quá 🎉', calm: '🌸 Một ngày đáng nhớ 🌸', tet: '🧧 Chúc Mừng Năm Mới 🧧', lantern: '🏮 Trung Thu Đoàn Viên 🏮', winter: '🎄 Merry Christmas 🎄' })[p.theme]}</Tag>
      {p.festDecor.map(d => (
        <Spr key={d.id} sprite={emojiSprite(d.icon, 14)} x={d.x} y={d.y} title={p.festIcon ? 'Chạm để gỡ' : ''}
          className={p.festIcon ? 'fest-item removable' : 'fest-item'}
          onClick={p.festIcon ? () => p.on.festRemove(d) : undefined}
          onHold={p.festIcon ? undefined : () => p.on.festRemove(d)} />
      ))}
    </>
  );
}

function FestFall({ theme }: { theme: Theme }) {
  const items = THEMES[theme].fall;
  return (
    <div className="fest-fall" aria-hidden>
      {Array.from({ length: 12 }, (_, i) => (
        <i key={i} style={{ left: `${(i * 17 + 3) % 100}%`, animationDelay: `${i * 1.1}s`, animationDuration: `${8 + (i % 4) * 2}s` }}>{items[i % items.length]}</i>
      ))}
    </div>
  );
}

// ───────── Phòng (nhà gỗ, phòng ngủ) ─────────

function RoomContent(p: WorldProps & { dark: boolean }) {
  const { scene, go, enter, on, editing } = p;
  const s = useScale();
  const island = scene;
  const decor = p.decor.filter(d => d.island === island);
  const depth = roomDepth(island, decor);
  const pv = p.partnerView;
  const [top, bottom] = SKY[pv?.phase ?? p.myView.phase];
  const win = roomPt(3, 0);

  return (
    <>
      {/* Cửa sổ nhìn sang trời bên người ấy */}
      <div className="house-window" title="Cửa sổ nhìn ra trời làng"
        style={{ left: win.x * s, top: (win.y - 39) * s, width: 30 * s, height: 25 * s, transform: TAN, background: `linear-gradient(${top}, ${bottom})` }}>
        {pv && <span>{p.myView.weather ? weatherIcon[p.myView.weather.type] : ''} {clock(pv.time)}</span>}
        {p.myView.weather?.type === 'rain' && <i className="win-rain" />}
        {p.myView.weather?.type === 'snow' && <i className="win-snow" />}
      </div>
      {scene === 'house' && <Tag x={HOUSE.calendar.x} y={HOUSE.calendar.y - 4} className="calendar">💞 {p.daysTogether}</Tag>}

      {decor.map(d => {
        const sel = d.id === p.selectedId ? 'selected' : '';
        if (isWallCell(island, d.y)) {
          const c = wallSlot(d.y, d.x);
          return <WallSpr key={d.id} sprite={decorSprite(d)} x={c.x} y={c.y} left={d.y === WALL_L} onHold={editing ? undefined : () => on.pickDecor(d)} className={`decor ${sel} ${d.id === p.ghost?.movingId ? 'moving' : ''}`} title={item(d.item_id).name} />;
        }
        const art = ART[d.item_id];
        const foot = roomFoot(d);
        return (
          <div key={d.id}>
            <Spr sprite={decorSprite(d)} x={foot.x} y={foot.y} z={art?.flat ? 1 : depth.get(d.id)} flip={!!d.rot}
              onHold={editing ? undefined : () => on.pickDecor(d)} className={`decor ${sel} ${d.id === p.ghost?.movingId ? 'moving' : ''} ${cellsOf(scene, d.item_id, d.x, d.y, d.rot ?? 0).some(([cx, cy]) => RESERVED[scene]?.(cx, cy)) ? 'over-door' : ''}`}
              title={['wardrobe', 'dresser'].includes(d.item_id) && !editing ? '👗 Tủ đồ — thay trang phục' : d.item_id === 'bed' && !editing ? '🛏️ Giường — ngủ, âu yếm' : item(d.item_id).name}
              onClick={['wardrobe', 'dresser'].includes(d.item_id) && !editing ? () => go(roomPt(d.x + 0.5, d.y + 1.6), on.wardrobe)
                : d.item_id === 'bed' && !editing ? () => go(walkTarget(scene, roomPt(d.x + 1.5, d.y - 0.5)) ?? p.live.mine.pos, () => on.bed(d)) : undefined} />
            {p.dark && art?.glow && <Glow x={foot.x} y={foot.y - 24} r={24} />}
          </div>
        );
      })}

      {editing && p.ghost && <RoomGhost ghost={p.ghost} island={island} />}
      {editing && <RoomCells {...p} />}
      {!editing && (
        <>
          {scene === 'house' && <Hot x={54} y={38} w={44} h={36} title="Bếp — nấu ăn" onClick={() => go(HOUSE.kitchen.stand, on.kitchen)} />}
          <Hot x={20} y={50} w={16} h={38} title={scene === 'house' ? 'Vào phòng ngủ' : scene === 'bedroom' ? 'Ra phòng khách' : 'Về phòng ngủ'}
            onClick={() => go(HOUSE.toBedroom, () => (scene === 'bathroom' ? enter('bedroom', BATH.toBath) : enter(scene === 'house' ? 'bedroom' : 'house', SCENES.bedroom.spawn)))} />
          <Tag x={28} y={44} className="label">{scene === 'house' ? '🛏️' : scene === 'bedroom' ? '🛋️' : '🛏️'}</Tag>
          {scene === 'bedroom' && (
            <>
              <Hot x={156} y={50} w={16} h={38} title="Vào phòng tắm" onClick={() => go(BATH.toBath, () => enter('bathroom'))} />
              <Tag x={164} y={44} className="label" onClick={() => go(BATH.toBath, () => enter('bathroom'))}>🛁</Tag>
            </>
          )}
          {scene === 'house' && !p.pet && (
            <>
              <Spr sprite={emojiSprite('🧺', 12)} x={roomPt(7, 5.5).x} y={roomPt(7, 5.5).y} className="bob" title="🐾 Ổ trống — nhận nuôi một bé" onClick={() => go(roomPt(6.2, 6.2), on.pet)} />
              <Tag x={roomPt(7, 5.5).x} y={roomPt(7, 5.5).y - 22} className="hint">🐾</Tag>
            </>
          )}
          {scene === 'house' && p.theme && <Tag x={96} y={8} className="fest-banner small">{THEMES[p.theme].hang} {THEMES[p.theme].label.slice(3)} {THEMES[p.theme].hang}</Tag>}
          {scene === 'house' && <Hot x={58} y={106} w={28} h={13} title="Ra ngoài" onClick={() => go(HOUSE.door, () => enter('town', BUILDINGS[0].door))} />}
        </>
      )}
      {scene === 'bathroom' && <BathContent {...p} />}
      {p.dark && <div className="room-night" />}
    </>
  );
}

function BathContent(p: WorldProps) {
  const s = useScale();
  const front = BATH.front;
  const steamy = p.bath === 'onsen' || p.bath === 'clear';
  return (
    <>
      <Spr sprite={tubBackSprite(p.bath)} x={front.x} y={front.y} z={Math.round(roomPt(BATH.back.gx, BATH.back.gy).y)} title={BATH_WATERS.find(w => w.id === p.bath)?.name} />
      <Spr sprite={tubFrontSprite(p.bath)} x={front.x} y={front.y} z={Math.round(front.y) + 1} />
      {[roomPt(BATH.back.gx + BATH.w - 0.15, BATH.back.gy + 0.1, 20), roomPt(BATH.back.gx + BATH.w - 0.15, BATH.back.gy + 0.4, 20), roomPt(BATH.back.gx + 0.15, BATH.back.gy + 0.1, 20)].map((c, i) => <Glow key={i} x={c.x} y={c.y} r={14} />)}
      <Glow x={roomPt(0, 0.45, 26).x} y={roomPt(0, 0.45, 26).y} r={14} />
      <div className={`tub-fx ${steamy ? 'steam' : p.bath === 'bubble' ? 'bubbles' : p.bath === 'rose' ? 'petals-up' : ''}`}
        style={{ left: (front.x - 46) * s, top: (front.y - 64) * s, width: 76 * s, height: 34 * s }}>
        {Array.from({ length: 7 }, (_, i) => <i key={i} style={{ left: `${10 + i * 13}%`, animationDelay: `${i * 0.5}s` }} />)}
      </div>
      <div className="bath-ambient" />
      <BathToys {...p} />
    </>
  );
}

/** Vịt cao su bơi trong bồn (chạm vào kêu "quạc") và nước té sang người kia */
function BathToys(p: WorldProps) {
  const s = useScale();
  const [hop, setHop] = useState(0);
  const theirs = p.partnerHere ? p.live.theirs : null;
  const ducks = [p.live.mine.duck && 'me', theirs?.duck && 'them'].filter(Boolean) as string[];
  const inTub = { me: p.live.mine.act === 'bath', them: theirs?.act === 'bath' };
  const seat = (who: 'me' | 'them') => BATH.seats[(who === 'me') === p.firstSeat ? 0 : 1];
  const [, tick] = useState(0);
  const splashing = (['me', 'them'] as const).filter(w => p.acts[w]?.n === 'splash' && Date.now() - p.acts[w]!.at < 1300);
  useEffect(() => { if (!splashing.length) return; const t = setTimeout(() => tick(v => v + 1), 1350); return () => clearTimeout(t); });
  const duck = duckSprite(), drop = dropSprite();
  // Chỗ nước trống trong lòng bồn (cạnh hai người, sau thành bồn)
  // Hai góc mặt nước phía sau-phải (toạ độ màn hình đo theo lòng bồn, tránh thành bồn và hai người)
  const SPOTS = [{ x: 120, y: 58 }, { x: 130, y: 64 }];
  // Đích nước té: người kia trong bồn → chỗ ngồi; đứng trong phòng → ngang mặt; không có ai → bay sang phía bên kia bồn
  const aim = (who: 'me' | 'them') => {
    if (inTub[who]) return { x: seat(who).x, y: seat(who).y };
    const pos = who === 'me' ? p.live.mine.pos : theirs?.pos;
    if (pos) return { x: pos.x, y: pos.y - 14 };
    return { x: seat(who).x, y: seat(who).y };
  };
  return (
    <>
      {ducks.map((d, i) => {
        const at = SPOTS[i];
        return (
          <img key={d} src={duck.url} alt="Vịt cao su" title="Vịt cao su — chạm để nghe quạc quạc" draggable={false}
            className={`bath-duck ${hop && Date.now() - hop < 700 ? 'hop' : ''}`}
            style={{ left: (at.x - duck.w / 2) * s, top: (at.y - duck.h + 2) * s, width: duck.w * s, height: duck.h * s, zIndex: Math.round(BATH.front.y) + 2, animationDelay: `${i * 0.7}s` }}
            onClick={e => { e.stopPropagation(); setHop(Date.now()); p.live.say('🦆 Quạc quạc!'); }} />
        );
      })}
      {splashing.map(w => {
        const from = seat(w), other = w === 'me' ? 'them' : 'me', a = p.acts[w]!;
        // Có người kia trong bồn thì nước bay vòng cung sang người đó, không thì bắn tung toé quanh mình
        const to = aim(other);
        return (
          <div key={`${w}${a.at}`} className="bath-splash" style={{ left: from.x * s, top: (from.y - 12) * s, zIndex: 300 }}>
            {Array.from({ length: 8 }, (_, i) => {
              const dx = (to.x - from.x + (i % 3 - 1) * 3) * s;
              const dy = (to.y - from.y + 10 + (i % 2) * 3) * s;
              return <img key={i} src={drop.url} alt="" className="to" style={{ ['--dx' as string]: `${dx}px`, ['--dy' as string]: `${dy}px`, ['--arc' as string]: `${-14 * s}px`, animationDelay: `${(i % 4) * 0.08 + Math.floor(i / 4) * 0.3}s`, width: drop.w * s * 0.45, height: drop.h * s * 0.45 }} />;
            })}
          </div>
        );
      })}
    </>
  );
}
function duckSprite() {
  // Vịt nhỏ xíu (5×4) — nằm nửa chìm trong nước
  return makeSprite('rubber-duck:v4', 5, 4, q => {
    q.rect(0, 2, 4, 2, '#f6c64e'); q.px(0, 1, '#f6c64e'); q.rect(1, 3, 3, 1, '#e0a838');
    q.rect(2, 0, 2, 2, '#f6c64e'); q.px(3, 0, '#3b2d3f'); q.px(4, 1, '#f7894a');
  });
}

/** Karaoke: đèn sân khấu quét màu, nốt nhạc bay quanh khung chiếu, micro đứng */
function Karaoke() {
  const s = useScale();
  return (
    <>
      <div className="karaoke-lights" />
      <div className="karaoke-notes" style={{ left: 8 * s, top: 2 * s, width: 144 * s, height: 80 * s }}>
        {['♪', '♫', '♬', '♩', '♪', '♫', '🎵', '🎶', '♬', '♪'].map((n, i) => (
          <i key={i} style={{ left: `${i % 2 ? 94 - (i * 7) % 20 : (i * 7) % 20}%`, top: `${(i * 31) % 90}%`, animationDelay: `${i * 0.45}s`, color: ['#ff8ac8', '#7ae0f0', '#f6e27a', '#b7a6e8', '#a5f070'][i % 5] }}>{n}</i>
        ))}
      </div>
      <Spr sprite={emojiSprite('🎤', 12)} x={80} y={98} z={120} className="bob" />
    </>
  );
}

/** Đồ treo tường: vẽ thẳng rồi nghiêng theo bức tường */
function WallSpr({ sprite, x, y, left, className, title, onHold }: { sprite: Sprite; x: number; y: number; left: boolean; className: string; title: string; onHold?: () => void }) {
  const s = useScale();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (
    <img src={sprite.url} alt={title} title={title} draggable={false} className={`spr ${onHold ? 'tappable' : ''} ${className}`}
      onClick={onHold && (e => e.stopPropagation())}
      onDoubleClick={onHold && (e => { e.stopPropagation(); onHold(); })}
      onPointerDown={onHold && (e => { if (e.pointerType !== 'mouse') timer.current = setTimeout(onHold, 450); })}
      onPointerUp={() => timer.current && clearTimeout(timer.current)}
      onContextMenu={onHold && (e => e.preventDefault())}
      style={{ left: (x - sprite.w / 2) * s, top: (y - sprite.h / 2) * s, width: sprite.w * s, height: sprite.h * s, zIndex: 2, transform: left ? TAN_NEG : TAN }} />
  );
}

function RoomGhost({ ghost, island }: { ghost: Ghost; island: string }) {
  const cls = `ghost ${ghost.why ? 'bad' : 'ok'}`;
  if (isWallCell(island, ghost.y)) {
    const c = wallSlot(ghost.y, ghost.x);
    return <WallSpr sprite={itemSprite(ghost.itemId)} x={c.x} y={c.y} left={ghost.y === WALL_L} className={cls} title="" />;
  }
  const art = ART[ghost.itemId];
  const foot = art ? roomPt(ghost.x + 1, ghost.y + 1) : { x: roomPt(ghost.x + 0.5, ghost.y + 0.5).x, y: roomPt(ghost.x + 0.5, ghost.y + 0.5).y + 4 };
  return <Spr sprite={itemSprite(ghost.itemId)} x={foot.x} y={foot.y} z={460} flip={!!ghost.rot} className={cls} />;
}

function RoomCells(p: WorldProps) {
  const s = useScale();
  const cells: ReactNode[] = [];
  for (let gy = 0; gy < ROOM.n; gy++) {
    for (let gx = 0; gx < ROOM.n; gx++) {
      const t = roomPt(gx, gy), l = roomPt(gx, gy + 1);
      const { hint, events } = cellBind(p, gx, gy);
      cells.push(
        <button key={`f${gx}-${gy}`} className={`px-cell iso-cell ${hint}`} aria-label={`Ô sàn ${gx + 1},${gy + 1}`}
          style={{ left: l.x * s, top: t.y * s, width: 20 * s, height: 10 * s }} {...events} />,
      );
    }
  }
  for (const row of [WALL_L, WALL_R]) {
    for (let i = 0; i < ROOM.n; i++) {
      const base = row === WALL_L ? roomPt(0, i + 1) : roomPt(i, 0);
      const { hint, events } = cellBind(p, i, row);
      cells.push(
        <button key={`w${row}-${i}`} className={`px-cell wall-cell ${hint}`} aria-label={`Tường ${row === WALL_L ? 'trái' : 'phải'} ${i + 1}`}
          style={{ left: base.x * s, top: (base.y - 38) * s, width: 10 * s, height: 30 * s, transform: row === WALL_L ? TAN_NEG : TAN }} {...events} />,
      );
    }
  }
  return <>{cells}</>;
}

// ───────── Trời & hiệu ứng ─────────

function Sky({ phase, wx, combos, onStar }: { phase: Phase; wx: WeatherType; combos: Combo[]; onStar: () => void }) {
  return (
    <>
      {wx !== 'rain' && wx !== 'snow' && (phase === 'night'
        ? <Spr sprite={moonSprite()} x={150} y={16} z={1} />
        : <Spr sprite={sunSprite()} x={phase === 'day' ? 140 : phase === 'dawn' ? 30 : 160} y={phase === 'day' ? 14 : 26} z={1} />)}
      {wx !== 'fog' && [0, 1, 2].slice(0, wx === 'clear' ? 1 : 3).map(i => (
        <Spr key={i} sprite={cloudSprite(wx === 'rain')} x={40 + i * 60} y={10 + (i % 2) * 8} z={2} className={`drift drift-${i}`} />
      ))}
      {combos.some(c => c.effect === 'rainbow') && <Rainbow />}
      {combos.some(c => c.effect === 'stars') && <ShootingStar onTap={onStar} />}
    </>
  );
}

function Rainbow() {
  const s = useScale();
  return (
    <svg className="fx-rainbow" viewBox="0 0 200 100" style={{ left: 20 * s, top: 0, width: 150 * s, height: 40 * s }} aria-hidden>
      {['#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff', '#d7baff'].map((c, i) => (
        <path key={c} d={`M ${10 + i * 6} 100 A ${90 - i * 6} ${90 - i * 6} 0 0 1 ${190 - i * 6} 100`} stroke={c} strokeWidth="6" fill="none" />
      ))}
    </svg>
  );
}

/** Sao băng hiện cùng lúc ở hai máy (theo đồng hồ), chạm để ước */
function ShootingStar({ onTap }: { onTap: () => void }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  if (!starVisible(now)) return null;
  return (
    <button key={Math.floor(now / STAR_PERIOD)} className="fx-star" onClick={e => { e.stopPropagation(); onTap(); }} aria-label="Chạm sao băng">
      <span className="star-trail" />
    </button>
  );
}

/** Dây đèn lấp lánh trên cây và hàng rào của đồi */
function FairyLights() {
  const s = useScale();
  const dots: [number, number][] = [];
  for (let i = 0; i < 14; i++) dots.push([6 + i * 2.2, 86 + Math.sin(i / 2) * 6 + (i % 3) * 3]);
  for (let i = 0; i < 9; i++) dots.push([150 + i * 5, 108 + Math.round(((150 + i * 5 - 96) / 96) ** 2 * 16) - 6]);
  for (let i = 0; i < 10; i++) dots.push([164 + Math.cos(i) * 12, 104 + Math.sin(i * 1.7) * 9]);
  return (
    <div className="fairy" aria-hidden>
      {dots.map(([x, y], i) => <i key={i} style={{ left: x * s, top: y * s, animationDelay: `${(i * 0.37) % 2}s`, background: ['#fff1a8', '#ffc6dc', '#c8f0ff'][i % 3] }} />)}
    </div>
  );
}

/** Chòm sao trái tim của hai bạn (hiện khi cùng ngồi ngắm đêm) */
function HeartStars() {
  const s = useScale();
  const pts = Array.from({ length: 14 }, (_, i) => {
    const t = (i / 14) * Math.PI * 2;
    return [96 + 16 * Math.sin(t) ** 3 * 1.4, 34 - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 1.1];
  });
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x * s},${y * s}`).join(' ') + 'Z';
  return (
    <svg className="heart-stars" width="100%" height="100%" aria-label="Chòm sao trái tim">
      <path d={d} />
      {pts.map(([x, y], i) => <circle key={i} cx={x * s} cy={y * s} r={Math.max(1.5, s * 0.7)} style={{ animationDelay: `${i * 0.15}s` }} />)}
    </svg>
  );
}

/** Mưa sao băng trên đồi: nhiều vệt bay chéo, chạm một vệt để ước */
function MeteorShower({ dense, onTap }: { dense: boolean; onTap: () => void }) {
  const meteors = useMemo(() => Array.from({ length: dense ? 9 : 3 }, (_, i) => ({
    x: 4 + ((i * 37) % 80), y: 2 + ((i * 23) % 30), d: (i * 1.3) % 7, t: 2.6 + ((i * 7) % 5) * 0.5,
  })), [dense]);
  return (
    <>
      {meteors.map((m, i) => (
        <button key={i} className="meteor" aria-label="Sao băng — chạm để ước"
          style={{ left: `${m.x}%`, top: `${m.y}%`, animationDelay: `${m.d}s`, animationDuration: `${m.t}s` }}
          onClick={e => { e.stopPropagation(); onTap(); }}>
          <span />
        </button>
      ))}
    </>
  );
}

function Fireflies({ n, area: [x, y, w, h] }: { n: number; area: [number, number, number, number] }) {
  const s = useScale();
  return (
    <div className="fireflies" style={{ left: x * s, top: y * s, width: w * s, height: h * s }}>
      {Array.from({ length: n }, (_, i) => (
        <i key={i} style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, animationDelay: `${(i * 0.7) % 4}s` }} />
      ))}
    </div>
  );
}

function Butterflies() {
  const s = useScale();
  return (
    <>
      {[[60, 200], [150, 230], [300, 150]].map(([x, y], i) => (
        <i key={i} className={`butterfly b${i}`} style={{ left: x * s, top: y * s }} />
      ))}
    </>
  );
}

function Petals() {
  return (
    <div className="petals">
      {Array.from({ length: 8 }, (_, i) => <i key={i} style={{ left: `${(i * 13 + 4) % 100}%`, animationDelay: `${i * 1.6}s`, animationDuration: `${9 + (i % 3) * 3}s` }} />)}
    </div>
  );
}
