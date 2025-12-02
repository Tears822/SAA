import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
// import type { IReadonlyTheme } from '@microsoft/sp-component-base';
import { escape } from '@microsoft/sp-lodash-subset';

import styles from './PortalTilesWebPart.module.scss';
import * as strings from 'PortalTilesWebPartStrings';

import { SPFx, spfi, SPFI } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";

export interface IPortalTilesWebPartProps {
  description: string;
  tilesListTitle: string;
}

interface ITileItem {
  Id: number;
  Title: string;
  Category: string; // "Apps" or "Services"
  Url: { Url: string; Description: string };
  IconUrl: string;
  BgColor: string;
}

export default class PortalTilesWebPart extends BaseClientSideWebPart<IPortalTilesWebPartProps> {

  private _sp: SPFI;

  public render(): void {
    this.domElement.innerHTML = `
    <div class="${styles.outer}">
        <div class="${styles.band} ${styles.bandApps}">
          <div class="${styles.bandLabel}">Apps &amp; Systems</div>
          <div id="apps-row" class="${styles.tilesRow} ${styles.tilesRowApps}"></div>
        </div>

        <div class="${styles.band} ${styles.bandServices}">
          <div class="${styles.bandLabel}">Services</div>
          <div id="services-row" class="${styles.tilesRow} ${styles.tilesRowServices}"></div>
        </div>
      </div>`;

      this.loadTiles().catch(console.error);
  }

  protected onInit(): Promise<void> {
    this._sp = spfi().using(SPFx(this.context));
    return super.onInit();
  }

  private async loadTiles(): Promise<void> {
    const listTitle = this.properties.tilesListTitle || "PortalTiles";

    const items: ITileItem[] = await this._sp.web.lists
      .getByTitle(listTitle)
      .items.select("Id", "Title", "Category", "Url", "IconUrl", "BgColor")
      .top(200)();

      const webUrl = this.context.pageContext.web.serverRelativeUrl.replace(/\/$/, '');
      const tiles: ITileItem[] = items.map((i: any) => {
        let iconUrl = '';

        if (i.IconUrl) {
          try {
            // ImageUrl is stored as JSON string
            const imgInfo = JSON.parse(i.IconUrl);
            if (imgInfo.fileName) {
              iconUrl =
                `${webUrl}/Lists/${encodeURIComponent(listTitle)}` +
                `/Attachments/${i.Id}/${encodeURIComponent(imgInfo.fileName)}`;
            }
          } catch (e) {
            console.warn('ImageUrl is not valid JSON', e);
          }
        }

        return {
          Id: i.Id,
          Title: i.Title || '',
          Category: i.Category || '',
          Url: i.Url || '',
          IconUrl: iconUrl || '',
          BgColor: i.BgColor || ''
        };
      });

    const apps = tiles.filter(i => i.Category === "Apps");
    const services = tiles.filter(i => i.Category === "Services");

    const appsRow = this.domElement.querySelector("#apps-row") as HTMLElement;
    const servicesRow = this.domElement.querySelector("#services-row") as HTMLElement;

    if (appsRow) {
      appsRow.innerHTML = apps.map(t => this.renderAppTile(t)).join("");
    }

    if (servicesRow) {
      servicesRow.innerHTML = services.map(t => this.renderServiceTile(t)).join("");
    }
  }

  private renderAppTile(tile: ITileItem): string {
    const url = tile.Url ? tile.Url.Url : "#";
    const title = escape(tile.Title || "");
    // const iconUrl = (tile as any).IconUrl ? (tile as any).IconUrl?.serverRelativeUrl || "" : "";
    const iconUrl = tile.IconUrl || "";


    return `
      <a class="${styles.appTile}" href="${url}" title="${title}">
        <div class="${styles.appTileInner}">
          ${
            iconUrl
              ? `<img class="${styles.appIcon}" src="${iconUrl}" alt="${title}" />`
              : `<span class="${styles.appInitials}">${title.substring(0, 2).toUpperCase()}</span>`
          }
        </div>
      </a>
    `;
  }

  private renderServiceTile(tile: ITileItem): string {
    const url = tile.Url ? tile.Url.Url : "#";
    const title = escape(tile.Title || "");
    const iconUrl = tile.IconUrl || "";
    const bg = tile.BgColor && tile.BgColor.trim() !== ""
      ? tile.BgColor
      : "#f3a76e";
    // const bg = "#f3a76e";

    return `
      <a class="${styles.serviceTile}" href="${url}" title="${title}" style="background:${bg};">
        <div class="${styles.serviceTileInner}">
          <img class="serviceIcon" src="${iconUrl}" alt="${title}" />
          <span class="${styles.serviceTitle}">${title}</span>
        </div>
      </a>
    `;
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                }),
                PropertyPaneTextField('tilesListTitle', {
                  label: 'Tiles List Title'
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
