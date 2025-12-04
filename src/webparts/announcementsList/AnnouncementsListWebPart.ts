import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneSlider,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
// import type { IReadonlyTheme } from '@microsoft/sp-component-base';
// import { escape } from '@microsoft/sp-lodash-subset';

import styles from './AnnouncementsListWebPart.module.scss';
import * as strings from 'AnnouncementsListWebPartStrings';
import { SPFx, SPFI, spfi } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
// import * as $ from "jquery";

export interface IAnnouncementsListWebPartProps {
  description: string;
  listName: string;
  itemsPerPage: number;
}

export interface IAnnouncementItem {
  Id: number;
  Title: string;
  Description: string;
  Category: string;
  ImageUrl: string;
  Created: string;
}


export default class AnnouncementsListWebPart extends BaseClientSideWebPart<IAnnouncementsListWebPartProps> {

   private _sp: SPFI;
  private _items: IAnnouncementItem[] = [];
  private _categories: string[] = [];     // <-- dynamic categories

  private _loading = false;
  private _error?: string;

  private _activeFilter: string = 'All';  // <-- can be 'All' or any category
  private _currentPage = 1;

  // DOM ids (per instance)
  private _filtersId: string;
  private _itemsId: string;
  private _statusId: string;
  private _pagerId: string;

  public async render(): Promise<void> {
   this._filtersId = `${this.instanceId}-filters`;
    this._itemsId = `${this.instanceId}-items`;
    this._statusId = `${this.instanceId}-status`;
    this._pagerId = `${this.instanceId}-pager`;

    this.domElement.innerHTML = this._getTemplateHtml();

    this._bindStaticEvents();
    await this._loadItems();
  }

  protected onInit(): Promise<void> {
    this._sp = spfi().using(SPFx(this.context));
        
    return super.onInit();
  }


  private _getTemplateHtml(): string {
    // filters will be rendered dynamically in _renderView()
    return `
      <div class="${styles.recognitionsFeed}">
        <div id="${this._filtersId}" class="${styles.filtersBar}"></div>

        <div id="${this._statusId}" class="${styles.statusMessage}">
          Loading...
        </div>

        <div id="${this._itemsId}" class="${styles.cardsGrid}">
          <!-- cards will be injected here -->
        </div>

        <div id="${this._pagerId}" class="${styles.pager}">
          <!-- pager will be injected here -->
        </div>
      </div>
    `;
  }

  private _bindStaticEvents(): void {
    const filtersBar = this.domElement.querySelector(`#${this._filtersId}`);
    if (filtersBar) {
      filtersBar.addEventListener('click', (ev: Event) => {
        const target = ev.target as HTMLElement;
        const btn = target.closest('button[data-filter]') as HTMLElement;
        if (!btn) {
          return;
        }
        const filter = btn.getAttribute('data-filter') || 'All';
        this._activeFilter = filter;
        this._currentPage = 1;
        this._renderView();
      });
    }

    const pager = this.domElement.querySelector(`#${this._pagerId}`);
    if (pager) {
      // event delegation for pager buttons
      pager.addEventListener('click', (ev: Event) => {
        const target = ev.target as HTMLElement;
        const btn = target.closest('button[data-page]') as HTMLElement;
        if (!btn) {
          return;
        }
        const pageStr = btn.getAttribute('data-page');
        const page = pageStr ? parseInt(pageStr, 10) : NaN;
        if (!isNaN(page)) {
          this._currentPage = page;
          this._renderView();
        }
      });
    }
  }

  private async _loadItems(): Promise<void> {
    this._loading = true;
    this._error = undefined;
    this._renderView(); // show "Loading..."

    try {
      const rawItems: any[] = await this._sp.web.lists
        .getByTitle(this.properties.listName || 'Announcements')
        .items
        .select('Id', 'Title', 'TitleEn', 'DescriptionAr', 'DescriptionEn','Category', 'ImageUrl', 'Created')
        .orderBy('Created', false)
        .top(500)();

      this._items = rawItems.map(r => ({
        Id: r.Id,
        Title: r.Title,
        Description: r.Description,
        Category: r.Category,
        ImageUrl: r.ImageUrl && r.ImageUrl.Url
          ? r.ImageUrl.Url
          : (typeof r.ImageUrl === 'string' ? r.ImageUrl : ''),
        Created: r.Created
      }));

      // build dynamic categories (distinct Category values)
      const cats = new Set<string>();
      this._items.forEach(i => {
        if (i.Category) {
          cats.add(i.Category);
        }
      });
      this._categories = Array.from(cats).sort();

      this._loading = false;
      this._currentPage = 1;
      this._renderView();
    } catch (err) {
      console.error(err);
      this._loading = false;
      this._error = 'Failed to load items. Check list name and permissions.';
      this._renderView();
    }
  }

