import { useEffect, useState } from 'react';
import { onToast } from '../lib/toast';

export function Toasts() {
  const [list, setList] = useState<{ id: number; msg: string }[]>([]);

  useEffect(() => onToast(msg => {
    const id = Date.now() + Math.random();
    setList(l => [...l.slice(-2), { id, msg }]);
    setTimeout(() => setList(l => l.filter(t => t.id !== id)), 4200);
  }), []);

  return (
    <div className="toasts" aria-live="polite">
      {list.map(t => <div key={t.id} className="toast">{t.msg}</div>)}
    </div>
  );
}
