// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../node_modules/@types/devextreme/dx.all.d.ts" />
// import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneSlider,
} from "@microsoft/sp-property-pane";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
// import type { IReadonlyTheme } from '@microsoft/sp-component-base';
// import { escape } from '@microsoft/sp-lodash-subset';

// import styles from './InternalJobsListWebPart.module.scss';
// import * as strings from 'InternalJobsListWebPartStrings';
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

export interface IInternalJobsListWebPartProps {
  listName: string;
  pageSize: number;
  viewDetailsPageUrl: string;
}

interface IJobItem {
  Id: number;
  Title: string;
  Department: string;
  JobDescription: string;
  Requirements: string;
  PublishedDate?: string;
  ClosingDate?: string;
  ImageUrl?: string;
}

export default class InternalJobsListWebPart extends BaseClientSideWebPart<IInternalJobsListWebPartProps> {
  private _sp: SPFI;

  private _allItems: IJobItem[] = [];
  private _departments: string[] = [];
  private _currentDepartment: string = "All";
  private _currentPage: number = 1;
  private _searchText: string = "";

  public async render(): Promise<void> {
    const id = this.instanceId;

    this.domElement.innerHTML = `
      <!--<div class="stories">
        <div class="filterBar" id="sl-filters-${id}"></div>-->

        <div class="stories">
      <div class="stories-toolbar">
        <div class="filterBar" id="sl-filters-${id}"></div>

        <div class="stories-search">
          <input
            type="text"
            id="sl-search-${id}"
            class="stories-search-input"
            placeholder="Search jobs..."
            autocomplete="off"
          />
        </div>
      </div>

        <div id="sl-status-${id}" class="status">
          Loading...
        </div>

        <div id="sl-list-${id}"></div>

        <div id="sl-pager-${id}" class="pager"></div>
        <!-- 🔹 popup host -->
      <div id="sl-popup-${id}"></div>
    </div>
      </div>
    `;

    await this._loadData();

    // wire search once the DOM exists
    const $search = $(`#sl-search-${id}`, this.domElement);
    $search.on("input", () => {
      this._searchText = ($search.val() || "").toString();
      this._currentPage = 1;
      this._renderCurrentPage();
    });
  }

  private async _loadData(): Promise<void> {
    const id = this.instanceId;
    const $status = $(`#sl-status-${id}`, this.domElement);
    const $listHost = $(`#sl-list-${id}`, this.domElement);
    const $pagerHost = $(`#sl-pager-${id}`, this.domElement);
    const $filterHost = $(`#sl-filters-${id}`, this.domElement);

    $status.removeClass("error").text("Loading...").show();
    $listHost.empty();
    $pagerHost.empty();
    $filterHost.empty();
    this._allItems = [];
    this._departments = [];
    this._currentDepartment = "All";
    this._currentPage = 1;

    try {
      // const today = new Date().toISOString();

      const list = this._sp.web.lists.getByTitle(this.properties.listName);

      const raw: any[] = await list.items
        .select(
          "Id",
          "Title",
          "Department",
          "JobDescription",
          "Requirements",
          "PublishedDate",
          "ClosingDate",
          "ImageUrl"
        )
        // .filter('PublishedDate ge datetime\'' + today + '\' and ClosingDate le datetime\'' + today + '\')')
        // .filter(l => l.date("PublishedDate").greaterThanOrEquals(today) && l.date("ClosingDate").lessThan(today))
        .orderBy("PublishedDate", false)();

      this._allItems = raw.map((i) => ({
        Id: i.Id,
        Title: i.Title,
        Department: i.Department ? i.Department.toString().trim() : "",
        JobDescription: (i.JobDescription || "").toString(),
        Requirements: (i.Requirements || "").toString(),
        PublishedDate: i.PublishedDate,
        ClosingDate: i.ClosingDate,
        ImageUrl: i.ImageUrl.Url || "",
      }));

      // Build distinct departments
      // const catSet: { [key: string]: boolean } = {};
      // this._allItems.forEach(i => {
      //   if (i.Department) {
      //     catSet[i.Department] = true;
      //   }
      // });
      // this._departments = Object.keys(catSet).sort();

      const catSet: { [key: string]: string } = {};
      this._allItems.forEach((i) => {
        const dep = (i.Department || "").trim();
        if (dep) {
          catSet[dep.toLowerCase()] = dep; // key = lower, value = display
        }
      });
      this._departments = Object.keys(catSet)
        .sort()
        .map((k) => catSet[k]);

      $status.hide();

      this._renderFilters();
      this._renderCurrentPage();
    } catch (err) {
      console.error("Internal JObs Listing error", err);
      $status.addClass("error").text("Error loading items.");
    }
  }

