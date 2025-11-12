// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../node_modules/@types/devextreme/dx.all.d.ts" />
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as strings from 'MccServiceActionsWebPartStrings';
import "devextreme";
import * as $ from "jquery";
import { SPComponentLoader } from '@microsoft/sp-loader';
import { spfi, SPFI } from '@pnp/sp';
import { SPFx } from '@pnp/sp/behaviors/spfx';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/attachments';
import '@pnp/sp/profiles';
import type { IAttachmentInfo } from '@pnp/sp/attachments';
import "@pnp/sp/site-users/web";
import "@pnp/sp/site-groups/web";

export interface IMccRequesterViewWebPartProps {
  description: string;
}

type ListContentReadyEvent = DevExpress.ui.dxList.ContentReadyEvent;

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
}

export default class MccRequesterViewWebPart extends BaseClientSideWebPart<IMccRequesterViewWebPartProps> {

  private _sp: SPFI;

  public async render(): Promise<void> {
    this.domElement.innerHTML = `
    <div id="dxDataGridContainer"></div>`;
    await this._initGrid();
  }

  private getperformanceRecognitions = (): DevExpress.data.DataSource<MccRequestItem, number> => {
    const dataSource = new DevExpress.data.DataSource({
      loadMode: "raw",
      key: "Id",
      load: async (): Promise<MccRequestItem[]> => {
        // const raw = await this.loadMccItems(this._sp);
        // console.log('Loaded MCC Items:', raw);
        // // keep your existing mapping (DateRange/ProposedDateRange normalization)
        // return (raw as MccRequestItem[]).map((item) => ({
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
        const me = await this._sp.web.currentUser();       // has Id/Title/Email
        const myId = (me as any).Id ?? (me as any).ID;
        const items = (await this._sp.web.lists.getByTitle('MCC_Requests').items()).filter(i => i.AuthorId === myId);
        const typedItems = items as MccRequestItem[];
        return typedItems.map((item) => ({
          ...item,
          DateRange: [
            item.StartDate ? this.toLocalDateOnly(item.StartDate) : undefined,
            item.EndDate ? this.toLocalDateOnly(item.EndDate) : undefined
          ],
          ProposedDateRange: [
            item.ProposedStartDate ? this.toLocalDateOnly(item.ProposedStartDate) : undefined,
            item.ProposedEndDate ? this.toLocalDateOnly(item.ProposedEndDate) : undefined
          ],
        }));
      },
      update: async (key: number, values: Partial<MccRequestItem>) => {
        return this._sp.web.lists.getByTitle('MCC_Requests').items.getById(key).update(values);
      },
    });

    return dataSource as DevExpress.data.DataSource<MccRequestItem, number>;
  };

  // private TARGET_GROUP_TITLES = ["Corporate Communication Section", "Creative Design Section", "Events & Exhibition Section", "Marketing Unit"];

  // private async getUserGroupIfExists(sp: SPFI): Promise<string | null> {
  //   // Get all site groups the current user belongs to
  //   const userGroups = await sp.web.currentUser.groups.select("Id", "Title")();

  //   // Find if the user is in one of the target groups
  //   const match = userGroups.find(g =>
  //     this.TARGET_GROUP_TITLES.some(t => g.Title.toLowerCase() === t.toLowerCase())
  //   );

  //   // Return the matching group name or null
  //   return match ? match.Title : null;
  // }

  //titles of the target groups
  // private Manager_GROUP_TITLES = ["Corporate Communication Section Manager", "Creative Design Section Manager", "Events & Exhibition Section Manager", "Marketing Unit Manager"];

  // private async isUserInManagersGroup(sp: SPFI): Promise<boolean> {
  //   // current user’s site groups
  //   const groups = await sp.web.currentUser.groups();
  //   if (!groups?.length) return false;

  //   // fallback: check by Title (case-insensitive)
  //   const titleSet = new Set(this.Manager_GROUP_TITLES.map(t => t.toLowerCase()));
  //   return groups.some(g => titleSet.has(g.Title?.toLowerCase()));
  // }

  // private async isCreatedByCurrentUser(sp: SPFI, currentItemId: number): Promise<boolean> {
  //   const me = await sp.web.currentUser();       // has Id/Title/Email
  //   return me.Id === currentItemId;
  // }

