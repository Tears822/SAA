// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../node_modules/devextreme/bundles/dx.all.d.ts" />
/// <reference path="../../../node_modules/devextreme/integration/jquery.d.ts" />
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { SPComponentLoader } from '@microsoft/sp-loader';
import { spfi, SPFI } from '@pnp/sp';
import { SPFx } from '@pnp/sp/behaviors/spfx';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import "devextreme";
// import * as $ from 'jquery';


export interface IMccDashboardWebPartProps {
  description: string;
  listTitle: string;
}

declare const window: any;

export default class MccDashboardWebPart extends BaseClientSideWebPart<IMccDashboardWebPartProps> {

  private _sp: SPFI;

  protected async onInit(): Promise<void> {
    this._sp = spfi().using(SPFx(this.context));

    // Load jQuery first
    // await SPComponentLoader.loadScript('https://code.jquery.com/jquery-3.5.1.min.js', { globalExportsName: 'jQuery' });
    // window.$ = window.jQuery = window.jQuery || window.$ || (window as any).jQuery;

    // Load DevExtreme CSS & JS
    SPComponentLoader.loadCss('https://cdn3.devexpress.com/jslib/23.2.4/css/dx.light.css');
    // await SPComponentLoader.loadScript('https://cdn3.devexpress.com/jslib/23.2.4/js/dx.all.js');

    return super.onInit();
  }

  public async render(): Promise<void> {
    // HTML skeleton (IDs must match the JS initializers)
    this.domElement.innerHTML = `
      <style>
        :root { --pad: 14px; }
        .mcc-page { padding: 20px; max-width: 1320px; margin: 0 auto; font-family: Segoe UI, Roboto, Arial, sans-serif; }
        .mcc-toolbar {
          display: grid; grid-template-columns: repeat(6, minmax(180px, 1fr));
          gap: var(--pad); margin-bottom: 18px; align-items: end;
        }
        .mcc-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--pad); margin-bottom: var(--pad); }
        .mcc-card { background:#fff; border-radius:16px; box-shadow:0 2px 10px rgba(0,0,0,.06); padding:18px; }
        .kpi-title { font-size:12px; color:#666; margin-bottom:6px; }
        .kpi-value { font-size:28px; font-weight:700; }
        .mcc-charts { display:grid; grid-template-columns: 1.2fr 1fr; grid-template-rows:auto auto; gap: var(--pad); }
        .mcc-charts .mcc-card { min-height: 360px; }
        .mcc-card h3 { margin:0 0 8px 0; font-size:14px; color:#333; }
        .stretch { height:100%; }
      </style>

      <div class="mcc-page">
        <div class="mcc-toolbar">
          <div id="fSection"></div>
          <div id="fService"></div>
          <div id="fDepartment"></div>
          <div id="fStatus"></div>
          <div id="fTimeAggregation"></div>
          <div id="fDelayDays"></div>
        </div>

        <div class="mcc-cards">
          <div class="mcc-card">
            <div class="kpi-title">Total Number of Requests</div>
            <div class="kpi-value" id="kpiTotal">0</div>
          </div>
          <div class="mcc-card">
            <div class="kpi-title">Delayed Tasks (exceeding X days)</div>
            <div class="kpi-value" id="kpiDelayed">0</div>
          </div>
          <div class="mcc-card">
            <div class="kpi-title">In Progress</div>
            <div class="kpi-value" id="kpiInProgress">0</div>
          </div>
          <div class="mcc-card">
            <div class="kpi-title">Finished</div>
            <div class="kpi-value" id="kpiDone">0</div>
          </div>
        </div>

        <div class="mcc-charts">
          <div class="mcc-card"><h3>Requests per Section</h3><div id="chartServiceType" class="stretch"></div></div>
          <div class="mcc-card"><h3>Departments</h3><div id="chartDepartment" class="stretch"></div></div>
          <div class="mcc-card" style="grid-column: 1 / -1"><h3>Time Trend</h3><div id="chartTimeTrend" class="stretch"></div></div>
          <div class="mcc-card"><h3>Requests per Service</h3><div id="chartService" class="stretch"></div></div>
          <div class="mcc-card"><h3>Request Status</h3><div id="chartStatus" class="stretch"></div></div>
        </div>
      </div>
    `;

    // after DOM is ready, init the dashboard
    await this._initDashboard();
  }

