// Trường học: lớp học có bảng đen (bài học mỗi ngày), cô giáo cú mèo, bạn cùng lớp; các bé nhà mình tới tuổi
// thì ngồi học trong giờ (thứ 2–6, 7:30–16:30). Ba mẹ ghé xem bài, làm bài tập cùng con, khen con, đón con về.
import { useState } from 'react';
import * as api from '../lib/api';
import { kidAge, kidLook, kidSprite, kidStage } from '../lib/kids';
import { emojiSprite } from '../lib/pixel';
import { notify } from '../lib/realtime';
import { atSchool, CLASSMATES, classOpen, deskSprite, DESKS, homework, lessonOf, owlSprite } from '../lib/school';
import { toast, toastError } from '../lib/toast';
import type { Live } from '../lib/useLive';
import { Chat, status } from './Places';
import { Sheet } from './Sheet';
import { Spr, Tag, useScale } from './Stage';

interface When { date: string; hour: number; minute: number }

export function SchoolContent({ kids, me, partner, when, walking, onKid }: {
  kids: api.Kid[]; me: api.Profile; partner: api.Profile | null; when: When; walking: (string | null | undefined)[]; onKid: (id: string) => void;
}) {
  const s = useScale();
  const open = classOpen(when.date, when.hour, when.minute);
  const lesson = lessonOf(when.date);
  const mine = kids.filter(k => k.name && atSchool(k, when.date, when.hour, when.minute) && !walking.includes(k.id));
  const desk = deskSprite();
  return (
    <>
      {/* Bảng đen: bài học hôm nay / tan học */}
      <div className="chalk" style={{ left: 96 * s, top: 21 * s, width: 86 * s, fontSize: Math.max(10, 5 * s) }}>
        {open ? <><small>{lesson.icon} {lesson.subject}</small><b>{lesson.board}</b></> : <><small>🔔 Tan học rồi</small><b>Hẹn gặp lại! 👋</b></>}
      </div>
      <div className="class-clock" style={{ left: 150 * s, top: 58 * s, fontSize: Math.max(9, 3.6 * s) }}>🕗 {String(when.hour).padStart(2, '0')}:{String(when.minute).padStart(2, '0')}</div>
      {open && <Spr sprite={owlSprite()} x={30} y={92} z={92} className="bob" title="Cô giáo cú mèo" />}
      {DESKS.map((d, i) => {
        const kid = mine[i];
        const mate = !kid && open && i >= mine.length && i - mine.length < CLASSMATES.length - 1 ? CLASSMATES[(i + when.date.length) % CLASSMATES.length] : null;
        return (
          <div key={i}>
            {kid && (() => {
              const look = kidLook(kid, me, partner);
              return <>
                <Spr sprite={kidSprite('student', look, 'idle', kid.gender === 'f')} x={d.x} y={d.y - 6} z={d.y - 1} className="study" title={`🎒 ${kid.name}`} onClick={() => onKid(kid.id)} />
                <Tag x={d.x} y={d.y - 30} className="label">🎒 {kid.name}</Tag>
              </>;
            })()}
            {mate && <Spr sprite={emojiSprite(mate, 11)} x={d.x} y={d.y - 6} z={d.y - 1} className="study" />}
            <Spr sprite={desk} x={d.x} y={d.y + 8} z={d.y} />
          </div>
        );
      })}
    </>
  );
}