  // private async loadMccItems(sp: SPFI): Promise<any[]> {
  //   const me = await sp.web.currentUser();       // has Id/Title/Email
  //   const myId = (me as any).Id ?? (me as any).ID;

  //     // const inAny = await this.isUserInAnyTargetGroup(sp);
  //     const userGroup = await this.getUserGroupIfExists(sp);

  //   const list = sp.web.lists.getByTitle("MCC_Requests").items;

  //   if (userGroup) {
  //     // Member of one of the groups → load the related items
  //     return await list
  //       .filter(i => i.text('Section').equals(userGroup).or().number('AuthorId').equals(myId))();
  //       // .filter(i => i.text('Section').equals(userGroup))();
  //   } else {
  //     // Not a member → only items I created (AuthorId == myId)
  //     return await list
  //       .filter(i => i.number('AuthorId').equals(myId))();
  //   }
  // }


  private getAttachedFiles = async (Id: number): Promise<IAttachmentInfo[]> => {
    return this._sp.web.lists.getByTitle('MCC_Requests').items.getById(Id).attachmentFiles();
  }

  private async _initGrid(): Promise<void> {
    let currentItemId = 0;
    const sp = spfi().using(SPFx(this.context));
    
    // const myId = (await this._sp.web.currentUser()).Id;      
    // const isManager = await this.isUserInManagersGroup(this._sp)

    $('#dxDataGridContainer').dxDataGrid({
        dataSource: this.getperformanceRecognitions(),
        keyExpr: "ID",
        showBorders: true,
        // focusedRowEnabled: true,
        allowColumnResizing: true,
        columnResizingMode: 'nextColumn',
        columnAutoWidth: true,
        wordWrapEnabled: true,
        noDataText: 'No pending requests found',
        searchPanel:{
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
            enabled: true
          },
        },
        filterRow: {
          visible: true
        },
        onEditorPreparing: (e: any) => {
          if (e.dataField === "SpecialistDecision" && e.parentType === "dataRow") {
            // e.editorOptions = e.editorOptions || {};
            const defaultValueChangeHandler = e.editorOptions.onValueChanged;
            e.editorOptions.onValueChanged = (args: any) => {
              const form = $('#requestForm').dxForm('instance');

              // Let DevExtreme do its built-in update first
              defaultValueChangeHandler?.(args);

              const isConditional = args.value === "Conditional";
              const wasConditional = args.previousValue === "Conditional";

              // Toggle visibility & requirement
              form.itemOption("SpecialistDecisionGroup.ProposedDateRange", "visible", isConditional);
              form.itemOption("SpecialistDecisionGroup.ProposedDateRange", "isRequired", isConditional);
              form.itemOption("RequesterDecisionGroup", "visible", isConditional);

              // Only clear the date range when switching AWAY from Conditional
              if (!isConditional && wasConditional) {
                form.updateData("ProposedDateRange", [null, null]); // use dataField (no group prefix)
                form.getEditor("ProposedDateRange")?.reset();       // use dataField (no group prefix)
              }
           }
          }
        },
        async onEditingStart(e) {
          currentItemId = e.key;
          // const authorId = e.data.AuthorId;
          const myId = await sp.web.currentUser();
          this.isCreatedByCurrentUser =  myId.Id === e.data.AuthorId;
          const form = $('#requestForm').dxForm('instance');
          // const readOnly = e.data.AuthorId === myId.Id;
          // form.itemOption("SpecialistDecisionGroup.SpecialistDecision", "editorOptions.readOnly", readOnly);
          // form.itemOption("SpecialistDecisionGroup.ProposedDateRange", "editorOptions.readOnly", readOnly);
          // form.itemOption("SpecialistDecisionGroup.SpecialistComments", "editorOptions.readOnly", readOnly);
          // form.itemOption("RequesterDecisionGroup.RequesterDecision", "editorOptions.readOnly", !readOnly);

          const isConditional = e.data.SpecialistDecision === "Conditional";
          // Toggle visibility & requirement
          form.itemOption("SpecialistDecisionGroup.ProposedDateRange", "visible", isConditional);
          form.itemOption("SpecialistDecisionGroup.ProposedDateRange", "isRequired", isConditional);
          form.itemOption("RequesterDecisionGroup", "visible", isConditional);

          // Only clear the date range when switching AWAY from Conditional
          if (!isConditional) {
            form.updateData("ProposedDateRange", [null, null]); // use dataField (no group prefix)
            form.getEditor("ProposedDateRange")?.reset();       // use dataField (no group prefix)
          }
        },
        onRowUpdating: (e) => {
          
          // if ("SpecialistDecision" in e.newData) {
          //   e.newData.SpecialistApprovalDate = new Date().toISOString();
          //   if (e.newData.SpecialistDecision === 'Reject') {
          //     e.newData.Status = 'Specialist Rejected';
          //   } else if (e.newData.SpecialistDecision === 'Conditional') {
          //     e.newData.Status = 'Pending Requester';
          //   } else if (e.newData.SpecialistDecision === 'Approve'){
          //     e.newData.Status = 'Pending Manager';
          //   }
          // }

          if ("RequesterDecision" in e.newData) {
            if (e.newData.RequesterDecision === 'Decline') {
              e.newData.Status = 'Requester Declined';
            } else if (e.newData.RequesterDecision === 'Agree') {
              e.newData.Status = 'Pending Manager';
            }
          }

          // if ("ManagerDecision" in e.newData) {
          //   e.newData.ManagerApprovalDate = new Date().toISOString();
          //   if (e.newData.ManagerDecision === 'Reject') {
          //     e.newData.Status = 'Manager Rejected';
          //   } else if (e.newData.ManagerDecision === 'Rework') {
          //     e.newData.Status = 'Amended';
          //   } else if (e.newData.ManagerDecision === 'Approve'){
          //     e.newData.Status = 'Completed';
          //   } 
          // }

          // if ("ProposedDateRange" in e.newData) {
          //   const [proposedStartDate, proposedEndDate] = e.newData.ProposedDateRange ?? [undefined, undefined];
          //   const normalizedProposedStartDate = this.toSPDateOnly(proposedStartDate);
          //   const normalizedProposedEndDate = this.toSPDateOnly(proposedEndDate);
          //   if (normalizedProposedStartDate !== undefined) {
          //     e.newData.ProposedStartDate = normalizedProposedStartDate;
          //   } else {
          //     delete e.newData.ProposedStartDate;
          //   }

          //   if (normalizedProposedEndDate !== undefined) {
          //     e.newData.ProposedEndDate = normalizedProposedEndDate;
          //   } else {
          //     delete e.newData.ProposedEndDate;
          //   }
          //   delete e.newData.ProposedDateRange;
          // }
        },
        editing: {
          mode: 'popup',
          allowUpdating: true,
          allowDeleting: false,
          allowAdding: false,
          confirmDelete: true,
          popup: {
            title: "MCC Service Request",
            showTitle: true,
            height: 700,
            width: 1000,
            resizeEnabled: true
          },
          form: {
            elementAttr: 
            {
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
                      readOnly: true
                    }
                  },
                  {
                    dataField: "JobTitle",
                    caption: "Job Title",
                    editorOptions: {
                      readOnly: true
                    }
                  },
                  {
                    dataField: "Department",
                    caption: "Department",
                    editorOptions: {
                      readOnly: true
                    }
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
                    dataField: 'Section',
                    caption: 'Section',
                    editorOptions: {
                      readOnly: true
                    }
                  },
                   {
                    dataField: 'Service',
                    caption: 'Service',
                    editorOptions: {
                      readOnly: true
                    }
                  },
                   {
                    dataField: 'Title',
                    caption: 'Title',
                    editorOptions: {
                      readOnly: true
                    }
                  },
                  {
                    dataField: "Details",
                    caption: 'Details',
                    editorType: 'dxTextArea',
                    editorOptions: {
                      readOnly: true
                    }
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
                      itemElement: string | JQuery<HTMLElement> | JQuery.TypeOrArray<Element | DocumentFragment>) => {
                      $("<div/>")
                        .dxList({
                          dataSource: currentItemId ? await this.getAttachedFiles(currentItemId) : [], //attachedfiles,
                          height: 100,
                          allowItemDeleting: false,
                          itemDeleteMode: "toggle",
                          noDataText: "",
                          onContentReady(event: ListContentReadyEvent) {
                            if (event.component.getDataSource().items().length === 0) {
                              event.element.css("display", "none");
                            }
                          },
                          elementAttr: {
                            id: "fileList",
                          },
                          itemTemplate(attachment: IAttachmentInfo) {
                            return `<a href="${encodeURI(attachment.ServerRelativeUrl)}" target="_blank">${attachment.FileName}</a>`;
                          },
                        })
                        .appendTo(itemElement);
                    },
                  },
                ]
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
                        { text: "Reject", value: "Reject" }
                      ],
                      valueExpr: "value",
                      displayExpr: "text",
                      layout: "horizontal",
                      readOnly: true,
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
                      readOnly: true,
                    },
                    colSpan: 1,
                  },
                  {
                    dataField: "SpecialistComments",
                    label: { text: "Comments" },
                    editorType: 'dxTextArea',
                    colSpan: 2,
                    editorOptions: {
                      readOnly: true,
                    }
                  },
                ]
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
                    dataField: 'RequesterDecision',
                    label: { text: "Decision" },
                    editorType: "dxRadioGroup",
                    colSpan: 2,
                    editorOptions: {
                      items: [
                        { text: "Agree", value: "Agree" },
                        { text: "Decline", value: "Decline" }
                      ],
                      valueExpr: "value",
                      displayExpr: "text",
                      layout: "horizontal",
                    }
                  },
                ]
              },
              {
                itemType: "group",
                visible: true,
                colCount: 2,
                colSpan: 2,
                caption: "Manager Decision",
                items: [
                  {
                    dataField: 'ManagerDecision',
                    label: { text: "Decision" },
                    editorType: "dxRadioGroup",
                    colSpan: 2,
                    editorOptions: {
                      items: [
                        { text: "Approve", value: "Approve" },
                        { text: "Reject", value: "Reject" },
                        { text: "Rework", value: "Rework" }
                      ],
                      valueExpr: "value",
                      displayExpr: "text",
                      layout: "horizontal",
                      readOnly: true,
                    }
                  },
                  {
                    dataField: 'ManagerComments',
                    label: { text: "Comments" },
                    editorType: 'dxTextArea',
                    colSpan: 2,
                    editorOptions: {
                      readOnly: true,
                    }
                  }
                ]
              }
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
              editorType: 'dxTextArea'
            }
          },
          {
            dataField: "Status",
            caption: 'Status',
            editorOptions: {
              readOnly: true,
            },
          },
          {
            dataField: 'SpecialistApprovalDate',
            caption: 'Specialist Approve/Reject Date',
            dataType: "date",
            format: 'yyyy-MM-dd',
            // sortOrder: 'desc',
            editorOptions: {
              readOnly: true,
            },
          },
          {
            dataField: 'ManagerApprovalDate',
            caption: 'Manager Approve/Reject Date',
            dataType: "date",
            format: 'yyyy-MM-dd',
            // sortOrder: 'desc',
            editorOptions: {
              readOnly: true,
            },
          },
          {
            dataField: "DateRange",
            caption: 'Date Range',
            visible: false
          },
          {
            dataField: "ProposedDateRange",
            visible: false
          },
          {
            dataField: "SpecialistComments",
            visible: false
          },
          {
            dataField: "SpecialistDecision",
            visible: false,
          },
          {
            dataField: "ManagerComments",
            visible: false
          },
          {
            dataField: "ManagerDecision",
            visible: false
          },
          {
            dataField: "RequesterDecision",
            visible: false
          },
          {
            dataField: "Created",
            caption: 'Created',
            dataType: "date",
            format: 'yyyy-MM-dd'
          },
          {
            dataField: "Modified",
            caption: 'Modified',
            dataType: "date",
            format: 'yyyy-MM-dd'
          },
          
        ],
        summary: {
          totalItems: [{
            column: 'EmployeeName',
            summaryType: 'count',
          }],
        },
      });
  }

  protected onInit(): Promise<void> {
    this._sp = spfi().using(SPFx(this.context));
        SPComponentLoader.loadCss("https://cdn3.devexpress.com/jslib/23.2.4/css/dx.light.css");
            return super.onInit();
  }


  private toLocalDateOnly(spDate?: string): Date | undefined {
    if (!spDate) return undefined;
    const d = new Date(spDate);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }

  // private toSPDateOnly(d?: Date): string | undefined {
  //   if (!d) return undefined;
  //   return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  //     .toISOString()
  //     .split("T")[0]; // e.g. "2025-11-04"
  // }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