  // private _terminalStatuses = new Set(['Approved','Published','Rejected','Completed']);
  private _terminalStatuses = new Set(['Submitted','Pending Requester','Pending Manager']);

  private _toDate(d?: string): Date | null {
    return d ? new Date(d + 'T00:00:00') : null;
  }

  private _daysBetween(a: Date, b: Date): number {    
    const x = new Date(a); x.setHours(0,0,0,0);
    const y = new Date(b); y.setHours(0,0,0,0);
    return Math.floor(Math.abs(x.getTime() - y.getTime()) / 86400000);
  }

  private _startOfWeek(d: Date): Date {
    const x = new Date(d); const day = (x.getDay()+6)%7;
    x.setDate(x.getDate()-day); x.setHours(0,0,0,0); return x;
  }
  private _startOfMonth(d: Date): Date {
    const x = new Date(d.getFullYear(), d.getMonth(), 1); x.setHours(0,0,0,0); return x;
  }
  private _startOfQuarter(d: Date): Date {
    const qStartMonth = Math.floor(d.getMonth()/3)*3;
    const x = new Date(d.getFullYear(), qStartMonth, 1); x.setHours(0,0,0,0); return x;
  }
  private _getWeekNumber(d: Date): number {
    const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = dt.getUTCDay() || 7;
    dt.setUTCDate(dt.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(dt.getUTCFullYear(),0,1));
    return Math.ceil((((dt as any) - (yearStart as any)) / 86400000 + 1)/7);
  }
  private _formatKey(date: Date, agg: 'Week'|'Month'|'Quarter'): string {
    const y = date.getFullYear();
    const m = date.getMonth()+1;
    if (agg === 'Week') return `${y}-W${this._getWeekNumber(date)}`;
    if (agg === 'Quarter') { const q = Math.floor(date.getMonth()/3)+1; return `${y}-Q${q}`; }
    return `${y}-${String(m).padStart(2,'0')}`;
  }

