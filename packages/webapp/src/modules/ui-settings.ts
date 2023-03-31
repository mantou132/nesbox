import { GemElement, html, adoptedStyle, customElement, connectStore } from '@mantou/gem';
import { waitLoading } from 'duoyun-ui/elements/wait';

import { i18n, langNames } from 'src/i18n';
import { gridStyle } from 'src/modules/shortcut-settings';
import { changeTheme, ThemeName, themeNames } from 'src/theme';
import { configure, Settings } from 'src/configure';
import { updateAccount } from 'src/services/api';

import 'duoyun-ui/elements/select';
import 'duoyun-ui/elements/switch';

/**
 * @customElement m-ui-settings
 */
@customElement('m-ui-settings')
@adoptedStyle(gridStyle)
@connectStore(i18n.store)
@connectStore(configure)
export class MUiSettingsElement extends GemElement {
  #updateVideoSetting = async (name: keyof Settings['ui'], value: Settings['ui'][keyof Settings['ui']]) => {
    await updateAccount({
      settings: {
        ...configure.user!.settings,
        ui: {
          ...configure.user!.settings.video,
          [name]: value,
        },
      },
    });
  };

  render = () => {
    return html`
      <div class="grid">
        <div>${i18n.get('changeLanguage')}</div>
        <dy-select
          .value=${i18n.currentLanguage}
          .options=${Object.keys(i18n.resources).map((code) => ({
            label: langNames[code],
            value: code,
          }))}
          @change=${({ detail }: CustomEvent<string>) => waitLoading(i18n.setLanguage(detail))}
        ></dy-select>
        <div>${i18n.get('changeTheme')}</div>
        <dy-select
          .value=${configure.theme}
          .options=${Object.entries(themeNames).map(([theme, name]: [ThemeName, string]) => ({
            label: name,
            value: theme,
          }))}
          @change=${({ detail }: CustomEvent<ThemeName>) => changeTheme(detail)}
        ></dy-select>
        ${window.__TAURI__ && location.hostname !== 'localhost'
          ? html`
              <div>${i18n.get('branch')}</div>
              <dy-select
                .value=${location.origin.includes('dev') ? 'dev' : 'master'}
                .options=${['master', 'dev'].map((branch) => ({ label: branch.toUpperCase(), value: branch }))}
                @change=${({ detail }: CustomEvent<string>) =>
                  window.__TAURI__?.tauri.invoke('set_branch', { branch: detail }).catch(() => {
                    //
                  })}
              ></dy-select>
            `
          : ''}
        ${'startViewTransition' in document
          ? html`
              <div>Transition</div>
              <dy-switch
                .checked=${!!configure.user?.settings.ui.viewTransition}
                @change=${({ detail }: CustomEvent<boolean>) => this.#updateVideoSetting('viewTransition', detail)}
              ></dy-switch>
            `
          : ''}
      </div>
    `;
  };
}
