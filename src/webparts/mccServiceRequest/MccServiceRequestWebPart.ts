// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../node_modules/@types/devextreme/dx.all.d.ts" />
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
// import type { IReadonlyTheme } from '@microsoft/sp-component-base';
// import { escape } from '@microsoft/sp-lodash-subset';
import "devextreme";
import * as $ from "jquery";
import styles from './MccServiceRequestWebPart.module.scss';
import * as strings from 'MccServiceRequestWebPartStrings';
import { SPComponentLoader } from '@microsoft/sp-loader';
import { spfi, SPFI } from '@pnp/sp';
import { SPFx } from '@pnp/sp/behaviors/spfx';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/attachments';
import '@pnp/sp/profiles';
// import { Item } from '@pnp/sp/items';

type SelectBoxValueChangedEvent = DevExpress.ui.dxSelectBox.ValueChangedEvent;
type DateRangeValueChangedEvent = DevExpress.ui.dxDateRangeBox.ValueChangedEvent;
type FileUploaderValueChangedEvent = DevExpress.ui.dxFileUploader.ValueChangedEvent;

interface UserProfileProperty {
  Key: string;
  Value: string;
}

interface ServiceItem {
  Id: number;
  Title: string;
  Service: string;
  [key: string]: unknown;
}

interface ServiceRequestViewModel {
  EmployeeName: string;
  EmployeeEmail: string;
  JobTitle: string;
  Department: string;
  Section: string | undefined;
  Service: string | undefined;
  Title: string;
  Details: string;
  Agree: boolean;
  Files: File[];
  AllSections: ServiceItem[];
  StartDate: Date | undefined;
  EndDate: Date | undefined;
  _serviceReqSeq?: number;
}

const isUserProfileProperty = (prop: unknown): prop is UserProfileProperty => {
  if (!prop || typeof prop !== 'object') {
    return false;
  }

  const candidate = prop as { Key?: unknown; Value?: unknown };
  return typeof candidate.Key === 'string' && typeof candidate.Value === 'string';
};

export interface IMccServiceRequestWebPartProps {
  description: string;
}

export let fileUploadPR: DevExpress.ui.dxFileUploader;

export default class MccServiceRequestWebPart extends BaseClientSideWebPart<IMccServiceRequestWebPartProps> {
  private _sp: SPFI;

  public async render(): Promise<void> {
    this.domElement.innerHTML = `
    <div class="${styles.root}">
    <div class="${styles.container}">
    <div id="dxFormContainer"></div>
    <!--<div class="${styles.note}">* Required fields: Parent, service, Title, and accepting Terms.</div>-->
    </div>
    </div>`;
    await this._initForm();
  }

