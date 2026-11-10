// Open-Meteo: thời tiết và tìm thành phố, không cần API key.
import type { WeatherType } from './content';

export interface Weather { type: WeatherType; temp: number; code: number }
/** Thời tiết ngoài trời của cảnh đang xem — NPC ngoài trời mặc theo (World cập nhật mỗi lần vẽ) */
export const outWx = { on: false, type: 'clear' as WeatherType, temp: 20, hour: 12, fest: '' };
/** Câu nói vu vơ hợp hoàn cảnh: thời tiết, giờ giấc, lễ hội. kid = lời trẻ con */
export function wxChatter(kid = false): string[] {
  const o: string[] = [];
  if (outWx.on) {
    if (outWx.type === 'rain') o.push(...(kid ? ['Mưa rồi, nhảy vũng nước đi! 💦', 'Tớ quên áo mưa 😢', 'Ô của tớ màu vàng nè ☂️'] : ['Mưa to quá, may mà có ô ☂️', 'Mưa thế này phơi đồ không khô mất', 'Chạy nhanh vào trú mưa thôi!']));
    if (outWx.type === 'snow') o.push(...(kid ? ['Ném tuyết không? ❄️', 'Nặn người tuyết đi!', 'Tuyết lạnh buốt tay luôn ⛄'] : ['Tuyết rơi đẹp ghê ❄️', 'Cẩn thận đường trơn nha', 'Về nhà uống gì nóng thôi']));
    if (outWx.type === 'fog') o.push(kid ? 'Sương mù như trong phim ma 👻' : 'Sương dày thế, lái xe phải chậm');
    if (outWx.temp < 10) o.push(kid ? 'Mẹ bắt tớ quàng khăn đó 🧣' : 'Lạnh quá, nhớ quàng khăn 🧣');
    if (outWx.temp >= 32) o.push(kid ? 'Nóng quá, muốn ăn kem 🍦' : 'Nắng chang chang, uống nước nhiều vào ☀️');
  }
  const h = outWx.hour;
  if (h < 10) o.push(kid ? 'Chào buổi sáng! 🌅' : 'Sáng sớm đã đông người ghê');
  else if (h >= 11 && h < 13) o.push(kid ? 'Đói bụng quá, sắp tới giờ ăn trưa' : 'Trưa rồi, đi ăn thôi 🍜');
  else if (h >= 21) o.push(kid ? 'Khuya rồi mà chưa ngủ hả?' : 'Khuya rồi, về sớm nghỉ ngơi đi 🌙');
  if (outWx.fest) o.push(kid ? `Hôm nay ${outWx.fest} đó, vui quá! 🎉` : `${outWx.fest} vui vẻ nha! 🎉`);
  return o;
}
/** Trộn câu theo hoàn cảnh vào câu thường (hoàn cảnh hay được nói hơn) */
export function pickChatter(base: string[], n: number, kid = false) {
  const c = wxChatter(kid);
  return c.length && n % 3 !== 2 ? c[n % c.length] : base[n % base.length];
}
/** NPC: lạnh quàng khăn, rét mặc áo khoác */
export function wxLook<T extends { outfit?: number; acc?: number; design?: unknown }>(look: T): T {
  if (!outWx.on) return look;
  if (outWx.temp < 3) return { ...look, outfit: 11, acc: 3, design: null };
  if (outWx.temp < 10) return { ...look, acc: 10 };
  return look;
}
export const wxRain = () => outWx.on && outWx.type === 'rain';
export interface Place {
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export const weatherLabel: Record<WeatherType, string> = {
  clear: 'Trời quang', cloudy: 'Nhiều mây', rain: 'Mưa', snow: 'Tuyết', fog: 'Sương mù',
};
export const weatherIcon: Record<WeatherType, string> = {
  clear: '☀️', cloudy: '☁️', rain: '🌧️', snow: '❄️', fog: '🌫️',
};

/** Mã thời tiết WMO → 5 loại của game */
export function codeToType(code: number): WeatherType {
  if (code <= 1) return 'clear';
  if (code <= 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  return 'rain'; // mưa phùn, mưa, mưa rào, dông
}

export async function fetchWeather(lat: number, lon: number): Promise<Weather> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Không lấy được thời tiết');
  const { current } = await res.json();
  return { type: codeToType(current.weather_code), temp: Math.round(current.temperature_2m), code: current.weather_code };
}

export async function searchCity(name: string): Promise<Place[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=6&language=vi&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Không tìm được thành phố');
  const data = await res.json();
  return data.results ?? [];
}
