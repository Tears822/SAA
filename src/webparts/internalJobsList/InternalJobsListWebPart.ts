// eslint-disable-next-line @typescript-eslint/triple-slash-reference
// <reference path="../../../node_modules/@types/devextreme/dx.all.d.ts" />
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
// import { SPComponentLoader } from "@microsoft/sp-loader";
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
// import "devextreme";
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
  Status?: string;
}

export default class InternalJobsListWebPart extends BaseClientSideWebPart<IInternalJobsListWebPartProps> {
  private _sp: SPFI;

  private _allItems: IJobItem[] = [];
  private _departments: string[] = [];
  // private _currentDepartment: string = "All";
  private _currentPage: number = 1;
  private _searchText: string = "";
  // private _applyPopup: any;
  private _jobs: IJobItem[] = [];
  private _filteredJobs: IJobItem[] = [];
  // private _pageSize: number = 6;
  private _currentDept: string = "All";

  private get _pageSize(): number {
    if (this.properties.pageSize && this.properties.pageSize > 0) {
      return this.properties.pageSize;
    }
    return 6;
  }

  public async render(): Promise<void> {
    const id = this.instanceId;

    this.domElement.innerHTML = `
      <div class="ijFeed ijFeed-list">
        <div class="ijFeedContent">

          <!-- LEFT COLUMN: header + filters + list + pager -->
          <div class="ijFeedLeft">
            <div class="ijFeedHeader">
              <h2 class="ijFeedTitle">Internal Jobs</h2>
              <div class="ijFeedHeaderRight">
                <div id="ij-filters-${id}" class="ijFilters"></div>
                <div class="ijSearch">
                  <input
                    type="text"
                    id="ij-search-${id}"
                    class="ijSearchInput"
                    placeholder="Search jobs..."
                    autocomplete="off"
                  />
                </div>
              </div>
            </div>

            <div id="ij-status-${id}" class="ijFeedStatus">Loading...</div>
            <div id="ij-list-${id}" class="ijList"></div>
            <div id="ij-pager-${id}" class="ijPager"></div>
          </div>

          <!-- RIGHT COLUMN: banner / job details -->
          <div class="ijFeedRight">
            <div id="ij-right-${id}" class="ijRightPanel"></div>
          </div>

        </div>
      </div>

      <!-- APPLY POPUP -->
      <!--<div id="ij-apply-overlay-${id}" class="ij-overlay ij-hidden">
        <div class="ij-popup">
          <div class="ij-popup-header">
            <h3 id="ij-apply-title-${id}">Apply</h3>
            <button
              type="button"
              class="ij-close-btn"
              id="ij-apply-close-${id}"
            >
              &times;
            </button>
          </div>

          <form id="ij-apply-form-${id}" class="ij-apply-form">
            <input type="hidden" id="ij-job-id-${id}" />

            <div class="ij-field">
              <label for="ij-name-${id}">Name</label>
              <input type="text" id="ij-name-${id}" required />
            </div>

            <div class="ij-field">
              <label for="ij-email-${id}">Email</label>
              <input type="email" id="ij-email-${id}" required />
            </div>

            <div class="ij-field">
              <label for="ij-dept-${id}">Department</label>
              <input type="text" id="ij-dept-${id}" readonly />
            </div>

            <div class="ij-field">
              <label for="ij-jobtitle-${id}">Job title</label>
              <input type="text" id="ij-jobtitle-${id}" readonly />
            </div>

            <div class="ij-field">
              <label for="ij-reason-${id}">Reason for applying</label>
              <select id="ij-reason-${id}" required>
                <option value="">Select...</option>
                <option value="Career growth">Career growth</option>
                <option value="Internal transfer">Internal transfer</option>
                <option value="New challenge">New challenge</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div class="ij-field">
              <label for="ij-notes-${id}">Why are you applying?</label>
              <textarea id="ij-notes-${id}" rows="4"></textarea>
            </div>

            <div class="ij-field">
              <label for="ij-cv-${id}">Upload CV</label>
              <input type="file" id="ij-cv-${id}" />
            </div>

            <div class="ij-actions">
              <button type="submit" class="ij-btn-primary">Submit</button>
              <button
                type="button"
                class="ij-btn-secondary"
                id="ij-apply-cancel-${id}"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>-->
    `;

    // Load jobs (PnPjs)
    await this._loadJobs();

    // Default right-panel banner
    this._renderDefaultRightPanel();

    // Search handler
    const $search = $(`#ij-search-${id}`, this.domElement);
    $search.on("input", () => {
      this._searchText = ($search.val() || "").toString();
      this._currentPage = 1;
      this._applyFilterAndSearch();
      this._renderCurrentPage();
      this._renderPager();
    });

    // Popup handlers
    const $overlay = $(`#ij-apply-overlay-${id}`, this.domElement);
    // const $close = $(`#ij-apply-close-${id}`, this.domElement);
    // const $cancel = $(`#ij-apply-cancel-${id}`, this.domElement);
    const $form = $(`#ij-apply-form-${id}`, this.domElement);

    // $close.on("click", () => this._hideApplyPopup());
    // $cancel.on("click", () => this._hideApplyPopup());
    $overlay.on("click", (e) => {
      if (e.target === $overlay[0]) {
        // this._hideApplyPopup();
      }
    });

    $form.on("submit", async (e) => {
      e.preventDefault();
      await this._submitApplication();
    });
  }

