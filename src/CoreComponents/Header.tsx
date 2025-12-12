import * as React from 'react';
import { IconButton } from '@fluentui/react/lib/Button';
import "./componets.scss";
import SearchComponent from './searchbox';
import { Icon } from '@fluentui/react';
import { ApplicationCustomizerContext } from '@microsoft/sp-application-base';
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';


export interface IHeaderState {
   menuOpen: boolean;
   userBoxOpen: boolean;
   langOpen: boolean;
   user?: IUserInfo | null;
   siteLogo: string;
   navigationNodes: INavigationNode[];
   loading: boolean;
   selectedLang: 'en' | 'ar';
}

export interface IHeaderProps {
   context: ApplicationCustomizerContext;
}

export interface IUserInfo {
   displayName: string;
   email: string;
   title?: string;
   pictureUrl?: string;
}

export interface INavigationNode {
   Id: number;
   Title: string;
   TitleAr: string;
   Url: string;
   IsExternal: boolean;
   Children?: INavigationNode[];
}

const navigationNodesStatic: INavigationNode[] = [
   {
      Id: 1,
      Title: "Employee Hub",
      TitleAr: "بوابة الموظف",
      Url: "#",
      IsExternal: false,
      Children: []
   },
   {
      Id: 2,
      Title: "Tawasul",
      TitleAr: "تواصل",
      Url: "#",
      IsExternal: false,
      Children: [
         { Id: 21, Title: "News", TitleAr: "الأخبار", Url: "#", IsExternal: false, Children: [] },
         { Id: 22, Title: "Announcements", TitleAr: "الإعلانات", Url: "#", IsExternal: false, Children: [] },
         { Id: 23, Title: "InternalJobs", TitleAr: "الوظائف الداخلية", Url: "#", IsExternal: false, Children: [] },
         { Id: 24, Title: "Surveys", TitleAr: "الاستبيانات", Url: "#", IsExternal: false, Children: [] }
      ]
   },
   {
      Id: 3,
      Title: "Matari",
      TitleAr: "مطاري",
      Url: "#",
      IsExternal: false,
      Children: [
         { Id: 31, Title: "Matari Program", TitleAr: "برنامج مطاري", Url: "#", IsExternal: false, Children: [] },
         { Id: 32, Title: "Nomination Process", TitleAr: "عملية الترشيح", Url: "#", IsExternal: false, Children: [] }
      ]
   },
   {
      Id: 4,
      Title: "About",
      TitleAr: "عن الهيئة",
      Url: "#",
      IsExternal: false,
      Children: [
         { Id: 41, Title: "SAA Strategy", TitleAr: "استراتيجية الهيئة", Url: "#", IsExternal: false, Children: [] },
         { Id: 42, Title: "SAA Organizational Structure", TitleAr: "الهيكل التنظيمي للهيئة", Url: "#", IsExternal: false, Children: [] }
      ]
   }
];



class HeaderPageComponent extends React.Component<IHeaderProps, IHeaderState> {

   constructor(props: IHeaderProps) {
      super(props);
      const autoLang = window.location.href.toLowerCase().includes("ar") ? "ar" : "en";
      this.state = {
         langOpen: false,
         menuOpen: false,
         userBoxOpen: false,
         user: null,
         siteLogo: require('../theme/images/logo.svg'),
         navigationNodes: [],
         loading: true,
         selectedLang: autoLang,
      };
   }


   async componentDidMount() {
      this.applyLanguageDirection(this.state.selectedLang);
      this.loadSiteLogo();
      this.loadNavigation();
      this.loadUserInfo();
   }

   private applyLanguageDirection(lang: 'en' | 'ar') {
      if (lang === "ar") {
         document.body.classList.add("arLang");
      } else {
         document.body.classList.remove("arLang");
      }
   }

   /**
    * Load site logo from SharePoint site settings
    */
   private loadSiteLogo = async (): Promise<void> => {
      try {
         const { context } = this.props;
         const siteUrl = context.pageContext.web.absoluteUrl;

         // Get site logo URL from web properties
         const response: SPHttpClientResponse = await context.spHttpClient.get(
            `${siteUrl}/_api/web?$select=SiteLogoUrl`,
            SPHttpClient.configurations.v1
         );

         if (response.ok) {
            const data = await response.json();
            if (data.SiteLogoUrl) {
               this.setState({ siteLogo: data.SiteLogoUrl });
            }
         }
      } catch (error) {
         console.error('Error loading site logo:', error);

      }
   };

