import * as React from 'react';
import { Link } from "react-router-dom";
import { withTranslation, WithTranslation } from 'react-i18next';
import { IconButton } from '@fluentui/react/lib/Button';
import "./componets.scss";
import SearchComponent from './searchbox';
import type { SPFI } from "@pnp/sp";
import { Icon } from '@fluentui/react';


export interface IHeaderState {
   menuOpen: boolean;
   userBoxOpen: boolean;
   langOpen: boolean;
   selectedLang: 'en' | 'ar';
   user?: IUserInfo | null;
}

export interface IHeaderProps {
   sp: SPFI;
}
export interface IUserInfo {
   displayName: string;
   email: string;
   title?: string;
   pictureUrl?: string;
}


class HeaderPageComponent extends React.Component<IHeaderProps & WithTranslation, IHeaderState> {

   constructor(props: any) {
      super(props);

      this.state = {
         langOpen: false,
         selectedLang: 'en',
         menuOpen: false,
         userBoxOpen: false,
         user: null
      };
   }

   componentDidMount() {
      this.fetchUser();
   }

   private toggleMenu = (): void => {
      this.setState({ menuOpen: !this.state.menuOpen });
   };

   private toggleUserBox = (): void => {
      this.setState({ userBoxOpen: !this.state.userBoxOpen });
   };

   private handleSearch = (value: string) => {
      console.log('Search Value:', value);
   };

   private toggleLangDropdown = (): void => {
      this.setState({ langOpen: !this.state.langOpen });
   };

   private changeLang = (lng: 'en' | 'ar'): void => {
      this.props.i18n.changeLanguage(lng);
      this.setState({ selectedLang: lng, langOpen: false }); // close dropdown
   };

   private fetchUser = async () => {
      try {
         const { sp } = this.props;
         const currentUser = await sp.web.currentUser();
         const pictureUrl = `${sp.web.toUrl()}/_layouts/15/userphoto.aspx?size=M&accountname=${currentUser.Email}`;
         this.setState({
            user: {
               displayName: currentUser.Title,
               email: currentUser.Email,
               title: currentUser.Title,
               pictureUrl
            }
         });
      } catch (err) {
         console.error("Error fetching user info", err);
      }
   }

   private openWaffle = (): void => {
      const anyWindow = window as any;

      if (anyWindow._spLaunchWaffle) {
         anyWindow._spLaunchWaffle();
      } else {
         console.warn("Waffle API not found. SuiteNav may be disabled.");
      }
   };
   public render(): React.ReactElement<{}> {
      const { t } = this.props;

      return (
         <div className="navigationContainer">


            <div className="container">
               <div className='top-Bar'>

                  <Icon
                     iconName="WaffleOffice365"
                     className='openAppsIcon'
                     onClick={this.openWaffle}
                  />

                  <Link to="/" className="brand">
                     <img src={require('../theme/images/logo.svg')} alt="Logo" />
                  </Link>
                  <img src={require('../theme/images/triangles.svg')} className='traingleBg' />

                  <SearchComponent placeholder="Search..." onSearch={this.handleSearch} />


                  {this.state.user &&
                     <>
                        <div className='user-box'>
                           <img
                              src={this.state.user.pictureUrl
                                 ? this.state.user.pictureUrl
                                 : require('../theme/images/default-user.jpg')}
                              alt={this.state.user.displayName || "User"}
                              onError={(e) => {
                                 (e.target as HTMLImageElement).src = require('../theme/images/default-user.jpg');
                              }}
                              onClick={this.toggleUserBox}
                           />
                        </div>

                        {this.state.userBoxOpen &&


                           <div className='user-profile-box'>

                              <Icon onClick={this.toggleUserBox} iconName='ChromeClose' className='close-user-profile' />
                              <div className='curr-user'>
                                 <img
                                    src={this.state.user.pictureUrl
                                       ? this.state.user.pictureUrl
                                       : require('../theme/images/default-user.jpg')}
                                    alt={this.state.user.displayName || "User"}
                                    onError={(e) => {
                                       (e.target as HTMLImageElement).src = require('../theme/images/default-user.jpg');
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
                        }
                     </>
                  }


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
                     <ul className="navLinks">
                        <li>
                           <Link to="/">{t('EmployeeHub')}</Link>
                        </li>

                        <li>
                           <Link to="/Tawasul">{t('Tawasul')}</Link>
                           <ul>
                              <li><Link to="/Tawasul/News">{t('News')}</Link></li>
                              <li><Link to="/Tawasul/Announcements">{t('Announcements')}</Link></li>
                              <li><Link to="/Tawasul/Announcements">{t('InternalJobs')}</Link></li>
                              <li><Link to="/Tawasul/Announcements">{t('Surveys')}</Link></li>
                           </ul>
                        </li>

                        <li>
                           <Link to="/Matari">{t('Matari')}</Link>
                           <ul>
                              <li><Link to="/Matari/Item1">{t('Matari Program')}</Link></li>
                              <li><Link to="/Matari/Item2">{t('Nomination Process')}</Link></li>
                           </ul>
                        </li>

                        <li>
                           <Link to="/About">{t('About')}</Link>
                           <ul>
                              <li><Link to="/Matari/Item1">{t('SAA Strategy')}</Link></li>
                              <li><Link to="/Matari/Item2">{t('SAA Organizational Structure')}</Link></li>
                           </ul>
                        </li>
                     </ul>


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
                  <li>
                     <Link to="/">{t('EmployeeHub')}</Link>
                  </li>

                  <li>
                     <Link to="/Tawasul">{t('Tawasul')}</Link>
                     <ul>
                        <li><Link to="/Tawasul/News">{t('News')}</Link></li>
                        <li><Link to="/Tawasul/Announcements">{t('Announcements')}</Link></li>
                        <li><Link to="/Tawasul/Announcements">{t('InternalJobs')}</Link></li>
                        <li><Link to="/Tawasul/Announcements">{t('Surveys')}</Link></li>
                     </ul>
                  </li>

                  <li>
                     <Link to="/Matari">{t('Matari')}</Link>
                     <ul>
                        <li><Link to="/Matari/Item1">{t('Matari Program')}</Link></li>
                        <li><Link to="/Matari/Item2">{t('Nomination Process')}</Link></li>
                     </ul>
                  </li>

                  <li>
                     <Link to="/About">{t('About')}</Link>
                     <ul>
                        <li><Link to="/Matari/Item1">{t('SAA Strategy')}</Link></li>
                        <li><Link to="/Matari/Item2">{t('SAA Organizational Structure')}</Link></li>
                     </ul>
                  </li>
               </ul>

               <div className="mobileLang">
                  <span onClick={() => this.changeLang('en')}>EN</span> |
                  <span onClick={() => this.changeLang('ar')}>AR</span>
               </div>
            </div>

         </div>

      );
   }
}

export default withTranslation()(HeaderPageComponent);
