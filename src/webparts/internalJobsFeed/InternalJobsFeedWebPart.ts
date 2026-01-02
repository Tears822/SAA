// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../node_modules/devextreme/bundles/dx.all.d.ts" />
/// <reference path="../../../node_modules/devextreme/integration/jquery.d.ts" />
import { Version } from "@microsoft/sp-core-library";
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneSlider,
} from "@microsoft/sp-property-pane";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
// import type { IReadonlyTheme } from '@microsoft/sp-component-base';
// import { escape } from '@microsoft/sp-lodash-subset';

// import styles from './InternalJobsFeedWebPart.module.scss';
// import * as strings from 'InternalJobsFeedWebPartStrings';
// import { SPComponentLoader } from "@microsoft/sp-loader";
import { SPFI, spfi, SPFx } from "@pnp/sp";
import "@pnp/sp";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/items";
import "@pnp/sp/lists";
import "@pnp/sp/profiles";
import "@pnp/sp/site-users/web";
import "@pnp/sp/webs";
// import "devextreme";
import * as $ from "jquery";

require("../../assets/style.css");

export interface IInternalJobsFeedWebPartProps {
  listName: string;
  maxItems: number;
  viewAllUrl: string;
  // applyPageUrl: string;
}

interface IJobItem {
  Id: number;
  Title: string;
  Department: string;
  ClosingDate?: string;
  ImageUrl?: string;
  JobDescription?: string;
}

export default class InternalJobsFeedWebPart extends BaseClientSideWebPart<IInternalJobsFeedWebPartProps> {
  // private _isDarkTheme: boolean = false;
  // private _environmentMessage: string = '';
  private _sp: SPFI;

  public async render(): Promise<void> {
    const instanceId = this.instanceId;

    this.domElement.innerHTML = `
      <div class="ijFeed">
      <div class="ijFeedContent">

        <!-- LEFT COLUMN: header + list -->
        <div class="ijFeedLeft">
          <div class="ijFeedHeader">
            <h2 class="ijFeedTitle">Internal Jobs</h2>
            <a id="ij-viewall-${instanceId}" class="ijFeedViewAll" href="#">
              View all ›
            </a>
          </div>

          <div id="ij-status-${instanceId}" class="ijFeedStatus">
            Loading...
          </div>

          <div id="ij-list" class="ijList"></div>
        </div>

        <!-- RIGHT COLUMN: banner / details -->
        <div class="ijFeedRight">
          <div id="ij-right-${instanceId}" class="ijRightPanel"></div>
        </div>

      </div>
    </div>
  `;

  // View all link
  $(`#ij-viewall-${instanceId}`, this.domElement).attr(
    "href",
    this.properties.viewAllUrl || this.context.pageContext.web.absoluteUrl
  );

  await this._renderJobs();
  }

  private async _renderJobs(): Promise<void> {
    const instanceId = this.instanceId;
    const $status = $(`#ij-status-${instanceId}`, this.domElement);
    const $listHost = $(`#ij-list`, this.domElement);
    const $rightPanel = $(`#ij-right-${instanceId}`, this.domElement);

    $status.removeClass("error").text("Loading...").show();
    $listHost.empty();
    $rightPanel.empty();

    const formatDate = (value?: string): string => {
      if (!value) return "";
      const d = new Date(value);
      if (isNaN(d.getTime())) return "";
      const options: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "2-digit",
        year: "numeric",
      };
      return d.toLocaleDateString(undefined, options);
    };

    // const getApplyUrl = (id: number): string => {
    //   const base = this.properties.applyPageUrl || "#";
    //   return `${base}${
    //     base.indexOf("?") > -1 ? "&" : "?"
    //   }jobId=${encodeURIComponent(id)}`;
    // };

    const renderDefaultRightBanner = (): void => {
      const webUrl = this.context.pageContext.web.absoluteUrl.replace(
        /\/$/,
        ""
      );
      $rightPanel.html(`
        <div class="ijRightBanner">
        <img
          src="${webUrl}/SiteAssets/internaljobs.png"
          alt="Internal jobs banner"
          class="ijRightBannerImg" />
        <div class="ijRightBannerOverlay">
          <div class="ijRightBannerTitle">INTERNAL JOBS</div>
          <div class="ijRightBannerSub">
            Your journey starts here. Explore opportunities within.
          </div>
        </div>
      </div>
      `);
    };

    const renderJobDetails = (job: IJobItem): void => {
      const closing = job.ClosingDate
        ? `Closing on ${formatDate(job.ClosingDate)}`
        : "";
      const descriptionHtml = job.JobDescription
        ? job.JobDescription
        : "<p>No description available.</p>";

      $rightPanel.html(`
        <div class="ijJobDetails">
          <div class="ijJobDetailsHeader">
            ${
              job.Department
                ? `<div class="ijJobDetailsDepartment">${job.Department}</div>`
                : ""
            }
            <h3 class="ijJobDetailsTitle">${job.Title}</h3>
            ${
              closing ? `<div class="ijJobDetailsClosing">${closing}</div>` : ""
            }
          </div>
          <div class="ijJobDetailsBody">
            ${descriptionHtml}
          </div>
        </div>
      `);
    };

