import { GemElement, html, adoptedStyle, customElement, connectStore } from '@mantou/gem';

import { configure, Settings } from 'src/configure';
import { gridStyle } from 'src/modules/shortcut-settings';
import { updateAccount } from 'src/services/api';
import { VideoFilter, VideoRefreshRate, VideoRenderMethod } from 'src/constants';
import { i18n } from 'src/i18n';
import { icons } from 'src/icons';

import 'duoyun-ui/elements/select';
import 'duoyun-ui/elements/use';

/**
 * @customElement m-video-settings
 */
@customElement('m-video-settings')
@adoptedStyle(gridStyle)
@connectStore(configure)
@connectStore(i18n.store)
export class MVideoSettingsElement extends GemElement {
  #updateVideoSetting = async (name: keyof Settings['video'], value: Settings['video'][keyof Settings['video']]) => {
    await updateAccount({
      settings: {
        ...configure.user!.settings,
        video: {
          ...configure.user!.settings.video,
          [name]: value,
        },
      },
    });
  };

  render = () => {
    if (!configure.user) return html``;

    return html`
      <div class="grid">
        <div>${i18n.get('refreshRate')}</div>
        <dy-select
          .value=${configure.user.settings.video.refreshRate}
          .options=${[
            { label: i18n.get('refreshRateAuto'), value: VideoRefreshRate.AUTO },
            { label: i18n.get('refreshRateFixed'), value: VideoRefreshRate.FIXED },
            { label: i18n.get('refreshRateSync'), value: VideoRefreshRate.SYNC },
          ]}
          @change=${(evt: CustomEvent<VideoRenderMethod>) => this.#updateVideoSetting('refreshRate', evt.detail)}
        ></dy-select>
        <div>${i18n.get('videoRender')}</div>
        <dy-select
          .value=${configure.user.settings.video.render}
          .options=${[
            { label: i18n.get('videoRenderPixelated'), value: VideoRenderMethod.PIXELATED },
            { label: i18n.get('videoRenderSmooth'), value: VideoRenderMethod.SMOOTH },
          ]}
          @change=${(evt: CustomEvent<VideoRenderMethod>) => this.#updateVideoSetting('render', evt.detail)}
        ></dy-select>
        <div>
          ${i18n.get('videoFilter')}
          <dy-tooltip .content=${i18n.get('tipHostSetting')}>
            <dy-use class="help" .element=${icons.help}></dy-use>
          </dy-tooltip>
        </div>
        <dy-select
          .value=${configure.user.settings.video.filter}
          .options=${[
            { label: i18n.get('videoFilterDefault'), value: VideoFilter.DEFAULT },
            { label: 'NTSC', value: VideoFilter.NTSC },
          ]}
          @change=${(evt: CustomEvent<VideoFilter>) => this.#updateVideoSetting('filter', evt.detail)}
        ></dy-select>
      </div>
    `;
  };
}
