import type { Guest } from '../lib/api';
import { animal } from '../lib/content';
import { averageStars } from '../lib/game';
import { Sheet } from './Sheet';

/** Sổ khách: lời nhận xét của các vị khách đã ghé một bờ */
export function GuestbookSheet({ title, guests, onClose }: { title: string; guests: Guest[]; onClose: () => void }) {
  const reviewed = guests.filter(g => g.left_at && g.stars);
  const rating = averageStars(reviewed.map(g => g.stars!));

  return (
    <Sheet title={title} onClose={onClose}>
      <p className="rating-big">{rating ? `⭐ ${rating}` : 'Chưa có đánh giá'} <small className="muted">· {reviewed.length} lượt khách</small></p>
      <ul className="reviews">
        {reviewed.map(g => {
          const a = animal(g.animal_id);
          return (
            <li key={g.id}>
              <span className="entry-icon">{a?.icon}</span>
              <div>
                <b>{a?.name}</b> <span className="stars">{'★'.repeat(g.stars!)}{'☆'.repeat(5 - g.stars!)}</span>
                <p>“{g.review}”</p>
                <small className="muted">{g.day.split('-').reverse().join('/')}</small>
              </div>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
