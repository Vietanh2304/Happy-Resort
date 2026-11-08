// Công ty: văn phòng có sếp và đồng nghiệp (NPC), bàn làm việc của mình → 3 việc mỗi ngày → tan làm nhận lương,
// drama công sở rẽ nhánh (4–5 ngày một lần), sổ chuyện để kể cho người ấy nghe.
import { useState } from 'react';
import * as api from '../lib/api';
import { bossDeskSprite, OFFICE, workDeskSprite } from '../lib/officeArt';
import { notify } from '../lib/realtime';
import { characterSprite } from '../lib/sprites';
import { toast, toastError } from '../lib/toast';
import { applyChoice, cast, COMPANIES, dramaToday, newJob, ROLE_NAME, salaryOf, tasksOf, workday, type Drama, type JobData, type Task } from '../lib/work';
import type { Pt } from '../lib/world';
import { avatarPx } from './Avatar';
import { Sheet } from './Sheet';
import { Spr, Tag, useScale } from './Stage';

type Look = api.Profile['avatar'];
interface Npc { id: string; name: string; look: Look; at: Pt; lines: string[] }

function npcs(job: JobData, girl: boolean): Npc[] {
  const c = cast(job, girl);
  const affair = job.flags.includes('affair'), fired = job.next === 'newjob';
  return [
    { id: 'boss', name: c.boss, look: { gender: c.boss.startsWith('chị') ? 'f' : 'm', hair: 2, hairColor: 7, skin: 1, shirt: 10, outfit: 4, glasses: 1 }, at: { x: OFFICE.boss.x, y: OFFICE.boss.y - 2 },
      lines: fired ? ['…'] : affair ? ['Chuyện hôm trước… em giữ kín nhé.', 'Làm tốt lắm, cuối tháng anh xét thưởng.'] : ['Báo cáo hôm nay xong chưa em?', 'Cố lên, quý này mình về đích!', 'Nhớ họp lúc 3 giờ nhé.'] },
    { id: 'minh', name: c.mate, look: { gender: 'm', hair: 0, hairColor: 1, skin: 2, shirt: 1, outfit: 6 }, at: OFFICE.desks[0],
      lines: ['Trưa nay ăn bún chả không?', 'Ê, deadline dời sang thứ Sáu rồi đó!', 'Tối qua xem bóng đá không?'] },
    { id: 'hoa', name: c.mate2, look: { gender: 'f', hair: 3, hairColor: 2, skin: 0, shirt: 8, outfit: 14 }, at: OFFICE.desks[1],
      lines: ['Nghe gì chưa? Phòng bên có biến…', 'Chị mới mua trà sữa, uống không em?', 'Người yêu em dễ thương ghê, cho chị xem ảnh với!'] },
    { id: 'crush', name: c.crushShort, look: girl ? { gender: 'm', hair: 7, hairColor: 0, skin: 1, shirt: 5, outfit: 16 } : { gender: 'f', hair: 1, hairColor: 3, skin: 0, shirt: 0, outfit: 1 }, at: OFFICE.desks[2],
      lines: job.flags.includes('cleared') ? ['Chuyện hôm trước… cho mình xin lỗi nhé.', 'Chúc hai người hạnh phúc 💐'] : ['Hôm nay trông bạn đẹp ghê 😳', 'Mình mua dư một cái bánh nè…', 'Cuối tuần rảnh không?'] },
    { id: 'intern', name: cast(job, girl).intern, look: { gender: 'f', hair: 4, hairColor: 4, skin: 1, shirt: 9, outfit: 0 }, at: OFFICE.desks[3],
      lines: ['Anh/chị ơi chỉ em cách làm báo cáo với!', 'Em pha cà phê cho cả phòng nè ☕', 'Hôm nay em được sếp khen đó!'] },
  ];
}