  private _renderFilters(): void {
    const id = this.instanceId;
    const $host = $(`#sl-filters-${id}`, this.domElement);
    $host.empty();

    const makeButton = (label: string, DepartmentKey: string) => {
      const isActive = this._currentDepartment === DepartmentKey;
      const $btn = $('<button type="button">')
        .addClass("filterButton")
        .text(label);

      if (isActive) {
        $btn.addClass("filterButtonActive");
      }

      $btn.on("click", () => {
        if (this._currentDepartment === DepartmentKey) return;
        this._currentDepartment = DepartmentKey;
        this._currentPage = 1;
        this._renderFilters();
        this._renderCurrentPage();
      });

      return $btn;
    };

    // "All"
    $host.append(makeButton("All", "All"));

    // departments from list
    this._departments.forEach((cat) => {
      $host.append(makeButton(cat, cat));
    });
  }

  private _renderCurrentPage(): void {
    const id = this.instanceId;
    const $listHost = $(`#sl-list-${id}`, this.domElement);
    const $pagerHost = $(`#sl-pager-${id}`, this.domElement);
    const $status = $(`#sl-status-${id}`, this.domElement);
    const $popupHost = $(`#sl-popup-${id}`, this.domElement);

    // 🔹 init / reuse dxPopup
    let popupInstance: any;
    try {
      popupInstance = ($popupHost as any).dxPopup("instance");
    } catch {
      popupInstance = null;
    }

    if (!popupInstance) {
      ($popupHost as any).dxPopup({
        width: 600,
        maxHeight: 500,
        showTitle: true,
        title: "",
        visible: false,
        hideOnOutsideClick: true,
        dragEnabled: true,
      });
      popupInstance = ($popupHost as any).dxPopup("instance");
    }

    const showDetails = (item: IJobItem) => {
      popupInstance.option({
        title: item.Title,
        contentTemplate: () => {
          const $root = $('<div class="ij-detail-popup"></div>');

          if (item.Department) {
            $("<div>")
              .addClass("ij-detail-department")
              .text(item.Department)
              .appendTo($root);
          }

          $("<h3>")
            .addClass("ij-detail-heading")
            .text("Job description")
            .appendTo($root);

          $("<div>")
            .addClass("ij-detail-text")
            .text(item.JobDescription || "No description provided.")
            .appendTo($root);

          $("<h3>")
            .addClass("ij-detail-heading")
            .text("Requirements")
            .appendTo($root);

          $("<div>")
            .addClass("ij-detail-text")
            .text(item.Requirements || "No requirements provided.")
            .appendTo($root);

          if (item.ClosingDate) {
            $("<div>")
              .addClass("ij-detail-date")
              .text('Closing: ' + formatDate(item.ClosingDate))
              .appendTo($root);
          }

          return $root;
        },
      });

      popupInstance.show();
    };
    // 🔹 end popup init

    $status.hide();
    // $listHost.empty();
    $pagerHost.empty();

    // Filter by Department
    // let filtered = this._allItems;
    // if (this._currentDepartment !== "All") {
    //   filtered = this._allItems.filter(
    //     (i) => i.Department === this._currentDepartment
    //   );
    // }

    let filtered = this._allItems;

    // if (this._currentDepartment !== "All") {
    //   const searchKey = this._currentDepartment.toLowerCase();

    //   filtered = this._allItems.filter((i) => {
    //     const dep = (i.Department || "").toLowerCase();
    //     // match if the selected department name is contained in the value
    //     // works for "Operations", "operations", "Operations;#123", etc.
    //     return dep.indexOf(searchKey) !== -1;
    //   });
    // }

    // 1) department filter
    if (this._currentDepartment !== "All") {
      const depKey = this._currentDepartment.toLowerCase();
      filtered = filtered.filter(
        (i) => (i.Department || "").toLowerCase().indexOf(depKey) !== -1
      );
    }

    // 2) search text (title + description)
    if (this._searchText && this._searchText.trim().length > 0) {
      const textKey = this._searchText.toLowerCase();

      filtered = filtered.filter(
        (i) =>
          (i.Title || "").toLowerCase().indexOf(textKey) !== -1 ||
          (i.JobDescription || "").toLowerCase().indexOf(textKey) !== -1
      );
    }

    if (!filtered.length) {
      $status.text("No items found.").show();
      return;
    }

    const pageSize = this.properties.pageSize || 3;
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

    if (this._currentPage > totalPages) {
      this._currentPage = totalPages;
    }

    const start = (this._currentPage - 1) * pageSize;
    const pageItems = filtered.slice(start, start + pageSize);

    // Render DevExtreme dxList with custom card template
    ($listHost as any).dxList({
      dataSource: pageItems,
      height: "auto",
      noDataText: "No items.",
      activeStateEnabled: false,
      focusStateEnabled: false,
      elementAttr: { class: "sl-list-root" },
      itemTemplate: (data: IJobItem, _index: number, element: HTMLElement) => {
        const $card = $("<div>").addClass("storyCard");

        // image
        if (data.ImageUrl) {
          $("<img>")
            .addClass("storyImage")
            .attr("src", data.ImageUrl)
            .attr("alt", data.Title)
            .appendTo($card);
        }

        const $content = $("<div>").addClass("storyContent").appendTo($card);

        if (data.Department) {
          $("<div>")
            .addClass("storyCategory")
            .text(data.Department)
            .appendTo($content);
        }

        $("<h3>").addClass("storyTitle").text(data.Title).appendTo($content);

        if (data.JobDescription) {
          $("<p>")
            .addClass("storyTeaser")
            .text(truncateText(data.JobDescription, 260))
            .appendTo($content);
        }

        if (data.PublishedDate) {
          $("<div>")
            .addClass("storyDate")
            .text(formatDate(data.PublishedDate))
            .appendTo($content);
        }

        // View details on the right bottom
        const $detailsWrapper = $("<div>")
          .addClass("storyDetailsWrapper")
          .appendTo($card);

        // $("<a>")
        //   .addClass("storyDetailsLink")
        //   .attr("href", getDetailsUrl.call(this, data.Id))
        //   .text("View details ›")
        //   .appendTo($detailsWrapper);

        $("<button>")
          .addClass("storyDetailsLink") // reuse same styling
          .attr("type", "button")
          .text("View details ›")
          .on("click", () => {
            showDetails(data); // 🔹 open dxPopup
          })
          .appendTo($detailsWrapper);

        $(element).append($card);
      },
    });

    // Render pager 1 2 3
    if (totalPages > 1) {
      for (let p = 1; p <= totalPages; p++) {
        const $pageLink = $('<button type="button">')
          .addClass("pagerButton")
          .text(p.toString());

        if (p === this._currentPage) {
          $pageLink.addClass("pagerButtonActive");
        }

        $pageLink.on("click", () => {
          if (this._currentPage === p) return;
          this._currentPage = p;
          this._renderCurrentPage();
        });

        $pagerHost.append($pageLink);
      }
    }

    function truncateText(text: string, max: number): string {
      if (!text) return "";
      if (text.length <= max) return text;
      return text.substring(0, max - 3) + "...";
    }

    function formatDate(value?: string): string {
      if (!value) return "";
      const d = new Date(value);
      if (isNaN(d.getTime())) return "";
      const opts: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "2-digit",
        year: "numeric",
      };
      return d.toLocaleDateString(undefined, opts);
    }