  private _renderDefaultRightPanel(): void {
    const id = this.instanceId;
    const $right = $(`#ij-right-${id}`, this.domElement);

    const webUrl = this.context.pageContext.web.absoluteUrl.replace(/\/$/, "");

    $right.html(`
      <div class="ijRightBanner">
        <img
          src="${webUrl}/SiteAssets/internaljobs.png"
          alt="Internal jobs banner"
          class="ijRightBannerImg"
        />
        <div class="ijRightBannerOverlay">
          <div class="ijRightBannerTitle">INTERNAL JOBS</div>
          <div class="ijRightBannerSub">
            Your journey starts here. Explore opportunities within.
          </div>
        </div>
      </div>
    `);
  }

  private _renderJobDetails(job: IJobItem): void {
    const id = this.instanceId;
    const $right = $(`#ij-right-${id}`, this.domElement);

    const closing = job.ClosingDate
      ? `Closing on ${this._formatDate(job.ClosingDate)}`
      : "";

    const descriptionHtml = job.JobDescription
      ? job.JobDescription
      : "<p>No description available.</p>";

    $right.html(`
      <div class="ijJobDetails">
        <div class="ijJobDetailsHeader">
          <div class="ijJobDetailsTitleRow">
            <h3 class="ijJobDetailsTitle">${job.Title}</h3>
            ${
              closing
                ? `<div class="ijJobDetailsClosing">${closing}</div>`
                : ""
            }
          </div>
          <div class="ijJobDetailsMeta">
            ${
              job.Department
                ? `<span class="ijJobDetailsDept">${job.Department}</span>`
                : ""
            }
          </div>
        </div>
        <div class="ijJobDetailsBody">
          ${descriptionHtml}
        </div>
      </div>
    `);
  }

  private async _getJobsFromList(): Promise<IJobItem[]> {
    const listTitle = this.properties.listName || "Job Listings";

    // Build start/end of today for inclusive filter
    // const today = new Date();
    // const start = new Date(today);
    // start.setHours(0, 0, 0, 0);
    // const end = new Date(today);
    // end.setHours(23, 59, 59, 999);

    // const startIso = start.toISOString();
    // const endIso = end.toISOString();

    interface IJobItemRaw {
      Id: number;
      Title: string;
      Department: string;
      JobDescription: string;
      Requirements: string;
      PublishedDate?: string;
      ClosingDate?: string;
      ImageUrl?: string | { Url?: string; serverUrl?: string; serverRelativeUrl?: string };
      Status: string;
    }

    const rawItems: IJobItemRaw[] = await this._sp.web.lists
      .getByTitle(listTitle)
      .items.select(
        "Id",
        "Title",
        "Department",
        "JobDescription",
        "Requirements",
        "PublishedDate",
        "ClosingDate",
        "ImageUrl",
        "Status"
      )
      .filter("Status eq 'Open'")
      .orderBy("PublishedDate", false)();

    return rawItems.map((i) => {
      let imageUrl: string | undefined = undefined;

      if (i.ImageUrl) {
        if (typeof i.ImageUrl === "string") {
          // Sometimes comes as JSON string
          try {
            const parsed = JSON.parse(i.ImageUrl);
            if (parsed && parsed.serverUrl && parsed.serverRelativeUrl) {
              imageUrl = `${parsed.serverUrl}${parsed.serverRelativeUrl}`;
            } else if (parsed && parsed.Url) {
              imageUrl = parsed.Url;
            }
          } catch {
            imageUrl = i.ImageUrl;
          }
        } else if (i.ImageUrl.Url) {
          imageUrl = i.ImageUrl.Url;
        }
      }

      return {
        Id: i.Id,
        Title: (i.Title || "").toString(),
        Department: (i.Department || "").toString(),
        JobDescription: (i.JobDescription || "").toString(),
        Requirements: (i.Requirements || "").toString(),
        PublishedDate: i.PublishedDate,
        ClosingDate: i.ClosingDate,
        ImageUrl: imageUrl,
        Status: i.Status,
      };
    });
  }

