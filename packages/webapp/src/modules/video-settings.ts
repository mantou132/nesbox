import { GemElement, html, adoptedStyle, customElement, connectStore } from '@mantou/gem';

import { configure, Settings } from 'src/configure';
import { gridStyle } from 'src/modules/keybinding';
import { updateAccount } from 'src/services/api';
import { VideoFilter, VideoRenderMethod } from 'src/constants';
import { i18n } from 'src/i18n';

import 'duoyun-ui/elements/select';

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
        <div>${i18n.get('videoRender')}</div>
        <dy-select
          .value=${configure.user.settings.video.render}
          .options=${[
            { label: i18n.get('videoRenderPixelated'), value: VideoRenderMethod.PIXELATED },
            { label: i18n.get('videoRenderSmooth'), value: VideoRenderMethod.SMOOTH },
          ]}
          @change=${(evt: CustomEvent<VideoRenderMethod>) => this.#updateVideoSetting('render', evt.detail)}
        ></dy-select>
        <div>${i18n.get('videoFilter')}</div>
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
