// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../node_modules/devextreme/bundles/dx.all.d.ts" />
/// <reference path="../../../node_modules/devextreme/integration/jquery.d.ts" />
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { escape } from '@microsoft/sp-lodash-subset';
import { SPComponentLoader } from "@microsoft/sp-loader";
import styles from './EmployeeDirectoryWebPart.module.scss';
import * as strings from 'EmployeeDirectoryWebPartStrings';

// import 'devextreme/integration/jquery';
import "devextreme";
import * as $ from "jquery";
// import DevExpress from 'devextreme/dx.all';
// import config from 'devextreme/core/config';
// import { DX_LICENSE_KEY } from '../../licenses/devextreme-license';
// declare global {
//   interface JQuery<TElement = HTMLElement> {
//     dxDataGrid(...args: any[]): any;
//   }

// DevExtreme widgets (typed)
// import DataGrid, { Properties as DataGridProps } from 'devextreme/ui/data_grid';
// import SelectBox, { Properties as SelectBoxProps } from 'devextreme/ui/select_box';
// import Popup, { Properties as PopupProps } from 'devextreme/ui/popup';
// import TabPanel, { Properties as TabPanelProps } from 'devextreme/ui/tab_panel';
// jQuery
// import * as $ from 'jquery';
// import DevExpress from 'devextreme/dx.all';

// (window as any).$ = $; (window as any).jQuery = $;

export interface IPeopleDirectoryWebPartProps {
  description: string;
  title: string;
}

interface AspirationRow {
  Approval_x0020_Date?: string;
}

// interface Person {
//   id: number;
//   name: string;
//   role: string;
//   department: string;
//   email: string;
//   phone: string;
//   location: string;
//   image: string;
//   skills: string[];
//   linkedin?: string;
//   website?: string;
//   joinDate: string;
//   bio: string;
// }

export default class PeopleDirectoryWebPart extends BaseClientSideWebPart<IPeopleDirectoryWebPartProps> {
  // private dataGridInstance!: DevExpress.ui.dxDataGrid;
  // private profilePopup!: DevExpress.ui.dxPopup;
  // private mockPeople: Person[] = [];

  public async onInit(): Promise<void> {
    // Register the license **BEFORE** any widget is created
  // config({ licenseKey: DX_LICENSE_KEY });
  SPComponentLoader.loadCss("https://cdn3.devexpress.com/jslib/25.1.6/css/dx.light.css");
    return super.onInit();
  }

  public render(): void {
    this.domElement.innerHTML = `
      <div class="${styles.peopleDirectory}">
        <div class="${styles.container}">
          <!-- Header -->
          <div class="${styles.header}">
            <div class="${styles.headerContent}">
              <div class="${styles.titleSection}">
                <div class="${styles.iconWrapper}">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <div>
                  <h1 class="${styles.title}">${escape(this.properties.title || 'People Directory')}</h1>
                  <p class="${styles.subtitle}">Find and connect with team members</p>
                </div>
              </div>

              <!-- Filters -->
              <!--<div class="${styles.filters}">
                <div id="searchBox" class="${styles.searchBox}"></div>
                <div id="departmentFilter" class="${styles.filterBox}"></div>
              </div>-->
            </div>
          </div>

          <!-- Data Grid -->
          <div class="${styles.gridContainer}">
            <div id="peopleGrid"></div>
          </div>

          <!-- Profile Popup -->
          <div id="profilePopup"></div>
        </div>
      </div>
    `;
    // this.initializeMockData();
    this.initializeControls();
  }