  private async _loadJobs(): Promise<void> {
    const id = this.instanceId;
    const $status = $(`#ij-status-${id}`, this.domElement);

    try {
      $status.removeClass("error").text("Loading...").show();

      const items = await this._getJobsFromList();
      this._jobs = items;
      this._filteredJobs = items.slice(0);

      // Build dynamic departments list
      const deptMap: Record<string, string> = {};
      this._jobs.forEach((j) => {
        const dep = (j.Department || "").trim();
        if (dep) {
          deptMap[dep.toLowerCase()] = dep;
        }
      });

      this._departments = Object.keys(deptMap)
        .sort()
        .map((k) => deptMap[k]);

      this._currentDept = "All";
      this._currentPage = 1;

      this._renderFilters();
      this._applyFilterAndSearch();
      this._renderCurrentPage();
      this._renderPager();

      $status.text("").hide();
    } catch (err) {
      console.error("Error loading jobs", err);
      $status.addClass("error").text("Error loading jobs.");
    }
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
    // this._currentDepartment = "All";
    this._currentPage = 1;

    try {
      // const today = new Date().toISOString();
      // const today = new Date().toISOString().split("T")[0];
      // const tomorrow = new Date();
      // tomorrow.setDate(tomorrow.getDate() + 1);
      // const tomorrowStr = tomorrow.toISOString().split("T")[0];

      interface IJobItemRaw {
        Id: number;
        Title: string;
        Department: string;
        JobDescription: string;
        Requirements: string;
        PublishedDate?: string;
        ClosingDate?: string;
        ImageUrl?: string | { Url?: string; serverUrl?: string; serverRelativeUrl?: string };
        Status: string;
      }

      const list = this._sp.web.lists.getByTitle(this.properties.listName);

      const raw: IJobItemRaw[] = await list.items
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
        // .filter(l => l.date("PublishedDate").lessThanOrEquals(new Date()) && l.date("ClosingDate").greaterThanOrEquals(new Date()))
        // .filter(`PublishedDate le datetime'${today}T23:59:59Z' and ClosingDate ge datetime'${today}T00:00:00Z'`)
        .orderBy("PublishedDate", false)();

      this._allItems = raw.map((i) => {
        let imageUrl: string = "";
        if (i.ImageUrl) {
          if (typeof i.ImageUrl === "string") {
            imageUrl = i.ImageUrl;
          } else if (typeof i.ImageUrl === "object" && i.ImageUrl.Url) {
            imageUrl = i.ImageUrl.Url;
          }
        }
        return {
          Id: i.Id,
          Title: i.Title,
          Department: i.Department ? i.Department.toString().trim() : "",
          JobDescription: (i.JobDescription || "").toString(),
          Requirements: (i.Requirements || "").toString(),
          PublishedDate: i.PublishedDate,
          ClosingDate: i.ClosingDate,
          ImageUrl: imageUrl,
        };
      });

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

  // private _setupFilters(): void {
  //   const id = this.instanceId;
  //   const $filters = $(`#ij-filters-${id}`, this.domElement);
  //   $filters.empty();

  //   const categories = [
  //     "All",
  //     "Finance",
  //     "HR",
  //     "IT",
  //     "Marketing",
  //     "Operations",
  //   ];

  //   categories.forEach((cat) => {
  //     const $btn = $('<button type="button" class="ij-filter-btn"></button>')
  //       .text(cat)
  //       .toggleClass("active", cat === this._currentDept)
  //       .on("click", () => {
  //         this._currentDept = cat;
  //         this._currentPage = 1;
  //         this._applyFilterAndSearch();
  //         this._renderCurrentPage();
  //         this._renderPager();
  //         $filters.find(".ij-filter-btn").removeClass("active");
  //         $btn.addClass("active");
  //       });

  //     $filters.append($btn);
  //   });
  // }

  private _applyFilterAndSearch(): void {
    this._filteredJobs = this._jobs.filter((j) => {
      const matchesDept =
        this._currentDept === "All" || j.Department === this._currentDept;

      const search = (this._searchText || "").toLowerCase();
      const matchesSearch =
        !search ||
        (j.Title && j.Title.toLowerCase().includes(search)) ||
        (j.JobDescription &&
          j.JobDescription.toLowerCase().includes(search));

      return matchesDept && matchesSearch;
    });
  }

  private _renderFilters(): void {
    const id = this.instanceId;
    const $filters = $(`#ij-filters-${id}`, this.domElement);
    $filters.empty();

    const categories: string[] = ["All", ...this._departments];

    categories.forEach((cat) => {
      const $btn = $('<button type="button" class="ij-filter-btn"></button>')
        .text(cat)
        .toggleClass("active", this._currentDept === cat)
        .on("click", () => {
          this._currentDept = cat;
          this._currentPage = 1;
          this._applyFilterAndSearch();
          this._renderCurrentPage();
          this._renderPager();

          $filters.find(".ij-filter-btn").removeClass("active");
          $btn.addClass("active");
        });

      $filters.append($btn);
    });
  }

  private _formatDate(value?: string): string {
    if (!value) return "";
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return "";
      const options: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        year: "numeric",
      };
      return d.toLocaleDateString(undefined, options);
    } catch (e) {
      console.error("Error formatting date:", e);
      return "";
    }
  }

