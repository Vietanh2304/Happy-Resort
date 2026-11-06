// Open-Meteo: thời tiết và tìm thành phố, không cần API key.
import type { WeatherType } from './content';

export interface Weather { type: WeatherType; temp: number; code: number }
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
