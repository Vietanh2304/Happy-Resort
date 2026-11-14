// Trạng thái sàn khiêu vũ dùng chung giữa thanh mũi tên (Disco.tsx) và lớp vẽ cặp đôi (Ballroom.tsx)
import type { DanceMood } from './tunes';
export interface DanceHit { who: 'me' | 'them'; m: number; at: number; both: boolean }
export const danceStage = { at: 0, end: 0, mood: 'waltz' as DanceMood, hits: [] as DanceHit[] };
