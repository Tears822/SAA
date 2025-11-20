// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../node_modules/@types/devextreme/dx.all.d.ts" />
// import { Version } from '@microsoft/sp-core-library';
// import {
//   type IPropertyPaneConfiguration,
//   PropertyPaneTextField
// } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
// import type { IReadonlyTheme } from '@microsoft/sp-component-base';
// import { escape } from '@microsoft/sp-lodash-subset';
import { spfi, SPFI } from '@pnp/sp/presets/all';
import { SPFx } from '@pnp/sp/behaviors/spfx';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import "devextreme";
import * as $ from 'jquery';
import { SPComponentLoader } from '@microsoft/sp-loader';

export interface IGoraetSaadaAppWebPartProps {
  description: string;
}

export default class GoraetSaadaAppWebPart extends BaseClientSideWebPart<IGoraetSaadaAppWebPartProps> {

  private sp: SPFI;

  public async render(): Promise<void> {
    this.domElement.innerHTML = `
      <style>
        .gs-app{font-family:Segoe UI,Roboto,Arial,sans-serif}
        .gs-nav{display:flex;gap:12px;margin-bottom:12px}
        .gs-nav a{padding:6px 10px;border:1px solid #ddd;border-radius:6px;text-decoration:none}
        .gs-screen{min-height:420px}
        .dx-card{border:1px solid #eee;border-radius:10px;background:#fff}
      </style>
      <div id="gs-app" class="gs-app">
        <div class="gs-nav">
          <a href="#give">Give a Dose</a>
          <a href="#history">History</a>
          <a href="#catalog">Catalog</a>
          <a href="#pending">Pending/Completed</a>
          <a href="#dashboard">Dashboard</a>
        </div>
        <div id="gs-screen" class="gs-screen"></div>
      </div>
    `;
    await this.route();
    window.addEventListener('hashchange', () => this.route());
  }

  protected onInit(): Promise<void> {
    this.sp = spfi().using(SPFx(this.context));
    SPComponentLoader.loadCss('https://cdn3.devexpress.com/jslib/23.2.4/css/dx.light.css');
    return super.onInit();
  }

private route() {
    const hash = (location.hash || '#give').toLowerCase();
    if (hash.startsWith('#history')) return this.loadHistory();
    if (hash.startsWith('#catalog')) return this.loadCatalog();
    if (hash.startsWith('#pending')) return this.loadPending();
    if (hash.startsWith('#dashboard')) return this.loadDashboard();
    return this.loadGiveForm();
  }

  // ---------- Give a Dose ----------
  private async loadGiveForm() {  
    $('#gs-screen', this.domElement).html(`<div id="give-form"></div>`);
    const me = await this.sp.web.currentUser();
    const catalog = await this.sp.web.lists.getByTitle('GSaada_Catalog').items
      .select('Id,Title,GiftType,MinAmount,MaxAmount,IsActive').filter('IsActive eq 1')();

    ($('#give-form') as any).dxForm({
      formData: {
        FromUserId: me.Id, GiftType: null, Amount: null,
        ToUserId: null, Reason: '', Message: '', CardTemplateId: null
      },
      colCount: 2,
      items: [
        // Replace with a People Picker that resolves user to ID (ToUserId)
        { dataField: 'ToUserId', label: { text: 'Recipient (User Id)' }, editorType: 'dxNumberBox',
          editorOptions: { showSpinButtons: true, min:1 }},

        { dataField: 'GiftType', editorType: 'dxSelectBox',
          editorOptions: { items: ['Card','Voucher','Cash','Points'], searchEnabled: true }},

        { dataField: 'Amount', editorType: 'dxNumberBox',
          editorOptions: { min: 0 } },

        { dataField: 'CardTemplateId', label:{ text:'Gift (Catalog)' },
          editorType: 'dxSelectBox',
          editorOptions: { items: catalog, displayExpr: 'Title', valueExpr: 'Id', searchEnabled: true }},

        { dataField: 'Reason', colSpan: 2, editorType: 'dxTextArea',
          editorOptions: { autoResizeEnabled: true, minHeight: 70 }},

        { dataField: 'Message', colSpan: 2, editorType: 'dxTextArea',
          editorOptions: { autoResizeEnabled: true, minHeight: 70 }},

        {
          itemType: 'button', colSpan: 2,
          buttonOptions: {
            text: 'Submit Dose', type: 'default', onClick: async (e: any) => {
              // const form = e.component;
              const form = $('#give-form').dxForm('instance');
              const fd = form.option('formData'); 
              const payload: any = {
                Title: 'Dose',
                FromUserId: me.Id,
                ToUserIdId: fd.ToUserId,
                GiftType: fd.GiftType,
                Amount: fd.Amount,
                Reason: fd.Reason,
                Message: fd.Message,
                CardTemplateIdId: fd.CardTemplateId,
                Status: 'Submitted'
              };
              await this.sp.web.lists.getByTitle('GSaada_Doses').items.add(payload);
              (window as any).DevExpress.ui.notify('Dose submitted', 'success', 2000);
              location.hash = '#history';
            }
          }
        }
      ]
    });
  }

