import { GemElement, html, adoptedStyle, customElement, connectStore } from '@mantou/gem';
import { waitLoading } from 'duoyun-ui/elements/wait';

import { i18n, langNames } from 'src/i18n';
import { gridStyle } from 'src/modules/shortcut-settings';
import { changeTheme, ThemeName, themeNames } from 'src/theme';
import { configure } from 'src/configure';

import 'duoyun-ui/elements/select';

/**
 * @customElement m-ui-settings
 */
@customElement('m-ui-settings')
@adoptedStyle(gridStyle)
@connectStore(i18n.store)
@connectStore(configure)
export class MUiSettingsElement extends GemElement {
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
      </div>
    `;
  };
}