  private _renderView(): void {
    const statusEl = this.domElement.querySelector(`#${this._statusId}`) as HTMLElement;
    const itemsEl = this.domElement.querySelector(`#${this._itemsId}`) as HTMLElement;
    const pagerEl = this.domElement.querySelector(`#${this._pagerId}`) as HTMLElement;
    const filtersBar = this.domElement.querySelector(`#${this._filtersId}`) as HTMLElement;

    if (!statusEl || !itemsEl || !pagerEl || !filtersBar) {
      return;
    }

    // --- render dynamic filter tabs ---
    const tabs: string[] = ['All', ...this._categories];
    filtersBar.innerHTML = tabs.map(tab => {
      const isActive = tab === this._activeFilter;
      const cls = isActive
        ? `${styles.filterTab} ${styles.active}`
        : styles.filterTab;
      return `
        <button type="button"
                class="${cls}"
                data-filter="${this._escape(tab)}">
          ${this._escape(tab)}
        </button>
      `;
    }).join('');

    if (this._loading) {
      statusEl.textContent = 'Loading...';
      statusEl.style.display = 'block';
      statusEl.classList.remove(styles.error);
      itemsEl.innerHTML = '';
      pagerEl.innerHTML = '';
      return;
    }

    if (this._error) {
      statusEl.textContent = this._error;
      statusEl.classList.add(styles.error);
      statusEl.style.display = 'block';
      itemsEl.innerHTML = '';
      pagerEl.innerHTML = '';
      return;
    }

    // filtered items
    const filteredItems = this._activeFilter === 'All'
      ? this._items
      : this._items.filter(i => i.Category === this._activeFilter);

    if (filteredItems.length === 0) {
      statusEl.textContent = 'No items found for the selected filter.';
      statusEl.classList.remove(styles.error);
      statusEl.style.display = 'block';
      itemsEl.innerHTML = '';
      pagerEl.innerHTML = '';
      return;
    }

    statusEl.style.display = 'none';

    // paging
    const pageSize = this.properties.itemsPerPage || 12;
    const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
    if (this._currentPage > totalPages) {
      this._currentPage = totalPages;
    }
    const startIndex = (this._currentPage - 1) * pageSize;
    const pageItems = filteredItems.slice(startIndex, startIndex + pageSize);

    // cards HTML
    const cardsHtml = pageItems.map(i => this._renderCardHtml(i)).join('');
    itemsEl.innerHTML = cardsHtml;

    // pager HTML
    if (totalPages > 1) {
      const pagesHtml = Array.from({ length: totalPages }, (_, idx) => {
        const page = idx + 1;
        const isCurrent = page === this._currentPage;
        const className = isCurrent
          ? `${styles.pageBtn} ${styles.currentPage}`
          : styles.pageBtn;

        return `
          <button type="button"
                  class="${className}"
                  data-page="${page}">
            ${page}
          </button>
        `;
      }).join('');

      pagerEl.innerHTML = `
        <button type="button"
                data-page="${Math.max(1, this._currentPage - 1)}"
                ${this._currentPage === 1 ? 'disabled' : ''}
        >&#8249; Prev</button>
        ${pagesHtml}
        <button type="button"
                data-page="${Math.min(totalPages, this._currentPage + 1)}"
                ${this._currentPage === totalPages ? 'disabled' : ''}
        >Next &#8250;</button>
      `;
    } else {
      pagerEl.innerHTML = '';
    }
  }

  private _renderCardHtml(item: IAnnouncementItem): string {
    const imgHtml = item.ImageUrl
      ? `<img src="${item.ImageUrl}"
              alt="${this._escape(item.Title)}"
              class="${styles.cardImage}" />`
      : '';

    return `
      <div class="${styles.card}">
        <div class="${styles.cardImageWrapper}">
          ${imgHtml}
        </div>
        <div class="${styles.cardBody}">
          <div class="${styles.cardHeaderRow}">
            <h3 class="${styles.cardTitle}">
              ${this._escape(item.Title)}
            </h3>
            <button type="button"
                    class="${styles.favoriteBtn}"
                    aria-label="Add to favorites">
              ★
            </button>
          </div>
          <p class="${styles.cardDescription}">
            ${this._escape(item.Description || '')}
          </p>
          <button type="button" class="${styles.happinessBtn}">
            Happiness Dose
          </button>
        </div>
      </div>
    `;
  }

  private _escape(value: string): string {
    if (!value) { return ''; }
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
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
                PropertyPaneTextField('listName', {
                  label: 'List name',
                  value: 'Announcements'
                }),
                PropertyPaneSlider('itemsPerPage', {
                  label: 'Items per page',
                  min: 4,
                  max: 24,
                  step: 1,
                  value: 12
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
