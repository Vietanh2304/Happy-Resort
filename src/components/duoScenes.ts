// Danh sách các màn hoạt động hai người (xem Duo.tsx)
import { SKY_SCENES } from './duoSky';
import { CRAFT_SCENES } from './duoCraft';
import { icecastle } from './duoIce';

export const DUO_SCENES = { ...SKY_SCENES, ...CRAFT_SCENES, icecastle };
