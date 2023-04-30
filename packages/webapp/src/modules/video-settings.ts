import { GemElement, html, adoptedStyle, customElement, connectStore } from '@mantou/gem';

import { RTCTransportType, VideoFilter, VideoRefreshRate, VideoRenderMethod } from 'src/constants';
import { configure, Settings } from 'src/configure';
import { gridStyle } from 'src/modules/shortcut-settings';
import { updateAccount } from 'src/services/api';
import { i18n } from 'src/i18n/basic';
import { icons } from 'src/icons';

import 'duoyun-ui/elements/select';
import 'duoyun-ui/elements/use';
import 'duoyun-ui/elements/tooltip';

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
        <div>${i18n.get('settings.video.refreshRate')}</div>
        <dy-select
          .value=${configure.user.settings.video.refreshRate}
          .options=${[
            { label: i18n.get('enum.videoRefreshRate.auto'), value: VideoRefreshRate.AUTO },
            { label: i18n.get('enum.videoRefreshRate.fixed'), value: VideoRefreshRate.FIXED },
            { label: i18n.get('enum.videoRefreshRate.sync'), value: VideoRefreshRate.SYNC },
          ]}
          @change=${(evt: CustomEvent<VideoRenderMethod>) => this.#updateVideoSetting('refreshRate', evt.detail)}
        ></dy-select>
        <div>${i18n.get('settings.video.render')}</div>
        <dy-select
          .value=${configure.user.settings.video.render}
          .options=${[
            { label: i18n.get('enum.videoRender.pixelated'), value: VideoRenderMethod.PIXELATED },
            { label: i18n.get('enum.videoRender.smooth'), value: VideoRenderMethod.SMOOTH },
          ]}
          @change=${(evt: CustomEvent<VideoRenderMethod>) => this.#updateVideoSetting('render', evt.detail)}
        ></dy-select>
        <div>${i18n.get('settings.video.filter')}</div>
        <dy-select
          .value=${configure.user.settings.video.filter}
          .options=${[
            { label: i18n.get('enum.videoFilter.default'), value: VideoFilter.DEFAULT },
            { label: 'NTSC', value: VideoFilter.NTSC },
            { label: 'CRT', value: VideoFilter.CRT },
          ]}
          @change=${(evt: CustomEvent<VideoFilter>) => this.#updateVideoSetting('filter', evt.detail)}
        ></dy-select>
        <div>
          ${i18n.get('settings.video.transport')}
          <dy-tooltip .content=${i18n.get('tip.settings.onlyHost')}>
            <dy-use class="help" .element=${icons.help}></dy-use>
          </dy-tooltip>
        </div>
        <dy-select
          .value=${configure.user.settings.video.rtcImprove}
          .options=${[
            { label: 'Event', value: RTCTransportType.EVENT },
            { label: 'Frame Clip', value: RTCTransportType.CLIP },
            { label: '30 FPS', value: RTCTransportType.REDUCE },
          ]}
          @change=${(evt: CustomEvent<VideoFilter>) => this.#updateVideoSetting('rtcImprove', evt.detail)}
        ></dy-select>
      </div>
    `;
  };
}