  // private _showDescription(job: IJobItem): void {
  //   // Create a simple modal overlay dynamically
  //   const overlay = document.createElement("div");
  //   overlay.className = "ij-overlay";

  //   const modal = document.createElement("div");
  //   modal.className = "ij-popup";
  //   modal.innerHTML = `
  //   <div class="ij-popup-header">
  //     <h3>${job.Title || "Job Details"}</h3>
  //     <button type="button" class="ij-close-btn">&times;</button>
  //   </div>
  //   <div class="ij-popup-body">
  //     <p><strong>Department:</strong> ${job.Department || "-"}</p>
  //     <p><strong>Published:</strong> ${this._formatDate(
  //       job.PublishedDate ?? ""
  //     )}</p>
  //     <p><strong>Closing:</strong> ${this._formatDate(
  //       job.ClosingDate ?? ""
  //     )}</p>
  //     <hr/>
  //     <div style="max-height: 300px; overflow-y: auto;">
  //       ${job.JobDescription || "<em>No description provided.</em>"}
  //     </div>
  //   </div>
  // `;

  //   overlay.appendChild(modal);
  //   document.body.appendChild(overlay);

  //   const close = modal.querySelector(".ij-close-btn") as HTMLButtonElement;
  //   close.addEventListener("click", () => document.body.removeChild(overlay));

  //   // Also close when clicking outside
  //   overlay.addEventListener("click", (e) => {
  //     if (e.target === overlay) {
  //       document.body.removeChild(overlay);
  //     }
  //   });
  // }