export function OfficeContent({ job, me, go, onDesk, onTalk }: { job: JobData; me: api.Profile; go: (to: Pt, then?: () => void) => void; onDesk: () => void; onTalk: (name: string, line: string) => void }) {
  const s = useScale();
  const ps = avatarPx(s);
  const girl = me.avatar.gender === 'f';
  const people = npcs(job, girl);
  const co = COMPANIES[job.company];
  return (
    <>
      <Tag x={96} y={8} className="label">{co.icon} {co.name} · {ROLE_NAME[job.role]}</Tag>
      <Spr sprite={bossDeskSprite()} x={OFFICE.boss.x} y={OFFICE.boss.y + 8} z={OFFICE.boss.y + 8} />
      {OFFICE.desks.map((d, i) => <Spr key={i} sprite={workDeskSprite(false)} x={d.x} y={d.y + 8} z={d.y + 8} />)}
      <Spr sprite={workDeskSprite(true)} x={OFFICE.myDesk.x} y={OFFICE.myDesk.y + 8} z={OFFICE.myDesk.y + 8} title="💻 Bàn làm việc của bạn" onClick={() => go(OFFICE.myDesk.stand, onDesk)} />
      <Tag x={OFFICE.myDesk.x} y={OFFICE.myDesk.y - 16} className="label" onClick={() => go(OFFICE.myDesk.stand, onDesk)}>💻 Bàn của bạn</Tag>
      {people.map((n, i) => {
        const sp = characterSprite(n.look, 'sit');
        const talk = () => go({ x: n.at.x + (n.at.x > 96 ? -14 : 14), y: n.at.y + 10 }, () => onTalk(n.name, n.lines[Math.floor((Date.now() / 1000 + i) % n.lines.length)]));
        return (
          <div key={n.id}>
            <img src={sp.url} alt={n.name} title={n.name} draggable={false} className="spr tappable npc-sit" onClick={e => { e.stopPropagation(); talk(); }}
              style={{ left: n.at.x * s - (sp.w * ps) / 2, top: (n.at.y - 1) * s - sp.h * ps, width: sp.w * ps, height: sp.h * ps, zIndex: Math.round(n.at.y) + 7, animationDelay: `${-i * 0.7}s` }} />
          </div>
        );
      })}
    </>
  );
}

