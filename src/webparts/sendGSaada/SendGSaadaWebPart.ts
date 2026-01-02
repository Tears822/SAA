// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../node_modules/devextreme/bundles/dx.all.d.ts" />
/// <reference path="../../../node_modules/devextreme/integration/jquery.d.ts" />
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import { SPFI, spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/files";
import "@pnp/sp/";
import "@pnp/sp/folders";
import "@pnp/sp/items";
import "@pnp/sp/lists";
import "@pnp/sp/site-users/web";
import "@pnp/sp/profiles";
import "@pnp/sp/attachments";
import "devextreme";
import * as $ from "jquery";
import { createPeopleStore } from "../../util/PeopleStore";
// import { SPHttpClient } from "@microsoft/sp-http";
import { SPComponentLoader } from "@microsoft/sp-loader";
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from "@microsoft/sp-property-pane";

// const CARDS_LIB = "GSaada_Cards";
const DOSES_LIST = "GSaada_Doses";

export interface ISendGSaadaWebPartProps {
  description: string;
  minAmount: number;
  maxAmount: number;
}

export default class SendGSaadaWebPart extends BaseClientSideWebPart<ISendGSaadaWebPartProps> {
  private sp: SPFI;
  private selectedCardId: number | null = null; // chosen from gallery
  private pendingCustomFile: File | null = null; // selected local image, not uploaded yet
  private pendingCustomPreviewUrl: string | null = null; // object URL for preview
  // private _canChangeGiftType: boolean = false;

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

  public async render(): Promise<void> {
    this.domElement.innerHTML = `
      <style>
        .gs-cards {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .gs-card-tile {
          width: 120px;
          height: 120px;
          border-radius: 8px;
          border: 1px solid #666;
          background: #f8f5f5ff;          
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          overflow: hidden;
          box-sizing: border-box;
        }

        .gs-card-tile:hover {
          transform: scale(1.5);
        }

        /* normal card with image */
        .gs-card-tile img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* selected state (green outline) */
        .gs-card-tile.selected {
          border: 3px solid #00c853;  /* green */
        }

        /* plus tile */
        .gs-card-add {
          border: 1px solid #888;
          color: #ddd;
          font-size: 42px;
          font-weight: 300;
        }
        .gs-card-add:hover {
          border-color: #fff;
        }
        .gs-form{max-width:880px;margin:auto}
        .gs-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .gs-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-top:8px}
        .gs-card{border:1px solid #e7e7e7;border-radius:12px;padding:8px;cursor:pointer;background:#fff}
        .gs-card.selected{outline:2px solid #1677ff}
        .gs-card img{width:100%;height:110px;object-fit:cover;border-radius:8px}
        
        /*.muted{color:#666;font-size:12px}
        .hide{display:none}
        .btn{background:#1677ff;color:#fff;border:none;border-radius:8px;padding:10px 14px;cursor:pointer}
        .btn.link{background:transparent;color:#1677ff}*/

        .muted{color:#666;font-size:12px}
        .hide{display:none}
        .btn{background:#1677ff;color:#fff;border:none;border-radius:8px;padding:10px 14px;cursor:pointer}
        .btn.link{background:transparent;color:#1677ff}

        .gs-actions{margin-top:40px;display:flex;justify-content:center;gap:12px}
        #btn-save{min-width:160px}
        #btn-cancel{min-width:160px;background:#ffffff;color:#1677ff;border:1px solid #1677ff}

      </style>
      <div class="gs-form">
        <h3>Send Goraet Saada</h3>
        <div id="gs-form"></div>
        <div id="cards-section" class="hide1">
          <div style="display:flex;align-items:center;gap:12px;margin:10px 0">
            <span class="muted">Pick a card or upload your own</span>
            <!--<button id="btn-upload" class="btn link">Upload your card</button>-->
            <!--<input id="file-input" type="file" accept="image/*,.pdf" class="hide" />-->
          </div>
          <div id="cards-grid" class="gs-cards"></div>
          <input id="file-input" type="file" accept="image/*" style="display:none" />
          <!--<div id="upload-note" class="muted" style="margin-top:6px"></div>-->
        </div>
        <div class="gs-actions">
          <button id="btn-save" class="btn">Submit</button>
          <button id="btn-cancel" class="btn btn-cancel">Cancel</button>
        </div>
      </div>
    `;

    await this.initForm();
    // $("#cards-section", this.domElement).removeClass("hide");
    const cards = await this.loadCardsFromLibrary();
    this.renderCards(cards); // preload catalog
    this.wireEvents();

    $("#file-input", this.domElement).on("change", async (ev: Event) => {
      // const file: File = ev.target.files?.[0];
      const input = ev.target as HTMLInputElement;
      const file: File | undefined = input.files?.[0];
      if (!file) {
        input.value = ""; // reset input
        return;
      }

      // 1) Validate image only
      if (!file.type || !file.type.startsWith("image/")) {
        alert("Please select an image file (PNG, JPG, JPEG, etc.).");
        input.value = "";
        return;
      }

      // 2) If there was a previous preview, clean it up
      if (this.pendingCustomPreviewUrl) {
        URL.revokeObjectURL(this.pendingCustomPreviewUrl);
        this.pendingCustomPreviewUrl = null;
      }

      // 3) Set the new file & preview
      this.pendingCustomFile = file;
      this.pendingCustomPreviewUrl = URL.createObjectURL(file);

      // 4) Clear any selected catalog card (we are choosing a custom image now)
      this.selectedCardId = null;

      // 5) Re-render the cards grid (this will show ONLY the new custom image tile)
      const cards = await this.loadCardsFromLibrary();
      this.renderCards(cards);

      // 6) Small note for the user
      $("#upload-note", this.domElement).text(
        `Selected custom image: ${file.name} (previous image has been replaced)`
      );

      // 7) Reset input so user can pick the same file again if they want
      input.value = "";
    });

    setTimeout(() => {
      this.bindFormEvents();
    }, 0);
  }

  private async isCurrentUserManagerOf(email: string): Promise<boolean> {
    try {
      // get user profile of the recipient
      const managerClaim: string =
        await this.sp.profiles.getUserProfilePropertyFor(email, "Manager");

      if (!managerClaim) return false;

      // SharePoint often returns manager claim like: "i:0#.f|membership|manager@domain.com"
      const managerEmail = managerClaim.split("|").pop()?.toLowerCase();

      const currentUserEmail =
        this.context.pageContext.user.email?.toLowerCase();

      return managerEmail === currentUserEmail;
    } catch (err) {
      console.error("Manager check failed", err);
      return false;
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
                  { text: "Voucher", value: "Voucher" },
                  { text: "Amount", value: "Amount" },
                ],
                valueExpr: "value",
                displayExpr: "text",
                disabled: true,
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

  private bindFormEvents(): void {
    const formInstance: any = $("#gs-form", this.domElement).dxForm("instance");

    if (!formInstance) {
      console.warn("dxForm not ready yet");
      return;
    }

    formInstance.off("fieldDataChanged.gs");

    formInstance.on("fieldDataChanged.gs", async (e: any) => {
      if (e.dataField === "ToUserEmail") {
        const recipientEmail = e.value;

        if (!recipientEmail) {
          formInstance.itemOption("GiftType", "editorOptions.disabled", true);
          formInstance.updateData("GiftType", null);
          return;
        }

        const isManager = await this.isCurrentUserManagerOf(recipientEmail);

        formInstance.itemOption(
          "GiftType",
          "editorOptions.disabled",
          !isManager
        );

        if (isManager && !formInstance.option("formData").GiftType) {
          formInstance.updateData("GiftType", "Card");
          await this.onGiftTypeChanged("Card");
        }
      }

      if (e.dataField === "GiftType") {
        await this.onGiftTypeChanged(e.value);
      }
    });
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
      disabled: !isManager,
    });
  }

  private async onGiftTypeChanged(value: string): Promise<void> {
    const form = $("#gs-form").dxForm("instance");

    const isAmount = value === "Amount";

    // Toggle visibility
    form.itemOption("Amount", "visible", isAmount);

    form.itemOption("Amount", {
      validationRules: isAmount
        ? [{ type: "required", message: "Amount is required" }]
        : [],
    });

  //  form.itemOption("GiftType", "editorOptions.disabled", !isAmount);
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

  private wireEvents(): void {
    const root = this.domElement;

    // upload custom card
    $("#btn-upload", root)
      .off("click.gs")
      .on("click.gs", () => {
        $("#file-input", root).trigger("click");
      });

    // custom card upload
    $("#custom-card-upload", root) // use your real input id
      .off("change.gs")
      .on("change.gs", (e: any) => {
        const input = e.target as HTMLInputElement;
        const files = input.files;
        this.pendingCustomFile = files && files.length > 0 ? files[0] : null;
      });

    // submit
    $("#btn-save", root)
      .off("click.gs")
      .on("click.gs", async () => {
        await this.submitDose();
      });

    // cancel -> go back to previous page
    $("#btn-cancel", root)
      .off("click.gs")
      .on("click.gs", () => {
        window.history.back();
      });

    const formInstance = ($("#gs-form", this.domElement) as any).dxForm(
      "instance"
    );

    // formInstance.on("fieldDataChanged", async (e: any) => {
    //   if (e.dataField === "ToUserEmail") {
    //     const recipientEmail = e.value;

    //     if (!recipientEmail) return;

    //     const isManager = await this.isCurrentUserManagerOf(recipientEmail);

    //     formInstance.itemOption("GiftType", "editorOptions", {
    //       disabled: !isManager,
    //     });
    //   }
    // });
    formInstance.on("fieldDataChanged", async (e: any) => {
      // Only act when Recipient changes
      if (e.dataField === "ToUserEmail") {
        const recipientEmail = e.value as string;

        if (!recipientEmail) {
          // this._canChangeGiftType = false;
          formInstance.itemOption("GiftType", "editorOptions.disabled", true);
          formInstance.updateData("GiftType", null);
          return;
        }

        const isManager = await this.isCurrentUserManagerOf(recipientEmail);
        // this._canChangeGiftType = isManager;

        // only toggle disabled here
        formInstance.itemOption(
          "GiftType",
          "editorOptions.disabled",
          !isManager
        );

        // Optionally set default for managers when empty
        if (isManager && !formInstance.option("formData").GiftType) {
          formInstance.updateData("GiftType", "Card");
          await this.onGiftTypeChanged("Card");
        }
      }

      // GiftType changed → update Amount/Card UI
      if (e.dataField === "GiftType") {
        await this.onGiftTypeChanged(e.value);
      }
    });
  }

  private async submitDose(): Promise<void> {
    const form = ($("#gs-form", this.domElement) as any).dxForm("instance");
    const data = form.option("formData") || {};

    const giftType = data.GiftType;
    const message = (data.Message || "").toString().trim();

    if (/*!toId ||*/ !giftType || !message) {
      alert("Please fill Recipient, GiftType, and Message.");

      return;
    }

    if (giftType === "Amount") {
      if (!data.Amount) {
        alert("Amount is required");
        return;
      }
    }

    const payload: any = {
      Title: `Goreat Saada ${new Date().toISOString()}`,
      ToUserName: data.ToUserName,
      ToUserEmail: data.ToUserEmail,
      GiftType: giftType,
      Message: message,
      Status: "Submitted",
      CardId: 0,
      Amount: data.Amount,
    };

    if (giftType === "Card") {
      if (this.selectedCardId) {
        // existing catalog card
        payload.CardId = this.selectedCardId;
      } else if (this.pendingCustomFile) {
        // upload custom image NOW
      } else {
        alert("Please pick a card or select a custom image.");
        return;
      }
    }

    try {
      const list = this.sp.web.lists.getByTitle(DOSES_LIST);

      // 1) create the item – in your environment this returns the item data directly
      const addResult: any = await list.items.add(payload);

      // from your log, the object has both ID and Id
      const itemId: number | undefined =
        addResult?.Id ?? addResult?.ID ?? addResult?.data?.Id;

      if (!itemId) {
        console.error("Could not resolve item ID from addResult:", addResult);
        alert("Could not get the created item ID to attach the image.");
        return;
      }

      // 2) if user uploaded a custom image (and did not choose a catalog card),
      //    attach it to this list item
      if (
        giftType === "Card" &&
        this.pendingCustomFile &&
        !this.selectedCardId
      ) {
        await list.items
          .getById(itemId)
          .attachmentFiles.add(
            this.pendingCustomFile.name,
            this.pendingCustomFile
          );
      }

      // reset
      this.selectedCardId = null;
      if (this.pendingCustomPreviewUrl) {
        URL.revokeObjectURL(this.pendingCustomPreviewUrl);
      }
      this.pendingCustomFile = null;
      this.pendingCustomPreviewUrl = null;
      $("#upload-note", this.domElement).text("");
      form.resetValues();

      const cards = await this.loadCardsFromLibrary();
      this.renderCards(cards);
      $("#upload-note", this.domElement).text("");
      $(".gs-card", this.domElement).removeClass("selected");

      // redirect after submit
      window.location.href = this.context.pageContext.site.absoluteUrl;
    } catch (err) {
      console.log(err);
      alert("Could not submit the recognition.");
    }
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
