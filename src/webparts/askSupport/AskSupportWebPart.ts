import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import AskSupport, { IAskSupportProps } from './component/askSupport';

export interface IAskSupportWebPartProps {
  description: string;
  askItUrl: string;
  askAdminUrl: string;
}

export default class AskSupportWebPart extends BaseClientSideWebPart<IAskSupportWebPartProps> {

  public render(): void {
    const element: React.ReactElement<IAskSupportProps> = React.createElement(
      AskSupport,
      {
        askItUrl: this.properties.askItUrl,
        askAdminUrl: this.properties.askAdminUrl
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { 
            description: 'Links' 
          },
          groups: [
            {
              groupName: 'Settings',
              groupFields: [
                PropertyPaneTextField('askItUrl', {
                  label: 'ASK IT link'
                }),
                PropertyPaneTextField('askAdminUrl', {
                  label: 'ASK Admin link'
                })
              ]
            }
          ]
        }
      ]
    };
  }
}