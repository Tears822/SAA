import { Log } from '@microsoft/sp-core-library';
import {
  BaseApplicationCustomizer,
  PlaceholderContent,
  PlaceholderName
} from '@microsoft/sp-application-base';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import * as strings from 'SaaMainApplicationCustomizerStrings';
import { FooterPageComponent } from '../../CoreComponents/Footer';
import HeaderPageComponent from '../../CoreComponents/Header';

const LOG_SOURCE: string = 'SaaMainApplicationCustomizer';

export interface ISaaMainApplicationCustomizerProperties {
}

export default class SaaMainApplicationCustomizer
  extends BaseApplicationCustomizer<ISaaMainApplicationCustomizerProperties> {

  private _topPlaceholder: PlaceholderContent | undefined;
  private _bottomPlaceholder: PlaceholderContent | undefined;

  public onInit(): Promise<void> {
    Log.info(LOG_SOURCE, `Initialized ${strings.Title}`);

    this.context.placeholderProvider.changedEvent.add(this, this._renderPlaceHolders);
    
    // Initial render
    this._renderPlaceHolders();

    return Promise.resolve();
  }

  private _renderPlaceHolders(): void {
    if (!this._topPlaceholder) {
      this._topPlaceholder = this.context.placeholderProvider.tryCreateContent(
        PlaceholderName.Top,
        { onDispose: this._onDispose }
      );

      // Render the header
      if (this._topPlaceholder) {
        const element: React.ReactElement = React.createElement(
          HeaderPageComponent,
          {
            context: this.context
          }
        );
        ReactDOM.render(element, this._topPlaceholder.domElement);
      }
    }

    // Check if the footer placeholder is already set and if the bottom placeholder is available
    if (!this._bottomPlaceholder) {
      this._bottomPlaceholder = this.context.placeholderProvider.tryCreateContent(
        PlaceholderName.Bottom,
        { onDispose: this._onDispose }
      );

      // Render the footer
      if (this._bottomPlaceholder) {
        const element: React.ReactElement = React.createElement(
          FooterPageComponent,
          {
          }
        );
        ReactDOM.render(element, this._bottomPlaceholder.domElement);
      }
    }
  }

  private _onDispose(): void {
    console.log('[SaaMainApplicationCustomizer._onDispose] Disposed custom top and bottom placeholders.');
  }

  public onDispose(): Promise<void> {
    // Cleanup
    if (this._topPlaceholder && this._topPlaceholder.domElement) {
      ReactDOM.unmountComponentAtNode(this._topPlaceholder.domElement);
    }
    
    if (this._bottomPlaceholder && this._bottomPlaceholder.domElement) {
      ReactDOM.unmountComponentAtNode(this._bottomPlaceholder.domElement);
    }

    return Promise.resolve();
  }
}