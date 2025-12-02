import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
// import type { IReadonlyTheme } from '@microsoft/sp-component-base';
// import { escape } from '@microsoft/sp-lodash-subset';

// import styles from './AskSupportWebPart.module.scss';
// import * as strings from 'AskSupportWebPartStrings';

export interface IAskSupportWebPartProps {
  description: string;
  askItUrl: string;
  askAdminUrl: string;
}

export default class AskSupportWebPart extends BaseClientSideWebPart<IAskSupportWebPartProps> {

  // private _isDarkTheme: boolean = false;
  // private _environmentMessage: string = '';

  public render(): void {
    this.domElement.innerHTML = `
    <div class="fullWidthWrapper">
        <div class="bar">
          <button id="askItBtn" class="askSupporttile askIt">
            <span class="icon">
              <img src="/sites/HubSite/SiteAssets/icons/askit.svg" class="ggprofile-icon" alt="">
            </span>
            <span class="label">ASK IT</span>
          </button>

          <button id="askAdminBtn" class="askSupporttile askAdmin">
            <span class="icon">
              <img src="/sites/HubSite/SiteAssets/icons/askadmin.svg" class="ggprofile-icon" alt="">
            </span>
            <span class="label">ASK Admin</span>
          </button>
        </div>
      </div>`;

      this._wireEvents();
  }

  // protected onInit(): Promise<void> {
  //   // return this._getEnvironmentMessage().then(message => {
  //   //   // this._environmentMessage = message;
  //   // });
  // }

  private _wireEvents(): void {
    const askItBtn = this.domElement.querySelector('#askItBtn') as HTMLButtonElement;
    const askAdminBtn = this.domElement.querySelector('#askAdminBtn') as HTMLButtonElement;

    if (askItBtn) {
      askItBtn.onclick = () => {
        if (this.properties.askItUrl) {
          window.location.href = this.properties.askItUrl;
        }
      };
    }

    if (askAdminBtn) {
      askAdminBtn.onclick = () => {
        if (this.properties.askAdminUrl) {
          window.location.href = this.properties.askAdminUrl;
        }
      };
    }
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
           header: { description: 'Links' },
          groups: [
            {
              groupName: 'Settings',
              groupFields: [
                PropertyPaneTextField('askItUrl', {
                  label: 'ASK IT link'
                }),
                PropertyPaneTextField('askAdminUrl', {
                  label: 'ASK Admin link'
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
