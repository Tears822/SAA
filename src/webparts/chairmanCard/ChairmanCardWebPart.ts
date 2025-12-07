
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from "@microsoft/sp-core-library";
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from "@microsoft/sp-property-pane";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";

import * as strings from "ChairmanCardWebPartStrings";
import { SPFI, spfi, SPFx } from "@pnp/sp";
import ChairmanCard, { IChairmanCardProps } from './components/ChairmanCard';


export interface IChairmanCardWebPartProps {
  listTitle: string;
}

export default class ChairmanCardWebPart extends BaseClientSideWebPart<IChairmanCardWebPartProps> {
  private _sp: SPFI;

  public render(): void {
    const element: React.ReactElement<IChairmanCardProps> = React.createElement(
      ChairmanCard,
      {
        listTitle: this.properties.listTitle || "Leaders",
        sp: this.sp,
        webUrl: this.context.pageContext.web.serverRelativeUrl.replace(/\/$/, '')
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    this._sp = spfi().using(SPFx(this.context));
    return super.onInit();
  }

  private get sp(): SPFI {
    if (!this._sp) {
      this._sp = spfi().using(SPFx(this.context));
    }
    return this._sp;
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