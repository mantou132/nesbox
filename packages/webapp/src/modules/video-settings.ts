import { GemElement, html, adoptedStyle, customElement, connectStore } from '@mantou/gem';

import { configure, Settings } from 'src/configure';
import { gridStyle } from 'src/modules/keybinding';
import { updateAccount } from 'src/services/api';
import { VideoFilter, VideoRenderMethod } from 'src/constants';

import 'duoyun-ui/elements/select';

/**
 * @customElement m-video-settings
 */
@customElement('m-video-settings')
@adoptedStyle(gridStyle)
@connectStore(configure)
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
        <div>渲染方法</div>
        <dy-select
          .value=${configure.user.settings.video.render}
          .options=${[
            { label: '像素化', value: VideoRenderMethod.PIXELATED },
            { label: '平滑', value: VideoRenderMethod.SMOOTH },
          ]}
          @change=${(evt: CustomEvent<VideoRenderMethod>) => this.#updateVideoSetting('render', evt.detail)}
        ></dy-select>
        <div>过滤器</div>
        <dy-select
          .value=${configure.user.settings.video.filter}
          .options=${[
            { label: '默认', value: VideoFilter.DEFAULT },
            { label: 'NTSC', value: VideoFilter.NTSC },
          ]}
          @change=${(evt: CustomEvent<VideoFilter>) => this.#updateVideoSetting('filter', evt.detail)}
        ></dy-select>
      </div>
    `;
  };
}
