// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../node_modules/@types/devextreme/dx.all.d.ts" />
// import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from "@microsoft/sp-property-pane";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
// import type { IReadonlyTheme } from '@microsoft/sp-component-base';
import { escape } from "@microsoft/sp-lodash-subset";

import styles from "./GSaadaItemsWebPart.module.scss";
import * as strings from "GSaadaItemsWebPartStrings";

import { SPFI, spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/files";
import "@pnp/sp/";
import "@pnp/sp/folders";
import "@pnp/sp/items";
import "@pnp/sp/lists";
import "@pnp/sp/site-users/web";
import "@pnp/sp/profiles";
import "devextreme";
import * as $ from "jquery";
import { SPComponentLoader } from "@microsoft/sp-loader";
import { createPeopleStore } from "../../util/PeopleStore";

export interface IGSaadaItemsWebPartProps {
  description: string;
  minAmount: number;
  maxAmount: number;
}

export default class GSaadaItemsWebPart extends BaseClientSideWebPart<IGSaadaItemsWebPartProps> {
  private sp: SPFI;
  private currentItemId: number | null = null; // null = new item, number = edit this Id
  private meId: number;
  private selectedCardId: number | null = null; // chosen from gallery
  private pendingCustomFile: File | null = null; // selected local image, not uploaded yet
  private pendingCustomPreviewUrl: string | null = null;

  public async render(): Promise<void> {
    const me = await this.sp.web.currentUser();
    this.meId = me.Id;

    this.domElement.innerHTML = `
    <style>
      .gs-layout {
        display: grid;
        grid-template-columns: 3fr 2fr;
        gap: 16px;
        align-items: flex-start;
      }
      .gs-panel {
        background:#fff;
        padding:12px;
        border-radius:8px;
        box-shadow:0 1px 3px rgba(0,0,0,.06);
      }
      .gs-panel h3 {
        margin:0 0 8px 0;
        font-size:16px;
      }
    </style>

    <div class="gs-layout">
      <div class="gs-panel">
        <h3>Existing Recognitions</h3>
        <div id="gs-grid"></div>
      </div>

      <div class="gs-panel">
        <h3 id="form-title">New Recognition</h3>
        <div id="gs-form"></div>

        <div id="cards-section" class="hide">
          <div style="display:flex;align-items:center;gap:12px;margin:10px 0">
            <span class="muted">Pick a card or upload your own</span>
            <button id="btn-upload" class="btn link">Upload your card</button>
            <input id="file-input" type="file" accept="image/*" style="display:none" />
          </div>
          <div id="cards-grid" class="gs-cards"></div>
          <div id="upload-note" class="muted" style="margin-top:6px"></div>
        </div>

        <div style="margin-top:16px;display:flex;gap:8px">
          <button id="btn-save" class="btn">Save</button>
          <button id="btn-new" class="btn link">New</button>
        </div>
      </div>
    </div>
  `;

    await this.initForm();
    await this.loadCardsFromLibrary(); // your existing logic
    this.initGrid(); // 🌟 new
    this.wireEvents();
  }

  protected onInit(): Promise<void> {
    if (this.properties.minAmount === undefined)
      this.properties.minAmount = 500;
    if (this.properties.maxAmount === undefined)
      this.properties.maxAmount = 1000;
    this.sp = spfi().using(SPFx(this.context));
    SPComponentLoader.loadCss(
      "https://cdn3.devexpress.com/jslib/23.2.4/css/dx.light.css"
    );
    return super.onInit();
  }

  private initGrid(): void {
    const $grid = $("#gs-grid", this.domElement);

    ($grid as any).dxDataGrid({
      dataSource: this.createGridStore(),
      keyExpr: "Id",
      columnAutoWidth: true,
      showBorders: true,
      hoverStateEnabled: true,
      selection: { mode: "single" },
      paging: { pageSize: 10 },
      pager: {
        showPageSizeSelector: true,
        allowedPageSizes: [10, 20, 50],
        showInfo: true,
      },
      columns: [
        { dataField: "Id", width: 60 },
        { dataField: "ToUserName", caption: "Recipient", minWidth: 140 },
        { dataField: "ToUserEmail", caption: "Recipient Email", minWidth: 180 },
        { dataField: "GiftType", caption: "Gift Type", width: 100 },
        { dataField: "Amount", caption: "Amount", width: 90 },
        { dataField: "Status", caption: "Status", width: 100 },
        {
          type: "buttons",
          width: 80,
          buttons: [
            {
              hint: "Edit",
              icon: "edit",
              onClick: async (e: any) => {
                await this.loadItemIntoForm(e.row.data.Id);
              },
            },
          ],
        },
      ],
      onRowDblClick: async (e: any) => {
        if (e.data?.Id) {
          await this.loadItemIntoForm(e.data.Id);
        }
      },
    });
  }

  private createGridStore(): any {
    // const that = this;
    const CustomStore = (window as any).DevExpress.data.CustomStore;

    return new CustomStore({
      key: "Id",
      load: async () => {
        // load a light view of items
        const items = await this.sp.web.lists
          .getByTitle("GSaada_Doses")
          .items.select(
            "Id,Title,ToUserName,ToUserEmail,GiftType,Amount,Status"
          )
          .orderBy("Id", false)
          .top(200)();
        return items;
      },
    });
  }

  private async loadItemIntoForm(id: number): Promise<void> {
    const form = ($("#gs-form", this.domElement) as any).dxForm("instance");

    const item = (await this.sp.web.lists
      .getByTitle("GSaada_Doses")
      .items.getById(id)
      .select(
        "Id,ToUserId,ToUserName,ToUserEmail,GiftType,Amount,Message,CardIdId,CardFileUrl"
      )()) as any;

    this.currentItemId = id;
    $("#form-title", this.domElement).text(`Edit Recognition #${id}`);

    const formData: any = {
      ToUserLogin: item.ToUserEmail || null, // we don't know login, but email will still show in autocomplete
      ToUserId: item.ToUserId || null,
      ToUserName: item.ToUserName || "",
      ToUserEmail: item.ToUserEmail || "",
      GiftType: item.GiftType || "Card",
      Amount: item.Amount ?? null,
      Message: item.Message || "",
    };

    form.option("formData", formData);

    // Apply GiftType-driven UI (Amount visibility, cards section, etc.)
    await this.onGiftTypeChanged(formData.GiftType);

    // If you want to preselect a card from CardIdId or CardFileUrl, you can:
    // - set this.selectedCardId and/or pendingCustomFile / preview (if you also load the image).
  }

  private wireEvents(): void {
    // existing btn-upload, file-input, etc...

    $("#btn-save", this.domElement).on("click", async () => {
      await this.saveRecognition();
    });

    $("#btn-new", this.domElement).on("click", async () => {
      await this.resetFormToNew();
    });
  }

  private renderCards(cards: any[]): void {
      const $grid = $("#cards-grid", this.domElement).empty();
  
      // 1) Normal cards from library
      cards.forEach((c) => {
        const $tile = $(`
        <div class="gs-card-tile" data-id="${c.Id}" title="${c.Title}">
          <img src="${c.ThumbnailUrl}" alt="${c.Title}">
        </div>
      `);
  
        $tile.on("click", () => {
          $(".gs-card-tile", this.domElement).removeClass("selected");
          $tile.addClass("selected");
  
          this.selectedCardId = c.Id;
          // If user picks a library card, discard pending custom selection (but keep file in memory if you want)
          // Here we just "un-choose" it:
          this.pendingCustomFile = null;
          this.pendingCustomPreviewUrl = null;
        });
  
        $grid.append($tile);
      });
  
      // 2) Custom local image tile (if user picked something but not uploaded yet)
      if (this.pendingCustomPreviewUrl) {
        const $custom = $(`
        <div class="gs-card-tile" data-custom="true" title="Custom image (not uploaded yet)">
          <img src="${this.pendingCustomPreviewUrl}" alt="Custom card">
        </div>
      `);
  
        $custom.on("click", () => {
          $(".gs-card-tile", this.domElement).removeClass("selected");
          $custom.addClass("selected");
  
          // User chose custom image, so we ignore catalog selection
          this.selectedCardId = null;
          // pendingCustomFile already set
        });
  
        $grid.append($custom);
      }
  
      // 3) "+" tile for picking a new local image
      const $add = $(`
        <div class="gs-card-tile gs-card-add" title="Upload your own image">
          <span>+</span>
        </div>
      `);
  
      $add.on("click", () => {
        $("#file-input", this.domElement).trigger("click");
      });
  
      $grid.append($add);
  
      // Optionally auto-select something (e.g., first card or custom)
      if (this.selectedCardId) {
        $grid
          .find(`.gs-card-tile[data-id="${this.selectedCardId}"]`)
          .addClass("selected");
      } else if (this.pendingCustomPreviewUrl) {
        $grid.find(`.gs-card-tile[data-custom="true"]`).addClass("selected");
      }
    }

  private async resetFormToNew(): Promise<void> {
    const form = ($("#gs-form", this.domElement) as any).dxForm("instance");

    this.currentItemId = null;
    $("#form-title", this.domElement).text("New Recognition");

    const fd: any = {
      ToUserLogin: null,
      ToUserId: null,
      ToUserName: "",
      ToUserEmail: "",
      GiftType: "Card",
      Amount: null,
      Message: "",
    };

    form.option("formData", fd);
    await this.onGiftTypeChanged("Card");

    this.selectedCardId = null;
    if (this.pendingCustomPreviewUrl) {
      URL.revokeObjectURL(this.pendingCustomPreviewUrl);
      this.pendingCustomPreviewUrl = null;
    }
    this.pendingCustomFile = null;
    $("#upload-note", this.domElement).text("");
  }

  private async uploadToCardsLibrary(
    file: File
  ): Promise<{ itemId: number; Url: string }> {
    try {
      const web = this.context.pageContext.web;

      // Normalize paths
      const serverRelWeb = web.serverRelativeUrl.replace(/^\//, "");
      const folderServerRel = `/${serverRelWeb}/GSaada_Cards`;

      // Target folder
      const folder = this.sp.web.getFolderByServerRelativePath(folderServerRel);

      // Upload => returns IFileInfo (no .file!)
      const uploadInfo = await folder.files.addUsingPath(file.name, file, {
        Overwrite: true,
      });

      // Resolve file URL from IFileInfo
      const serverRelativeUrl = uploadInfo.ServerRelativeUrl;

      // Rebind to the real IFile object
      const fileObj =
        this.sp.web.getFileByServerRelativePath(serverRelativeUrl);

      // Get list item to retrieve ID
      const item = await fileObj.getItem();

      // EXECUTE the query to get data with Id
      const itemData: { Id: number } = await item.select("Id")();

      // Build absolute URL
      const webUrl = web.absoluteUrl.replace(/\/$/, "");
      const absoluteUrl = `${webUrl}${serverRelativeUrl}`;

      return {
        itemId: itemData.Id,
        Url: absoluteUrl,
      };
    } catch (err) {
      console.log("Upload error:", err);
      throw err;
    }
  }

  private async saveRecognition(): Promise<void> {
    const form = ($("#gs-form", this.domElement) as any).dxForm("instance");
    const data = form.option("formData") || {};

    // resolve recipient, validate GiftType / Amount, card selection...
    // let toId: number | null = Number(data.ToUserId) || null;
    // if (!toId && data.ToUserLogin) {
    //   toId = await this.ensureUserIdFromLogin(String(data.ToUserLogin));
    // }

    const giftType = data.GiftType || "Card";
    const message = (data.Message || "").toString().trim();
    const amount = giftType === "Amount" ? Number(data.Amount) : null;

    if (/*!toId ||*/ !giftType || !message) {
      alert("Please fill Recipient, Gift Type and Message.");
      return;
    }
    if (giftType === "Amount" && (amount == null || isNaN(amount))) {
      alert("Please enter a valid Amount.");
      return;
    }

    const payload: any = {
      // ToUserId: toId,
      ToUserName: data.ToUserName || "",
      ToUserEmail: data.ToUserEmail || "",
      GiftType: giftType,
      Message: message,
      Status: "Submitted",
    };

    if (giftType === "Amount") {
      payload.Amount = amount;
    }

    // Card logic (same as you already have)
    if (giftType === "Card") {
      if (this.selectedCardId) {
        payload.CardIdId = this.selectedCardId;
      } else if (this.pendingCustomFile) {
        const uploaded = await this.uploadToCardsLibrary(
          this.pendingCustomFile
        );
        payload.CardFileUrl = { Url: uploaded.Url, Description: "Custom Card" };
      } else {
        alert("Please select a card or upload an image.");
        return;
      }
    }

    const list = this.sp.web.lists.getByTitle("GSaada_Doses");

    try {
      if (this.currentItemId) {
        // 🔁 UPDATE existing
        await list.items.getById(this.currentItemId).update(payload);
        alert("Recognition updated successfully.");
      } else {
        // ➕ ADD new
        payload.Title = `Recognition ${new Date().toISOString()}`;
        const res = await list.items.add(payload);
        this.currentItemId = res.data.Id;
        alert("Recognition added successfully.");
      }

      // refresh grid after save
      const grid = ($("#gs-grid", this.domElement) as any).dxDataGrid(
        "instance"
      );
      await grid.refresh();
    } catch (err) {
      console.error(err);
      alert("Error saving recognition.");
    }
  }

  private async initForm(): Promise<void> {
    // const $f = $("#gs-form", this.domElement);
    // very small DX form; replace with your People Picker if needed
    $("#gs-form").dxForm({
      formData: {
        ToUserName: null,
        GiftType: "Card",
        Amount: null,
        Message: "",
      },
      items: [
        {
          itemType: "group",
          colCount: 2,
          items: [
            {
              dataField: "ToUserName", // store the selected login first
              label: { text: "Recipient" },
              editorType: "dxAutocomplete",
              isRequired: true,
              editorOptions: {
                dataSource: createPeopleStore(this.sp),
                minSearchLength: 2,
                placeholder: "Type a name or email…",
                showClearButton: true,
                searchTimeout: 300,
                valueExpr: "name",
                searchExpr: ["name", "email"],
                onSelectionChanged: async (e: {
                  selectedItem?: {
                    id?: string | number;
                    name?: string;
                    email?: string;
                  } | null;
                }) => {
                  const selected = e.selectedItem; // full object
                  const form = $("#gs-form").dxForm("instance");
                  form.updateData("ToUserEmail", selected?.email);
                  // ensure we pass a string to updateGiftTypePermission
                  await this.updateGiftTypePermission(
                    String(selected?.id ?? "")
                  );
                },
                itemTemplate(data: { name?: string; email?: string }) {
                  return $(`<div>
                              <div>${data.name}</div>
                              <div style="font-size:12px;opacity:.7">${data.email}</div>
                            </div>`);
                },
              },
            },
            {
              dataField: "ToUserEmail",
              visible: false,
            },
            {
              dataField: "GiftType",
              label: { text: "Gift Type" },
              editorType: "dxSelectBox",
              isRequired: true,
              editorOptions: {
                // items: ["Card", "Amount", "Voucher"],
                value: "Card",
                items: [
                  { text: "Card", value: "Card" },
                  { text: "Voucher", value: "Voucher", disabled: true },
                  { text: "Amount", value: "Amount", disabled: true },
                ],
                valueExpr: "value",
                displayExpr: "text",
                // disabled: true,
                onValueChanged: (e: { value: string }) =>
                  this.onGiftTypeChanged(e.value),
              },
            },
            {
              dataField: "Amount",
              label: { text: "Amount" },
              editorType: "dxNumberBox",
              editorOptions: {
                min: this.properties.minAmount,
                max: this.properties.maxAmount,
                showSpinButtons: true,
                showClearButton: true,
                format: "#,##0.##",
                placeholder: `Between ${this.properties.minAmount} and ${this.properties.maxAmount}`,
              },
              isRequired: true,
              visible: false, // initially hidden; show based on GiftType if needed
              validationRules: [
                { type: "required", message: "Amount is required" },
                {
                  type: "range",
                  min: this.properties.minAmount,
                  max: this.properties.maxAmount,
                  message: `Amount must be between ${this.properties.minAmount} and ${this.properties.maxAmount}`,
                },
              ],
            },
            {
              colSpan: 2,
              colCount: 2,
              dataField: "Message",
              label: { text: "Message" },
              editorType: "dxTextArea",
              isRequired: true,
              editorOptions: { height: 100, placeholder: "Say thanks…" },
            },
          ],
        },
      ],
    });
  }

  private async onGiftTypeChanged(value: string): Promise<void> {
    const form = $("#gs-form").dxForm("instance");

    const isAmount = value === "Amount";

    // Toggle visibility
    form.itemOption("Amount", "visible", isAmount);

    // Toggle required rule dynamically
    form.itemOption("Amount", "isRequired", isAmount);

    form.itemOption("GiftType", "value", value);
    form.itemOption("GiftType", "disabled", !isAmount);

    // Clear or keep card section
    if (value === "Card") {
      // Show card picker
      $("#cards-section", this.domElement).removeClass("hide");

      // Reload cards only if necessary
      await this.loadCardsFromLibrary().then((cards: any) => {
        this.renderCards(cards);
      });
    } else {
      // Hide card picker if not Card
      $("#cards-section", this.domElement).addClass("hide");

      // Clear any card selection
      this.selectedCardId = null;
      this.pendingCustomFile = null;
      if (this.pendingCustomPreviewUrl) {
        URL.revokeObjectURL(this.pendingCustomPreviewUrl);
        this.pendingCustomPreviewUrl = null;
      }
    }
  }

  // Enable GiftType only if current user is recipient's manager
    private async updateGiftTypePermission(
      recipientLogin: string
    ): Promise<void> {
      const form = ($("#gs-form", this.domElement) as any).dxForm("instance");
      const isManager = await this.isCurrentUserManagerOf(recipientLogin);
      // this.canEditGiftType = isManager;
  
      // If not manager → force Card and lock the field
      const fd = form.option("formData") || {};
      if (!isManager) {
        fd.GiftType = "Card";
        form.option("formData", fd);
      }
  
      // Toggle disabled flag on GiftType editor
      const currentOpts = form.itemOption("GiftType", "editorOptions") || {};
      form.itemOption("GiftType", "editorOptions", {
        ...currentOpts,
        disabled: !isManager
      });
    }

    private async isCurrentUserManagerOf(
    recipientLogin: string
  ): Promise<boolean> {
    if (!recipientLogin) return false;

    try {
      const me = await this.sp.web.currentUser();
      const meLogin = (me.LoginName || "").toLowerCase();

      // Get recipient profile
      const profile = await this.sp.profiles.getPropertiesFor(recipientLogin);
      type UserProfileProperty = { Key: string; Value?: string | null };
      const props: UserProfileProperty[] = (profile.UserProfileProperties as UserProfileProperty[]) || [];

      const managerProp = props.find((p) => p.Key === "Manager");
      const managerLogin = (managerProp?.Value || "").toLowerCase();

      if (!managerLogin || !meLogin) return false;

      // UPS Manager is usually stored as a login/claims; simple compare works in most setups
      return managerLogin.indexOf(meLogin) !== -1;
    } catch (err) {
      console.error("Error checking manager relationship:", err);
      return false;
    }
  }

  private async loadCardsFromLibrary(): Promise<unknown[]> {
    try {
      const items = await this.sp.web.lists
        .getByTitle("GSaada_Cards")
        .items.select(
          "Id",
          "Title",
          "FileLeafRef",
          "EncodedAbsUrl",
          "Thumbnail",
          "IsActive"
        )
        .top(10)(); // enough for your catalog

      // Normalize for rendering
      return items
        .filter((i) => i.IsActive !== false) // optional filter
        .map((i) => ({
          Id: i.Id,
          Title: i.Title || i.FileLeafRef,
          ThumbnailUrl: i.Thumbnail || i.EncodedAbsUrl || "",
          Url: i.EncodedAbsUrl,
        }));
    } catch (err) {
      console.error("Error loading cards:", err);
      return [];
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
              ],
            },
          ],
        },
      ],
    };
  }
}
