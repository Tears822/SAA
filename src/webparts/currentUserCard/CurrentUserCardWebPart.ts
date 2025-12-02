// import { Version } from '@microsoft/sp-core-library';
// import {
//   type IPropertyPaneConfiguration,
//   PropertyPaneTextField
// } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
// import type { IReadonlyTheme } from '@microsoft/sp-component-base';
// import { escape } from '@microsoft/sp-lodash-subset';
import { spfi, SPFI } from '@pnp/sp';
import { SPFx } from '@pnp/sp';
import '@pnp/sp/profiles';
// import styles from './CurrentUserCard.module.scss';
// import * as strings from 'CurrentUserCardWebPartStrings';

require("../../assets/style.css");

export interface ICurrentUserCardWebPartProps {
  description: string;
}

export default class CurrentUserCardWebPart extends BaseClientSideWebPart<ICurrentUserCardWebPartProps> {

  private _sp: SPFI;

  public render(): void {
    this.domElement.innerHTML = `
    <div class="userCard">
        <div class="header">
          <div class="avatarCircle">
            <img id="cucUserPhoto" alt="User photo" />
          </div>
          <div class="textArea">
            <div id="cucUserName" class="currentUsername">Loading...</div>
            <div id="cucUserTitle" class="title"></div>
          </div>
        </div>

        <div class="tiles">
          <a id="cucTileProfile" class="tile tilePurple" target="_blank" rel="noopener">
            <span class="icon"><img src="/sites/HubSite/SiteAssets/icons/profile.svg" class="ggprofile-icon" alt=""></span>
            <span class="label">Profile</span>
          </a>
          <a id="cucTileEmail" class="tile tileGreen">
            <span class="icon"><img src="/sites/HubSite/SiteAssets/icons/email.svg" class="ggprofile-icon" alt=""></span>
            <span class="label">Email</span>
          </a>
          <a id="cucTileOneDrive" class="tile tileOrange" target="_blank" rel="noopener">
            <span class="icon"><img src="/sites/HubSite/SiteAssets/icons/onedrive.svg" class="tablerbrand-onedrive-icon" alt=""></span>
            <span class="label">OneDrive</span>
          </a>
          <a id="cucTileTeams" class="tile tilePeach" target="_blank" rel="noopener">
            <span class="icon"><img src="/sites/HubSite/SiteAssets/icons/teams-logo-light.svg" class="phmicrosoft-teams-logo-light-icon" alt=""></span>
            <span class="label">Teams</span>
          </a>
          <a id="cucTileFav" class="tile tileFav" target="_blank" rel="noopener">
            <span class="icon"><img src="/sites/HubSite/SiteAssets/icons/favorite.svg" class="ggprofile-icon" alt=""></span>
            <span class="label">Favorites</span>
          </a>
          <a id="cucTileTasks" class="tile tileMint" target="_blank" rel="noopener">
            <span class="icon"><img src="/sites/HubSite/SiteAssets/icons/list-task.svg" class="bilist-task-icon" alt=""></span>
            <span class="label">My Tasks</span>
          </a>
        </div>
      </div>
      `;

      this._loadCurrentUser().catch(console.error);
  }

  protected onInit(): Promise<void> {
    this._sp = spfi().using(SPFx(this.context));
    return super.onInit();
  }

  private _getProfileProperty(
    props: Array<{ Key: string; Value: string }>,
    key: string
  ): string | undefined {
    const hit = props.find(p => p.Key === key);
    return hit ? hit.Value : undefined;
  }

  private async _loadCurrentUser(): Promise<void> {
    const webUrl = this.context.pageContext.web.absoluteUrl.replace(/\/$/, '');

    const props = await this._sp.profiles.myProperties();

    const displayName = props.DisplayName;
    // const email = props.Email;
    const account = props.AccountName; // usually claims

    const jobTitle =
      this._getProfileProperty(props.UserProfileProperties, 'SPS-JobTitle') ||
      '';

    // photo url
    const photoUrl = `${webUrl}/_layouts/15/userphoto.aspx?size=L&accountname=${encodeURIComponent(account)}`;

    // set into DOM
    const nameEl = this.domElement.querySelector('#cucUserName') as HTMLDivElement;
    const titleEl = this.domElement.querySelector('#cucUserTitle') as HTMLDivElement;
    const imgEl = this.domElement.querySelector('#cucUserPhoto') as HTMLImageElement;

    if (nameEl)  nameEl.textContent  = displayName || '';
    if (titleEl) titleEl.textContent = jobTitle || '';
    if (imgEl)   imgEl.src           = photoUrl;

    // tiles links
    const mailLink = this.domElement.querySelector('#cucTileEmail') as HTMLAnchorElement;
    const profileLink = this.domElement.querySelector('#cucTileProfile') as HTMLAnchorElement;
    const oneDriveLink = this.domElement.querySelector('#cucTileOneDrive') as HTMLAnchorElement;
    const teamsLink = this.domElement.querySelector('#cucTileTeams') as HTMLAnchorElement;
    const tasksLink = this.domElement.querySelector('#cucTileTasks') as HTMLAnchorElement;

    if (mailLink) {
      mailLink.href = `https://outlook.office.com`;
    }

    // you can change these targets to whatever you use internally
    if (profileLink) {
      // classic profile page; or you can point to Delve if you prefer
      profileLink.href = `${webUrl}/_layouts/15/editprofile.aspx`;
    }

    if (oneDriveLink) {
      oneDriveLink.href = 'https://www.office.com/onedrive';
    }

    if (teamsLink) {
      teamsLink.href = 'https://teams.microsoft.com/';
    }

    if (tasksLink) {
      // To Do web app – change if you use Planner, etc.
      tasksLink.href = 'https://to-do.office.com/tasks';
    }
  }



  // private _getEnvironmentMessage(): Promise<string> {
  //   if (!!this.context.sdks.microsoftTeams) { // running in Teams, office.com or Outlook
  //     return this.context.sdks.microsoftTeams.teamsJs.app.getContext()
  //       .then(context => {
  //         let environmentMessage: string = '';
  //         switch (context.app.host.name) {
  //           case 'Office': // running in Office
  //             environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOffice : strings.AppOfficeEnvironment;
  //             break;
  //           case 'Outlook': // running in Outlook
  //             environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOutlook : strings.AppOutlookEnvironment;
  //             break;
  //           case 'Teams': // running in Teams
  //           case 'TeamsModern':
  //             environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentTeams : strings.AppTeamsTabEnvironment;
  //             break;
  //           default:
  //             environmentMessage = strings.UnknownEnvironment;
  //         }

  //         return environmentMessage;
  //       });
  //   }

  //   return Promise.resolve(this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentSharePoint : strings.AppSharePointEnvironment);
  // }

  // protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
  //   if (!currentTheme) {
  //     return;
  //   }

  //   this._isDarkTheme = !!currentTheme.isInverted;
  //   const {
  //     semanticColors
  //   } = currentTheme;

  //   if (semanticColors) {
  //     this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
  //     this.domElement.style.setProperty('--link', semanticColors.link || null);
  //     this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
  //   }

  // }

  // protected get dataVersion(): Version {
  //   return Version.parse('1.0');
  // }

  // protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
  //   return {
  //     pages: [
  //       {
  //         header: {
  //           description: strings.PropertyPaneDescription
  //         },
  //         groups: [
  //           {
  //             groupName: strings.BasicGroupName,
  //             groupFields: [
  //               PropertyPaneTextField('description', {
  //                 label: strings.DescriptionFieldLabel
  //               })
  //             ]
  //           }
  //         ]
  //       }
  //     ]
  //   };
  // }
}