/** Bàn làm việc: việc hôm nay, drama, sổ chuyện */
export function WorkSheet({ me, partner, jobs, date, onSave, onPaid, onTell, onClose }: {
  me: api.Profile; partner: api.Profile | null; jobs: api.JobRow[]; date: string;
  onSave: (j: JobData) => Promise<void>; onPaid: (amount: number) => void; onTell: (text: string) => void; onClose: () => void;
}) {
  const girl = me.avatar.gender === 'f';
  const job: JobData = jobs.find(j => j.user_id === me.id)?.data ?? newJob(date);
  const theirs = partner ? jobs.find(j => j.user_id === partner.id)?.data : undefined;
  const today = job.today?.day === date ? job.today : { day: date, done: {} as Record<string, number> };
  const tasks = tasksOf(me.id, date);
  const drama = dramaToday(job, girl, date);
  const unemployed = job.next === 'newjob' && !(drama && drama.id === 'newjob');
  const [tab, setTab] = useState<'work' | 'drama' | 'log'>(drama && job.drama?.day !== date ? 'drama' : 'work');
  const [doing, setDoing] = useState<Task | null>(null);
  const allDone = tasks.every(t => today.done[t.id] !== undefined);
  const [paidNow, setPaidNow] = useState(false);
  const co = COMPANIES[job.company];
  const save = (j: JobData) => onSave(j).catch(toastError);

  const finishTask = (t: Task, right: number) => {
    const favor = t.favor && right === t.steps.length ? t.favor : 0;
    void save({ ...job, favor: Math.min(10, job.favor + favor), today: { day: date, done: { ...today.done, [t.id]: right } } });
    setDoing(null);
    toast(`${t.icon} Xong "${t.title}": đúng ${right}/${t.steps.length}${favor ? ' · sếp hài lòng 👍' : ''}`);
  };
  const clockOut = async () => {
    const pay = salaryOf({ ...job, today }, tasks);
    try {
      const ok = await api.grantCoins(`salary:${date}`, pay);
      await save({ ...job, today, days: job.days + (ok ? 1 : 0) });
      if (ok) { onPaid(pay); setPaidNow(true); } else toast('Hôm nay nhận lương rồi nha 😊');
    } catch (e) { toastError(e); }
  };
  const choose = (d: Drama, i: number) => {
    const { job: next, result } = applyChoice(job, d, i, date);
    void save(next);
    if (result.bonus) api.grantCoins(`drama:${date}`, result.bonus).then(ok => { if (ok) { toast(`💰 +${result.bonus} xu vào hũ chung`); notify('profiles'); } }, console.error);
  };

  if (doing) return <TaskRun task={doing} onDone={r => finishTask(doing, r)} onClose={() => setDoing(null)} />;
  const picked = job.drama?.day === date ? job.drama.picked : undefined;
  return (
    <Sheet title={`💼 ${co.icon} ${co.name}`} onClose={onClose}>
      <p className="muted small-note">{ROLE_NAME[job.role]} · đã đi làm {job.days} ngày · 👔 sếp quý {job.favor >= 0 ? '+' : ''}{job.favor} · 🤝 đồng nghiệp {job.mates >= 0 ? '+' : ''}{job.mates}{job.rumor > 0 ? ` · 🗣️ tin đồn ${job.rumor}` : ''}</p>
      <div className="tabs">
        <button className={tab === 'work' ? 'active' : ''} onClick={() => setTab('work')}>📋 Việc hôm nay</button>
        <button className={tab === 'drama' ? 'active' : ''} onClick={() => setTab('drama')}>🎭 Drama{drama && picked === undefined ? ' 🔴' : ''}</button>
        <button className={tab === 'log' ? 'active' : ''} onClick={() => setTab('log')}>📖 Sổ chuyện</button>
      </div>
      {tab === 'work' && (
        !workday(date) ? <p className="muted">🌴 Cuối tuần công ty nghỉ — ở nhà chơi với {partner?.display_name ?? 'người ấy'} thôi!</p>
          : unemployed ? <p className="muted">📦 Bạn đang tạm nghỉ việc… vài hôm nữa sẽ có công ty gọi phỏng vấn (xem tab 🎭 Drama).</p>
          : (
            <>
              <ul className="task-list">
                {tasks.map(t => {
                  const r = today.done[t.id];
                  return (
                    <li key={t.id} className={r !== undefined ? 'done' : ''}>
                      <span>{t.icon} <b>{t.title}</b><small className="muted"> — {t.desc}</small></span>
                      {r !== undefined ? <span className="ok-tag">✓ {r}/{t.steps.length}</span> : <button className="btn small" onClick={() => setDoing(t)}>Làm</button>}
                    </li>
                  );
                })}
              </ul>
              <button className="btn" disabled={!allDone || paidNow} onClick={() => void clockOut()}>{allDone ? `🏠 Tan làm · nhận lương ~${salaryOf({ ...job, today }, tasks)} xu` : 'Làm xong 3 việc mới được tan làm'}</button>
            </>
          )
      )}
      {tab === 'drama' && (
        !drama ? <p className="muted">😌 Hôm nay công ty yên bình. Drama tiếp theo khoảng ngày {job.nextDay.split('-').reverse().join('/')}.</p> : (
          <div className="drama">
            <h3>{drama.icon} {drama.title}</h3>
            <p>{drama.text}</p>
            {picked === undefined ? drama.choices.map((c, i) => <button key={i} className="btn small ghost drama-choice" onClick={() => choose(drama, i)}>{c.label}</button>) : (
              <>
                <p className="drama-pick">Bạn chọn: <b>{drama.choices[picked].label}</b></p>
                <p className="drama-out">➡️ {job.drama?.text}</p>
                {job.next && <p className="muted small-note">⏳ Chuyện này còn tiếp… vài hôm nữa sẽ biết.</p>}
                <button className="btn small" onClick={() => onTell(`📢 Drama ở ${co.name}: ${drama.title} — mình chọn "${drama.choices[picked].label}" → ${job.drama?.text}`)}>💬 Kể cho {partner?.display_name ?? 'người ấy'} nghe</button>
              </>
            )}
          </div>
        )
      )}
      {tab === 'log' && (
        <div className="drama-log">
          {!job.log.length && <p className="muted">Chưa có chuyện gì… đi làm vài hôm là có ngay 😏</p>}
          {[...job.log].reverse().map((l, i) => <p key={i}><small className="muted">{l.day.split('-').reverse().join('/')}</small> <b>{l.title}</b><br />{l.text}</p>)}
          {theirs?.log?.length ? (
            <>
              <h4>📖 Chuyện công ty của {partner?.display_name}</h4>
              {[...theirs.log].reverse().slice(0, 8).map((l, i) => <p key={`t${i}`}><small className="muted">{l.day.split('-').reverse().join('/')}</small> <b>{l.title}</b><br />{l.text}</p>)}
            </>
          ) : null}
        </div>
      )}
    </Sheet>
  );
}

function TaskRun({ task, onDone, onClose }: { task: Task; onDone: (right: number) => void; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [right, setRight] = useState(0);
  const [flash, setFlash] = useState<'ok' | 'no' | null>(null);
  const step = task.steps[i];
  const pick = (j: number) => {
    if (flash) return;
    const ok = j === step.ok;
    setFlash(ok ? 'ok' : 'no');
    setTimeout(() => {
      setFlash(null);
      const r = right + (ok ? 1 : 0);
      if (i + 1 >= task.steps.length) onDone(r); else { setRight(r); setI(i + 1); }
    }, 650);
  };
  return (
    <Sheet title={`${task.icon} ${task.title} (${i + 1}/${task.steps.length})`} onClose={onClose}>
      <p className="task-q">{step.q}</p>
      <div className="task-opts">{step.options.map((o, j) => <button key={j} className={`btn small ghost ${flash && j === step.ok ? 'right' : ''} ${flash === 'no' ? 'shake' : ''}`} onClick={() => pick(j)}>{o}</button>)}</div>
      {flash && <p className={`task-flash ${flash}`}>{flash === 'ok' ? '✅ Chuẩn!' : '❌ Chưa đúng…'}</p>}
    </Sheet>
  );
}
