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
import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/site-users/web";

const LOG_SOURCE: string = 'SaaMainApplicationCustomizer';

export interface ISaaMainApplicationCustomizerProperties {
}

export default class SaaMainApplicationCustomizer
  extends BaseApplicationCustomizer<ISaaMainApplicationCustomizerProperties> {

  private _topPlaceholder: PlaceholderContent | undefined;
  private _bottomPlaceholder: PlaceholderContent | undefined;
  private _scrollHandler: () => void;

  public async onInit(): Promise<void> {
    Log.info(LOG_SOURCE, `Initialized ${strings.Title}`);
    console.log('SaaMainApplicationCustomizer onInit called');

    this.context.placeholderProvider.changedEvent.add(this, this._renderPlaceHolders);

    // Initial render
    this._renderPlaceHolders();

    // Set up scroll handler
    this._scrollHandler = this._handleScroll.bind(this);
    window.addEventListener('scroll', this._scrollHandler);
    console.log('Scroll event listener added');

    const sp = spfi().using(SPFx(this.context));
    const user = (await sp.web.currentUser()).IsSiteAdmin;
    if (!user) {
      $("#spCommandBar").hide();
      $("#SuiteNavWrapper").hide();
      $("#O365_MainLink_Settings_container").hide();
      $("#O365_HeaderRightRegion").hide();
    }

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
        // Initially hide the footer
        // this._bottomPlaceholder.domElement.style.display = 'none';
      }
    }
  }

  private _handleScroll(): void {
    console.log('Scroll event triggered');
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    console.log(`ScrollTop: ${scrollTop}, WindowHeight: ${windowHeight}, DocumentHeight: ${documentHeight}`);

    // Show footer when scrolled to the bottom
    if (scrollTop + windowHeight >= documentHeight) { // 100px threshold
      console.log('Showing footer');
      if (this._bottomPlaceholder && this._bottomPlaceholder.domElement) {
        this._bottomPlaceholder.domElement.style.display = 'block';
      }
    } else {
      console.log('Hiding footer');
      if (this._bottomPlaceholder && this._bottomPlaceholder.domElement) {
        this._bottomPlaceholder.domElement.style.display = 'none';
      }
    }
  }

  private _onDispose(): void {
    console.log('[SaaMainApplicationCustomizer._onDispose] Disposed custom top and bottom placeholders.');
  }

  public onDispose(): Promise<void> {
    // Remove scroll event listener
    if (this._scrollHandler) {
      window.removeEventListener('scroll', this._scrollHandler);
    }

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