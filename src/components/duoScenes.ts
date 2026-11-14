// Danh sách các màn hoạt động hai người (xem Duo.tsx)
import { SKY_SCENES } from './duoSky';
import { CRAFT_SCENES } from './duoCraft';
import { icecastle } from './duoIce';
import { glacier_train } from './duoTrain';
import { CHEER_SCENES } from './duoCheer';
import { greet } from './duoGreet';
import { DREAM_SCENES } from './duoDream';

export const DUO_SCENES = { ...SKY_SCENES, ...CRAFT_SCENES, icecastle, glacier: glacier_train, ...CHEER_SCENES, greet, ...DREAM_SCENES };
