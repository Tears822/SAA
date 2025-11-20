// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../node_modules/@types/devextreme/dx.all.d.ts" />
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import { spfi, SPFI } from "@pnp/sp/presets/all";
import { SPFx } from "@pnp/sp/behaviors/spfx";
// Ensure PnPjs features are attached
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/site-users/web";
import "devextreme";
import * as $ from "jquery";
import { SPComponentLoader } from "@microsoft/sp-loader";

type ReactionType = 'Medal' | 'Heart' | 'Clap';
type UserLite = { Id: number; Title: string };
type RxBucket = { count: number; users: UserLite[] };
type RxRow = { Medal: RxBucket; Heart: RxBucket; Clap: RxBucket };
type RxMap = Record<number, RxRow>;

const RX_FIELD = 'Reaction_Type';

export interface IGSaadaFeedWebPartProps {
  description: string;
}


export default class GSaadaFeedWebPart extends BaseClientSideWebPart<IGSaadaFeedWebPartProps> {

  private sp: SPFI;
  private meId = 0;

  protected onInit(): Promise<void> {
    this.sp = spfi().using(SPFx(this.context));
    SPComponentLoader.loadCss('https://cdn3.devexpress.com/jslib/23.2.4/css/dx.light.css');
    return super.onInit();
  }

  public async render(): Promise<void> {
    const me = await this.sp.web.currentUser();
    this.meId = me.Id;

    this.domElement.innerHTML = `
      <style>
        .rec-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:18px}
        .rec-card{border:1px solid #eee;border-radius:16px;background:#fff;padding:16px;box-shadow:0 2px 10px rgba(0,0,0,.04)}
        .rec-header{display:flex;gap:12px;align-items:center;margin-bottom:8px}
        .rec-chip{display:inline-flex;gap:8px;align-items:center;background:#f6f7f9;border-radius:12px;padding:10px 12px;margin:10px 0}
        .rec-msg{border-left:4px solid #1e90ff20;padding:10px 12px;margin:8px 0 16px 0;max-height:110px;overflow:auto}
        .rec-reactions{display:flex;gap:12px;flex-wrap:wrap}
        .rx{display:inline-flex;align-items:center;gap:8px;background:#f3f4f6;border-radius:24px;padding:8px 14px;cursor:pointer}
        .rx.me{outline:2px solid #1e90ff55}
        .rx i{font-style:normal}
        .rx b{font-weight:600}
        .btn-primary{background:#1677ff;color:#fff;border:none;border-radius:8px;padding:10px 14px;cursor:pointer}
        .rec-commend-by{font-weight:600}
        .rec-commend-sub{color:#7a7a7a;font-size:12px}

        /* giver chip */
        .rec-giver{display:inline-flex;align-items:center;gap:8px;background:#f8f9fb;border-radius:14px;padding:10px 12px;margin:8px 0 16px 0;font-size:12px;color:#555}
        .rec-giver img{width:22px;height:22px;border-radius:50%}
      </style>
      <div style="margin-bottom:14px">
        <button id="btn-add" class="btn-primary">Send Goreat Saada</button>
      </div>
      <div id="rec-grid" class="rec-grid"></div>`;

    $('#btn-add', this.domElement).on('click', () => {
      location.href = `${this.context.pageContext.web.absoluteUrl}/SitePages/GSaada.aspx#give`;
    });

    await this.loadCards();
  }
  
