import * as React from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import { SPFI } from '@pnp/sp';
import './PortalTilesWebPart.scss';


interface ITileItem {
  Id: number;
  Title: string;
  Category: string;
  Url: { Url: string; Description: string };
  IconUrl: string;
  BgColor: string;
}

export interface IPortalTilesProps {
  sp: SPFI;
  listTitle: string;
  webUrl: string;
}

export interface IPortalTilesState {
  apps: ITileItem[];
  services: ITileItem[];
  loading: boolean;
  error: string | null;
}

export default class PortalTiles extends React.Component<IPortalTilesProps, IPortalTilesState> {
  constructor(props: IPortalTilesProps) {
    super(props);
    this.state = {
      apps: [],
      services: [],
      loading: true,
      error: null
    };
  }

  public componentDidMount(): void {
    this.loadTiles();
  }

  public componentDidUpdate(prevProps: IPortalTilesProps): void {
    if (prevProps.listTitle !== this.props.listTitle) {
      this.loadTiles();
    }
  }

  private async loadTiles(): Promise<void> {
    try {
      this.setState({ loading: true, error: null });

      const listTitle = this.props.listTitle || "PortalTiles";

      const items: ITileItem[] = await this.props.sp.web.lists
        .getByTitle(listTitle)
        .items.select("Id", "Title", "Category", "Url", "IconUrl", "BgColor")
        .top(200)();

      const tiles: ITileItem[] = items.map((i: any) => {
        let iconUrl = '';

        if (i.IconUrl) {
          try {
            const imgInfo = JSON.parse(i.IconUrl);
            if (imgInfo.fileName) {
              iconUrl =
                `${this.props.webUrl}/Lists/${encodeURIComponent(listTitle)}` +
                `/Attachments/${i.Id}/${encodeURIComponent(imgInfo.fileName)}`;
            }
          } catch (e) {
            console.warn('ImageUrl is not valid JSON', e);
          }
        }

        return {
          Id: i.Id,
          Title: i.Title || '',
          Category: i.Category || '',
          Url: i.Url || '',
          IconUrl: iconUrl || '',
          BgColor: i.BgColor || ''
        };
      });

      const apps = tiles.filter(i => i.Category === "Apps");
      const services = tiles.filter(i => i.Category === "Services");

      this.setState({ apps, services, loading: false });
    } catch (error) {
      console.error('Error loading tiles:', error);
      this.setState({ 
        error: 'Failed to load tiles', 
        loading: false 
      });
    }
  }

  private renderAppTile = (tile: ITileItem): JSX.Element => {
    const url = tile.Url ? tile.Url.Url : "#";
    const title = tile.Title || "";
    const iconUrl = tile.IconUrl || "";

    return (
      <a 
        key={tile.Id}
        className="appTile}"
        href={url} 
        title={title}
      >
        <div className="appTileInner">
          {iconUrl ? (
            <img 
              className="appIcon" 
              src={iconUrl} 
              alt={title} 
            />
          ) : (
            <span className="appInitials">
              {title.substring(0, 2).toUpperCase()}
            </span>
          )}
        </div>
      </a>
    );
  }

  private renderServiceTile = (tile: ITileItem): JSX.Element => {
    const url = tile.Url ? tile.Url.Url : "#";
    const title = tile.Title || "";
    const iconUrl = tile.IconUrl || "";
    const bg = tile.BgColor && tile.BgColor.trim() !== ""
      ? tile.BgColor
      : "#f3a76e";

    return (
      <a 
        key={tile.Id}
        className="serviceTile"
        href={url} 
        title={title}
        style={{ background: bg }}
      >
        <div className="serviceTileInner">
          {iconUrl ? (
            <img 
              className="serviceIcon" 
              src={iconUrl} 
              alt={title} 
            />
          ) : (
            <Icon iconName='TeamsLogo' />
          )}
          <span className="serviceTitle">{title}</span>
        </div>
      </a>
    );
  }

  public render(): React.ReactElement<IPortalTilesProps> {
    const { apps, services, loading, error } = this.state;

    if (loading) {
      return (
        <div className="outer">
          <div>Loading tiles...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="outer">
          <div>Error: {error}</div>
        </div>
      );
    }

    return (
      <div className="outer">
        <div className="band bandApps">
          <div className="bandLabel">Apps &amp; Systems</div>
          <div className="tilesRow tilesRowApps">
            {apps.map(tile => this.renderAppTile(tile))}
          </div>
        </div>

        <div className="band bandServices">
          <div className="bandLabel">Services</div>
          <div className="tilesRow tilesRowServices">
            {services.map(tile => this.renderServiceTile(tile))}
          </div>
        </div>
      </div>
    );
  }
}