  // private initializeMockData(): void {
  //   this.mockPeople = [
  //     {
  //       id: 1,
  //       name: 'Sarah Johnson',
  //       role: 'Senior Product Manager',
  //       department: 'Product',
  //       email: 'sarah.johnson@company.com',
  //       phone: '+1 (555) 123-4567',
  //       location: 'San Francisco, CA',
  //       image: 'https://images.unsplash.com/photo-1652471949169-9c587e8898cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  //       skills: ['Product Strategy', 'Agile', 'User Research', 'Analytics', 'Leadership'],
  //       linkedin: 'https://linkedin.com',
  //       website: 'https://example.com',
  //       joinDate: 'Jan 2022',
  //       bio: 'Passionate product leader with 8+ years of experience building user-centric products.'
  //     },
  //     {
  //       id: 2,
  //       name: 'Michael Chen',
  //       role: 'Lead Software Engineer',
  //       department: 'Engineering',
  //       email: 'michael.chen@company.com',
  //       phone: '+1 (555) 234-5678',
  //       location: 'Seattle, WA',
  //       image: 'https://images.unsplash.com/photo-1622626426572-c268eb006092?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  //       skills: ['React', 'TypeScript', 'Node.js', 'System Design', 'Mentoring'],
  //       linkedin: 'https://linkedin.com',
  //       joinDate: 'Mar 2021',
  //       bio: 'Full-stack engineer passionate about building scalable systems and mentoring junior developers.'
  //     },
  //     {
  //       id: 3,
  //       name: 'Emily Rodriguez',
  //       role: 'UX Design Lead',
  //       department: 'Design',
  //       email: 'emily.rodriguez@company.com',
  //       phone: '+1 (555) 345-6789',
  //       location: 'Austin, TX',
  //       image: 'https://images.unsplash.com/photo-1581065178047-8ee15951ede6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  //       skills: ['UI/UX Design', 'Figma', 'Design Systems', 'Prototyping', 'User Testing'],
  //       linkedin: 'https://linkedin.com',
  //       website: 'https://example.com',
  //       joinDate: 'Jul 2020',
  //       bio: 'Design leader focused on creating intuitive, accessible experiences.'
  //     },
  //     {
  //       id: 4,
  //       name: 'David Kim',
  //       role: 'Marketing Director',
  //       department: 'Marketing',
  //       email: 'david.kim@company.com',
  //       phone: '+1 (555) 456-7890',
  //       location: 'New York, NY',
  //       image: 'https://images.unsplash.com/photo-1742119971773-57e0131095b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  //       skills: ['Digital Marketing', 'SEO', 'Brand Strategy', 'Content Marketing', 'Analytics'],
  //       linkedin: 'https://linkedin.com',
  //       joinDate: 'Sep 2019',
  //       bio: 'Data-driven marketing professional with expertise in growth strategies and brand building.'
  //     },
  //     {
  //       id: 5,
  //       name: 'Jessica Wang',
  //       role: 'Senior Data Scientist',
  //       department: 'Engineering',
  //       email: 'jessica.wang@company.com',
  //       phone: '+1 (555) 567-8901',
  //       location: 'Boston, MA',
  //       image: 'https://images.unsplash.com/photo-1652471949169-9c587e8898cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  //       skills: ['Machine Learning', 'Python', 'Data Analysis', 'Statistics', 'TensorFlow'],
  //       linkedin: 'https://linkedin.com',
  //       website: 'https://example.com',
  //       joinDate: 'Feb 2021',
  //       bio: 'Data scientist passionate about using ML to solve complex business problems.'
  //     },
  //     {
  //       id: 6,
  //       name: 'Alex Thompson',
  //       role: 'Customer Success Manager',
  //       department: 'Sales',
  //       email: 'alex.thompson@company.com',
  //       phone: '+1 (555) 678-9012',
  //       location: 'Denver, CO',
  //       image: 'https://images.unsplash.com/photo-1622626426572-c268eb006092?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  //       skills: ['Customer Relations', 'SaaS', 'Account Management', 'Onboarding', 'Training'],
  //       linkedin: 'https://linkedin.com',
  //       joinDate: 'May 2022',
  //       bio: 'Customer success advocate dedicated to ensuring clients achieve their goals.'
  //     },
  //     {
  //       id: 7,
  //       name: 'Priya Patel',
  //       role: 'Senior Product Designer',
  //       department: 'Design',
  //       email: 'priya.patel@company.com',
  //       phone: '+1 (555) 789-0123',
  //       location: 'Los Angeles, CA',
  //       image: 'https://images.unsplash.com/photo-1581065178047-8ee15951ede6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  //       skills: ['Product Design', 'Interaction Design', 'Sketch', 'User Flows', 'Wireframing'],
  //       linkedin: 'https://linkedin.com',
  //       website: 'https://example.com',
  //       joinDate: 'Nov 2021',
  //       bio: 'Product designer focused on crafting delightful user experiences.'
  //     },
  //     {
  //       id: 8,
  //       name: 'James Mitchell',
  //       role: 'VP of Engineering',
  //       department: 'Engineering',
  //       email: 'james.mitchell@company.com',
  //       phone: '+1 (555) 890-1234',
  //       location: 'San Francisco, CA',
  //       image: 'https://images.unsplash.com/photo-1742119971773-57e0131095b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  //       skills: ['Engineering Leadership', 'Architecture', 'Team Building', 'Strategy', 'Cloud'],
  //       linkedin: 'https://linkedin.com',
  //       joinDate: 'Jan 2020',
  //       bio: 'Engineering executive with 15+ years of experience building and scaling teams.'
  //     }
  //   ];
  // }

  
  private initializeControls(): void {
    $('#peopleGrid').dxDataGrid({
        dataSource: [],
        // keyExpr: "ID",
        showBorders: true,
        // focusedRowEnabled: true,
        allowColumnResizing: true,
        columnResizingMode: 'nextColumn',
        columnAutoWidth: true,
        wordWrapEnabled: true,
        // noDataText: 'Add Career Aspiration',
        searchPanel:{
          visible: true,
          highlightSearchText: true,
        },
        // scrolling: {
        //   rowRenderingMode: 'virtual',
        // },
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
        editing: {
          mode: 'popup',
          allowUpdating: true,
          allowDeleting: true,
          allowAdding: true,
          confirmDelete: true,
          popup: {
            title: "Career Aspiration",
            showTitle: true,
            height: 450,
            width: 900,
            resizeEnabled: true
          },
          form: {
            items: [
              {
                itemType: "group",
                colCount: 2,
                colSpan: 2,
                caption: "Employee Input",
                items: [
                  {
                    dataField: "Aspirations",
                    caption: "Aspirations",
                  },
                  {
                    dataField: "AspirationsDate",
                    caption: "Aspirations Date",
                    // dataType: "date",
                    // format: 'yyyy-MM-dd',
                  },
                ],
              },
              {
                itemType: "group",
                colCount: 2,
                colSpan: 2,
                caption: "Manager Input",
                items: [
                  {
                    dataField: "Manager_x0020_Comment",
                    caption: 'Manager Response',
                    editorType: 'dxTextArea',
                    // editorOptions: {
                    //   readOnly: !existInHRTeam,
                    // },
                  },
                  {
                    dataField: 'Approval_x0020_Date',
                    caption: 'Manager Response Date',
                    // dataType: "date",
                    // format: 'yyyy-MM-dd',
                    // editorOptions: {
                    //   readOnly: !existInHRTeam,
                    // },
                  },
                ]
              }
            ],
          },
        },
        // async onSaved(e) {
        //   const percentage = await splist.getProgress(sp, currentUser.Email);
        //   const employeeDetails = await splist.getListItemsFilterbyColumn(sp, 'Employee Details', 'Title', currentUser.Email);
        //   await splist.updateListItem(sp, 'Employee Details', employeeDetails[0].Id, {ProfileCompletion: percentage/100});

        //   let itemId: number;
        //   if (e.changes[0].type === "update") {
        //     itemId = e.changes[0].key;
        //   } else {
        //     itemId = e.changes[0].data.data.Id;
        //   }
          
        //   if (approvalStatus !== "Approved" && !isCEO) {
        //     const values = {Title: currentUser.DisplayName, Direct_x0020_Manager: directManager.DisplayName, List_x0020_Name: "Aspiration", 
        //     ItemID: itemId, Status: "Pending", Employee_x0020_Email: currentUser.Email, Direct_x0020_Manager_x0020_Email: directManager.Email };
            
        //     const changes = await splist.getListItemsFilterbyColumn(sp, "Change Requests", /*"Direct_x0020_Manager_x0020_Email", directManager.Email,*/ "Employee_x0020_Email", currentUser.Email, "ItemID", itemId, "List_x0020_Name", "Aspiration");
            
        //     if (changes.length > 0) {
        //       await splist.updateListItem(sp,'Change Requests', changes[0].Id, values);
        //     } else {
        //       await splist.addListItem(sp,'Change Requests', values);
        //     }
      
        //     await splist.sendEmail(sp, currentUser, directManager, 'Aspiration');
        //   }
        // },
        // onEditorPreparing(e) {
        //     const status = e.row?.data.Approval_x0020_Status;
        //     approvalStatus = status;
        //     if (status === "Approved" && !existInHRTeam) {
        //           if (e.dataField === 'Aspirations') {
        //             e.editorOptions.readOnly = true;
        //           } 
        //           if (e.dataField === 'AspirationsDate') {
        //             e.editorOptions.readOnly = true;
        //           }  
        //     }
        // },
        // async onEditingStart(e) {
        //   const status = e.data.Approval_x0020_Status;
        //   if (status === "Approved" && !existInHRTeam) {
        //     await DevExpress.ui.dialog.alert(
        //       "<i>This item can't be edited because the manager approved it</i>",
        //       "Career Aspiration"
        //     );
        //   }
        // },
        columns: [
          {
            dataField: "Aspirations",
            caption: "Aspirations",
            formItem: {
              editorType: 'dxTextArea',
            },
            validationRules: [
              { type: "required" }
            ],
            editorOptions: {
              spellcheck: true
            }
          },
          {
            dataField: "AspirationsDate",
            caption: "Aspirations Date",
            dataType: "date",
            format: 'yyyy-MM-dd',
            validationRules: [
              { type: "required" }
            ],
            editorOptions: {
              spellcheck: true
            }
          },
          {
            dataField: "Manager_x0020_Comment",
            caption: 'Manager Response',
            visible: false,
            editorOptions: {
              // readOnly: !existInHRTeam,
              spellcheck: true

            },
            formItem: {
              editorType: 'dxTextArea'
            }
          },
          {
            dataField: 'Approval_x0020_Date',
            caption: 'Manager Response Date',
            dataType: "date",
            format: 'yyyy-MM-dd',
            sortOrder: 'desc',
            editorOptions: {
              // readOnly: !existInHRTeam,
              spellcheck: true
            },
            calculateCellValue(rowData: AspirationRow) {
              const approvalDate = rowData.Approval_x0020_Date ?? undefined;
              if (approvalDate === undefined || approvalDate === '1970-01-01T00:00:00Z') {
                return '';
              } else {
                return new Date(approvalDate).toLocaleDateString("en-CA").split('T')[0];
              }
            },
          },
          {
            dataField: "Approval_x0020_Status",
            caption: 'Approval Status',
            formItem: {  
              visible: false  
            }
          },
          // {
          //   type: 'buttons',
          //   buttons: [
          //     {
          //       name: 'edit'
          //     },
          //     {
          //       name: 'delete',
          //       visible (e){
          //         return existInHRTeam || e.row?.data.Approval_x0020_Status === 'Pending' || e.row?.data.Approval_x0020_Status === 'Amended';
          //       },
          //       async onClick(e) {
          //         const result = DevExpress.ui.dialog.confirm(
          //                   "<i>Are you sure want to delete this Item</i>",
          //                   "Career Aspiration"
          //                 );
          //         await result.done(async (dialogResult) => {
          //           if (dialogResult) {
          //             if(existInHRTeam || e.row?.data.Approval_x0020_Status === 'Pending' || e.row?.data.Approval_x0020_Status === 'Amended') {
          //               const itemId = e.row?.data.Id;
          //               await splist.deleteListItem(sp, "Aspiration", itemId);
          //               const request = await splist.getListItemsFilterbyColumn(sp, "Change Requests", /*"Direct_x0020_Manager_x0020_Email", directManager.Email,*/ "Employee_x0020_Email", currentUser.Email, "ItemID", itemId, "List_x0020_Name", "Aspiration");
          //               if (request.length > 0) {
          //                 await splist.deleteListItem(sp, "Change Requests", request[0].Id);
          //               }
          //               await $(element).dxDataGrid('instance').refresh();
          //             }
          //           }
          //         });
          //       },
          //     },
          //   ],
          // },
        ],
        summary: {
          totalItems: [{
            column: 'Aspirations',
            summaryType: 'count',
          }],
        },
      });
      
    // Department filter
    // const departments = ['All Departments', ...Array.from(new Set(this.mockPeople.map(p => p.department)))];
    // const deptEl = $('#departmentFilter')[0] as HTMLElement;
    // if (deptEl) {
    //   const departmentFilterOptions: DevExpress.ui.dxSelectBox = {
    //     // items: departments,
    //     // value: 'All Departments',
    //     width: 200,
    //     onValueChanged: (e) => {
    //       if (!this.dataGridInstance) return;
    //       if (e.value === 'All Departments') {
    //         this.dataGridInstance.clearFilter();
    //       } else {
    //         this.dataGridInstance.filter(['department', '=', e.value]);
    //       }
    //     }
    //   };
    //   // eslint-disable-next-line no-new
    //   new SelectBox(deptEl, departmentFilterOptions);
    // }

    // DataGrid
    // const gridEl = $('#peopleGrid')[0] as HTMLElement;
    // const gridOptions: DevExpress.ui.dxDataGridOptions = {
    //   dataSource: this.mockPeople,
    //   showBorders: true,
    //   showRowLines: true,
    //   rowAlternationEnabled: true,
    //   hoverStateEnabled: true,
    //   searchPanel: {
    //     visible: true,
    //     highlightCaseSensitive: true
    //   },
    //   paging: {
    //     pageSize: 8,
    //     pageIndex: 0
    //   },
    //   pager: {
    //     visible: true,
    //     displayMode: 'full',
    //     showPageSizeSelector: true,
    //     allowedPageSizes: [8, 16, 24],
    //     showNavigationButtons: true,
    //     showInfo: true,
    //     infoText: 'Showing {0}-{1} of {2}'
    //   },
    //   columns: [
    //     {
    //       caption: 'Photo',
    //       width: 80,
    //       cellTemplate: (container: HTMLElement, options: any) => {
    //         $('<img>')
    //           .attr('src', options.data.image)
    //           .css({
    //             width: '50px',
    //             height: '50px',
    //             borderRadius: '50%',
    //             objectFit: 'cover'
    //           })
    //           .appendTo(container);
    //       }
    //     },
    //     { dataField: 'name', caption: 'Name', width: 180 },
    //     { dataField: 'role', caption: 'Role', width: 200 },
    //     { dataField: 'department', caption: 'Department', width: 130 },
    //     { dataField: 'email', caption: 'Email', width: 220 },
    //     { dataField: 'location', caption: 'Location', width: 150 },
    //     {
    //       caption: 'Skills',
    //       width: 200,
    //       cellTemplate: (container: HTMLElement, options: any) => {
    //         const skills: string[] = options.data.skills.slice(0, 2);
    //         const remaining = options.data.skills.length - 2;

    //         const skillsHtml = skills
    //           .map((skill: string) => `<span class="${styles.skillBadge}">${skill}</span>`)
    //           .join('');

    //         const remainingHtml = remaining > 0
    //           ? `<span class="${styles.skillBadge}">+${remaining}</span>`
    //           : '';

    //         $(container).html(`
    //           <div class="${styles.skillsContainer}">
    //             ${skillsHtml}${remainingHtml}
    //           </div>
    //         `);
    //       }
    //     },
    //     {
    //       caption: 'Actions',
    //       width: 120,
    //       cellTemplate: (container: HTMLElement, options: any) => {
    //         $('<button>')
    //           .text('View Profile')
    //           .addClass(styles.viewButton)
    //           .on('click', () => this.showProfilePopup(options.data as Person))
    //           .appendTo(container);
    //       }
    //     }
    //   ]
    // };

    // this.dataGridInstance = new DataGrid(gridEl, gridOptions);

    // // Popup
    // const popupEl = $('#profilePopup')[0] as HTMLElement;
    // const popupOptions: PopupProps = {
    //   showTitle: true,
    //   title: 'Profile Details',
    //   width: 700,
    //   height: 'auto',
    //   maxHeight: '90vh',
    //   showCloseButton: true,
    //   contentTemplate: () => $('<div id="profileContent"></div>')
    // };
    // this.profilePopup = new Popup(popupEl, popupOptions);
  }

