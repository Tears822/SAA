// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../node_modules/@types/devextreme/dx.all.d.ts" />
import { Version } from "@microsoft/sp-core-library";
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from "@microsoft/sp-property-pane";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";

import * as strings from "ChairmanCardWebPartStrings";
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
// import styles from "./ChairmanCardWebPart.module.scss";

require("../../assets/style.css");

export interface IChairmanCardWebPartProps {
  listTitle: string;
}

interface ILeaderItem {
  Id: number;
  Title: string; // Name
  Position: string;
  ShortBio: string;
  LongBio: string;
  ImageUrl: string;
}

export default class ChairmanCardWebPart extends BaseClientSideWebPart<IChairmanCardWebPartProps> {
  private _sp: SPFI;

  public async render(): Promise<void> {
    this.domElement.innerHTML = `
    <div class="chairmanCard">
        <div id="leaderContainer">Loading...</div>
      </div>`;

    await this.loadLeaders();
  }

  protected onInit(): Promise<void> {
    this._sp = spfi().using(SPFx(this.context));
    SPComponentLoader.loadCss(
      "https://cdn3.devexpress.com/jslib/23.2.4/css/dx.light.css"
    );
    return super.onInit();
  }

  private get sp(): SPFI {
    if (!this._sp) {
      // fallback in case something calls before onInit finished
      this._sp = spfi().using(SPFx(this.context));
    }
    return this._sp;
  }

  private async loadLeaders(): Promise<void> {
    const listTitle = this.properties.listTitle || "Leaders";

    const $container = $("#leaderContainer", this.domElement);

    try {
      const items = await this.sp.web.lists
        .getByTitle(listTitle)
        .items.select(
          "Id",
          "Title",
          "Position",
          "ShortBio",
          "LongBio",
          "ImageUrl"
        )
        .orderBy("Sort", true)();

      if (!items.length) {
        $container.text("No data found.");
        return;
      }

      const webUrl = this.context.pageContext.web.serverRelativeUrl.replace(/\/$/, '');

      const leaders: ILeaderItem[] = items.map((i: any) => {
        let imageUrl = '';

        if (i.ImageUrl) {
          try {
            // ImageUrl is stored as JSON string
            const imgInfo = JSON.parse(i.ImageUrl);
            if (imgInfo.fileName) {
              imageUrl =
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
          Position: i.Position || '',
          ShortBio: i.ShortBio || '',
          LongBio: i.LongBio || '',
          ImageUrl: imageUrl
        };
      });

      this.renderCarousel(leaders);
    } catch (error) {
      console.log("Error loading leaders", error);
      $("#leaderGallery", this.domElement).text("Error loading data.");
    }
  }

  private renderCarousel(leaders: ILeaderItem[]): void {
    const $container = $('#leaderContainer', this.domElement);

    const slidesHtml = leaders
      .map((l, index) => `
        <div class="slide ${index === 0 ? 'slideActive' : ''}" data-index="${index}">
          <div class="card">
            <div class="cardInner">
              <div class="left">
                <h2 class="name">${l.Title}</h2>
                <div class="position">${l.Position}</div>
                <p class="paragraph">${l.ShortBio}</p>
                <p class="paragraph">${l.LongBio}</p>
              </div>
              <div class="right">
                <img src="${l.ImageUrl}" alt="${l.Title}" class="photo" />
              </div>
            </div>
          </div>
        </div>
      `)
      .join('');

    const dotsHtml = leaders
      .map(
        (_, index) =>
          `<span class="dot ${index === 0 ? 'dotActive' : ''}" data-index="${index}"></span>`
      )
      .join('');

    const html = `
      <div class="carousel" data-count="${leaders.length}">
        <div class="slides">
          ${slidesHtml}
        </div>
        <div class="controls">
          <!--<button type="button" class="navBtn prev">&#10094;</button>-->
          <div class="dots">
            ${dotsHtml}
          </div>
          <!--<button type="button" class="navBtn next">&#10095;</button>-->
        </div>
      </div>
    `;

    $container.html(html);
    this.wireCarouselEvents(leaders.length);
  }

  private wireCarouselEvents(count: number): void {
    if (count <= 1) {
      // No need for carousel behaviour
      $('.controls', this.domElement).hide();
      return;
    }

    const $root = $('.carousel', this.domElement);
    const $slides = $('.slide', $root);
    const $dots = $('.dot', $root);

    let current = 0;
    let timer: number | undefined;

    const show = (index: number) => {
      if (index < 0) index = count - 1;
      if (index >= count) index = 0;
      current = index;

      $slides.removeClass("slideActive");
      $dots.removeClass("dotActive");

      $slides.eq(current).addClass("slideActive");
      $dots.eq(current).addClass("dotActive");
    };

    const stopAuto = () => {
      if (timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    };

    const startAuto = () => {
      stopAuto();
      // change every 8 seconds
      timer = window.setInterval(() => show(current + 1), 8000);
    };

    

    // Prev / Next buttons
    $root.on('click', '.prev', () => {
      show(current - 1);
      startAuto();
    });

    $root.on('click', '.next', () => {
      show(current + 1);
      startAuto();
    });

    // Dots click
    $root.on('click', '.dot', (ev) => {
      const idx = parseInt($(ev.currentTarget).attr('data-index') || '0', 10);
      show(idx);
      startAuto();
    });

    // Pause on hover
    $root.on('mouseenter', () => stopAuto());
    $root.on('mouseleave', () => startAuto());

    // Start auto-rotation
    startAuto();
  }

  protected get dataVersion(): Version {
    return Version.parse("1.0");
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: "Chairman card settings",
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField("description", {
                  label: strings.DescriptionFieldLabel,
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
