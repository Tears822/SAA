import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from "@microsoft/sp-core-library";
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from "@microsoft/sp-property-pane";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import * as strings from "CurrentUserCardWebPartStrings";
import { SPFI, spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/profiles";

import CurrentUserCard, { ICurrentUserCardProps } from './components/CurrentUserCard';

export interface ICurrentUserCardWebPartProps {
  description: string;
}

export default class CurrentUserCardWebPart extends BaseClientSideWebPart<ICurrentUserCardWebPartProps> {

  private _sp: SPFI;

  public async onInit(): Promise<void> {
    await super.onInit();
    this._sp = spfi().using(SPFx(this.context));
  }

  public render(): void {

    const element: React.ReactElement<ICurrentUserCardProps> = React.createElement(
      CurrentUserCard,
      {
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
            description: "Current user card settings",
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