   /**
    * Load navigation from SharePoint top navigation
    */
   private loadNavigation = async (): Promise<void> => {
      try {
         const { context } = this.props;
         const siteUrl = context.pageContext.web.absoluteUrl;

         // Get top navigation nodes
         const response: SPHttpClientResponse = await context.spHttpClient.get(
            `${siteUrl}/_api/web/navigation/topnavigationbar?$expand=Children`,
            SPHttpClient.configurations.v1
         );

         if (response.ok) {
            const data = await response.json();
            const nodes: INavigationNode[] = data.value.map((node: any) => ({
               Id: node.Id,
               Title: node.Title,
               Url: node.Url,
               IsExternal: node.IsExternal,
               Children: node.Children?.results || []
            }));




            this.setState({ navigationNodes: navigationNodesStatic || nodes, loading: false });
         }
      } catch (error) {
         console.error('Error loading navigation:', error);
         this.setState({ loading: false });
      }
   };

   /**
    * Load current user information
    */
   private loadUserInfo = async (): Promise<void> => {
      try {
         const { context } = this.props;
         const siteUrl = context.pageContext.web.absoluteUrl;

         // Get current user profile picture
         const response: SPHttpClientResponse = await context.spHttpClient.get(
            `${siteUrl}/_api/SP.UserProfiles.PeopleManager/GetMyProperties`,
            SPHttpClient.configurations.v1
         );

         if (response.ok) {
            const data = await response.json();
            const pictureUrl = data.PictureUrl || null;

            this.setState({
               user: {
                  displayName: context.pageContext.user.displayName,
                  email: context.pageContext.user.email || '',
                  title: data.Title || '',
                  pictureUrl: pictureUrl
               }
            });
         }
      } catch (error) {
         console.error('Error loading user info:', error);
         // Set basic user info without picture
         this.setState({
            user: {
               displayName: this.props.context.pageContext.user.displayName,
               email: this.props.context.pageContext.user.email || '',
            }
         });
      }
   };

   private toggleMenu = (): void => {
      this.setState({ menuOpen: !this.state.menuOpen });
   };

   private toggleUserBox = (): void => {
      this.setState({ userBoxOpen: !this.state.userBoxOpen });
   };

   private handleSearch = (value: string) => {
      console.log('Search Value:', value);
      // Implement search functionality
      const searchUrl = `${this.props.context.pageContext.web.absoluteUrl}/_layouts/15/search.aspx?q=${encodeURIComponent(value)}`;
      window.location.href = searchUrl;
   };

   private toggleLangDropdown = (): void => {
      this.setState({ langOpen: !this.state.langOpen });
   };

   private openWaffle = (): void => {
      const anyWindow = window as any;

      if (anyWindow._spLaunchWaffle) {
         anyWindow._spLaunchWaffle();
      } else {
         console.warn("Waffle API not found. SuiteNav may be disabled.");
      }
   };

   private changeLang = (lng: 'en' | 'ar'): void => {
      this.setState({ selectedLang: lng, langOpen: false });
      this.applyLanguageDirection(lng);
   };

