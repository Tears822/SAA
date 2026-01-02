// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../node_modules/devextreme/bundles/dx.all.d.ts" />
/// <reference path="../../../node_modules/devextreme/integration/jquery.d.ts" />
import DevExpress from "devextreme/bundles/dx.all";
// import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from "@microsoft/sp-property-pane";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
// import type { IReadonlyTheme } from '@microsoft/sp-component-base';
// import { escape } from "@microsoft/sp-lodash-subset";

// import styles from "./GSaadaItemsWebPart.module.scss";
// import * as strings from "GSaadaItemsWebPartStrings";

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
import { createPeopleStore } from "../../util/PeopleStore";
import * as splist from "../../util";

require("../../assets/style.css");

export interface IGSaadaItemsWebPartProps {
  description: string;
  minAmount: number;
  maxAmount: number;
}

export default class GSaadaItemsWebPart extends BaseClientSideWebPart<IGSaadaItemsWebPartProps> {
  private sp: SPFI;
  // private currentItemId: number | null = null; // null = new item, number = edit this Id
  // private meId: number;
  private selectedCardId: number | null = null; // chosen from gallery
  private pendingCustomFile: File | null = null; // selected local image, not uploaded yet
  private pendingCustomPreviewUrl: string | null = null;

  public async render(): Promise<void> {
    // const me = await this.sp.web.currentUser();
    // this.meId = me.Id;

    this.domElement.innerHTML = `
     <div id="gs-dashboard">
      <div id="gs-kpis" class="gs-kpi-row"></div>
      <div id="gs-charts-row" class="gs-charts-row">
        <div id="chart-by-status" class="gs-chart"></div>
        <div id="chart-by-gifttype" class="gs-chart"></div>
      </div>
    </div>
    <div id="dxDataGridContainer"></div>`;

    // build the grid (and the popup form definition)
    await this.initDashboard();
    await this.initGrid();
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

  private getGSaadaItems = (sp: SPFI): DevExpress.data.DataSource<any, any> => {
    return new DevExpress.data.DataSource({
      loadMode: "raw",
      key: "Id",
      load: async () => {
        const items = await this.sp.web.lists
          .getByTitle("GSaada_Doses")
          .items // .select(
          //   "Id,Title,ToUserName,GiftType,Amount,Status"
          // )
          .orderBy("Id", false)();

        return await Promise.all(
          items.map(async (i: any) => {
            const sender = await this.sp.web.siteUsers.getById(i.AuthorId)();

            return {
              ...i,
              Sender: sender?.Title || "", // resolved value
            };
          })
        );

        // this.gridData = result;
      },
      insert: async (values: any) => {
        values.Title = `Goreat Saada ${new Date().toISOString()}`;
        return await sp.web.lists.getByTitle("GSaada_Doses").items.add(values);
      },
      update: async (key: any, values: any) => {
        return await sp.web.lists
          .getByTitle("GSaada_Doses")
          .items.getById(key)
          .update(values);
      },
      // remove: async (key) => {
      //   return await splist.deleteListItem(sp, "ListName", key);
      // },
    });
  };

  private async initGrid(): Promise<void> {
    // let currentItemId = 0;
    const sp = spfi().using(SPFx(this.context));
    const isUserInHRGroup = await splist.isUserInManagersGroup(sp, ["HRGroup"]);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const wp = this;

    $("#dxDataGridContainer").dxDataGrid({
      dataSource: this.getGSaadaItems(sp),
      keyExpr: "Id",
      showBorders: true,
      // focusedRowEnabled: true,
      allowColumnResizing: true,
      columnResizingMode: "nextColumn",
      columnAutoWidth: true,
      wordWrapEnabled: true,
      noDataText: "No requests found",
      searchPanel: {
        visible: true,
        highlightSearchText: true,
      },
      paging: {
        pageSize: 10,
      },
      pager: {
        visible: true,
        allowedPageSizes: [5, 10, 25],
        showPageSizeSelector: true,
        showInfo: true,
        showNavigationButtons: true,
      },
      headerFilter: {
        visible: true,
        search: {
          enabled: true,
        },
      },
      filterRow: {
        visible: true,
      },
      editing: {
        mode: "popup",
        allowUpdating: true,
        allowDeleting: false,
        allowAdding: true,
        confirmDelete: true,
        // texts: { editRow: "Claim" },
        popup: {
          title: "Goreat Saada",
          showTitle: true,
          height: 600,
          width: 1000,
          resizeEnabled: true,
        },
        form: {
          elementAttr: {
            id: "saadaForm",
          },
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
                  const form = $("#saadaForm").dxForm("instance");
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
                items: ["Card"],
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
            {
              itemType: "simple",
              colSpan: 2,
              template: async (data: any, itemElement: any) => {
                const $cardsSection = $(`
                <div id="cards-section" class="">
                  <div style="display:flex;align-items:center;gap:12px;margin:10px 0">
                    <span class="muted">Pick a card or upload your own</span>
                  </div>
                  <div id="cards-grid" class="gs-cards"></div>
                  <input id="file-input" type="file" accept="image/*" style="display:none" />
                  <!--<div id="upload-note" class="muted" style="margin-top:6px"></div>-->
                </div>`);
                itemElement.append($cardsSection);
                const cards = (await this.loadCardsFromLibrary()) as any[];
                // this.renderCards(cards);
                const $grid = $("#cards-grid").empty();

                // 1) Normal cards from library - show images in tiles
                cards.forEach((c) => {
                  const $tile = $(`
                    <div class="gs-card-tile" data-id="${c.Id}" title="${c.Title}">
                      <img src="${c.ThumbnailUrl}" alt="${c.Title}">
                    </div>
                  `);

                  // show selection when user clicks on tile and store selectedCardId
                  $tile.on("click", () => {
                    // $(".gs-card-tile", this.domElement).removeClass("selected");
                    // $tile.removeClass("selected");
                    $("#cards-section")
                      .find(".gs-card-tile")
                      .removeClass("selected");
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
                    // $(".gs-card-tile", this.domElement).removeClass("selected");
                    // $custom.removeClass("selected");
                    $("#cards-section")
                      .find(".gs-card-tile")
                      .removeClass("selected");
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
                  // $("#file-input", this.domElement).trigger("click");
                  $("#cards-section #file-input").trigger("click");
                });

                $grid.append($add);

                // Optionally auto-select something (e.g., first card or custom)
                if (this.selectedCardId) {
                  $grid
                    .find(`.gs-card-tile[data-id="${this.selectedCardId}"]`)
                    .addClass("selected");
                } else if (this.pendingCustomPreviewUrl) {
                  $grid
                    .find(`.gs-card-tile[data-custom="true"]`)
                    .addClass("selected");
                }

                // $(this.domElement).on(
                $(itemElement).on("change", "#file-input", async (ev: any) => {
                  const input = ev.target as HTMLInputElement;
                  const file: File | undefined = input.files?.[0];

                  if (!file) {
                    input.value = "";
                    return;
                  }

                  // 1) Image only
                  if (!file.type || !file.type.startsWith("image/")) {
                    alert(
                      "Please select an image file (PNG, JPG, JPEG, etc.)."
                    );
                    input.value = "";
                    return;
                  }

                  // 2) Clean previous preview
                  if (this.pendingCustomPreviewUrl) {
                    URL.revokeObjectURL(this.pendingCustomPreviewUrl);
                    this.pendingCustomPreviewUrl = null;
                  }

                  // 3) Set new file & preview
                  this.pendingCustomFile = file;
                  this.pendingCustomPreviewUrl = URL.createObjectURL(file);

                  // 4) Clear selected catalog card
                  this.selectedCardId = null;

                  // 5) Re-render cards (shows only custom image + “+” tile)
                  const cards = (await this.loadCardsFromLibrary()) as any[];
                  this.renderCards(cards);

                  // 6) Note for user
                  $("#upload-note").text(
                    `Selected custom image: ${file.name} (previous image has been replaced)`
                  );

                  // 7) Reset input so user can pick same file again if needed
                  input.value = "";
                });
              },
            },
            {
              colSpan: 2,
              colCount: 2,
              dataField: "Reason",
              label: { text: "Reason" },
              editorType: "dxTextArea",
              visible: false,
              editorOptions: { height: 100, placeholder: "Gift Reason…" },
            },
            {
              dataField: "HRDecision",
              label: { text: "HR Decision" },
              editorType: "dxRadioGroup",
              colSpan: 2,
              visible: false,
              editorOptions: {
                items: [
                  { text: "Agree", value: "Agree" },
                  { text: "Decline", value: "Decline" },
                ],
                valueExpr: "value",
                displayExpr: "text",
                layout: "horizontal",
                readOnly: !isUserInHRGroup,
              },
            },
            //   ],
            // },
          ],
        },
      },
      // onEditorPrepared: (options) => {
      //   if (options.dataField === "GiftType") {
      //     // Store initial disabled state
      //      this.onGiftTypeChanged(options.value);
      //   }
      // },
      onInitNewRow: (e: DevExpress.ui.dxDataGrid.InitNewRowEvent) => {
        const form = $("#saadaForm").dxForm("instance") as
          | DevExpress.ui.dxForm
          | undefined;
        form?.resetOption("formData");
        e.data.GiftType = "Card";
        e.data.Status = "Submitted";
      },
      onEditCanceled(e: DevExpress.ui.dxDataGrid.EditCanceledEvent) {
        const form = $("#saadaForm").dxForm("instance") as
          | DevExpress.ui.dxForm
          | undefined;
        form?.resetOption("formData");
      },
      onSaving: async (e) => {
        if (!e.changes?.length) return;

        // make a shallow copy of the change object
        const change = { ...e.changes[e.changes.length - 1] };
        const data = { ...change.data };

        const form = $("#saadaForm").dxForm("instance") as
          | DevExpress.ui.dxForm
          | undefined;
        const fd = form?.option("formData") || {};
        // Set Status based on GiftType and HRDecision
        if (e.changes.length > 0) {
          // const index = e.changes.length - 1;

          // Set initial status based on GiftType and HRDecision
          if (
            (fd.GiftType !== "Card" &&
              data.HRDecision === null) ||
            data.HRDecision === undefined
          ) {
            data.Status = "Pending HR";
          } else if (
            fd.GiftType !== "Card" &&
            data.HRDecision === "Agree"
          ) {
            data.Status = "Approved by HR";
          } else if (
            fd.GiftType !== "Card" &&
            data.HRDecision === "Decline"
          ) {
            data.Status = "Declined by HR";
          }

          if (wp.selectedCardId !== null) {
            data.CardId = wp.selectedCardId;
          }

          data.ToUserEmail = fd.ToUserEmail;
          data.GiftType = fd.GiftType;
          
          // custom upload
          if (this.selectedCardId === null && this.pendingCustomFile) {
            const newCard = await this.uploadToCardsLibrary(
              this.pendingCustomFile
            );
            if (newCard) data.CardId = newCard.itemId;
          }

          
        }
        // assign back once all async work is done
          e.changes[e.changes.length - 1].data = data;
        // console.log("Saving form data:", e.changes);
        // console.log("form data:", fd);
      },
      
      onSaved: () => {
        this.selectedCardId = null;
        this.pendingCustomFile = null;
        if (this.pendingCustomPreviewUrl) {
          URL.revokeObjectURL(this.pendingCustomPreviewUrl);
          this.pendingCustomPreviewUrl = null;
        }
      },
      columns: [
        {
          dataField: "Id",
          caption: "Id",
        },
        {
          dataField: "Sender",
          caption: "Sender",
        },
        {
          dataField: "ToUserName",
          caption: "Recipient",
        },
        {
          dataField: "ToUserEmail",
          visible: false,
        },
        {
          dataField: "GiftType",
          caption: "Gift Type",
          // setCellValue(newData, value, currentRowData) {
          //   newData.GiftType = value;
          // },
          editorOptions: {
            onValueChanged: (e: { value: string }) => {
              this.onGiftTypeChanged(e.value);
            },
          },
        },
        {
          dataField: "Message",
          caption: "Details",
          visible: false,
          formItem: {
            editorType: "dxTextArea",
          },
        },
        {
          dataField: "Amount",
          caption: "Amount",
          visible: false,
        },
        {
          dataField: "Status",
          caption: "Status",
          // visible: false,
        },
        { dataField: "Reason", caption: "Reason", visible: false },
        { dataField: "HRDecision", caption: "HR Decision", visible: false },
        {
          dataField: "Created",
          caption: "Created",
          dataType: "date",
          format: "yyyy-MM-dd",
        },
        {
          dataField: "Modified",
          caption: "Modified",
          dataType: "date",
          format: "yyyy-MM-dd",
        },
      ],
      summary: {
        totalItems: [
          {
            column: "Id",
            summaryType: "count",
          },
        ],
      },
    });
  }

  private renderCards(cards: any[]): void {
    const $grid = $("#cards-grid").empty();

    // 1) Normal cards from library
    cards.forEach((c) => {
      const $tile = $(`
        <div class="gs-card-tile" data-id="${c.Id}" title="${c.Title}">
          <img src="${c.ThumbnailUrl}" alt="${c.Title}">
        </div>
      `);

      $tile.on("click", () => {
        $("#cards-section").find(".gs-card-tile").removeClass("selected");
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
        $("#cards-section").find(".gs-card-tile").removeClass("selected");
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

    // $add.on("click", () => {
    //   $("#file-input", this.domElement).trigger("click");
    // });

    $add.on("click", () => {
      $grid.closest("#cards-section").find("#file-input").trigger("click");
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

  // private async onGiftTypeChanged(value: string): Promise<void> {
  //   const form = $("#saadaForm").dxForm("instance");

  //   const isAmount = value === "Amount";

  //   // Toggle visibility
  //   form.itemOption("Amount", "visible", isAmount);

  //   // Toggle required rule dynamically
  //   form.itemOption("Amount", "isRequired", isAmount);

  //   form.itemOption("GiftType", "value", value);
  //   form.itemOption("GiftType", "disabled", !isAmount);

  //   // Clear or keep card section
  //   if (value === "Card") {
  //     // Show card picker
  //     $("#cards-section", this.domElement).removeClass("hide");

  //     // Reload cards only if necessary
  //     await this.loadCardsFromLibrary().then((cards: any) => {
  //       this.renderCards(cards);
  //     });
  //   } else {
  //     // Hide card picker if not Card
  //     $("#cards-section", this.domElement).addClass("hide");

  //     // Clear any card selection
  //     this.selectedCardId = null;
  //     this.pendingCustomFile = null;
  //     if (this.pendingCustomPreviewUrl) {
  //       URL.revokeObjectURL(this.pendingCustomPreviewUrl);
  //       this.pendingCustomPreviewUrl = null;
  //     }
  //   }
  // }

  private onGiftTypeChanged(currentValue: string) {
    // const form = $("#saadaForm").dxForm("instance");

    const form = $("#saadaForm").dxForm("instance") as
      | DevExpress.ui.dxForm
      | undefined;

    // If the popup form is not created yet, do nothing
    if (!form) {
      // console.warn("saadaForm dxForm instance not found yet, skipping onGiftTypeChanged");
      return;
    }
    const isAmount = currentValue === "Amount";
    const isCard = currentValue === "Card";

    // form.updateData("GiftType", currentValue);
    // Toggle amount field

    // Keep GiftType value in sync with the editor
    // form.itemOption("GiftType", "value", currentValue);
    if (isAmount) {
      // const giftTypeEditorOptions =
      //   (form.itemOption("GiftType", "editorOptions") as any) || {};
      // form.itemOption("GiftType", "editorOptions", {
      //   ...giftTypeEditorOptions,
      //   value: currentValue,
      // });
    } else {
      form.updateData("Amount", null);
    }

    form.itemOption("Amount", "visible", isAmount);
    form.itemOption("Amount", "isRequired", isAmount);
    form.itemOption("Reason", "visible", isAmount);
    form.itemOption("HRDecision", "visible", isAmount);
    // form.itemOption("GiftType", "editorOptions", { value: currentValue });

    form.itemOption("GiftType", "editorOptions", {
      items: ["Card", "Amount", "Voucher"],
      value: currentValue,
    });
    form.updateData("GiftType", currentValue);

    const $cardsSection = $("#cards-section");

    if (isCard) {
      // show cards section inside the form
      $cardsSection.removeClass("hide");

      // load & render cards (from library + custom preview if any)
      // const cards = (await this.loadCardsFromLibrary()) as any[];
      // this.renderCards(cards);
    } else {
      // hide cards section
      // $cardsSection.addClass("hide");

      // clear card-related state
      this.selectedCardId = null;
      this.pendingCustomFile = null;
      if (this.pendingCustomPreviewUrl) {
        URL.revokeObjectURL(this.pendingCustomPreviewUrl);
        this.pendingCustomPreviewUrl = null;
      }
    }
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

  // Enable GiftType only if current user is recipient's manager
  private async updateGiftTypePermission(
    recipientLogin: string
  ): Promise<void> {
    const form = $("#saadaForm").dxForm("instance");
    const isManager = await this.isCurrentUserManagerOf(recipientLogin);
    // this.canEditGiftType = isManager;
    // form.itemOption("GiftType", "editorOptions", { disabled: !isManager });
    // If not manager → force Card and lock the field
    // const fd = form.option("formData") || {};
    if (!isManager) {
      // fd.GiftType = "Card";
      // form.option("formData", fd);
      form.itemOption("GiftType", "editorOptions", { items: ["Card"] });
      form.updateData("GiftType", "Card");
      form.itemOption("Amount", "visible", isManager);
      form.itemOption("Amount", "isRequired", isManager);
      form.itemOption("Reason", "visible", isManager);
      form.itemOption("HRDecision", "visible", isManager);
    } else {
      form.itemOption("GiftType", "editorOptions", {
        items: ["Card", "Amount", "Voucher"],
      });
    }

    // Toggle disabled flag on GiftType editor
    // const currentOpts = form.itemOption("GiftType", "editorOptions") || {};
    // form.itemOption("GiftType", "editorOptions", {
    //   ...currentOpts,
    //   disabled: !isManager,
    // });
    // form.itemOption("GiftType", "editorOptions", { disabled: !isManager });
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
      const props: UserProfileProperty[] =
        (profile.UserProfileProperties as UserProfileProperty[]) || [];

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

  private async initDashboard(): Promise<void> {
  // Load only the fields we need
  const items = await this.sp.web.lists
    .getByTitle("GSaada_Doses")
    .items.select("Id", "GiftType", "Status", "Amount")();

  // --- 1) Basic stats ---
  const totalRequests = items.length;
  const totalAmount = items.reduce(
    (sum: number, i: any) => sum + (i.Amount || 0),
    0
  );

  // group helper
  const groupCount = (arr: any[], field: string) => {
    const map: Record<string, number> = {};
    arr.forEach((i) => {
      const key = (i[field] || "Unknown") as string;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.keys(map).map((k) => ({ [field]: k, Count: map[k] }));
  };

  const byStatus = groupCount(items, "Status");      // [{ Status, Count }]
  const byGiftType = groupCount(items, "GiftType");  // [{ GiftType, Count }]

  // --- 2) Render KPIs as simple cards ---
  const kpiHtml = `
    <div class="gs-kpi-card">
      <div class="gs-kpi-label">Total Requests</div>
      <div class="gs-kpi-value">${totalRequests}</div>
    </div>
    <div class="gs-kpi-card">
      <div class="gs-kpi-label">Total Amount</div>
      <div class="gs-kpi-value">${totalAmount}</div>
    </div>
  `;
  $("#gs-kpis", this.domElement).html(kpiHtml);

  // --- 3) Charts using DevExtreme ---

  // Status pie chart
  ($("#chart-by-status") as any).dxPieChart({
    dataSource: byStatus,
    series: [
      {
        argumentField: "Status",
        valueField: "Count",
      },
    ],
    tooltip: {
      enabled: true,
      format: "fixedPoint",
      customizeTooltip: (arg: any) => {
        return {
          text: `${arg.argumentText}: ${arg.valueText} requests`,
        };
      },
    },
    legend: {
      visible: true,
    },
    title: "Requests by Status",
  });

  // GiftType bar chart
  ($("#chart-by-gifttype") as any).dxChart({
    dataSource: byGiftType,
    series: [
      {
        type: "bar",
        argumentField: "GiftType",
        valueField: "Count",
      },
    ],
    valueAxis: {
      label: { format: { type: "fixedPoint", precision: 0 } },
    },
    tooltip: {
      enabled: true,
      customizeTooltip: (arg: any) => {
        return {
          text: `${arg.argumentText}: ${arg.valueText} requests`,
        };
      },
    },
    title: "Requests by Gift Type",
  });
}


  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: "Give Recognition Settings" },
          groups: [
            {
              groupName: "Amount limits",
              groupFields: [
                PropertyPaneTextField("minAmount", {
                  label: "Minimum Amount",
                  description: "Smallest allowed value",
                }),
                PropertyPaneTextField("maxAmount", {
                  label: "Maximum Amount",
                  description: "Largest allowed value",
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
