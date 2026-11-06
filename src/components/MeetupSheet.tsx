import { useState } from 'react';
import * as api from '../lib/api';
import { daysUntil } from '../lib/game';
import { notify } from '../lib/realtime';
import { toast, toastError } from '../lib/toast';
import { Sheet } from './Sheet';

interface Props {
  me: api.Profile;
  meetup: api.Meetup | null;
  today: string;
  onClose: () => void;
}

export function MeetupSheet({ me, meetup, today, onClose }: Props) {
  const [day, setDay] = useState(meetup?.day ?? '');
  const left = meetup ? daysUntil(today, meetup.day) : null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.setMeetup(me, day);
      notify('meetup');
      toast('📅 Đã hẹn ngày gặp!');
    } catch (err) {
      toastError(err);
    }
  }

  return (
    <Sheet title="📅 Ngày gặp nhau" onClose={onClose}>
      {left !== null && (
        <div className="countdown">
          {left > 0 && <><b>{left}</b><span>ngày nữa là gặp nhau</span></>}
          {left === 0 && <><b>💞</b><span>Hôm nay gặp nhau rồi!</span></>}
          {left < 0 && <span>Lần gặp trước đã qua — hẹn lần tiếp theo nhé.</span>}
        </div>
      )}
      <form className="stack" onSubmit={save}>
        <label className="field">
          <span>Chọn ngày gặp</span>
          <input type="date" min={today} value={day} onChange={e => setDay(e.target.value)} required />
        </label>
        <button className="btn" disabled={!day || day === meetup?.day}>Lưu ngày hẹn</button>
        <p className="muted">Đúng ngày đó, cả hai bờ sẽ có pháo hoa và một kỷ vật đặc biệt.</p>
      </form>
    </Sheet>
  );
}

export function Fireworks({ onClose }: { onClose: () => void }) {
  return (
    <div className="fireworks" onClick={onClose}>
      {Array.from({ length: 7 }, (_, i) => <div key={i} className={`burst burst-${i}`} />)}
      <div className="fireworks-msg">
        <b>💞 Hôm nay gặp nhau!</b>
        <span>Kỷ vật ngày gặp đã nằm trong túi. Chạm để đóng.</span>
      </div>
    </div>
  );
}
