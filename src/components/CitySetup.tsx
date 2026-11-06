import * as api from '../lib/api';
import { toastError } from '../lib/toast';
import { Splash } from './Splash';
import { CityPicker, placeFields } from './CityPicker';

export function CitySetup({ profile, onDone }: { profile: api.Profile; onDone: () => void }) {
  return (
    <Splash>
      <p>Resort của bạn nằm ở thành phố nào?</p>
      <p className="muted">Bầu trời trong làng sẽ theo thời tiết và giờ thật ở đó.</p>
      <CityPicker
        onPick={p => api.updateProfile(profile.id, placeFields(p)).then(onDone, toastError)}
      />
    </Splash>
  );
}