    const openApplyPopup = (job: IJobItem): void => {
      const evt = new CustomEvent<IJobItem>("ij-open-apply", { detail: job });
      window.dispatchEvent(evt);
    };

    // Start with default banner
    renderDefaultRightBanner();

    try {
      // const today = new Date().toISOString().split("T")[0];
      const list = this._sp.web.lists.getByTitle(this.properties.listName);

      const rawItems: any[] = await list.items
        .select(
          "Id",
          "Title",
          "Department",
          "ClosingDate",
          "ImageUrl",
          "Status",
          "JobDescription"
        )
        // .filter(l => l.date("PublishedDate").lessThanOrEquals(new Date()) && l.date("ClosingDate").greaterThanOrEquals(new Date()))
        // .filter(`PublishedDate le datetime'${today}T23:59:59Z' and ClosingDate ge datetime'${today}T00:00:00Z'`)
        .filter("Status eq 'Open'")
        .orderBy("ClosingDate", true)
        .top(this.properties.maxItems || 4)();

      const jobs: IJobItem[] = rawItems.map((i) => ({
        Id: i.Id,
        Title: i.Title,
        Department: i.Department || "",
        ClosingDate: i.ClosingDate,
        ImageUrl: i.ImageUrl.Url || "",
        JobDescription: i.JobDescription || "",
      }));

      if (!jobs.length) {
        $status.text("No open internal jobs.").show();
        return;
      }

      $status.hide();
      $listHost.empty();

      jobs.forEach((job) => {
        const closingText = job.ClosingDate
          ? `Closing on ${formatDate(job.ClosingDate)}`
          : "";

        const $card = $("<div>").addClass("ijCard");

        if (job.ImageUrl) {
          $("<img>")
            .addClass("ijCardImage")
            .attr("src", job.ImageUrl)
            .attr("alt", job.Title)
            .appendTo($card);
        }

        const $body = $("<div>").addClass("ijCardBody").appendTo($card);

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

        // clicking title shows description on the right
        $title.on("click", () => {
          renderJobDetails(job);
        });

        if (closingText) {
          $("<div>")
            .addClass("ijCardClosing")
            .text(closingText)
            .appendTo($body);
        }

        const $actions = $("<div>").addClass("ijCardActions").appendTo($body);
        const $detailsContainer = $(".ijJobDetails");

        $("<button>")
          .addClass("ijCardApply")
          .text("Apply")
          .on("click", () => openApplyPopup(job))
          .appendTo($detailsContainer);

        $("<button>")
          .addClass("ijCardJobDescription")
          .text("Job Description")
          .on("click", () => renderJobDetails(job))
          .appendTo($actions);

        $listHost.append($card);
      });
    } catch (error) {
      console.log("InternalJobs error", error);
      $status.addClass("error").text("Error loading internal jobs.");
    }
  }

  protected async onAfterPropertyPaneChangesApplied(): Promise<void> {
    // Re-render when properties change
    await this._renderJobs();
  }

  protected onInit(): Promise<void> {
    this._sp = spfi().using(SPFx(this.context));

    // Make jQuery global 
    (window as any).$ = (window as any).jQuery = $;

    // Default props
    if (!this.properties.listName) {
      this.properties.listName = "Job Listings";
    }
    if (!this.properties.maxItems) {
      this.properties.maxItems = 4;
    }
    if (!this.properties.viewAllUrl) {
      this.properties.viewAllUrl = `${this.context.pageContext.web.absoluteUrl}/SitePages/Internal-Jobs.aspx`;
    }
    // if (!this.properties.applyPageUrl) {
    //   this.properties.applyPageUrl = `${this.context.pageContext.web.absoluteUrl}/SitePages/ApplyInternalJob.aspx`;
    // }
    // SPComponentLoader.loadCss(
    //   "https://cdn3.devexpress.com/jslib/23.2.4/css/dx.light.css"
    // );
    return super.onInit();
  }

  protected get dataVersion(): Version {
    return Version.parse("1.0");
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: "Internal jobs DevExtreme feed" },
          groups: [
            {
              groupName: "Settings",
              groupFields: [
                PropertyPaneTextField("listName", {
                  label: "Job list name",
                }),
                PropertyPaneSlider("maxItems", {
                  label: "Max jobs to show",
                  min: 1,
                  max: 12,
                  step: 1,
                }),
                PropertyPaneTextField("viewAllUrl", {
                  label: "View all page URL",
                }),
                // PropertyPaneTextField("applyPageUrl", {
                //   label: "Apply page URL (without jobId)",
                // }),
              ],
            },
          ],
        },
      ],
    };
  }
}