  private chunk<T>(arr: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));
  }
  private buildOrFilter(field: string, ids: number[]): string {
    return ids.map(id => `(${field} eq ${id})`).join(' or ');
  }

  private async loadCards() {
    const doses = await this.sp.web.lists.getByTitle('GSaada_Doses').items
      .select('Id,Title,Message,GiftType,Status,ToUser/Id,ToUser/Title,ToUser/EMail,FromUser/Id,FromUser/Title,FromUser/EMail')
      .expand('ToUser,FromUser')
      .filter("(Status eq 'Approved') or (Status eq 'Paid')")
      .orderBy('Id', false)
      .top(10)();

    const doseIds = doses.map(d => d.Id);
    const reactions = await this.getReactions(doseIds);

    const $grid = $('#rec-grid', this.domElement).empty();
    for (const d of doses) {
      const r = reactions[d.Id] || { Medal:{count:0,users:[]}, Heart:{count:0,users:[]}, Clap:{count:0,users:[]} };
      const meRx = {
        Medal: r.Medal.users.some(u=>u.Id===this.meId),
        Heart: r.Heart.users.some(u=>u.Id===this.meId),
        Clap:  r.Clap.users.some(u=>u.Id===this.meId),
      };

      const toEmail = (d as any).ToUser?.EMail || '';
      const toPhoto = toEmail ? this.photoUrl(toEmail) : await this.photoUrlFromUserId(d.ToUser.Id);

      const fromEmail = (d as any).FromUser?.EMail || '';
      const fromPhoto = fromEmail ? this.photoUrl(fromEmail) : await this.photoUrlFromUserId(d.FromUser.Id);

      const card = $(`
        <div class="rec-card" data-id="${d.Id}">
          <div class="rec-header">
            <img src="${toPhoto}" width="80" height="80" alt="${d.ToUser.Title}" style="border-radius:50%">
            <div>
              <!--<div class="rec-commend-by">${d.ToUser.Title}</div>-->
              <!--<div class="rec-commend-sub">Commended by: ${d.FromUser.Title}</div>-->
              <div class="rec-chip">
                
                <div>
                  <div style="font-weight:700">${d.ToUser.Title}</div>
                  <!--<a style="text-decoration:none;color:#1677ff">${d.GiftType || 'Recognition'}</a>-->
                </div>
              </div>
            </div>
          </div>

          
          <div class="rec-msg"><span>🏆 </span>${(d as any).Message || ''}</div>

          <div class="rec-giver" title="Goreat Saada given by ${d.FromUser.Title}">
            <img src="${fromPhoto}" alt="${d.FromUser.Title}">
            <span>sent by ${d.FromUser.Title}</span>
          </div>

          <div class="rec-reactions">
            ${this.rxHtml('Medal','🥇',r.Medal.count,meRx.Medal)}
            ${this.rxHtml('Heart','💖',r.Heart.count,meRx.Heart)}
            ${this.rxHtml('Clap','👏',r.Clap.count,meRx.Clap)}
          </div>
        </div>
      `);

      card.on('click', '.rx[data-type]', async (ev) => {
        const $btn = $(ev.currentTarget);
        const type = $btn.data('type') as ReactionType;
        await this.toggleReaction(d.Id, type);
        $btn.toggleClass('me');
        const n = Number($btn.find('b').text() || '0');
        const plus = $btn.hasClass('me') ? 1 : -1;
        $btn.find('b').text(String(Math.max(0, n + plus)));
      });

      card.on('click', '.rx b', async (ev) => {
        ev.stopPropagation();
        const type = ($(ev.currentTarget).closest('.rx').data('type')) as ReactionType;
        const users = (reactions[d.Id] && reactions[d.Id][type]?.users) || [];
        this.showUsersPopover(ev.currentTarget as HTMLElement, type, users);
      });

      $grid.append(card);
    }
  }

  private rxHtml(type: ReactionType, icon: string, count: number, me: boolean) {
    return `<div class="rx ${me?'me':''}" data-type="${type}" title="${type}"><i>${icon}</i><b>${count}</b></div>`;
  }

  private photoUrl(accountNameOrEmail: string) {
    if (!accountNameOrEmail) return `${this.context.pageContext.web.absoluteUrl}/_layouts/15/images/person.gif`;
    return `${this.context.pageContext.web.absoluteUrl}/_layouts/15/userphoto.aspx?size=S&accountname=${encodeURIComponent(accountNameOrEmail)}`;
  }
  private async photoUrlFromUserId(userId: number) {
    try {
      const u = await this.sp.web.siteUsers.getById(userId)();
      const login = (u as any).LoginName || (u as any).Email || (u as any).UserPrincipalName || '';
      if (!login) return `${this.context.pageContext.web.absoluteUrl}/_layouts/15/images/person.gif`;
      return `${this.context.pageContext.web.absoluteUrl}/_layouts/15/userphoto.aspx?size=S&accountname=${encodeURIComponent(login)}`;
    } catch {
      return `${this.context.pageContext.web.absoluteUrl}/_layouts/15/images/person.gif`;
    }
  }

  private async getReactions(doseIds: number[]): Promise<RxMap> {
    const map: RxMap = {};
    if (!doseIds.length) return map;

    doseIds.forEach(id => { map[id] = { Medal:{count:0,users:[]}, Heart:{count:0,users:[]}, Clap:{count:0,users:[]} }; });

    const list = this.sp.web.lists.getByTitle('GSaada_Reactions');
    const groups = this.chunk(doseIds, 20);
    for (const group of groups) {
      const filter = this.buildOrFilter('DoseId', group);
      const rx = await list.items
        .select(`Id,Title,DoseId,${RX_FIELD},Author/Id,Author/Title`)
        .expand('Author')
        .filter(filter)
        .top(5000)();

      rx.forEach((r: any) => {
        const id = r.DoseId as number;
        const type = r[RX_FIELD] as ReactionType;
        if (!map[id]) map[id] = { Medal:{count:0,users:[]}, Heart:{count:0,users:[]}, Clap:{count:0,users:[]} };
        map[id][type].count += 1;
        map[id][type].users.push({ Id: r.Author?.Id || 0, Title: r.Author?.Title || 'Unknown' });
      });
    }

    return map;
  }

  private async toggleReaction(doseId: number, type: ReactionType) {
    const key = `${doseId}|${this.meId}|${type}`;
    const list = this.sp.web.lists.getByTitle('GSaada_Reactions');
    const existing = await list.items.select('Id').filter(`Title eq '${key.replace(/'/g, "''")}'`).top(1)();
    if (existing.length) {
      await list.items.getById(existing[0].Id).delete();
      return;
    }
    const payload: any = { Title: key, DoseId: doseId, ById: this.meId };
    payload[RX_FIELD] = type;
    await list.items.add(payload);
  }

  private showUsersPopover(targetEl: HTMLElement, type: string, users: { Id: number; Title: string }[]): void {
    $('#rx-popover').remove();
    const $pop = $('<div id="rx-popover"></div>').appendTo('body');

    const html = users.length
      ? `<ul style="margin:0;padding:0;list-style:none;max-height:200px;overflow:auto">
           ${users.map(u => `<li style="padding:6px 8px;border-bottom:1px solid #eee">${u.Title}</li>`).join('')}
         </ul>`
      : `<div style="padding:8px 12px;color:#777">No reactions yet</div>`;

    const popover = ($pop as any).dxPopover({
      target: targetEl,
      showEvent: 'dxclick',
      hideEvent: 'mouseleave',
      position: 'bottom',
      width: 220,
      shading: false,
      closeOnOutsideClick: true,
      contentTemplate: () => {
        const $content = $('<div>');
        $content.append(`<div style="font-weight:600;margin-bottom:6px">${type} by</div>`);
        $content.append(html);
        return $content;
      }
    }).dxPopover('instance');

    popover.show();
  }
  
}
