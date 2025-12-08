import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';

import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import * as React from 'react';
import * as ReactDom from 'react-dom';

import { SPFx, spfi, SPFI } from "@pnp/sp";
import PortalTiles, { IPortalTilesProps } from './components/PortalTiles';


export interface IPortalTilesWebPartProps {
  description: string;
  tilesListTitle: string;
}

export default class PortalTilesWebPart extends BaseClientSideWebPart<IPortalTilesWebPartProps> {


    private _sp: SPFI;

  public async onInit(): Promise<void> {
    await super.onInit();
    this._sp = spfi().using(SPFx(this.context));
  }

  public render(): void {

    const element: React.ReactElement<IPortalTilesProps> = React.createElement(
      PortalTiles,
      {
        sp: this._sp,
        listTitle: this.properties.tilesListTitle,
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
          header: { description: "Portal Tiles Configuration" },
          groups: [
            {
              groupName: "Main Settings",
              groupFields: [
                PropertyPaneTextField("tilesListTitle", {
                  label: "Tiles List Title"
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
