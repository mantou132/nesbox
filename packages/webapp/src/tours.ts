import { setTours, Tour } from 'duoyun-ui/elements/coach-mark';
import { getCDNSrc } from 'src/utils';

import { globalEvents } from 'src/constants';
import { tourI18n } from 'src/tour-i18n';
import { configure, toggleSettingsState } from 'src/configure';
import { updateAccount } from 'src/services/api';

const tours = [
  {
    preview: getCDNSrc(
      'https://user-images.githubusercontent.com/3841872/188765413-edcab6c5-7f32-4510-b3b0-635d00cb6939.png',
    ),
    title: tourI18n.get('tour1Title'),
    description: tourI18n.get('tour1Desc'),
    finishText: tourI18n.get('tour1FinishText'),
    finish: () => {
      toggleSettingsState();
      return new Promise((res) => addEventListener(globalEvents.CLOSE_SETTINGS, () => res(null), { once: true }));
    },
  },
  {
    title: tourI18n.get('tour2Title'),
    description: tourI18n.get('tour2Desc'),
  },
].map(
  (tour, index, arr) =>
    ({
      ...tour,
      maskCloseable: false,
      before: () => updateAccount({ settings: { ...configure.user!.settings, tourIndex: index + 1 } }),
      skip: () => updateAccount({ settings: { ...configure.user!.settings, tourIndex: arr.length } }),
    } as Tour),
);

export const openTorus = () => {
  if (configure.user && configure.user.settings.tourIndex < tours.length) {
    setTours(tours, { currentIndex: configure.user.settings.tourIndex });
  } else {
    // test
    // updateAccount({ settings: { ...configure.user!.settings, tourIndex: 0 } });
  }
};
