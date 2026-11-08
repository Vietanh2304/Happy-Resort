// Trường học: lớp học có bảng đen (bài học mỗi ngày), cô giáo cú mèo, bạn cùng lớp; các bé nhà mình tới tuổi
// thì ngồi học trong giờ (thứ 2–6, 7:30–16:30). Ba mẹ ghé xem bài, làm bài tập cùng con, khen con, đón con về.
import * as api from '../lib/api';
import { kidAge, kidLook, kidSprite, kidStage } from '../lib/kids';
import { atSchool, CLASSMATE_NPC, classOpen, deskSprite, DESKS, inClassroom, lessonOf, owlSprite, PERIOD, periodOf } from '../lib/school';
import { meetingDay } from '../lib/study';
import { characterSprite } from '../lib/sprites';
import { avatarPx } from './Avatar';
import type { Live } from '../lib/useLive';
import { Chat, status } from './Places';
import { Spr, Tag, useScale } from './Stage';

interface When { date: string; hour: number; minute: number }

const PARENTS = [
  { gender: 'f' as const, hair: 3, hairColor: 1, skin: 0, shirt: 4, outfit: 14 }, { gender: 'm' as const, hair: 2, hairColor: 0, skin: 2, shirt: 10, outfit: 4 },
  { gender: 'f' as const, hair: 5, hairColor: 2, skin: 1, shirt: 8, outfit: 1 }, { gender: 'm' as const, hair: 6, hairColor: 6, skin: 3, shirt: 2, outfit: 7 },
];

export function SchoolContent({ kids, me, partner, when, walking, onKid }: {
  kids: api.Kid[]; me: api.Profile; partner: api.Profile | null; when: When; walking: (string | null | undefined)[]; onKid: (id: string) => void;
}) {
  const s = useScale();
  const period = periodOf(when.date, when.hour, when.minute);
  const open = inClassroom(period);   // ra chơi / ăn trưa / thể dục thì cả lớp ở ngoài sân
  const nap = period === 'nap';
  const lesson = lessonOf(when.date);
  const mine = open ? kids.filter(k => k.name && atSchool(k, when.date, when.hour, when.minute) && !walking.includes(k.id)) : [];
  const desk = deskSprite();
  const ps = avatarPx(s);
  const meeting = meetingDay(when.date) && when.hour >= 17;
  return (
    <>
      {/* Bảng đen: bài học hôm nay / tan học */}
      <div className="chalk" style={{ left: 96 * s, top: 21 * s, width: 86 * s, fontSize: Math.max(10, 5 * s) }}>
        {nap ? <><small>😴 Giờ ngủ trưa</small><b>Suỵt… khẽ thôi</b></> : open ? <><small>{lesson.icon} {lesson.subject}</small><b>{lesson.board}</b></> : period !== 'closed' ? <><small>{PERIOD[period].icon} {PERIOD[period].label}</small><b>Cả lớp ra sân rồi 🏃</b></> : <><small>🔔 Tan học rồi</small><b>Hẹn gặp lại! 👋</b></>}
      </div>
      <div className="class-clock" style={{ left: 150 * s, top: 58 * s, fontSize: Math.max(9, 3.6 * s) }}>🕗 {String(when.hour).padStart(2, '0')}:{String(when.minute).padStart(2, '0')}</div>
      {(open || meeting) && <Spr sprite={owlSprite()} x={30} y={92} z={92} className="bob" title="Cô giáo cú mèo" />}
      <img src={characterSprite({ gender: 'm', hair: 0, hairColor: 6, skin: 2, shirt: 7, outfit: 6, glasses: 1 }, 'idle').url} alt="Bác bảo vệ" title="Bác bảo vệ" className="spr npc-guard"
        style={{ left: 176 * s - 8 * ps, top: 140 * s - 28 * ps, width: 18 * ps, height: 28 * ps, zIndex: 141 }} />
      {meeting && PARENTS.map((look, i) => {
        const d = DESKS[(i + 2) % DESKS.length], sp = characterSprite(look, 'sit');
        return <img key={i} src={sp.url} alt="Phụ huynh" title="Phụ huynh" className="spr npc-sit" style={{ left: (d.x + 12) * s - (sp.w * ps) / 2, top: (d.y + 6) * s - sp.h * ps, width: sp.w * ps, height: sp.h * ps, zIndex: d.y + 2 }} />;
      })}
      {meeting && <Tag x={96} y={66} className="label">📣 Đang họp phụ huynh</Tag>}
      {DESKS.map((d, i) => {
        const kid = mine[i];
        const mate = !kid && open ? CLASSMATE_NPC[(i - mine.length + when.date.length) % CLASSMATE_NPC.length] : null;
        return (
          <div key={i}>
            {kid && (() => {
              const look = kidLook(kid, me, partner);
              return <>
                <Spr sprite={kidSprite('student', look, 'idle', kid.gender === 'f')} x={d.x} y={d.y - 6} z={d.y - 1} className="study" title={`🎒 ${kid.name}`} onClick={() => onKid(kid.id)} />
                <Tag x={d.x} y={d.y - 30} className="label">🎒 {kid.name}</Tag>
              </>;
            })()}
            {mate && <Spr sprite={kidSprite('student', mate.look, 'idle', mate.girl)} x={d.x} y={d.y - 6} z={d.y - 1} className="study" title={`Bạn ${mate.name}`} />}
            {nap && (kid || mate) && i % 2 === 0 && <Tag x={d.x + 6} y={d.y - 28} className="bed-bubble">💤</Tag>}
            <Spr sprite={desk} x={d.x} y={d.y + 8} z={d.y} />
          </div>
        );
      })}
    </>
  );
}

