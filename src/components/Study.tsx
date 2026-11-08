// Dạy con học buổi tối (2–3 môn mỗi ngày, mỗi môn 4 câu), bảng điểm, bé khoe điểm trên lớp, họp phụ huynh 10 ngày/lần.
import { useState } from 'react';
import * as api from '../lib/api';
import { kidAge, kidLook, kidSprite, kidStage } from '../lib/kids';
import { notify } from '../lib/realtime';
import { lessonOf } from '../lib/school';
import { exercise, gradeOf, nextMeeting, PARENT_CHATTER, scoreOf, SUBJECTS, subjectsOn, teacherComment, type Subject } from '../lib/study';
import { toast, toastError } from '../lib/toast';
import { Sheet } from './Sheet';

const avgOf = (rows: api.Score[]) => (rows.length ? Math.round((rows.reduce((s, r) => s + r.score, 0) / rows.length) * 10) / 10 : null);
export const recentScores = (scores: api.Score[], kidId: string, date: string, days = 10) => {
  const from = new Date(Date.parse(`${date}T12:00:00Z`) - days * 864e5).toISOString().slice(0, 10);
  return scores.filter(s => s.kid_id === kidId && s.day > from && s.day <= date);
};

export function StudySheet({ me, partner, kids, scores, date, onClose }: { me: api.Profile; partner: api.Profile | null; kids: api.Kid[]; scores: api.Score[]; date: string; onClose: () => void }) {
  const students = kids.filter(k => k.name && kidStage(k, date) === 'student');
  const [kidId, setKidId] = useState(students[0]?.id);
  const [doing, setDoing] = useState<Subject | null>(null);
  const kid = students.find(k => k.id === kidId) ?? students[0];
  if (!kid) return <Sheet title="📚 Dạy con học" onClose={onClose}><p className="muted">Chưa có bé nào tới tuổi đi học (bé đi học từ ngày thứ 45).</p></Sheet>;
  const today = subjectsOn(date);
  const done = (s: Subject) => scores.find(x => x.kid_id === kid.id && x.day === date && x.subject === s);
  const recent = recentScores(scores, kid.id, date);
  const homework = recent.filter(s => !s.subject.startsWith('lop'));
  const classToday = scores.find(x => x.kid_id === kid.id && x.day === date && x.subject.startsWith('lop'));
  const look = kidLook(kid, me, partner);
  if (doing) return <ExerciseRun kid={kid} me={me} subject={doing} date={date} grade={gradeOf(kidAge(kid, date))} onClose={() => setDoing(null)} />;
  return (
    <Sheet title="📚 Dạy con học" onClose={onClose}>
      {students.length > 1 && <div className="tabs">{students.map(k => <button key={k.id} className={k.id === kid.id ? 'active' : ''} onClick={() => setKidId(k.id)}>{k.gender === 'm' ? '👦' : '👧'} {k.name}</button>)}</div>}
      <div className="study-head">
        <img src={kidSprite('student', look, 'idle', kid.gender === 'f').url} alt="" className="px-img kid-mini" />
        <div>
          <b>{kid.name}</b> · lớp {gradeOf(kidAge(kid, date))}<br />
          <span className="muted small-note">Điểm trung bình 10 ngày: <b>{avgOf(homework) ?? '—'}</b> · Họp phụ huynh: {nextMeeting(date).split('-').reverse().join('/')}</span>
        </div>
      </div>
      {classToday && <p className="kid-brag">🎒 {kid.name} khoe: "Hôm nay con được <b>{classToday.score} điểm</b> {classToday.subject.slice(4)} ở lớp đó ba mẹ!"</p>}
      <p className="muted small-note">Tối nay ôn {today.length} môn (mỗi môn 4 câu). Làm xong mỗi môn +20 xu, được 10 điểm thì bé thương ba mẹ thêm 💗</p>
      <ul className="task-list">
        {today.map(s => {
          const d = done(s);
          return (
            <li key={s} className={d ? 'done' : ''}>
              <span>{SUBJECTS[s].icon} <b>{SUBJECTS[s].name}</b>{d?.by_user && <small className="muted"> — {d.by_user === me.id ? 'bạn' : partner?.display_name} kèm</small>}</span>
              {d ? <span className="ok-tag">{d.score}/10</span> : <button className="btn small" onClick={() => setDoing(s)}>Kèm con làm</button>}
            </li>
          );
        })}
      </ul>
      {homework.length > 0 && (
        <div className="score-book">
          <p className="tl-label">📒 Sổ điểm gần đây</p>
          {[...recent].reverse().slice(0, 8).map(s => <span key={s.id} className="chip">{s.day.slice(8)}/{s.day.slice(5, 7)} · {s.subject.startsWith('lop') ? `🏫 ${s.subject.slice(4)}` : `${SUBJECTS[s.subject as Subject]?.icon ?? ''} ${SUBJECTS[s.subject as Subject]?.name ?? s.subject}`}: <b>{s.score}</b></span>)}
        </div>
      )}
    </Sheet>
  );
}