   private renderNavigationItems = (nodes: INavigationNode[]): JSX.Element[] => {
      const isAr = this.state.selectedLang === "ar";

      return nodes.map((node) => (
        <li key={node.Id}>
          <a href={node.Url} target={node.IsExternal ? "_blank" : "_self"}>
            {isAr ? node.TitleAr : node.Title}
          </a>

          {node.Children && node.Children.length > 0 && (
            <ul>
              {node.Children.map((child) => (
                <li key={child.Id}>
                  <a href={child.Url} target={child.IsExternal ? "_blank" : "_self"}>
                    {isAr ? child.TitleAr : child.Title}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </li>
      ));
   };


   public render(): React.ReactElement<{}> {
      const { siteLogo, navigationNodes, loading } = this.state;

      return (
         <div className="navigationContainer">
            <div className="container">
               <div className='top-Bar'>
                  <Icon
                     iconName="WaffleOffice365"
                     className='openAppsIcon'
                     onClick={this.openWaffle}
                  />

                  <a href={this.props.context.pageContext.web.absoluteUrl} className="brand">
                     <img
                        src={siteLogo}
                        alt="Site Logo"
                        onError={(e) => {
                           (e.target as HTMLImageElement).src = require('../theme/images/logo.svg');
                        }}
                     />
                  </a>
                  <img src={require('../theme/images/triangles.svg')} className='traingleBg' />

                  <SearchComponent placeholder="Search..." onSearch={this.handleSearch} />

                  {this.state.user && (
                     <>
                        <div className='user-box'>
                           <img
                              src={this.state.user.pictureUrl || require('../theme/images/default-user.jpg')}
                              alt={this.state.user.displayName || "User"}
                              onError={(e) => {
                                 (e.target as HTMLImageElement).src = require('../theme/images/default-user.jpg');
                              }}
                              onClick={this.toggleUserBox}
                           />
                        </div>

                        {this.state.userBoxOpen && (

                           <div className='user-profile-box'>

                              <Icon onClick={this.toggleUserBox} iconName='ChromeClose' className='close-user-profile' />
                              <div className='curr-user'>
                                 <img
                                    src={this.state.user.pictureUrl
                                       ? this.state.user.pictureUrl
                                       : require('../theme/images/default-user.png')}
                                    alt={this.state.user.displayName || "User"}
                                    onError={(e) => {
                                       (e.target as HTMLImageElement).src = require('../theme/images/default-user.png');
                                    }}
                                 />
                                 <div>
                                    <h3>{this.state.user.displayName}</h3>
                                    <h4>{this.state.user.title}</h4>
                                 </div>
                              </div>

                              <div className="tiles">
                                 <a id="cucTileProfile" className="tilePurple" target="_blank" rel="noopener">
                                    <Icon iconName='TeamsLogo' />
                                    <label>Profile</label>
                                 </a>
                                 <a id="cucTileEmail" className="tileGreen">
                                    <Icon iconName='Mail' />
                                    <label>Email</label>
                                 </a>
                                 <a id="cucTileOneDrive" className="tileOrange" target="_blank" rel="noopener">
                                    <Icon iconName='OneDriveLogo' />
                                    <label>OneDrive</label>
                                 </a>
                                 <a id="cucTileTeams" className="tilePeach" target="_blank" rel="noopener">
                                    <Icon iconName='TeamsLogo' />
                                    <label>Teams</label>
                                 </a>
                                 <a id="cucTileFav" className="tileFav" target="_blank" rel="noopener">
                                    <Icon iconName='FavoriteStar' />
                                    <label>Favorites</label>
                                 </a>
                                 <a id="cucTileTasks" className="tileMint" target="_blank" rel="noopener">
                                    <Icon iconName='BulletedList2' />
                                    <label>My Tasks</label>
                                 </a>
                              </div>
                           </div>

                        )}
                     </>
                  )}

                  <div className="lang-switcher">
                     <div className="selected-lang" onClick={this.toggleLangDropdown}>
                        {this.state.selectedLang.toUpperCase()} <Icon iconName='ChevronDownMed' />
                     </div>
                     {this.state.langOpen && (
                        <ul className="lang-dropdown">
                           {['en', 'ar']
                              .filter(l => l !== this.state.selectedLang)
                              .map(lang => (
                                 <li key={lang} onClick={() => this.changeLang(lang as 'en' | 'ar')}>
                                    {lang.toUpperCase()}
                                 </li>
                              ))}
                        </ul>

                     )}
                  </div>
               </div>
            </div>

            <div className="bottom-Bar">
               <div className="container">
                  <div className="navbar">
                     {loading ? (
                        <div className="loading">Loading navigation...</div>
                     ) : (
                        <ul className="navLinks">
                           {this.renderNavigationItems(navigationNodes)}
                        </ul>
                     )}

                     <IconButton
                        className="hamburger"
                        iconProps={{ iconName: 'GlobalNavButton' }}
                        onClick={this.toggleMenu}
                     />
                  </div>
               </div>
            </div>

            <div className={this.state.menuOpen ? "mobileMenu open" : "mobileMenu"}>
               <ul>
                  {this.renderNavigationItems(navigationNodes)}
               </ul>
            </div>
         </div>
      );
   }
}

export default HeaderPageComponent;