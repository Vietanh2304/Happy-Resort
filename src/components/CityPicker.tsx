import { useState } from 'react';
import { searchCity, type Place } from '../lib/weather';

export function CityPicker({ onPick }: { onPick: (p: Place) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Place[] | null>(null);
  const [busy, setBusy] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      setResults(await searchCity(q.trim()));
    } catch {
      setResults([]);
    }
    setBusy(false);
  }

  return (
    <div className="stack">
      <form className="row" onSubmit={search}>
        <input placeholder="Tên thành phố, vd. Hà Nội" value={q} onChange={e => setQ(e.target.value)} required />
        <button className="btn small" disabled={busy}>{busy ? '…' : 'Tìm'}</button>
      </form>
      {results?.length === 0 && <p className="muted">Không thấy thành phố nào, thử tên khác nhé.</p>}
      {results && results.length > 0 && (
        <ul className="city-list">
          {results.map(p => (
            <li key={`${p.latitude},${p.longitude}`}>
              <button onClick={() => onPick(p)}>
                <b>{p.name}</b>
                <span className="muted">{[p.admin1, p.country].filter(Boolean).join(', ')}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Các trường hồ sơ tương ứng với một địa điểm */
export function placeFields(p: Place) {
  return { city: p.name, lat: p.latitude, lon: p.longitude, tz: p.timezone };
}