  private _groupCount<T>(arr: T[], selector: (x: T) => string | undefined): Array<{name:string, value:number}> {
    const map = new Map<string, number>();
    arr.forEach(o=>{
      const key = selector(o) ?? 'Unknown';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map, ([name, value]) => ({ name, value }));
  }

  private async _loadItems(): Promise<any[]> {
    const listTitle = this.properties.listTitle || 'MCC_Requests';
    const items = await this._sp.web.lists.getByTitle(listTitle).items
      .select('Id','Title','Section','Service','Department','Status','Created'/*,'CompletedDate'*/)
      .top(5000)();

    // Normalize dates to yyyy-MM-dd if needed
    const toIsoShort = (v: string | null | undefined) => {
      if (!v) return undefined;
      const d = new Date(v);
      if (isNaN(d.getTime())) return undefined;
      const mm = String(d.getMonth()+1).padStart(2,'0');
      const dd = String(d.getDate()).padStart(2,'0');
      return `${d.getFullYear()}-${mm}-${dd}`;
    };

    return items.map(it => ({
      Id: it.Id,
      Title: it.Title,
      Section: it.Section,
      Service: it.Service,
      Department: it.Department,
      Status: it.Status,
      Created: toIsoShort((it as any).Created),
      // CompletedDate: toIsoShort((it as any).CompletedDate),
    }));
  }

  private _applyFilters(data: any[], filterState: any): any[] {
    const s = filterState;
    return data.filter(item=>{
      if (s.Section.length && !s.Section.includes(item.Section)) return false;
      if (s.Service.length   && !s.Service.includes(item.Service))       return false;
      if (s.Department.length    && !s.Department.includes(item.Department))         return false;
      if (s.Status.length        && !s.Status.includes(item.Status))                 return false;
      return true;
    });
  }

  private _computeDelayedCount(data: any[], delayDays: number): number {
    const today = new Date();
    return data.filter(o=>{
      const submitted = this._toDate(o.Created) || today;
      const age = this._daysBetween(new Date(submitted), new Date(today));
      const isOpen = !this._terminalStatuses.has(o.Status || '');
      return isOpen && age > delayDays;
    }).length;
  }

  private _buildTrend(data: any[], agg: 'Week'|'Month'|'Quarter'): Array<{bucket:string, count:number}> {
    const buckets = new Map<string, number>();
    for (const row of data) {
      const dt = this._toDate(row.Created);
      if (!dt) continue;
      let keyDate: Date;
      if (agg === 'Week') keyDate = this._startOfWeek(dt);
      else if (agg === 'Quarter') keyDate = this._startOfQuarter(dt);
      else keyDate = this._startOfMonth(dt);
      const k = this._formatKey(keyDate, agg);
      buckets.set(k, (buckets.get(k) || 0) + 1);
    }
    return Array.from(buckets, ([bucket, count]) => ({ bucket, count }))
      .sort((a,b)=> a.bucket.localeCompare(b.bucket));
  }

  private async _initDashboard(): Promise<void> {
    const $ = window.$ as JQueryStatic;

    // 1) Load data
    const rawData = await this._loadItems();

    // 2) Filter state
    const filterState = {
      Section: [] as string[],
      Service:   [] as string[],
      Department:    [] as string[],
      Status:        [] as string[],
      TimeAgg:       'Month' as 'Week'|'Month'|'Quarter',
      DelayDays:     7
    };

    // 3) Create filter widgets
    const uniq = (field: string) => Array.from(new Set(rawData.map((x:any) => x[field]).filter(Boolean))).sort();

    // 4) Charts
    const chartServiceType = $('#chartServiceType').dxPieChart({
      type: 'doughnut',
      innerRadius: 0.55,
      series: [{ argumentField: 'name', valueField: 'value' }],
      legend: { visible: true },
      tooltip: { enabled: true, format: { type: 'fixedPoint', precision: 0 } },
      redrawOnResize: false,
    }).dxPieChart('instance');

    const chartDepartment = $('#chartDepartment').dxChart({
      series: [{ type: 'bar', argumentField: 'name', valueField: 'value', name: 'Department', }],
      argumentAxis: { label: { overlappingBehavior: 'rotate', rotationAngle: 30 } },
      tooltip: { enabled: true },
      redrawOnResize: false,
    }).dxChart('instance');
    
    const chartTimeTrend = $('#chartTimeTrend').dxChart({
      series: [{ type: 'line', argumentField: 'bucket', valueField: 'count', name: 'Requests' }],
      argumentAxis: { argumentType: 'string' },
      tooltip: { enabled: true },
      redrawOnResize: false,
    }).dxChart('instance');

    const chartService = $('#chartService').dxChart({
      series: [{ type: 'bar', argumentField: 'name', valueField: 'value', name:'Service' }],
      argumentAxis: { label: { overlappingBehavior: 'rotate', rotationAngle: 30 } },
      tooltip: { enabled: true },
      redrawOnResize: false,
    }).dxChart('instance');

    const chartStatus = $('#chartStatus').dxPieChart({
      series: [{ argumentField: 'name', valueField: 'value' }],
      tooltip: { enabled: true },
      legend: { visible: true },
      redrawOnResize: false,
    }).dxPieChart('instance');

    const refresh = () => {
      const filtered = this._applyFilters(rawData, filterState);

      // KPIs
      $('#kpiTotal').text(filtered.length);
      $('#kpiDelayed').text(this._computeDelayedCount(filtered, filterState.DelayDays));
      // $('#kpiInProgress').text(filtered.filter((x:any) => (x.Status||'').toLowerCase()==='in progress').length);
      $('#kpiInProgress').text(filtered.filter((x: any) => {const s = (x.Status || '').trim().toLowerCase();return ['submitted','pending requester','pending manager'].includes(s);}).length);
      $('#kpiDone').text(filtered.filter((x: any) => {const s = (x.Status || '').trim().toLowerCase();return ['completed','specialist rejected','requester declined','manager rejected'].includes(s);}).length);


      // Aggregations
      const svc = this._groupCount(filtered, (x:any)=>x.Section);
      const dep = this._groupCount(filtered, (x:any)=>x.Department);
      const rqt = this._groupCount(filtered, (x:any)=>x.Service);
      const sts = this._groupCount(filtered, (x:any)=>x.Status);
      const trn = this._buildTrend(filtered, filterState.TimeAgg);

      // Update charts
      chartServiceType.option('dataSource', svc);
      chartDepartment.option('dataSource', dep);
      chartService.option('dataSource', rqt);
      chartStatus.option('dataSource', sts);
      chartTimeTrend.option('dataSource', trn);
    };

    $('#fSection').dxTagBox({
      items: uniq('Section'),
      placeholder: 'Section',
      showClearButton: true,
      onValueChanged: (e: any)=>{ filterState.Section = e.value; refresh(); }
    });

    $('#fService').dxTagBox({
      items: uniq('Service'),
      placeholder: 'Service',
      showClearButton: true,
      onValueChanged: (e: any)=>{ filterState.Service = e.value; refresh(); }
    });

    $('#fDepartment').dxTagBox({
      items: uniq('Department'),
      placeholder: 'Department',
      showClearButton: true,
      onValueChanged: (e: any)=>{ filterState.Department = e.value; refresh(); }
    });

    $('#fStatus').dxTagBox({
      items: uniq('Status'),
      placeholder: 'Request Status',
      showClearButton: true,
      onValueChanged: (e: any)=>{ filterState.Status = e.value; refresh(); }
    });

    $('#fTimeAggregation').dxSelectBox({
      items: ['Week','Month','Quarter'],
      value: filterState.TimeAgg,
      labelMode: 'floating',
      label: 'Time Range (aggregation)',
      onValueChanged: (e: any)=>{ filterState.TimeAgg = e.value; refresh(); }
    });

    $('#fDelayDays').dxNumberBox({
      value: filterState.DelayDays,
      min: 1,
      showSpinButtons: true,
      labelMode: 'floating',
      label: 'Delayed if exceeds X days (since submitted)',
      onValueChanged: (e: any)=>{ filterState.DelayDays = e.value || 1; refresh(); }
    });

    

    // 5) Refresh pipeline
    // const refresh = () => {
    //   const filtered = this._applyFilters(rawData, filterState);

    //   // KPIs
    //   $('#kpiTotal').text(filtered.length);
    //   $('#kpiDelayed').text(this._computeDelayedCount(filtered, filterState.DelayDays));
    //   $('#kpiInProgress').text(filtered.filter((x:any) => (x.Status||'').toLowerCase()==='in progress').length);
    //   $('#kpiDone').text(filtered.filter((x:any) => ['approved','published','completed'].includes((x.Status||'').toLowerCase())).length);

    //   // Aggregations
    //   const svc = this._groupCount(filtered, (x:any)=>x.Section);
    //   const dep = this._groupCount(filtered, (x:any)=>x.Department);
    //   const rqt = this._groupCount(filtered, (x:any)=>x.Service);
    //   const sts = this._groupCount(filtered, (x:any)=>x.Status);
    //   const trn = this._buildTrend(filtered, filterState.TimeAgg);

    //   // Update charts
    //   chartServiceType.option('dataSource', svc);
    //   chartDepartment.option('dataSource', dep);
    //   chartService.option('dataSource', rqt);
    //   chartStatus.option('dataSource', sts);
    //   chartTimeTrend.option('dataSource', trn);
    // };

    // Initial paint
    refresh();
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [{
        header: { description: 'MCC Dashboard Settings' },
        groups: [{
          groupName: 'Data',
          groupFields: [
            PropertyPaneTextField('listTitle', {
              label: 'Requests List Title',
              value: 'MCC Requests'
            })
          ]
        }]
      }]
    };
  }
}