function ExerciseRun({ kid, me, subject, date, grade, onClose }: { kid: api.Kid; me: api.Profile; subject: Subject; date: string; grade: number; onClose: () => void }) {
  const qs = exercise(kid.id, date, subject, grade);
  const [i, setI] = useState(0);
  const [right, setRight] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [end, setEnd] = useState<number | null>(null);
  const q = qs[i];
  const choose = (j: number) => {
    if (pick !== null) return;
    setPick(j);
    const r = right + (j === q.ok ? 1 : 0);
    setTimeout(() => {
      setPick(null);
      if (i + 1 < qs.length) { setRight(r); setI(i + 1); return; }
      const sc = scoreOf(r, qs.length);
      setEnd(sc);
      void (async () => {
        try {
          await api.addScore(me, kid.id, date, subject, sc);
          if (await api.grantCoins(`study:${kid.id}:${date}:${subject}`, 20)) toast('🪙 +20 xu vì kèm con học');
          if (sc === 10) { await api.careKid(kid.id, 'play', 1); if (await api.kidMilestone(kid.id, 'homework')) toast(`🌟 Mốc đáng nhớ: bài tập đầu tiên được điểm 10 của bé ${kid.name}!`); }
          notify('scores', 'profiles', 'kids');
        } catch (e) { toastError(e); }
      })();
    }, 900);
  };
  if (end !== null) return (
    <Sheet title={`${SUBJECTS[subject].icon} ${SUBJECTS[subject].name} — xong rồi!`} onClose={onClose}>
      <p className="hw-score">{end >= 9 ? '💯' : end >= 7 ? '👍' : '💪'} Bé {kid.name} được <b>{end}/10</b> điểm</p>
      <p className="muted center">{end === 10 ? 'Giỏi quá! Bé ôm ba mẹ một cái thật chặt 🤗' : end >= 7 ? 'Làm tốt lắm, mai cố thêm chút nữa nhé!' : 'Không sao, mai mình ôn lại cùng nhau nha 💕'}</p>
      <button className="btn" onClick={onClose}>Về danh sách bài</button>
    </Sheet>
  );
  return (
    <Sheet title={`${SUBJECTS[subject].icon} ${SUBJECTS[subject].name} · câu ${i + 1}/${qs.length}`} onClose={onClose}>
      <p className="task-q">{q.q}</p>
      {q.hint && <p className="muted small-note">💡 Gợi ý: {q.hint}</p>}
      <div className="task-opts">{q.options.map((o, j) => <button key={j} className={`btn ghost ${pick !== null && j === q.ok ? 'right' : ''} ${pick === j && j !== q.ok ? 'shake' : ''}`} onClick={() => choose(j)}>{o}</button>)}</div>
      {pick !== null && <p className={`task-flash ${pick === q.ok ? 'ok' : 'no'}`}>{pick === q.ok ? '✅ Đúng rồi!' : `❌ Đáp án: ${q.options[q.ok]}`}</p>}
    </Sheet>
  );
}

