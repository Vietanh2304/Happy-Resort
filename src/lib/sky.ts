import type { Phase } from './content';

/** Màu trời [trên, dưới] theo thời điểm trong ngày — tươi, rực */
export const SKY: Record<Phase, [string, string]> = {
  dawn: ['#7d86e0', '#ffb8a0'],
  day: ['#3fa9f5', '#b8e8ff'],
  sunset: ['#6a4fc4', '#ff8a5c'],
  night: ['#121a4a', '#3a3a8a'],
};

/** Màu biển gần mỗi bờ */
export const SEA: Record<Phase, string> = {
  dawn: '#5fb8e0',
  day: '#1fb5d8',
  sunset: '#9a6ac0',
  night: '#1f3470',
};
