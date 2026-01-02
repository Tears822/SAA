// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../node_modules/devextreme/bundles/dx.all.d.ts" />
/// <reference path="../../../node_modules/devextreme/integration/jquery.d.ts" />
import DevExpress from "devextreme/bundles/dx.all";
import { Version } from "@microsoft/sp-core-library";
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from "@microsoft/sp-property-pane";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import * as strings from "MccServiceActionsWebPartStrings";
import "devextreme";
import * as $ from "jquery";
import { SPComponentLoader } from "@microsoft/sp-loader";
import { spfi, SPFI } from "@pnp/sp";
import { SPFx } from "@pnp/sp/behaviors/spfx";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/attachments";
import "@pnp/sp/profiles";
import type { IAttachmentInfo } from "@pnp/sp/attachments";
import "@pnp/sp/site-users/web";
import "@pnp/sp/site-groups/web";
import * as splist from "../../util";

export interface IMccServiceActionsWebPartProps {
  description: string;
}

// interface IAssignee {
//   Id: number;           // SharePoint user Id
//   Title: string;        // Display name
//   Email: string;
//   LoginName: string;
// }

type ListContentReadyEvent = DevExpress.ui.dxList.ContentReadyEvent;
type GridEditorPreparingEvent = DevExpress.ui.dxDataGrid.EditorPreparingEvent;
type GridColumnButtonClickEvent =
  DevExpress.ui.dxDataGrid.ColumnButtonClickEvent;
type DxElement = DevExpress.core.dxElement;

interface ISimpleValueChangedEvent {
  value?: unknown;
  previousValue?: unknown;
}

type DateRangeTuple = [Date | undefined, Date | undefined];

interface MccRequestItem {
  Id: number;
  ID?: number;
  Title?: string;
  EmployeeName?: string;
  EmployeeEmail?: string;
  JobTitle?: string;
  Department?: string;
  Section?: string;
  Service?: string;
  Details?: string;
  StartDate?: string;
  EndDate?: string;
  ProposedStartDate?: string;
  ProposedEndDate?: string;
  DateRange?: DateRangeTuple;
  ProposedDateRange?: DateRangeTuple;
  SpecialistDecision?: string;
  SpecialistComments?: string;
  SpecialistApprovalDate?: string;
  ManagerDecision?: string;
  ManagerComments?: string;
  ManagerApprovalDate?: string;
  RequesterDecision?: string;
  Status?: string;
  Created?: string;
  Modified?: string;
  [key: string]: unknown;
  Assignee?: { Id: number; Title: string; EMail: string };
}

export default class MccServiceActionsWebPart extends BaseClientSideWebPart<IMccServiceActionsWebPartProps> {
  private sp: SPFI;
  private currentUser!: splist.IAssignee;
  private assignees: splist.IAssignee[] = [];
  private isViewMode = false;

  public async render(): Promise<void> {
    this.domElement.innerHTML = `
    <div id="dxDataGridContainer"></div>`;
    await this._initGrid();
  }

  /** Claim current item to current user: updates form + (optionally) the list item immediately. */

  private getperformanceRecognitions = (
    sp: SPFI
  ): DevExpress.data.DataSource<MccRequestItem, number> => {
    const dataSource = new DevExpress.data.DataSource({
      loadMode: "raw",
      key: "Id",
      load: async (): Promise<MccRequestItem[]> => {
        const raw = await splist.loadMccItems(
          this.sp,
          this.TARGET_GROUP_TITLES
        );
        console.log("Loaded MCC Items:", raw);
        // keep your existing mapping (DateRange/ProposedDateRange normalization)
        return (raw as MccRequestItem[]).map((item) => ({
          ...item,
          DateRange: [
            item.StartDate ? splist.toLocalDateOnly(item.StartDate) : undefined,
            item.EndDate ? splist.toLocalDateOnly(item.EndDate) : undefined,
          ],
          ProposedDateRange: [
            item.ProposedStartDate
              ? splist.toLocalDateOnly(item.ProposedStartDate)
              : undefined,
            item.ProposedEndDate
              ? splist.toLocalDateOnly(item.ProposedEndDate)
              : undefined,
          ],
          // AssigneeId: item.AssigneeId ? item.AssigneeId : null,
          SpecialistName: item.SpecialistName ? item.SpecialistName : "",
          SpecialistEmail: item.SpecialistEmail ? item.SpecialistEmail : "",
        }));
        // const items = await this.sp.web.lists.getByTitle('MCC_Requests').items();
        // const typedItems = items as MccRequestItem[];
        // return typedItems.map((item) => ({
        //   ...item,
        //   DateRange: [
        //     item.StartDate ? this.toLocalDateOnly(item.StartDate) : undefined,
        //     item.EndDate ? this.toLocalDateOnly(item.EndDate) : undefined
        //   ],
        //   ProposedDateRange: [
        //     item.ProposedStartDate ? this.toLocalDateOnly(item.ProposedStartDate) : undefined,
        //     item.ProposedEndDate ? this.toLocalDateOnly(item.ProposedEndDate) : undefined
        //   ],
        // }));
      },
      update: async (key: number, values: Partial<MccRequestItem>) => {
        return sp.web.lists
          .getByTitle("MCC_Requests")
          .items.getById(key)
          .update(values);
      },
    });

    return dataSource as DevExpress.data.DataSource<MccRequestItem, number>;
  };

