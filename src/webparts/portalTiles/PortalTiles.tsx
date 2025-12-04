import * as React from "react";
import { FC } from "react";
import { SPFI } from "@pnp/sp";
import { Icon } from "@fluentui/react";

export interface IPortalTilesProps {
    sp: SPFI;
    listTitle: string;
    webUrl: string;
}



const PortalTiles: FC<IPortalTilesProps> = ({ sp, listTitle, webUrl }) => {


    return (
        <div className="outer">
            <div className="band bandApps">
                <div className="bandLabel">Apps &amp; Systems</div>
                <div className="tilesRow tilesRowApps">
                    <a className="appTile" href="#" title="app1">
                        <div className="appTileInner">
                            <img className="appIcon" src={require("../../theme/images/appsIcons/app1.png")} alt="app" />
                        </div>
                    </a>
                    <a className="appTile" href="#" title="app1">
                        <div className="appTileInner">
                            <img className="appIcon" src={require("../../theme/images/appsIcons/app2.svg")} alt="app" />
                        </div>
                    </a>
                    <a className="appTile" href="#" title="app1">
                        <div className="appTileInner">
                            <img className="appIcon" src={require("../../theme/images/appsIcons/app3.svg")} alt="app" />
                        </div>
                    </a>
                    <a className="appTile" href="#" title="app1">
                        <div className="appTileInner">
                            <img className="appIcon" src={require("../../theme/images/appsIcons/app4.svg")} alt="app" />
                        </div>
                    </a>
                    <a className="appTile" href="#" title="app1">
                        <div className="appTileInner">
                            <img className="appIcon" src={require("../../theme/images/appsIcons/app5.svg")} alt="app" />
                        </div>
                    </a>
                    <a className="appTile" href="#" title="app1">
                        <div className="appTileInner">
                            <img className="appIcon" src={require("../../theme/images/appsIcons/app6.svg")} alt="app" />
                        </div>
                    </a>
                    <a className="appTile" href="#" title="app1">
                        <div className="appTileInner">
                            <img className="appIcon" src={require("../../theme/images/appsIcons/app7.svg")} alt="app" />
                        </div>
                    </a>
                    <a className="appTile" href="#" title="app1">
                        <div className="appTileInner">
                            <img className="appIcon" src={require("../../theme/images/appsIcons/app8.svg")} alt="app" />
                        </div>
                    </a>
                    <a className="appTile" href="#" title="app1">
                        <div className="appTileInner">
                            <img className="appIcon" src={require("../../theme/images/appsIcons/app9.svg")} alt="app" />
                        </div>
                    </a>
                    <a className="appTile" href="#" title="app1">
                        <div className="appTileInner">
                            <img className="appIcon" src={require("../../theme/images/appsIcons/app10.svg")} alt="app" />
                        </div>
                    </a>
                </div>
            </div>

            <div className="band bandServices">
                <div className="bandLabel">Services</div>
                <div className="tilesRow tilesRowServices">
                    <a className="serviceTile" href="#" title="#" style={{ background: "#EAC086" }}>
                        <div className="serviceTileInner">
                            <img className="serviceIcon" src={require("../../theme/images/serviceIcons/icon1.svg")} alt="" />
                            <span className="serviceTitle">Matari</span>
                        </div>
                    </a>
                    <a className="serviceTile" href="#" title="#" style={{ background: "#ABA2D0" }}>
                        <div className="serviceTileInner">
                            <img className="serviceIcon" src={require("../../theme/images/serviceIcons/icon2.svg")} alt="" />
                            <span className="serviceTitle">Goreat Saada</span>
                        </div>
                    </a>
                    <a className="serviceTile" href="#" title="#" style={{ background: "#C3CBDB" }}>
                        <div className="serviceTileInner">
                            <img className="serviceIcon" src={require("../../theme/images/serviceIcons/icon3.svg")} alt="" />
                            <span className="serviceTitle">MCC</span>
                        </div>
                    </a>
                    <a className="serviceTile" href="#" title="#" style={{ background: "#C3DBD2" }}>
                        <div className="serviceTileInner">
                            <img className="serviceIcon" src={require("../../theme/images/serviceIcons/icon4.svg")} alt="" />
                            <span className="serviceTitle">Procurement</span>
                        </div>
                    </a>
                    <a className="serviceTile" href="#" title="#" style={{ background: "#FFBB91" }}>
                        <div className="serviceTileInner">
                            <img className="serviceIcon" src={require("../../theme/images/serviceIcons/icon5.svg")} alt="" />
                            <span className="serviceTitle">HR</span>
                        </div>
                    </a>
                    <a className="serviceTile" href="#" title="#" style={{ background: "#A3D5BD" }}>
                        <div className="serviceTileInner">
                            <img className="serviceIcon" src={require("../../theme/images/serviceIcons/icon6.svg")} alt="" />
                            <span className="serviceTitle">Ibtkari</span>
                        </div>
                    </a>
                    <a className="serviceTile" href="#" title="#" style={{ background: "#ACCDE0" }}>
                        <div className="serviceTileInner">
                            <Icon iconName='FavoriteStar' />
                            <span className="serviceTitle">Favorites</span>
                        </div>
                    </a>
                    <a className="serviceTile" href="#" title="#" style={{ background: "#FAB599" }}>
                        <div className="serviceTileInner">
                            <Icon iconName='TeamsLogo' />
                            <span className="serviceTitle">Teams</span>
                        </div>
                    </a>
                    <a className="serviceTile" href="#" title="#" style={{ background: "#F58B6E" }}>
                        <div className="serviceTileInner">
                            <Icon iconName='OneDriveLogo' />
                            <span className="serviceTitle">OneDrive</span>
                        </div>
                    </a>
                    <a className="serviceTile" href="#" title="#" style={{ background: "#C3DBD2" }}>
                        <div className="serviceTileInner">
                            <Icon iconName='BulletedList2' />
                            <span className="serviceTitle">My Tasks</span>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    );
};
export default PortalTiles;
