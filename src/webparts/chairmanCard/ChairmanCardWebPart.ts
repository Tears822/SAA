import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from "@microsoft/sp-core-library";
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from "@microsoft/sp-property-pane";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import * as strings from "ChairmanCardWebPartStrings";
import { SPFI, spfi, SPFx } from "@pnp/sp";
import "@pnp/sp";
import "@pnp/sp/items";
import "@pnp/sp/lists";
import "@pnp/sp/webs";


import ChairmanCard, { IChairmanCardProps } from './components/ChairmanCard';

export interface IChairmanCardWebPartProps {
  listTitle: string;
}

export default class ChairmanCardWebPart extends BaseClientSideWebPart<IChairmanCardWebPartProps> {

  private _sp: SPFI;

  public async onInit(): Promise<void> {
    await super.onInit();
    this._sp = spfi().using(SPFx(this.context));
  }

  public render(): void {

    const element: React.ReactElement<IChairmanCardProps> = React.createElement(
      ChairmanCard,
      {
        listTitle: this.properties.listTitle || "Leaders",
        sp: this._sp,
        webUrl: this.context.pageContext.web.absoluteUrl
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse("1.0");
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: "Chairman card settings",
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField("listTitle", {
                  label: "List Title",
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