  private _renderCurrentPage(): void {
    const id = this.instanceId;
    const $list = $(`#ij-list-${id}`, this.domElement);
    $list.empty();

    if (!this._filteredJobs.length) {
      $list.append('<div class="ij-empty">No jobs found.</div>');
      return;
    }

    const startIndex = (this._currentPage - 1) * this._pageSize;
    const endIndex = startIndex + this._pageSize;
    const pageItems = this._filteredJobs.slice(startIndex, endIndex);

    const $grid = $('<div class="ijCardsGrid"></div>');

    pageItems.forEach((job) => {
      const closingText = job.ClosingDate
        ? `Closing on ${this._formatDate(job.ClosingDate)}`
        : "";

      const $card = $('<div class="ijCard"></div>');

      if (job.ImageUrl) {
        $("<img>")
          .addClass("ijCardImage")
          .attr("src", job.ImageUrl)
          .attr("alt", job.Title)
          .appendTo($card);
      }

      const $body = $('<div class="ijCardBody"></div>').appendTo($card);

      if (job.Department) {
        $("<div>")
          .addClass("ijCardDepartment")
          .text(job.Department)
          .appendTo($body);
      }

      const $title = $("<div>")
        .addClass("ijCardTitle")
        .text(job.Title)
        .appendTo($body);

      // Clicking title shows job details on the right
      $title.on("click", () => this._renderJobDetails(job));

      if (closingText) {
        $("<div>")
          .addClass("ijCardClosing")
          .text(closingText)
          .appendTo($body);
      }

      const $actions = $('<div class="ijCardActions"></div>').appendTo($body);

      $("<button>")
        .addClass("ijCardApply")
        .text("Apply")
        // .on("click", () => this._openApplyPopup(job))
        .appendTo($actions);

      $("<button>")
        .addClass("ijCardJobDescription")
        .text("Job Description")
        .on("click", () => this._renderJobDetails(job))
        .appendTo($actions);

      $grid.append($card);
    });

    $list.append($grid);
  }

  private _renderPager(): void {
    const id = this.instanceId;
    const $pager = $(`#ij-pager-${id}`, this.domElement);
    $pager.empty();

    const totalPages = Math.ceil(this._filteredJobs.length / this._pageSize);
    if (totalPages <= 1) {
      return;
    }

    for (let p = 1; p <= totalPages; p++) {
      const $btn = $('<button type="button" class="ij-page-btn"></button>')
        .text(p.toString())
        .toggleClass("active", p === this._currentPage)
        .on("click", () => {
          this._currentPage = p;
          this._renderCurrentPage();
          this._renderPager();
        });

      $pager.append($btn);
    }
  }

  // private openApplyPopup = (job: IJobItem): void => {
  //   const id = this.instanceId;
  //   const $host = $(`#sl-apply-popup-${id}`, this.domElement);

  //   let popup: any;
  //   try {
  //     popup = ($host as any).dxPopup("instance");
  //   } catch {
  //     popup = null;
  //   }

  //   if (!popup) {
  //     ($host as any).dxPopup({
  //       width: 430,
  //       maxHeight: 520,
  //       showTitle: true,
  //       title: "Apply for this job",
  //       hideOnOutsideClick: true,
  //       dragEnabled: false,
  //       contentTemplate: () => $("<div>"),
  //     });
  //     popup = ($host as any).dxPopup("instance");
  //   }

  //   // this._applyPopup = popup;

  //   popup.option({
  //     title: `Apply for "${job.Title}"`,
  //     contentTemplate: () => {
  //       const $root = $('<div class="ij-apply-popup"></div>');

  //       // Select reason
  //       $('<label class="ij-apply-label">Select Reason</label>').appendTo(
  //         $root
  //       );
  //       const $reasonSelect = $("<div></div>").appendTo($root);
  //       ($reasonSelect as any).dxSelectBox({
  //         items: [
  //           "Career growth",
  //           "Internal transfer",
  //           "New challenge",
  //           "Other",
  //         ],
  //         placeholder: "Reason for applying",
  //         stylingMode: "outlined",
  //       });

  //       // Why are you applying?
  //       $(
  //         '<label class="ij-apply-label">Why are you applying for this job?</label>'
  //       ).appendTo($root);
  //       const $whyArea = $("<div></div>").appendTo($root);
  //       ($whyArea as any).dxTextArea({
  //         placeholder: "Write...",
  //         height: 100,
  //       });

  //       // Upload CV
  //       $('<label class="ij-apply-label">Upload your CV</label>').appendTo(
  //         $root
  //       );
  //       const $cvBox = $(
  //         '<div class="ij-upload-box"><span>Upload CV</span></div>'
  //       ).appendTo($root);
  //       const $cvInput = $(
  //         '<input type="file" accept=".pdf,.doc,.docx" style="display:none" />'
  //       ).appendTo($root);
  //       $cvBox.on("click", () => $cvInput.trigger("click"));