/** Bé đi học về khoe điểm trên lớp (một lần mỗi ngày học) */
export async function bragClassGrade(me: api.Profile, kid: api.Kid, date: string, scores: api.Score[]) {
  const { classGrade } = await import('../lib/study');
  const sc = classGrade(kid.id, date, avgOf(recentScores(scores, kid.id, date).filter(s => !s.subject.startsWith('lop'))));
  const subj = lessonOf(date).subject;
  try { await api.addScore(me, kid.id, date, `lop:${subj}`, sc); } catch { return null; }   // người kia ghi rồi
  notify('scores');
  return { sc, subj };
}

export function MeetingSheet({ kids, scores, date, onClose }: { kids: api.Kid[]; scores: api.Score[]; date: string; onClose: () => void }) {
  const students = kids.filter(k => k.name && kidStage(k, date) === 'student');
  const [said, setSaid] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);
  const reports = students.map(k => {
    const rec = recentScores(scores, k.id, date);
    const hw = rec.filter(s => !s.subject.startsWith('lop'));
    return { k, avg: avgOf(hw), cls: avgOf(rec.filter(s => s.subject.startsWith('lop'))), n: new Set(hw.map(s => s.day)).size };
  });
  const best = reports.some(r => (r.avg ?? 0) >= 8.5);
  const claim = async () => {
    setClaimed(true);
    try {
      if (await api.claim(`pta:${date}`, best ? [{ id: 'certificate', n: 1 }] : [])) {
        if (best) toast('🏅 Cô tặng Giấy khen — đã vào túi đồ (treo tường được)!');
        if (await api.grantCoins(`pta-coins:${date}`, best ? 200 : 60)) toast(`🪙 +${best ? 200 : 60} xu vì đi họp phụ huynh đầy đủ`);
        notify('inventory', 'profiles', 'claims');
      }
    } catch (e) { toastError(e); }
  };
  return (
    <Sheet title="📣 Họp phụ huynh" onClose={onClose}>
      <p className="muted small-note">🦉 Cô giáo cú mèo, các phụ huynh và ba mẹ cùng ngồi trong lớp.</p>
      <div className="meeting-chatter">{PARENT_CHATTER.slice(0, 3).map((t, i) => <p key={i}>{t}</p>)}</div>
      {reports.map(r => (
        <div key={r.k.id} className="drama-out">
          <b>🦉 Cô nói về bé {r.k.name}:</b>
          <p>{teacherComment(r.k.name, r.avg, r.n)}</p>
          <small className="muted">Điểm ôn ở nhà: {r.avg ?? '—'} · điểm trên lớp: {r.cls ?? '—'} · số tối được kèm: {r.n}</small>
        </div>
      ))}
      {!said ? (
        <div className="task-opts">
          {['Cảm ơn cô, nhà em sẽ kèm con đều hơn ạ', 'Cô cho em xin cách giúp con học tiếng Anh với ạ', 'Con ở nhà hay kể về cô lắm ạ 🥰'].map(t => <button key={t} className="btn small ghost" onClick={() => { setSaid(t); void claim(); }}>{t}</button>)}
        </div>
      ) : (
        <p className="drama-out">🦉 Cô cười hiền: "{said.includes('tiếng Anh') ? 'Mỗi tối hát cùng con một bài tiếng Anh, chỉ 10 phút thôi là con nhớ từ rất nhanh.' : 'Ba mẹ quan tâm như vậy là bé hạnh phúc lắm rồi.'}"{best ? ' Cô gửi giấy khen cho bé nhé!' : ''}</p>
      )}
      {claimed && <button className="btn" onClick={onClose}>Ra về</button>}
    </Sheet>
  );
}