  // ---------- History ----------
  private async loadHistory() {
    $('#gs-screen', this.domElement).html(`<div id="history-grid"></div>`);
    const me = await this.sp.web.currentUser();
    const items = await this.sp.web.lists.getByTitle('GSaada_Doses').items
      .select('Id,Title,Created,Status,GiftType,Amount,ToUser/Title,FromUser/Title')
      .expand('ToUser,FromUser')
      .filter(`FromUserId eq ${me.Id} or ToUserId eq ${me.Id}`)();

    ($('#history-grid') as any).dxDataGrid({
      dataSource: items,
      keyExpr: 'Id',
      showBorders: true,
      columnAutoWidth: true,
      searchPanel: { visible: true },
      filterRow: { visible: true },
      paging: { pageSize: 10 },
      columns: [
        { dataField: 'Id', caption: '#' },
        { dataField: 'Created', dataType: 'date' },
        { dataField: 'FromUser.Title', caption: 'From' },
        { dataField: 'ToUser.Title', caption: 'To' },
        'GiftType', 'Amount', 'Status'
      ]
    });
  }

  // ---------- Catalog ----------
  private async loadCatalog() {
    $('#gs-screen', this.domElement).html(`<div id="catalog-grid"></div>`);
    const catalog = await this.sp.web.lists.getByTitle('GSaada_Catalog').items
      .select('Id,Title,GiftType,MinAmount,MaxAmount,IsActive').filter('IsActive eq 1')();

    ($('#catalog-grid') as any).dxDataGrid({  
      dataSource: catalog,
      keyExpr: 'Id',
      columnAutoWidth: true,
      showBorders: true,
      columns: [
        'Title','GiftType',
        { dataField:'MinAmount', caption:'Min' },
        { dataField:'MaxAmount', caption:'Max' },
        {
          type: 'buttons',
          buttons: [{
            text: 'Use', onClick: () => { location.hash = '#give'; }
          }]
        }
      ]
    });
  }

  // ---------- Pending / Completed ----------
  private async loadPending() {
    $('#gs-screen', this.domElement).html(`<div id="pending-grid"></div>`);
    const items = await this.sp.web.lists.getByTitle('GSaada_Doses').items
      .select('Id,Title,Status,GiftType,Amount,ToUser/Title,FromUser/Title')
      .expand('ToUser,FromUser')();

    ($('#pending-grid') as any).dxDataGrid({
      dataSource: items,
      keyExpr: 'Id',
      columnAutoWidth: true,
      showBorders: true,
      filterRow: { visible: true },
      columns: [
        'Id',{ dataField:'FromUser.Title',caption:'From'},{ dataField:'ToUser.Title',caption:'To'},
        'GiftType','Amount','Status',
        {
          type: 'buttons',
          buttons: [
            { text: 'Approve',
              visible: (e:any)=> e.row.data.Status==='ManagerReview' || e.row.data.Status==='FinanceReview',
              onClick: async (e:any)=> this.transition(e.row.data.Id,'Approve') },
            { text: 'Reject',
              visible: (e:any)=> e.row.data.Status==='ManagerReview' || e.row.data.Status==='FinanceReview',
              onClick: async (e:any)=> this.transition(e.row.data.Id,'Reject') },
            { text: 'Mark Paid',
              visible: (e:any)=> e.row.data.Status==='Approved',
              onClick: async (e:any)=> this.transition(e.row.data.Id,'Paid') },
          ]
        }
      ]
    });
  }

  private async transition(id:number, action:'Approve'|'Reject'|'Paid') {
    const list = this.sp.web.lists.getByTitle('GSaada_Doses').items.getById(id);
    const item = await list.select('Status')();
    let next = item.Status;

    if (action==='Approve') {
      next = (item.Status==='ManagerReview') ? 'FinanceReview' : 'Approved';
    } else if (action==='Reject') {
      next = 'Rejected';
    } else if (action==='Paid') {
      next = 'Paid';
    }
    await list.update({ Status: next });
    (window as any).DevExpress.ui.notify(`Status → ${next}`, 'success', 1500);
    await this.loadPending();
  }

  // ---------- Dashboard ----------
  private async loadDashboard() {
    $('#gs-screen', this.domElement).html(`
      <div id="kpi-cards" class="grid grid-cols-4 gap-4"></div>
      <div id="trend" style="height:320px;margin-top:16px;"></div>
    `);
    const items = await this.sp.web.lists.getByTitle('GSaada_Doses').items
      .select('Id,Status,GiftType,Created')();

    const total = items.length;
    const approved = items.filter(i=>['Approved','Paid'].includes(i.Status)).length;
    const rejected = items.filter(i=>i.Status==='Rejected').length;

    $('#kpi-cards').html(`
      <div class="dx-card p-4">Total Doses: <b>${total}</b></div>
      <div class="dx-card p-4">Approved: <b>${approved}</b></div>
      <div class="dx-card p-4">Rejected: <b>${rejected}</b></div>
      <div class="dx-card p-4">Approval %: <b>${total?Math.round(approved*100/total):0}%</b></div>
    `);

    const byMonth: Record<string, number> = {};
    items.forEach(i=>{
      const k = (new Date(i.Created)).toISOString().slice(0,7);
      byMonth[k] = (byMonth[k]||0)+1;
    });
    const series = Object.keys(byMonth).sort().map(k=>({ Month:k, Count:byMonth[k] }));

    ($('#trend') as any).dxChart({
      dataSource: series,
      series: { valueField:'Count', argumentField:'Month', type:'bar', name:'Doses' },
      legend: { visible:true },
      argumentAxis: { argumentType:'string' },
      title: 'Time Trend'
    });
  }
}
