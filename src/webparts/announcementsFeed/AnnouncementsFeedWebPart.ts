// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../node_modules/@types/devextreme/dx.all.d.ts" />
import { Version } from "@microsoft/sp-core-library";
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from "@microsoft/sp-property-pane";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
// import type { IReadonlyTheme } from "@microsoft/sp-component-base";
// import { escape } from "@microsoft/sp-lodash-subset";

import styles from "./AnnouncementsFeedWebPart.module.scss";
import * as strings from "AnnouncementsFeedWebPartStrings";
import { SPFx, SPFI, spfi } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "devextreme";
import * as $ from "jquery";
import { SPComponentLoader } from "@microsoft/sp-loader";

export interface IAnnouncementsFeedWebPartProps {
  description: string;
  listTitle: string;
  redirectUrl: string;
}

interface IAnnouncementItem {
  Id: number;
  Title: string;
  Description: string;
  ImageUrl: string | null;
  // ButtonText?: string | undefined;
}

export default class AnnouncementsFeedWebPart extends BaseClientSideWebPart<IAnnouncementsFeedWebPartProps> {
  private _sp: SPFI | undefined;

  public render(): void {
    const rtlClass = this.isArabic ? styles.rtl : "";
   

    const labels = this.currentLabels;


    this.domElement.innerHTML = `
    <div class="${styles.announcements} ${rtlClass}">
      <div class="${styles.announcementsheaderRow}">
        <h2 class="${styles.sectionTitle}">
          ${labels.sectionTitle}
        </h2>
        <a class="${styles.viewAll}" href="${this.context.pageContext.site.absoluteUrl}/SitePages/announcements-list.aspx" role="link">
          ${labels.viewAll}
        </a>
      </div>
      <div id="ann-grid" class="${styles.grid}"></div>
    </div>`;

    this.loadAnnouncements().catch(console.error);
  }

  protected onInit(): Promise<void> {
    this._sp = spfi().using(SPFx(this.context));
    SPComponentLoader.loadCss(
      "https://cdn3.devexpress.com/jslib/23.2.4/css/dx.light.css"
    );
    return super.onInit();
  }

  private async loadAnnouncements(): Promise<void> {
    if (!this._sp) return;

    const listTitle = this.properties.listTitle || "Announcements";

    try {
      const rawItems: any[] = await this._sp.web.lists
        .getByTitle(listTitle)
        .items.select(
          "Id",
          "Title",
          "TitleAr",
          "DescriptionEn",
          "DescriptionAr",
          "ImageUrl"
        )
        .orderBy("Id", false).top(9)(); // latest first

      const useArabic = this.isArabic;
      const webUrl = this.context.pageContext.web.absoluteUrl.replace(
        /\/$/,
        ""
      );

      const items: IAnnouncementItem[] = rawItems.map((i) => {
        // -------- Title + Description localization --------
        const title = useArabic
          ? i.TitleAr || i.Title || ""
          : i.Title || i.TitleAr || "";

        const description = useArabic
          ? i.DescriptionAr || i.DescriptionEn || ""
          : i.DescriptionEn || i.DescriptionAr || "";

        // -------- Image column (Image type / attachment) handling --------
        const rawImage = i.ImageUrl;
        let img: string | null = null;

        if (rawImage) {
          try {
            const value =
              typeof rawImage === "string" ? JSON.parse(rawImage) : rawImage;

            if (value.Url) {
              // standard image column with absolute URL
              img = value.Url as string;
            } else if (value.serverRelativeUrl) {
              // stored with serverRelativeUrl
              img = `${webUrl}${value.serverRelativeUrl}`;
            } else if (value.fileName) {
              // image stored as attachment (like Reserved_ImageAttachment_*.jpg)
              img = `${webUrl}/Lists/${listTitle}/Attachments/${i.Id}/${value.fileName}`;
            }
          } catch {
            // if not JSON, treat as plain URL
            if (typeof rawImage === "string") {
              img = rawImage;
            }
          }
        }

        return {
          Id: i.Id,
          Title: title,
          Description: description,
          ImageUrl: img,
        };
      });

      this.renderCards(items);
    } catch (e) {
      console.error("Error loading announcements", e);
      const grid = this.domElement.querySelector("#ann-grid");
      if (grid) {
        grid.innerHTML = `<span>Could not load announcements.</span>`;
      }
    }
  }

  private renderCards(items: IAnnouncementItem[]): void {
    const grid = this.domElement.querySelector("#ann-grid");
    if (!grid) return;

    grid.innerHTML = "";

    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = styles.card + ' ' + (this.isArabic ? styles.ltr : '');

      // Image
      const imgWrapper = document.createElement("div");
      imgWrapper.className = styles.cardImageWrapper;

      if (item.ImageUrl) {
        const img = document.createElement("img");
        img.className = styles.cardImage;
        img.src = item.ImageUrl;
        img.alt = item.Title || "Announcement";
        imgWrapper.appendChild(img);
      }

      // Body
      const body = document.createElement("div");
      body.className = styles.cardBody;

      const title = document.createElement("div");
      title.className = styles.cardTitle;
      title.textContent = item.Title;

      const desc = document.createElement("div");
      desc.className = styles.cardDescription;
      desc.textContent = item.Description;

      const btnWrapper = document.createElement("div");
      btnWrapper.className = styles.cardButtonWrapper;

      const btnDiv = document.createElement("div");
      btnWrapper.appendChild(btnDiv);

      body.appendChild(title);
      body.appendChild(desc);
      body.appendChild(btnWrapper);

      card.appendChild(imgWrapper);
      card.appendChild(body);
      grid.appendChild(card);

      const labels = this.currentLabels;
      
      $(btnDiv).dxButton({
        text: labels.buttonText,
        type: "default",
        stylingMode: "outlined",
        width: "auto",
        elementAttr: { class: "happinessButton" },
        onClick: () => {
          console.log("Announcement clicked:", item.Id);
        },
      });
    });
  }

  private get isArabic(): boolean {
    // const culture =
    //   this.context.pageContext.cultureInfo.currentUICultureName || "";
    // return culture.toLowerCase().startsWith("ar");
    const culture = this.context.pageContext.site.serverRequestPath || "";
    return culture.toLowerCase().includes("/ar/");
  }

  private get currentLabels() {
     const Labels = {
      en: {
        sectionTitle: "Announcements",
        viewAll: "View all",
        buttonText: "Happiness Dose",
      },
      ar: {
        sectionTitle: "الإعلانات",
        viewAll: "عرض الكل",
        buttonText: "جرعة سعادة",
      },
    } as const;
  return this.isArabic ? Labels.ar : Labels.en;
}

  

  protected get dataVersion(): Version {
    return Version.parse("1.0");
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription,
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField("description", {
                  label: strings.DescriptionFieldLabel,
                }),
                PropertyPaneTextField("listTitle", {
                  label: "Announcements List Title",
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