  private TARGET_GROUP_TITLES = [
    "Corporate Communication Section",
    "Creative Design Section",
    "Events & Exhibition Section",
    "Marketing Unit",
  ];

  //titles of the target groups
  private Manager_GROUP_TITLES = [
    "Corporate Communication Section Manager",
    "Creative Design Section Manager",
    "Events & Exhibition Section Manager",
    "Marketing Unit Manager",
  ];

  // private async isCreatedByCurrentUser(sp: SPFI, currentItemId: number): Promise<boolean> {
  //   const me = await sp.web.currentUser();       // has Id/Title/Email
  //   return me.Id === currentItemId;
  // }

  private async _initGrid(): Promise<void> {
    let currentItemId = 0;
    const sp = spfi().using(SPFx(this.context));

    // const myId = (await this.sp.web.currentUser()).Id;
    const isManager = await splist.isUserInManagersGroup(
      sp,
      this.Manager_GROUP_TITLES
    );
    this.currentUser = await splist.loadCurrentUser(sp);
    const sectionGroup = await splist.getUserGroupIfExists(
      sp,
      this.TARGET_GROUP_TITLES
    );
    this.assignees = await splist.loadAssigneesFromGroup(
      sectionGroup ? sectionGroup : "",
      sp
    );

    $("#dxDataGridContainer").dxDataGrid({
      dataSource: this.getperformanceRecognitions(sp),
      keyExpr: "Id",
      showBorders: true,
      // focusedRowEnabled: true,
      allowColumnResizing: true,
      columnResizingMode: "nextColumn",
      columnAutoWidth: true,
      wordWrapEnabled: true,
      noDataText: "No pending requests found",
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
      // onInitialized: (btn: any) => {
      //   const $formEl = $(btn.element).closest(".dx-form");
      //   const form = ($formEl as any).data("dxForm") as DevExpress.ui.dxForm;
      //   const fd = form?.option("formData") || {};
      //   const alreadyMine = fd.AssigneeId === this.currentUser.id;
      //   btn.component.option("disabled", alreadyMine || fd.Status === "Closed");
      // },
      onEditorPreparing: (e: GridEditorPreparingEvent) => {
        if (
          e.parentType === "dataRow" &&
          e.row &&
          e.row.isEditing &&
          this.isViewMode
        ) {
          e.editorOptions.readOnly = this.isViewMode;
          e.editorOptions.focusStateEnabled = !this.isViewMode; // UX: no focus ring
          e.editorOptions.hoverStateEnabled = !this.isViewMode; // UX: no hover visual
          // If you use custom templates, also guard them to render as read-only
        }

        if (
          e.dataField === "SpecialistDecision" &&
          e.parentType === "dataRow"
        ) {
          // e.editorOptions = e.editorOptions || {};
          const defaultValueChangeHandler = e.editorOptions.onValueChanged;
          e.editorOptions.onValueChanged = (args: ISimpleValueChangedEvent) => {
            const form = $("#requestForm").dxForm("instance");

            // Let DevExtreme do its built-in update first
            defaultValueChangeHandler?.(args);

            const newValue = typeof args.value === "string" ? args.value : "";
            const isConditional = newValue === "Conditional";
            const previousValue =
              typeof args.previousValue === "string" ? args.previousValue : "";
            const wasConditional = previousValue === "Conditional";

            // Toggle visibility & requirement
            form.itemOption(
              "SpecialistDecisionGroup.ProposedDateRange",
              "visible",
              isConditional
            );
            form.itemOption(
              "SpecialistDecisionGroup.ProposedDateRange",
              "isRequired",
              isConditional
            );
            form.itemOption("RequesterDecisionGroup", "visible", isConditional);

            // Only clear the date range when switching AWAY from Conditional
            if (!isConditional && wasConditional) {
              form.updateData("ProposedDateRange", [undefined, undefined]); // use dataField (no group prefix)
              form.getEditor("ProposedDateRange")?.reset(); // use dataField (no group prefix)
            }
          };
        }

        // if (e.dataField === "AssigneeId" && e.parentType === "dataRow") {
        //   // Disable Assignee select if already assigned to someone
        //   const currentAssigneeId = e.value;

        //   e.dataField. = currentAssigneeId;
        // }
      },
      async onEditingStart(e) {
        currentItemId = e.key;
        // const authorId = e.data.AuthorId;
        // const myId = await sp.web.currentUser();
        // this.isCreatedByCurrentUser =  myId.Id === e.data.AuthorId;
        const form = $("#requestForm").dxForm("instance");
        // const readOnly = e.data.AuthorId === myId.Id;
        // form.itemOption("SpecialistDecisionGroup.SpecialistDecision", "editorOptions.readOnly", readOnly);
        // form.itemOption("SpecialistDecisionGroup.ProposedDateRange", "editorOptions.readOnly", readOnly);
        // form.itemOption("SpecialistDecisionGroup.SpecialistComments", "editorOptions.readOnly", readOnly);
        // form.itemOption("RequesterDecisionGroup.RequesterDecision", "editorOptions.readOnly", !readOnly);

        const isConditional = e.data.SpecialistDecision === "Conditional";
        // Toggle visibility & requirement
        // form.itemOption("SpecialistDecisionGroup.ProposedDateRange", "visible", isConditional);
        form.itemOption(
          "SpecialistDecisionGroup.ProposedDateRange",
          "visible",
          isConditional
        );
        form.itemOption(
          "SpecialistDecisionGroup.ProposedDateRange",
          "isRequired",
          isConditional
        );
        form.itemOption("RequesterDecisionGroup", "visible", isConditional);

        // Only clear the date range when switching AWAY from Conditional
        if (!isConditional) {
          form.updateData("ProposedDateRange", [undefined, undefined]); // use dataField (no group prefix)
          form.getEditor("ProposedDateRange")?.reset(); // use dataField (no group prefix)
        }

        // Ensure the form has helper fields in its formData (for first open)
        // e.data.SpecialistName = e.data.SpecialistName || "";
        // e.data.SpecialistEmail = e.data.SpecialistEmail || "";
      },
      onRowUpdating: (e: DevExpress.ui.dxDataGrid.RowUpdatingEvent) => {
        if ("SpecialistDecision" in e.newData) {
          e.newData.SpecialistApprovalDate = new Date().toISOString();
          if (e.newData.SpecialistDecision === "Reject") {
            e.newData.Status = "Specialist Rejected";
          } else if (e.newData.SpecialistDecision === "Conditional") {
            e.newData.Status = "Pending Requester";
          } else if (e.newData.SpecialistDecision === "Approve") {
            e.newData.Status = "Pending Manager";
          }
        }

        // if ("RequesterDecision" in e.newData) {
        //   if (e.newData.RequesterDecision === 'Decline') {
        //     e.newData.Status = 'Requester Declined';
        //   } else if (e.newData.RequesterDecision === 'Agree') {
        //     e.newData.Status = 'Pending Manager';
        //   }
        // }

        if ("ManagerDecision" in e.newData) {
          e.newData.ManagerApprovalDate = new Date().toISOString();
          if (e.newData.ManagerDecision === "Reject") {
            e.newData.Status = "Manager Rejected";
          } else if (e.newData.ManagerDecision === "Rework") {
            e.newData.Status = "Amended";
          } else if (e.newData.ManagerDecision === "Approve") {
            e.newData.Status = "Completed";
          }
        }

        if ("ProposedDateRange" in e.newData) {
          const [proposedStartDate, proposedEndDate] = e.newData
            .ProposedDateRange ?? [undefined, undefined];
          const normalizedProposedStartDate =
            splist.toSPDateOnly(proposedStartDate);
          const normalizedProposedEndDate =
            splist.toSPDateOnly(proposedEndDate);
          if (normalizedProposedStartDate !== undefined) {
            e.newData.ProposedStartDate = normalizedProposedStartDate;
          } else {
            delete e.newData.ProposedStartDate;
          }

          if (normalizedProposedEndDate !== undefined) {
            e.newData.ProposedEndDate = normalizedProposedEndDate;
          } else {
            delete e.newData.ProposedEndDate;
          }
          delete e.newData.ProposedDateRange;
        }
      },
      editing: {
        mode: "popup",
        allowUpdating: true,
        allowDeleting: false,
        allowAdding: false,
        confirmDelete: true,
        texts: { editRow: "Claim" },
        popup: {
          title: "MCC Service Request",
          showTitle: true,
          height: 700,
          width: 1000,
          resizeEnabled: true,
        },
        form: {
          elementAttr: {
            id: "requestForm",
          },
          items: [
            {
              itemType: "group",
              colCount: 2,
              colSpan: 2,
              caption: "Employee Details",
              items: [
                {
                  dataField: "EmployeeName",
                  caption: "Employee Name",
                  editorOptions: {
                    readOnly: true,
                  },
                },
                {
                  dataField: "JobTitle",
                  caption: "Job Title",
                  editorOptions: {
                    readOnly: true,
                  },
                },
                {
                  dataField: "Department",
                  caption: "Department",
                  editorOptions: {
                    readOnly: true,
                  },
                },
              ],
            },
            {
              itemType: "group",
              colCount: 2,
              colSpan: 2,
              caption: "Request Details",
              items: [
                {
                  dataField: "Section",
                  caption: "Section",
                  editorOptions: {
                    readOnly: true,
                  },
                },
                {
                  dataField: "Service",
                  caption: "Service",
                  editorOptions: {
                    readOnly: true,
                  },
                },
                {
                  dataField: "Title",
                  caption: "Title",
                  editorOptions: {
                    readOnly: true,
                  },
                },
                {
                  dataField: "Details",
                  caption: "Details",
                  editorType: "dxTextArea",
                  editorOptions: {
                    readOnly: true,
                  },
                },
                {
                  dataField: "DateRange",
                  label: { text: "Period" },
                  editorType: "dxDateRangeBox",
                  editorOptions: {
                    type: "date",
                    displayFormat: "yyyy-MM-dd",
                    readOnly: true,
                  },
                },
                {
                  name: "fileList",
                  // visible: Id !== 0,
                  colSpan: 2,
                  template: async (
                    _data: unknown,
                    itemElement:
                      | string
                      | JQuery<HTMLElement>
                      | JQuery.TypeOrArray<Element | DocumentFragment>
                  ) => {
                    $("<div/>")
                      .dxList({
                        dataSource: currentItemId
                          ? await splist.getAttachedFiles(sp, currentItemId)
                          : [], //attachedfiles,
                        height: 100,
                        allowItemDeleting: false,
                        itemDeleteMode: "toggle",
                        noDataText: "",
                        onContentReady(event: ListContentReadyEvent) {
                          if (
                            event.component.getDataSource().items().length === 0
                          ) {
                            event.element.css("display", "none");
                          }
                        },
                        elementAttr: {
                          id: "fileList",
                        },
                        itemTemplate(attachment: IAttachmentInfo) {
                          return `<a href="${encodeURI(
                            attachment.ServerRelativeUrl
                          )}" target="_blank">${attachment.FileName}</a>`;
                        },
                      })
                      .appendTo(itemElement);
                  },
                },
              ],
            },
            {
              itemType: "group",
              caption: "Assignment",
              colCount: 2,
              colSpan: 2,
              name: "AssignmentGroup",
              items: [
                // Assignee Select
                // {
                //   dataField: "AssigneeId",
                //   label: { text: "Assignee" },
                //   editorType: "dxSelectBox",
                //   editorOptions: {
                //     elementAttr: {
                //       id: "selectBoxContainer"
                //     },
                //     // bind group members
                //     dataSource: this.assignees,
                //     displayExpr: "title",
                //     valueExpr: "id",
                //     searchEnabled: true,
                //     showClearButton: true,
                //     // display template to show email under the name (optional)
                //     itemTemplate: (itemData: splist.IAssignee, _: any, element: any) => {
                //       element.append(
                //         `<div class="dx-item">
                //           <div>${itemData.Title}</div>
                //           <div style="font-size:12px;opacity:.7">${itemData.Email}</div>
                //         </div>`
                //       );
                //     }
                //   },

                // },

                // // Claim button RIGHT NEXT to the select
                // {
                //   itemType: "button",
                //   horizontalAlignment: "left",
                //   buttonOptions: {
                //     text: "Claim",
                //     stylingMode: "contained",
                //     type: "default",
                //     onClick: async (btnEvt: any) => {
                //       // Access the current Form instance from the button
                //       // 1) Find the closest dxForm widget instance:
                //       // const $formEl = $(btnEvt.element).closest(".dx-form");
                //       // const form = ($formEl as any).data("dxForm") as DevExpress.ui.dxForm;
                //       // 2) The current row (if needed) can be fetched from formData:
                //       // const fd = form.option("formData") || {};
                //       // const currentItemId = fd.Id; // assuming 'Id' is in your formData
                //       const user = await sp.web.currentUser();
                //       const selectBox = $("#selectBoxContainer").dxSelectBox("instance");
                //       selectBox.option("value", user.Email);
                //       // await this.claimCurrent(form, this.currentUser);
                //     }
                //   }
                // },
                {
                  dataField: "SpecialistEmail",
                  label: { text: "Assignee" },
                  editorType: "dxSelectBox",
                  editorOptions: {
                    dataSource: this.assignees, // IAssignee[]
                    displayExpr: "Title",
                    valueExpr: "Email",
                    searchEnabled: true,
                    showClearButton: true,
                    placeholder: "Select assignee...",
                    elementAttr: {
                      id: "selectBoxContainer",
                    },
                    itemTemplate: (
                      item: splist.IAssignee,
                      _index: number,
                      element: DxElement
                    ) => {
                      $(element).append(
                        `<div>
                            <div>${item.Title}</div>
                            <div style="font-size:12px;opacity:.7">${item.Email}</div>
                          </div>`
                      );
                    },
                  },
                },
                // Claim button RIGHT NEXT to the select
                {
                  itemType: "button",
                  horizontalAlignment: "left",
                  buttonOptions: {
                    text: "Claim",
                    stylingMode: "contained",
                    type: "default",
                    elementAttr: {
                      id: "claimButton",
                    },
                    onClick: async () => {
                      const selectBox = $("#selectBoxContainer").dxSelectBox(
                        "instance"
                      );
                      selectBox.option("value", this.currentUser.Email);
                    },
                  },
                },
              ],
            },
            {
              itemType: "group",
              visible: true,
              colCount: 2,
              colSpan: 2,
              caption: "Specialist Decision",
              name: "SpecialistDecisionGroup",
              items: [
                {
                  dataField: "SpecialistDecision",
                  label: { text: "Decision" },
                  editorType: "dxRadioGroup",
                  editorOptions: {
                    items: [
                      { text: "Approve", value: "Approve" },
                      { text: "Conditional", value: "Conditional" },
                      { text: "Reject", value: "Reject" },
                    ],
                    valueExpr: "value",
                    displayExpr: "text",
                    layout: "horizontal",
                  },
                  colSpan: 1,
                },
                {
                  dataField: "ProposedDateRange",
                  label: { text: "Proposed Period" },
                  editorType: "dxDateRangeBox",
                  visible: false,
                  editorOptions: {
                    type: "date",
                    openOnFieldClick: true,
                    displayFormat: "yyyy-MM-dd",
                  },
                  colSpan: 1,
                },
                {
                  dataField: "SpecialistComments",
                  label: { text: "Comments" },
                  editorType: "dxTextArea",
                  colSpan: 2,
                },
              ],
            },
            {
              itemType: "group",
              visible: false,
              colCount: 2,
              colSpan: 2,
              caption: "Requester Decision",
              name: "RequesterDecisionGroup",
              items: [
                {
                  dataField: "RequesterDecision",
                  label: { text: "Decision" },
                  editorType: "dxRadioGroup",
                  colSpan: 2,
                  editorOptions: {
                    items: [
                      { text: "Agree", value: "Agree" },
                      { text: "Decline", value: "Decline" },
                    ],
                    valueExpr: "value",
                    displayExpr: "text",
                    layout: "horizontal",
                    readOnly: true,
                  },
                },
              ],
            },
            {
              itemType: "group",
              visible: true,
              colCount: 2,
              colSpan: 2,
              caption: "Manager Decision",
              items: [
                {
                  dataField: "ManagerDecision",
                  label: { text: "Decision" },
                  editorType: "dxRadioGroup",
                  colSpan: 2,
                  editorOptions: {
                    items: [
                      { text: "Approve", value: "Approve" },
                      { text: "Reject", value: "Reject" },
                      { text: "Rework", value: "Rework" },
                    ],
                    valueExpr: "value",
                    displayExpr: "text",
                    layout: "horizontal",
                    readOnly: !isManager,
                  },
                },
                {
                  dataField: "ManagerComments",
                  label: { text: "Comments" },
                  editorType: "dxTextArea",
                  colSpan: 2,
                  editorOptions: {
                    readOnly: !isManager,
                  },
                },
              ],
            },
          ],
        },
      },

      columns: [
        {
          dataField: "Id",
          caption: "Id",
        },
        {
          dataField: "EmployeeName",
          caption: "Employee Name",
        },
        {
          dataField: "JobTitle",
          caption: "Job Title",
          visible: false,
        },
        {
          dataField: "Department",
          caption: "Department",
          visible: false,
        },
        {
          dataField: "Section",
          caption: "Section",
        },
        {
          dataField: "Service",
          caption: "Service",
        },
        {
          dataField: "Title",
          caption: "Title",
        },
        {
          dataField: "Details",
          caption: "Details",
          visible: false,
          formItem: {
            editorType: "dxTextArea",
          },
        },
        {
          dataField: "Status",
          caption: "Status",
        },
        {
          dataField: "SpecialistApprovalDate",
          caption: "Specialist Approve/Reject Date",
          dataType: "date",
          format: "yyyy-MM-dd",
        },
        {
          dataField: "ManagerApprovalDate",
          caption: "Manager Approve/Reject Date",
          dataType: "date",
          format: "yyyy-MM-dd",
        },
        {
          dataField: "DateRange",
          caption: "Date Range",
          visible: false,
        },
        {
          dataField: "ProposedDateRange",
          visible: false,
        },
        {
          dataField: "SpecialistComments",
          visible: false,
        },
        {
          dataField: "SpecialistDecision",
          visible: false,
        },
        {
          dataField: "ManagerComments",
          visible: false,
        },
        {
          dataField: "ManagerDecision",
          visible: false,
        },
        {
          dataField: "RequesterDecision",
          visible: false,
        },
        {
          dataField: "SpecialistEmail",
          visible: false,
        },
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
        {
          type: "buttons",
          buttons: [
            {
              text: "Claim",
              // icon: "edit",       // or "user" if you prefer
              hint: "Claim",
              onClick: (e: GridColumnButtonClickEvent) => {
                if (!e.row) {
                  return;
                }
                this.isViewMode = false;
                e.component.editRow(e.row.rowIndex);
              },
            },
            {
              text: "View",
              // icon: "search",
              hint: "View details (read-only)",
              onClick: (e: GridColumnButtonClickEvent) => {
                if (!e.row) {
                  return;
                }
                this.isViewMode = true;
                e.component.editRow(e.row.rowIndex);
                $("#claimButton").hide();
                $(".dx-button[aria-label='Save']").hide();
              },
            },
          ],
        },
      ],
      summary: {
        totalItems: [
          {
            column: "EmployeeName",
            summaryType: "count",
          },
        ],
      },
    });
  }

  protected async onInit(): Promise<void> {
    this.sp = spfi().using(SPFx(this.context));
    SPComponentLoader.loadCss(
      "https://cdn3.devexpress.com/jslib/23.2.4/css/dx.light.css"
    );
    await splist.loadCurrentUser(this.sp);
    return super.onInit();
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
              ],
            },
          ],
        },
      ],
    };
  }
}
