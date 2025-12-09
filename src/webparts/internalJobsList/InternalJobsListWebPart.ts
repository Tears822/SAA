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
import "@pnp/sp/attachments";
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
  // private _applyPopup: any;

  public async render(): Promise<void> {
    const id = this.instanceId;

    this.domElement.innerHTML = `
      <!--<div class="stories">
        <div class="filterBar" id="sl-filters-${id}"></div>-->

        <!--<div class="stories">
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
        <!-- popup host -->
      <div id="sl-popup-${id}"></div>
      <div id="sl-apply-popup-${id}"></div>
    </div>
      </div>-->
      <div class="stories">
      <!-- Top toolbar: filters + search -->
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

      <!-- Main layout: left (cards) 60% / right (image) 30% -->
      <div class="stories-layout">
        <div class="stories-list-column">
          <div id="sl-status-${id}" class="status">Loading...</div>
          <div id="sl-list-${id}"></div>
          <div id="sl-pager-${id}" class="pager"></div>
        </div>

        <div class="stories-banner-column">
          <img
            src="/sites/InternalJobs/SiteAssets/internaljobs.png"
            alt="Internal jobs"
            class="stories-banner-image"
          />
        </div>
      </div>

      <!-- Popups -->
      <div id="sl-popup-${id}"></div>
      <div id="sl-apply-popup-${id}"></div>
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
      const today = new Date().toISOString().split("T")[0];
      // const tomorrow = new Date();
      // tomorrow.setDate(tomorrow.getDate() + 1);
      // const tomorrowStr = tomorrow.toISOString().split("T")[0];

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
        .filter(
          `PublishedDate le datetime'${today}T23:59:59Z' and ClosingDate ge datetime'${today}T00:00:00Z'`
        )
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
              .text("Closing: " + formatDate(item.ClosingDate))
              .appendTo($root);
          }

          return $root;
        },
      });

      popupInstance.show();
    };
    // end popup init

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
      // itemTemplate: (data: IJobItem, _index: number, element: HTMLElement) => {
      //   const $card = $("<div>").addClass("storyCard");

      //   // image
      //   if (data.ImageUrl) {
      //     $("<img>")
      //       .addClass("storyImage")
      //       .attr("src", data.ImageUrl)
      //       .attr("alt", data.Title)
      //       .appendTo($card);
      //   }

      //   const $content = $("<div>").addClass("storyContent").appendTo($card);

      //   if (data.Department) {
      //     $("<div>")
      //       .addClass("storyCategory")
      //       .text(data.Department)
      //       .appendTo($content);
      //   }

      //   $("<h3>").addClass("storyTitle").text(data.Title).appendTo($content);

      //   if (data.JobDescription) {
      //     $("<p>")
      //       .addClass("storyTeaser")
      //       .text(truncateText(data.JobDescription, 100))
      //       .appendTo($content);
      //   }

      //   if (data.PublishedDate) {
      //     $("<div>")
      //       .addClass("storyDate")
      //       .text(formatDate(data.PublishedDate))
      //       .appendTo($content);
      //   }

      // View details on the right bottom
      // const $detailsWrapper = $("<div>")
      //   .addClass("storyDetailsWrapper")
      //   .appendTo($card);

      // $("<a>")
      //   .addClass("storyDetailsLink")
      //   .attr("href", getDetailsUrl.call(this, data.Id))
      //   .text("View details ›")
      //   .appendTo($detailsWrapper);

      //   const $actionsWrapper = $('<div class="job-actions"></div>');

      //   $("<button>")
      //     .addClass("storyDetailsLink") // reuse same styling
      //     .attr("type", "button")
      //     .text("Job Description ›")
      //     .on("click", () => {
      //       showDetails(data); // open dxPopup
      //     })
      //     .appendTo($actionsWrapper);

      //   $(element).append($card);

      //   // Apply button
      //   $("<button>")
      //     .addClass("storyApplyLink")
      //     .attr("type", "button")
      //     .text("Apply")
      //     .on("click", () => {
      //       this.openApplyPopup(data);
      //     })
      //     .appendTo($actionsWrapper);
      // },
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
            .text(truncateText(data.JobDescription, 100))
            .appendTo($content);
        }

        if (data.PublishedDate) {
          $("<div>")
            .addClass("storyDate")
            .text(formatDate(data.PublishedDate))
            .appendTo($content);
        }

        // Buttons on the right
        const $actionsWrapper = $('<div class="job-actions"></div>').appendTo(
          $card
        );

        // Apply first (like screenshot)
        $("<button>")
          .addClass("storyApplyLink")
          .attr("type", "button")
          .text("Apply")
          .on("click", () => {
            this.openApplyPopup(data);
          })
          .appendTo($actionsWrapper);

        // Job Description button
        $("<button>")
          .addClass("storyDetailsLink")
          .attr("type", "button")
          .text("Job Description")
          .on("click", () => {
            showDetails(data);
          })
          .appendTo($actionsWrapper);

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

  private openApplyPopup = (job: IJobItem): void => {
    const id = this.instanceId;
    const $host = $(`#sl-apply-popup-${id}`, this.domElement);

    let popup: any;
    try {
      popup = ($host as any).dxPopup("instance");
    } catch {
      popup = null;
    }

    if (!popup) {
      ($host as any).dxPopup({
        width: 430,
        maxHeight: 520,
        showTitle: true,
        title: "Apply for this job",
        hideOnOutsideClick: true,
        dragEnabled: false,
        contentTemplate: () => $("<div>"),
      });
      popup = ($host as any).dxPopup("instance");
    }

    // this._applyPopup = popup;

    popup.option({
      title: `Apply for "${job.Title}"`,
      contentTemplate: () => {
        const $root = $('<div class="ij-apply-popup"></div>');

        // Select reason
        $('<label class="ij-apply-label">Select Reason</label>').appendTo(
          $root
        );
        const $reasonSelect = $("<div></div>").appendTo($root);
        ($reasonSelect as any).dxSelectBox({
          items: [
            "Career growth",
            "Internal transfer",
            "New challenge",
            "Other",
          ],
          placeholder: "Reason for applying",
          stylingMode: "outlined",
        });

        // Why are you applying?
        $(
          '<label class="ij-apply-label">Why are you applying for this job?</label>'
        ).appendTo($root);
        const $whyArea = $("<div></div>").appendTo($root);
        ($whyArea as any).dxTextArea({
          placeholder: "Write...",
          height: 100,
        });

        // Upload CV
        $('<label class="ij-apply-label">Upload your CV</label>').appendTo(
          $root
        );
        const $cvBox = $(
          '<div class="ij-upload-box"><span>Upload CV</span></div>'
        ).appendTo($root);
        const $cvInput = $(
          '<input type="file" accept=".pdf,.doc,.docx" style="display:none" />'
        ).appendTo($root);
        $cvBox.on("click", () => $cvInput.trigger("click"));

        // Upload additional documents
        $(
          '<label class="ij-apply-label">Upload additional documents</label>'
        ).appendTo($root);
        const $attBox = $(
          '<div class="ij-upload-box"><span>Upload attachments</span></div>'
        ).appendTo($root);
        const $attInput = $(
          '<input type="file" multiple style="display:none" />'
        ).appendTo($root);
        $attBox.on("click", () => $attInput.trigger("click"));

        // Apply button
        const $btn = $(
          '<button type="button" class="ij-apply-button">Apply</button>'
        ).appendTo($root);

        $btn.on("click", async () => {
          const reason = ($reasonSelect as any).dxSelectBox("option", "value");
          const why = ($whyArea as any).dxTextArea("option", "value");

          if (!reason) {
            alert("Please select a reason for applying.");
            return;
          }

          try {
            $btn.prop("disabled", true).text("Submitting...");

            await this._submitApplication(
              job,
              reason,
              why,
              $cvInput[0] as HTMLInputElement,
              $attInput[0] as HTMLInputElement
            );

            popup.hide();
            alert("Your application has been submitted.");
          } catch (e) {
            console.error(e);
            alert("Error while submitting the application.");
          } finally {
            $btn.prop("disabled", false).text("Apply");
          }
        });

        return $root;
      },
    });

    popup.show();
  };

  private async _submitApplication(
    job: IJobItem,
    reason: string,
    why: string,
    cvInput: HTMLInputElement,
    attachmentsInput: HTMLInputElement
  ): Promise<void> {
    const me = await this._sp.profiles.myProperties();
    const profile: Record<string, string> = {};
    const fullName = me.DisplayName || profile.PreferredName || "";
    const jobTitle = profile["SPS-JobTitle"] || profile.Title || "";
    const department = profile.Department || "";
    const list = this._sp.web.lists.getByTitle("Job Applications");

    const itemAddResult = await list.items.add({
      Title: job.Title,
      ApplicantName: fullName,
      ApplicantEmail: this.context.pageContext.user.email,
      Department: department,
      JobTitle: jobTitle,
      JobId: job.Id,
      Reason_For_Applying: reason,
      Why: why,
      Status: "Submitted",
    });

    const itemId: number = itemAddResult.data.Id;

    const filesToUpload: File[] = [];

    if (cvInput.files && cvInput.files.length > 0) {
      filesToUpload.push(cvInput.files[0]);
    }

    if (attachmentsInput.files && attachmentsInput.files.length > 0) {
      for (let i = 0; i < attachmentsInput.files.length; i++) {
        const f = attachmentsInput.files[i];
        if (f) {
          filesToUpload.push(f);
        }
      }
    }

    if (filesToUpload.length > 0) {
      const item = list.items.getById(itemId);
      for (const file of filesToUpload) {
        // File extends Blob so we can pass it directly
        await item.attachmentFiles.add(file.name, file);
      }
    }
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