export function SchoolPanel({ live, kids, when, partnerHere, partnerName, onPickup, onLeave }: {
  live: Live; kids: api.Kid[]; when: When; partnerHere: boolean; partnerName: string; onPickup: (kid: api.Kid) => void; onLeave: () => void;
}) {
  const [hw, setHw] = useState<api.Kid | null>(null);
  const named = kids.filter(k => k.name && k.born_on <= when.date);
  const lesson = lessonOf(when.date);
  const open = classOpen(when.date, when.hour, when.minute);
  return (
    <div className="room-bar">
      <div className="room-panel">
        {status(partnerHere, partnerName, `Rủ ${partnerName} cùng ghé trường thăm con nhé 🏫`)}
        <p className="muted small-note">{open ? `${lesson.icon} Hôm nay lớp học ${lesson.subject}: ${lesson.note}` : '🔔 Ngoài giờ học (lớp học thứ 2–6, 7:30–16:30) — các bé đang ở nhà.'}</p>
        {!named.length && <p className="muted small-note">🐦 Nhà mình chưa có bé — khi có bé và bé lớn tới tuổi đi học, bé sẽ học ở đây.</p>}
        {named.map(k => {
          const stage = kidStage(k, when.date), age = kidAge(k, when.date);
          const here = atSchool(k, when.date, when.hour, when.minute);
          return (
            <div key={k.id} className="row wrap school-kid">
              <b>{k.gender === 'm' ? '👦' : '👧'} {k.name}</b>
              {stage !== 'student' ? <span className="muted small-note">còn {45 - age} ngày nữa tới tuổi đi học</span> : (
                <>
                  <span className="muted small-note">{here ? 'đang trong lớp ✏️' : 'đi học rồi · ngày học thứ ' + (age - 44)}</span>
                  <button className="btn small" onClick={() => setHw(k)}>✏️ Làm bài tập cùng con</button>
                  <button className="btn small ghost" onClick={() => live.say(`🌟 ${k.name} giỏi quá, ba mẹ thương con!`)}>🌟 Khen con</button>
                  <button className="btn small ghost" onClick={() => onPickup(k)}>🎒 Đón con về</button>
                </>
              )}
            </div>
          );
        })}
        <Chat live={live} placeholder="Nói gì đó ở trường…" />
      </div>
      <button className="btn small ghost leave" onClick={onLeave}>🚪 Ra ngoài</button>
      {hw && <HomeworkSheet kid={hw} date={when.date} live={live} onClose={() => setHw(null)} />}
    </div>
  );
}

function HomeworkSheet({ kid, date, live, onClose }: { kid: api.Kid; date: string; live: Live; onClose: () => void }) {
  const qs = homework(kid.id, date);
  const [picked, setPicked] = useState<(number | null)[]>(qs.map(() => null));
  const done = picked.every(p => p !== null);
  const score = picked.filter((p, i) => p === qs[i].answer).length;
  const [sent, setSent] = useState(false);
  const submit = async () => {
    setSent(true);
    const perfect = score === qs.length;
    live.say(perfect ? `💯 ${kid.name} được điểm 10!` : `✏️ ${kid.name} làm đúng ${score}/${qs.length} câu`);
    if (!perfect) return;
    try {
      if (await api.grantCoins(`homework:${kid.id}:${date}`, 30)) { toast(`💯 Điểm 10! Thưởng +30 xu vào hũ chung (mỗi ngày một lần)`); notify('profiles'); }
      if (await api.kidMilestone(kid.id, 'homework')) { toast(`🌟 Mốc đáng nhớ: ✏️ Bài tập đầu tiên được điểm 10 của bé ${kid.name}!`); notify('kids'); }
      await api.careKid(kid.id, 'play', 1); notify('kids');
    } catch (e) { toastError(e); }
  };
  return (
    <Sheet title={`✏️ Bài tập của bé ${kid.name}`} onClose={onClose}>
      {qs.map((q, i) => (
        <div key={i} className="hw-q">
          <p><b>Câu {i + 1}.</b> {q.q}</p>
          <div className="row wrap">
            {q.options.map((o, j) => (
              <button key={j} disabled={sent} className={`chip ${picked[i] === j ? (sent ? (j === q.answer ? 'active' : 'wrong') : 'active') : ''} ${sent && j === q.answer ? 'right' : ''}`}
                onClick={() => setPicked(p => p.map((v, k) => (k === i ? j : v)))}>{o}</button>
            ))}
          </div>
        </div>
      ))}
      {!sent ? <button className="btn" disabled={!done} onClick={() => void submit()}>📮 Nộp bài cho cô</button>
        : <p className="hw-score">{score === qs.length ? '💯 Điểm 10! Cô dán ngôi sao vàng cho bé ⭐' : `Đúng ${score}/${qs.length} câu — mai làm lại nhé, cố lên! 💪`}</p>}
    </Sheet>
  );
}