  //       // Upload additional documents
  //       $(
  //         '<label class="ij-apply-label">Upload additional documents</label>'
  //       ).appendTo($root);
  //       const $attBox = $(
  //         '<div class="ij-upload-box"><span>Upload attachments</span></div>'
  //       ).appendTo($root);
  //       const $attInput = $(
  //         '<input type="file" multiple style="display:none" />'
  //       ).appendTo($root);
  //       $attBox.on("click", () => $attInput.trigger("click"));

  //       // Apply button
  //       const $btn = $(
  //         '<button type="button" class="ij-apply-button">Apply</button>'
  //       ).appendTo($root);

  //       $btn.on("click", async () => {
  //         const reason = ($reasonSelect as any).dxSelectBox("option", "value");
  //         const why = ($whyArea as any).dxTextArea("option", "value");

  //         if (!reason) {
  //           alert("Please select a reason for applying.");
  //           return;
  //         }

  //         try {
  //           $btn.prop("disabled", true).text("Submitting...");

  //           await this._submitApplication(
  //             job,
  //             reason,
  //             why,
  //             $cvInput[0] as HTMLInputElement,
  //             $attInput[0] as HTMLInputElement
  //           );

  //           popup.hide();
  //           alert("Your application has been submitted.");
  //         } catch (e) {
  //           console.error(e);
  //           alert("Error while submitting the application.");
  //         } finally {
  //           $btn.prop("disabled", false).text("Apply");
  //         }
  //       });

  //       return $root;
  //     },
  //   });

  //   popup.show();
  // };

  // private _openApplyPopup(job: IJobItem): void {
  //   const id = this.instanceId;
  //   const $overlay = $(`#ij-apply-overlay-${id}`, this.domElement);

  //   $(`#ij-job-id-${id}`, this.domElement).val(job.Id);
  //   $(`#ij-dept-${id}`, this.domElement).val(job.Department || "");
  //   $(`#ij-jobtitle-${id}`, this.domElement).val(job.Title || "");

  //   $(`#ij-apply-title-${id}`, this.domElement).text(`Apply - ${job.Title}`);

  //   $overlay.removeClass("ij-hidden");
  // }

  // private _hideApplyPopup(): void {
  //   const id = this.instanceId;
  //   const $overlay = $(`#ij-apply-overlay-${id}`, this.domElement);
  //   $overlay.addClass("ij-hidden");
  // }

  // private async _createJobApplicationItem(payload: {
  //   jobId: number;
  //   name: string;
  //   email: string;
  //   dept: string;
  //   jobTitle: string;
  //   reason: string;
  //   notes: string;
  //   file?: File;
  // }): Promise<void> {
  //   const listTitle = "Job Applications"; // change if your list name is different

  //   // Map payload to list fields (use your internal names)
  //   const body: any = {
  //     Title: `${payload.jobTitle || ""} - ${payload.name || ""}`,
  //     ApplicantName: payload.name,
  //     ApplicantEmail: payload.email,
  //     Department: payload.dept,
  //     JobTitle: payload.jobTitle,
  //     Reason_For_Applying: payload.reason,
  //     Status: "Submitted", // default status
  //     Notes: payload.notes,
  //   };

  //   if (payload.jobId) {
  //     body.JobId = payload.jobId; // optional JobId column
  //   }

  //   // 1) Add item
  //   const list = this._sp.web.lists.getByTitle(listTitle);
  //   const addResult = await list.items.add(body);
  //   const item = addResult.item;
  //   const itemId = addResult.data.Id as number;

  //   // 2) Add attachment (CV) if provided
  //   if (payload.file) {
  //     const buffer = await payload.file.arrayBuffer();
  //     await item.attachmentFiles.add(payload.file.name, buffer);
  //   }

  //   console.log(`Application item created. Id = ${itemId}`);
  // }