    // function getDetailsUrl(this: InternalJobsListWebPart, id: number): string {
    //   const base = this.properties.viewDetailsPageUrl || "#";
    //   return `${base}${
    //     base.indexOf("?") > -1 ? "&" : "?"
    //   }itemId=${encodeURIComponent(id)}`;
    // }
  }

  protected async onAfterPropertyPaneChangesApplied(): Promise<void> {
    await this._loadData();
  }

  protected onInit(): Promise<void> {
    this._sp = spfi().using(SPFx(this.context));

    // expose jQuery for DevExtreme
    (window as any).$ = (window as any).jQuery = $;

    if (!this.properties.listName) {
      this.properties.listName = "Job Listings";
    }
    if (!this.properties.pageSize) {
      this.properties.pageSize = 9;
    }
    if (!this.properties.viewDetailsPageUrl) {
      this.properties.viewDetailsPageUrl = `${this.context.pageContext.web.absoluteUrl}/SitePages/Story.aspx`;
    }
    SPComponentLoader.loadCss(
      "https://cdn3.devexpress.com/jslib/23.2.4/css/dx.light.css"
    );
    return super.onInit();
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: "Stories / Internal jobs listing" },
          groups: [
            {
              groupName: "Settings",
              groupFields: [
                PropertyPaneTextField("listName", {
                  label: "List name",
                }),
                PropertyPaneSlider("pageSize", {
                  label: "Items per page",
                  min: 1,
                  max: 10,
                  step: 1,
                }),
                PropertyPaneTextField("viewDetailsPageUrl", {
                  label: "Details page URL (without itemId)",
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