  // private async showProfilePopup(person: Person): Promise<void> {
  //   await this.profilePopup.show();

  //   const profileHtml = `
  //     <div class="${styles.profileContent}">
  //       <!-- Header -->
  //       <div class="${styles.profileHeader}">
  //         <img src="${person.image}" alt="${person.name}" class="${styles.profileImage}" />
  //         <div class="${styles.profileInfo}">
  //           <h2>${person.name}</h2>
  //           <p class="${styles.profileRole}">${person.role}</p>
  //           <div class="${styles.badges}">
  //             <span class="${styles.badge}">${person.department}</span>
  //             <span class="${styles.badge}">Joined ${person.joinDate}</span>
  //           </div>
  //           <button class="${styles.messageButton}">
  //             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
  //               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
  //             </svg>
  //             Send Message
  //           </button>
  //         </div>
  //       </div>

  //       <div class="${styles.separator}"></div>

  //       <!-- Tab Panel -->
  //       <div id="profileTabs"></div>
  //     </div>
  //   `;

  //   $('#profileContent').html(profileHtml);

    // TabPanel (the original code missed 'new TabPanel(...)')
    // const tabsEl = $('#profileTabs')[0] as HTMLElement;
    // const tabOptions: DevExpress.ui.dxTabPanel = {
    //   items: [
    //     {
    //       title: 'About',
    //       template: () => $(`
    //         <div class="${styles.tabContent}">
    //           <h3>Bio</h3>
    //           <p class="${styles.bio}">${person.bio}</p>

