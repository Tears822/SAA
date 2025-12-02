// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../node_modules/@types/devextreme/dx.all.d.ts" />
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField, PropertyPaneSlider
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
// import type { IReadonlyTheme } from '@microsoft/sp-component-base';
// import { escape } from '@microsoft/sp-lodash-subset';

// import styles from './InternalJobsFeedWebPart.module.scss';
// import * as strings from 'InternalJobsFeedWebPartStrings';
import { SPComponentLoader } from "@microsoft/sp-loader";
import { SPFI, spfi, SPFx } from "@pnp/sp";
import "@pnp/sp";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/items";
import "@pnp/sp/lists";
import "@pnp/sp/profiles";
import "@pnp/sp/site-users/web";
import "@pnp/sp/webs";
import "devextreme";
import * as $ from "jquery";


require("../../assets/style.css");

export interface IInternalJobsFeedWebPartProps {
   listName: string;
  maxItems: number;
  viewAllUrl: string;
  applyPageUrl: string;
}

interface IJobItem {
  Id: number;
  Title: string;
  Department: string;
  ClosingDate?: string;
  ImageUrl?: string;
}

export default class InternalJobsFeedWebPart extends BaseClientSideWebPart<IInternalJobsFeedWebPartProps> {

  // private _isDarkTheme: boolean = false;
  // private _environmentMessage: string = '';
private _sp: SPFI;

  public async render(): Promise<void> {
    const instanceId = this.instanceId;

    this.domElement.innerHTML = `
      <div class="ijFeed">
        <div class="ijFeedHeader">
          <h2 class="ijFeedTitle">Internal Jobs</h2>
          <a id="ij-viewall-${instanceId}"
             class="ijFeedViewAll"
             href="#">View all &rsaquo;</a>
        </div>
        <div id="ij-status-${instanceId}" class="ijFeedStatus">
          Loading...
        </div>
        <div id="ij-list"></div>
      </div>
    `;

    // Set View All link
    $(`#ij-viewall-${instanceId}`, this.domElement).attr(
      'href',
      this.properties.viewAllUrl || this.context.pageContext.web.absoluteUrl
    );

    await this._renderJobs();
  }

  private async _renderJobs(): Promise<void> {
    const instanceId = this.instanceId;
    const $status = $(`#ij-status-${instanceId}`, this.domElement);
    const $listHost = $(`#ij-list`, this.domElement);

    $status.removeClass("error").text('Loading...').show();
    $listHost.empty();

    const formatDate = (value?: string): string => {
      if (!value) return '';
      const d = new Date(value);
      if (isNaN(d.getTime())) return '';
      const options: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      };
      return d.toLocaleDateString(undefined, options);
    };

    const getApplyUrl = (id: number): string => {
      const base = this.properties.applyPageUrl || '#';
      return `${base}${base.indexOf('?') > -1 ? '&' : '?'}jobId=${encodeURIComponent(
        id
      )}`;
    };

    try {
      const list = this._sp.web.lists.getByTitle(this.properties.listName);

      const rawItems: any[] = await list.items
        .select('Id', 'Title', 'Department', 'ClosingDate', 'ImageUrl', 'Status')
        .filter("Status eq 'Open'")
        .orderBy('ClosingDate', true)
        .top(this.properties.maxItems || 6)();

      const jobs: IJobItem[] = rawItems.map(i => ({
        Id: i.Id,
        Title: i.Title,
        Department: i.Department || '',
        ClosingDate: i.ClosingDate,
        ImageUrl: i.ImageUrl.Url || ''
      }));

      if (!jobs.length) {
        $status.text('No open internal jobs.').show();
        return;
      }

      $status.hide();

      // DevExtreme dxList
      ($listHost as any).dxList({
        dataSource: jobs,
        height: 'auto',
        noDataText: 'No open internal jobs.',
        activeStateEnabled: false,
        focusStateEnabled: false,
        // elementAttr: { class: "dxListRoot" },
        elementAttr: { class: 'ij-list-root' }, 
        itemTemplate: (data: IJobItem, _index: number, element: HTMLElement) => {
          const closingText = data.ClosingDate
            ? `Closing on ${formatDate(data.ClosingDate)}`
            : '';

          const $card = $('<div>').addClass("ijCard");

          if (data.ImageUrl) {
            $('<img>')
              .addClass("ijCardImage")
              .attr('src', data.ImageUrl)
              .attr('alt', data.Title)
              .appendTo($card);
          }

          const $body = $('<div>').addClass("ijCardBody").appendTo($card);

          if (data.Department) {
            $('<div>')
              .addClass("ijCardDepartment")
              .text(data.Department)
              .appendTo($body);
          }

          $('<a>')
            .addClass("ijCardTitle")
            .attr('href', getApplyUrl(data.Id))
            .text(data.Title)
            .appendTo($body);

          if (closingText) {
            $('<div>')
              .addClass("ijCardClosing")
              .text(closingText)
              .appendTo($body);
          }

          $('<button>')
            .addClass("ijCardApply")
            .text('Apply')
            .on('click', () => {
              window.location.href = getApplyUrl(data.Id);
            })
            .appendTo($body);

          $(element).append($card);
        }
      });
    } catch (error) {
      console.log('InternalJobs error', error);
      $status.addClass("error").text('Error loading internal jobs.');
    }
  }

  protected async onAfterPropertyPaneChangesApplied(): Promise<void> {
    // Re-render when properties change
    await this._renderJobs();
  }
  
  protected onInit(): Promise<void> {
    this._sp = spfi().using(SPFx(this.context));

    // Make jQuery global for DevExtreme
    (window as any).$ = (window as any).jQuery = $;

    // Default props
    if (!this.properties.listName) {
      this.properties.listName = 'Job Listings';
    }
    if (!this.properties.maxItems) {
      this.properties.maxItems = 6;
    }
    if (!this.properties.viewAllUrl) {
      this.properties.viewAllUrl =
        `${this.context.pageContext.web.absoluteUrl}/SitePages/Internal-Jobs.aspx`;
    }
    if (!this.properties.applyPageUrl) {
      this.properties.applyPageUrl =
        `${this.context.pageContext.web.absoluteUrl}/SitePages/ApplyInternalJob.aspx`;
    }
    SPComponentLoader.loadCss(
      "https://cdn3.devexpress.com/jslib/23.2.4/css/dx.light.css"
    );
    return super.onInit();
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

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: 'Internal jobs DevExtreme feed' },
          groups: [
            {
              groupName: 'Settings',
              groupFields: [
                PropertyPaneTextField('listName', {
                  label: 'Job list name'
                }),
                PropertyPaneSlider('maxItems', {
                  label: 'Max jobs to show',
                  min: 1,
                  max: 12,
                  step: 1
                }),
                PropertyPaneTextField('viewAllUrl', {
                  label: 'View all page URL'
                }),
                PropertyPaneTextField('applyPageUrl', {
                  label: 'Apply page URL (without jobId)'
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