  private async _submitApplication(): Promise<void> {
    const id = this.instanceId;

    const jobIdVal = $(`#ij-job-id-${id}`, this.domElement).val();
    const jobId = jobIdVal ? Number(jobIdVal) : undefined;

    const name = ($(`#ij-name-${id}`, this.domElement).val() || "").toString();
    const email = ($(`#ij-email-${id}`, this.domElement).val() || "").toString();
    const dept = ($(`#ij-dept-${id}`, this.domElement).val() || "").toString();
    const jobTitle = (
      $(`#ij-jobtitle-${id}`, this.domElement).val() || ""
    ).toString();
    const reason = (
      $(`#ij-reason-${id}`, this.domElement).val() || ""
    ).toString();
    const notes = (
      $(`#ij-notes-${id}`, this.domElement).val() || ""
    ).toString();

    const fileInput = $(
      `#ij-cv-${id}`,
      this.domElement
    )[0] as HTMLInputElement | undefined;

    let file: File | undefined;
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      file = fileInput.files[0];
    }

    if (!name || !email || !reason) {
      alert("Please fill in name, email and reason for applying.");
      return;
    }

    try {
      const appsList = this._sp.web.lists.getByTitle("Job Applications");

      const itemAddResult = await appsList.items.add({
        Title: jobTitle || (jobId ? `Application for job #${jobId}` : "Application"),
        ApplicantName: name,
        ApplicantEmail: email,
        Department: dept,
        JobTitle: jobTitle,
        JobId: jobId,
        Reason_For_Applying: reason,
        Why: notes,
        Status: "Submitted",
      });

      const itemId: number = itemAddResult.data.Id;

      if (file) {
        await appsList.items.getById(itemId).attachmentFiles.add(file.name, file);
      }

      alert("Your application has been submitted.");
      // this._hideApplyPopup();

      const $form = $(`#ij-apply-form-${id}`, this.domElement);
      const formEl = $form[0] as HTMLFormElement | undefined;
      if (formEl) {
        formEl.reset();
      }
    } catch (err) {
      console.error("Error submitting application", err);
      alert("Error submitting your application. Please try again.");
    }
  }

  // private async _submitApplication(
  //   job: IJobItem,
  //   reason: string,
  //   why: string,
  //   cvInput: HTMLInputElement,
  //   attachmentsInput: HTMLInputElement
  // ): Promise<void> {
  //   const me = await this._sp.profiles.myProperties();
  //   const profile: Record<string, string> = {};
  //   const fullName = me.DisplayName || profile.PreferredName || "";
  //   const jobTitle = profile["SPS-JobTitle"] || profile.Title || "";
  //   const department = profile.Department || "";
  //   const list = this._sp.web.lists.getByTitle("Job Applications");

  //   const itemAddResult = await list.items.add({
  //     Title: job.Title,
  //     ApplicantName: fullName,
  //     ApplicantEmail: this.context.pageContext.user.email,
  //     Department: department,
  //     JobTitle: jobTitle,
  //     JobId: job.Id,
  //     Reason_For_Applying: reason,
  //     Why: why,
  //     Status: "Submitted",
  //   });

  //   const itemId: number = itemAddResult.data.Id;

  //   const filesToUpload: File[] = [];

  //   if (cvInput.files && cvInput.files.length > 0) {
  //     filesToUpload.push(cvInput.files[0]);
  //   }

  //   if (attachmentsInput.files && attachmentsInput.files.length > 0) {
  //     for (let i = 0; i < attachmentsInput.files.length; i++) {
  //       const f = attachmentsInput.files[i];
  //       if (f) {
  //         filesToUpload.push(f);
  //       }
  //     }
  //   }

  //   if (filesToUpload.length > 0) {
  //     const item = list.items.getById(itemId);
  //     for (const file of filesToUpload) {
  //       // File extends Blob so we can pass it directly
  //       await item.attachmentFiles.add(file.name, file);
  //     }
  //   }
  // }

  protected async onAfterPropertyPaneChangesApplied(): Promise<void> {
    await this._loadData();
    await this._loadJobs();
    this._renderDefaultRightPanel();
  }

  protected onInit(): Promise<void> {
    this._sp = spfi().using(SPFx(this.context));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // SPComponentLoader.loadCss(
    //   "https://cdn3.devexpress.com/jslib/23.2.4/css/dx.light.css"
    // );
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
                  max: 12,
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
