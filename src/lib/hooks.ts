import { useCallback, useEffect, useRef, useState } from 'react';
import { onSync, type Topic } from './realtime';
import { fetchWeather, type Weather } from './weather';

/** Dữ liệu tải từ server, tự tải lại khi có notify(topic) ở máy mình hoặc máy người ấy. */
export function useSynced<T>(topic: Topic, load: () => Promise<T>, initial: T, deps: unknown[] = []) {
  const [data, setData] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  const loadRef = useRef(load);
  loadRef.current = load;
  const reload = useCallback(
    () => loadRef.current().then(d => { setData(d); setLoaded(true); }, e => console.error(topic, e)),
    [topic],
  );
  useEffect(() => {
    reload();
    return onSync(topic, reload);
  }, [topic, reload, ...deps]);
  return [data, reload, loaded] as const;
}

/** Giờ hiện tại, cập nhật mỗi `ms` */
export function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

const WEATHER_EVERY = 30 * 60_000;

/** Thời tiết thật tại tọa độ, làm mới mỗi 30 phút */
export function useWeather(lat?: number | null, lon?: number | null) {
  const [weather, setWeather] = useState<Weather | null>(null);
  useEffect(() => {
    if (lat == null || lon == null) return setWeather(null);
    let alive = true;
    const load = () => fetchWeather(lat, lon).then(w => alive && setWeather(w), console.error);
    load();
    const t = setInterval(load, WEATHER_EVERY);
    return () => { alive = false; clearInterval(t); };
  }, [lat, lon]);
  return weather;
}
