import { LANDMARKS, type CityKind } from '../lib/places';
import { Sheet } from './Sheet';

export const PLANE_NOTES = ['Nhớ cậu 💗', 'Ăn cơm chưa?', 'Ngủ ngon nha 🌙', 'Cố lên! 💪', 'Muốn ôm quá 🤗'];
export interface TwinPlane { id: number; fromMe: boolean; text: string }

/** Bưu thiếp một địa điểm ở thành phố của một trong hai người */
export function Postcard({ city, cityName, i, onWish, onClose }: { city: CityKind; cityName: string; i: number; onWish: (body: string) => void; onClose: () => void }) {
  const l = LANDMARKS[city][i];
  if (!l) return null;
  return (
    <Sheet title="📮 Bưu thiếp" onClose={onClose}>
      <div className="postcard">
        <div className="postcard-icon">{l.icon}</div>
        <div>
          <h3>{l.name}</h3>
          <small>{cityName}</small>
          <p>{l.text}</p>
        </div>
      </div>
      <button className="btn" onClick={() => onWish(`Cùng nhau đi ${l.name} (${cityName}) ${l.icon}`)}>💌 Thêm vào danh sách "Muốn cùng làm"</button>
    </Sheet>
  );
}