export function SchoolPanel({ live, kids, when, partnerHere, partnerName, onPickup, onLeave, onStudy, onMeeting }: {
  live: Live; kids: api.Kid[]; when: When; partnerHere: boolean; partnerName: string; onPickup: (kid: api.Kid) => void; onLeave: () => void; onStudy: () => void; onMeeting: () => void;
}) {
  const named = kids.filter(k => k.name && k.born_on <= when.date);
  const lesson = lessonOf(when.date);
  const open = classOpen(when.date, when.hour, when.minute);
  const period = periodOf(when.date, when.hour, when.minute);
  return (
    <div className="room-bar">
      <div className="room-panel">
        {status(partnerHere, partnerName, `Rủ ${partnerName} cùng ghé trường thăm con nhé 🏫`)}
        <p className="muted small-note">{open && !inClassroom(period) ? `${PERIOD[period].icon} ${PERIOD[period].label} — cả lớp đang ở sân trường, ra sân xem các bé nhé!` : open ? `${lesson.icon} Hôm nay lớp học ${lesson.subject}: ${lesson.note}` : '🔔 Ngoài giờ học (lớp học thứ 2–6, 7:30–16:30) — các bé đang ở nhà.'}</p>
        {meetingDay(when.date) && <button className="btn small" onClick={onMeeting}>📣 Họp phụ huynh hôm nay{when.hour >= 17 ? ' — vào họp' : ' (17:00)'}</button>}
        {!named.length && <p className="muted small-note">🐦 Nhà mình chưa có bé — khi có bé và bé lớn tới tuổi đi học, bé sẽ học ở đây.</p>}
        {named.map(k => {
          const stage = kidStage(k, when.date), age = kidAge(k, when.date);
          const here = atSchool(k, when.date, when.hour, when.minute);
          return (
            <div key={k.id} className="row wrap school-kid">
              <b>{k.gender === 'm' ? '👦' : '👧'} {k.name}</b>
              {stage !== 'student' ? <span className="muted small-note">còn {45 - age} ngày nữa tới tuổi đi học</span> : (
                <>
                  <span className="muted small-note">{here ? (inClassroom(period) ? 'đang trong lớp ✏️' : 'đang ở sân trường 🏃') : 'đi học rồi · ngày học thứ ' + (age - 44)}</span>
                  <button className="btn small" onClick={onStudy}>📚 Dạy con học</button>
                  <button className="btn small ghost" onClick={() => live.say(`🌟 ${k.name} giỏi quá, ba mẹ thương con!`)}>🌟 Khen con</button>
                  <button className="btn small ghost" onClick={() => onPickup(k)}>🎒 Đón con về</button>
                </>
              )}
            </div>
          );
        })}
        <Chat live={live} placeholder="Nói gì đó ở trường…" />
      </div>
      <button className="btn small ghost leave" onClick={onLeave}>🚪 Ra sân trường</button>
    </div>
  );
}