    //           <h3>Contact Information</h3>
    //           <div class="${styles.contactInfo}">
    //             <div class="${styles.contactItem}">
    //               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    //                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
    //               </svg>
    //               <div>
    //                 <span class="${styles.label}">Email</span>
    //                 <a href="mailto:${person.email}">${person.email}</a>
    //               </div>
    //             </div>
    //             <div class="${styles.contactItem}">
    //               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    //                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
    //               </svg>
    //               <div>
    //                 <span class="${styles.label}">Phone</span>
    //                 <a href="tel:${person.phone}">${person.phone}</a>
    //               </div>
    //             </div>
    //             <div class="${styles.contactItem}">
    //               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    //                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
    //                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
    //               </svg>
    //               <div>
    //                 <span class="${styles.label}">Location</span>
    //                 <span>${person.location}</span>
    //               </div>
    //             </div>
    //           </div>
    //         </div>
    //       `)
    //     },
    //     {
    //       title: 'Skills',
    //       template: () => {
    //         const skillsHtml = person.skills
    //           .map((s: string) => `<span class="${styles.skillBadge}">${s}</span>`)
    //           .join('');
    //         return $(`
    //           <div class="${styles.tabContent}">
    //             <h3>Technical Skills</h3>
    //             <div class="${styles.skillsList}">
    //               ${skillsHtml}
    //             </div>
    //           </div>
    //         `);
    //       }
    //     },
    //     {
    //       title: 'Contact',
    //       template: () => $(`
    //         <div class="${styles.tabContent}">
    //           <div class="${styles.contactDetails}">
    //             <p><strong>Email:</strong> <a href="mailto:${person.email}">${person.email}</a></p>
    //             <p><strong>Phone:</strong> <a href="tel:${person.phone}">${person.phone}</a></p>
    //             <p><strong>Location:</strong> ${person.location}</p>
    //             ${person.linkedin ? `<p><strong>LinkedIn:</strong> <a href="${person.linkedin}" target="_blank" rel="noopener">View Profile</a></p>` : ''}
    //             ${person.website ? `<p><strong>Website:</strong> <a href="${person.website}" target="_blank" rel="noopener">Visit Website</a></p>` : ''}
    //           </div>
    //         </div>
    //       `)
    //     }
    //   ],
    //   selectedIndex: 0,
    //   animationEnabled: true
    // };

    // // eslint-disable-next-line no-new
    // new TabPanel(tabsEl, tabOptions);
  // }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: strings.PropertyPaneDescription },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('title', { label: 'Web Part Title' }),
                PropertyPaneTextField('description', { label: strings.DescriptionFieldLabel })
              ]
            }
          ]
        }
      ]
    };
  }
}