  private async _initForm(): Promise<void> {
    const sp = this._sp;
    // const props = this.properties;

    // 1) Load profile
    const me = await sp.profiles.myProperties();
    const profile: Record<string, string> = {};
    const userProfileProperties: UserProfileProperty[] = Array.isArray(me.UserProfileProperties)
      ? me.UserProfileProperties.filter(isUserProfileProperty)
      : [];

    userProfileProperties.forEach((property) => {
      profile[property.Key] = property.Value;
    });

    const fullName = me.DisplayName || profile.PreferredName || '';
    const jobTitle = profile['SPS-JobTitle'] || profile.Title || '';
    const department = profile.Department || '';

    // 2) Load parents
    const parentsRaw = await sp.web.lists.getByTitle('MCC_Services').items.select('Id','Title', 'Service').orderBy('Id')();
    const parents = parentsRaw as ServiceItem[];
    const uniqueSections = parents.filter((item, index, self) =>
      self.findIndex(t => t.Title === item.Title) === index
    );
    // ViewModel
    const vm: ServiceRequestViewModel = {
      EmployeeName: fullName,
      EmployeeEmail: me.Email || '',
      JobTitle: jobTitle,
      Department: department,
      Section: undefined,
      Service: undefined,
      Title: '',
      Details: '',
      Agree: false,
      Files: [],
      AllSections: uniqueSections,
      StartDate: undefined,
      EndDate: undefined,
    };

      $('#dxFormContainer').dxForm({
        formData: vm,
        labelMode: 'floating',
        colCount: 2,
        minColWidth: 300,
        items: [
          { dataField: 'EmployeeName', label: { text: 'Employee Name' }, editorOptions: { readOnly: true } },
          { dataField: 'JobTitle', label: { text: 'Job Title' }, editorOptions: { readOnly: true } },
          { dataField: 'Department', label: { text: 'Department' }, editorOptions: { readOnly: true } },

          {
            dataField: 'Section',
            isRequired: true,
            label: { text: 'Section' },
            editorType: 'dxSelectBox',
            editorOptions: {
              dataSource: vm.AllSections,
              valueExpr: 'Title',
              displayExpr: 'Title',
              searchEnabled: true,
              onValueChanged: async (e: SelectBoxValueChangedEvent) => {
                const sectionTitle = typeof e.value === 'string' ? e.value : undefined;

                vm._serviceReqSeq = (vm._serviceReqSeq ?? 0) + 1;
                const mySeq = vm._serviceReqSeq;

                const f = $('#dxFormContainer').dxForm('instance');
                const serviceEditor = f?.getEditor('Service');
                serviceEditor?.option('disabled', true);

                if (vm._serviceReqSeq !== mySeq) return;

                // apply updates atomically AFTER the await
                vm.Section = sectionTitle;
                vm.Service = undefined;
                const services = sectionTitle
                  ? parents.filter(item => item.Title === sectionTitle)
                  : [];
                serviceEditor?.option('dataSource', services);
                serviceEditor?.option('value', undefined);
                serviceEditor?.option('disabled', false);
               
              }
            }
          },
          { dataField: 'Title', isRequired: true, label: { text: 'Title' } },

          {
            dataField: 'Service',
            isRequired: true,
            label: { text: 'Service' },
            editorType: 'dxSelectBox',
            editorOptions: {
              dataSource: [],
              valueExpr: 'Service',
              displayExpr: 'Service',
              searchEnabled: true
            }
          },
          { dataField: 'Details', colSpan: 2, label: { text: 'Details' }, editorType: 'dxTextArea', editorOptions: { minHeight: 120 } },
          {
            dataField: "DateRange",
            isRequired: true,
            label: { text: "Period" },
            editorType: "dxDateRangeBox",
            editorOptions: {
              // initial value from your view model
              value: [vm.StartDate, vm.EndDate],
              type: "date",
              openOnFieldClick: true,
              displayFormat: "yyyy-MM-dd",
              onValueChanged: (e: DateRangeValueChangedEvent) => {
                const range = Array.isArray(e.value) ? e.value : [undefined, undefined];
                const [start, end] = range;
                vm.StartDate = start instanceof Date ? start : start ? new Date(start) : undefined;
                vm.EndDate = end instanceof Date ? end : end ? new Date(end) : undefined;
              }
            },
            validationRules: [
              { type: "required", message: "Please choose a date range." },
              {
                type: "custom",
                reevaluate: true,
                message: "End date must be on/after start date.",
                validationCallback: ({ value }) => {
                  const [s, e] = value || [];
                  return !s || !e ? false : new Date(e) >= new Date(s);
                }
              }
            ]
          },
          {
            name: "fileUpload",
            colSpan: 2,
                template(
                  _data: unknown,
                  itemElement:
                    | string
                    | JQuery<HTMLElement>
                    | JQuery.TypeOrArray<Element | DocumentFragment>
                ) {
                  return (fileUploadPR = $("<div/>")
                    .appendTo(itemElement)
                    .dxFileUploader({
                      // labelText: "Drag and drop files to instantly upload",
                      multiple: true,
                      // accept: "image/*",
                      // allowedFileExtensions: allowedFileExtensions,
                      value: [],
                      uploadMode: "useButtons",
                      selectButtonText: "Select file",
                      maxFileSize: 5000000,
                      onValueChanged: (e: FileUploaderValueChangedEvent) => {
                        e.element.find(".dx-fileuploader-upload-button").hide();
                        //  vm.Files = (e.value && e.value[0]) ? e.value[0] : null;
                        const files = Array.isArray(e.value)
                          ? e.value.filter((file: unknown): file is File => file instanceof File)
                          : [];
                        vm.Files = files;
                      },
                    })
                    .dxFileUploader("instance"));
                },
          },
          
          { dataField: 'Agree', colSpan: 2, editorType: 'dxCheckBox', isRequired: true, label: {visible: false, text: '' }, editorOptions: { text: 'I agree to Terms & Conditions' } },
          
          {
            itemType: 'button',
            horizontalAlignment: 'right',
            buttonOptions: {
              type: 'danger', text: 'Cancel', onClick: () => (window.location.href = '/'),
              width: '120px',
            }
          },
          {
            itemType: 'button',
            // colSpan: 1,
            horizontalAlignment: 'left',
            buttonOptions: {
              type: 'success', text: 'Submit', 
              onClick: async (e) => {
                e.validationGroup.validate();
                await this._onSubmit(vm);
              },
              width: '120px',
              useSubmitBehavior: true,
            }
          },
          ],
    });
  }

  private async _onSubmit(vm: ServiceRequestViewModel): Promise<void> {
    // Tiny validation guard (DevExtreme form already validates required fields)
    if (!vm.Agree) {
      DevExpress.ui?.notify?.({ message: 'Please accept Terms & Conditions.', type: 'warning' });
      return;
    }

    try {
      // 1) Create item
      const addRes = await this._sp.web.lists.getByTitle('MCC_Requests').items.add({
        Title: vm.Title,
        Details: vm.Details || '',
        EmployeeName: vm.EmployeeName || '',
        EmployeeEmail: vm.EmployeeEmail || '',
        JobTitle: vm.JobTitle || '',
        Department: vm.Department || '',
        Section: vm.Section,
        Service: vm.Service,
        StartDate: this.toSPDateOnly(vm.StartDate),
        EndDate: this.toSPDateOnly(vm.EndDate),
        Status: 'Submitted'
      });

      const itemId = addRes.Id as number;

      // 2) Attachment 
      if (vm.Files.length > 0) {
        const item = this._sp.web.lists.getByTitle('MCC_Requests').items.getById(itemId);

        for (const file of vm.Files) {
          await item.attachmentFiles.add(file.name, file); // Blob/File is OK
        }
      }

      DevExpress.ui?.notify?.({ message: ' Request Submitted successfully', type: 'success', displayTime: 1500 });
      setTimeout(() => { window.location.href = '/' }, 900);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error
        ? err.message
        : typeof err === 'object' && err && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Submission failed';
      DevExpress.ui?.notify?.({ message, type: 'error', displayTime: 6000 });
    }
  }

  private toSPDateOnly(d?: Date): string | undefined {
    if (!d) return undefined;
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
      .toISOString()
      .split("T")[0]; // e.g. "2025-11-04"
  }

  protected onInit(): Promise<void> {
    this._sp = spfi().using(SPFx(this.context));
    SPComponentLoader.loadCss("https://cdn3.devexpress.com/jslib/23.2.4/css/dx.light.css");
        return super.onInit();
  }



 

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
