import * as React from "react";
import "./newsWebpart.scss";
import { Icon } from "@fluentui/react";
import { SPFI } from "@pnp/sp";

// NOTE: This file assumes you've already configured PnPjs and pass `sp` in props.

export interface INewsItem {
  id: number;
  title: string;
  subtitle?: string;
  description: string;
  date: string;
  image: string;
  url: string;
}

interface INewsBoxProps {
  sp: SPFI;
  top?: number;
  listTitle: string; // e.g. "Site Pages"
}

interface INewsBoxState {
  items: INewsItem[];
  loading: boolean;
  error: string | null;
}

export default class NewsBox extends React.Component<INewsBoxProps, INewsBoxState> {
  constructor(props: INewsBoxProps) {
    super(props);

    this.state = {
      items: [],
      loading: true,
      error: null
    };
  }

  public componentDidMount(): void {
    void this.loadNews();
  }

  public componentDidUpdate(prevProps: INewsBoxProps): void {
    if (
      prevProps.listTitle !== this.props.listTitle ||
      prevProps.top !== this.props.top ||
      prevProps.sp !== this.props.sp
    ) {
      void this.loadNews();
    }
  }

  private _safeText(v: unknown): string {
    if (typeof v === "string") return v;
    if (v === null || v === undefined) return "";
    return String(v);
  }

  private _formatDate(value: unknown): string {
    // SharePoint may return ISO strings; keep it safe.
    const s = this._safeText(value);
    if (!s) return "";
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toLocaleDateString();
  }

  private _parseBannerImageUrl(raw: unknown): string {
    // BannerImageUrl is often JSON in modern pages/news.
    // Examples seen in SPO: {"serverRelativeUrl": "..."} or {"Url":"..."} etc.
    if (!raw) return "";

    if (typeof raw === "string") {
      const trimmed = raw.trim();

      // Try JSON
      if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
        try {
          const obj = JSON.parse(trimmed);
          // common shapes
          const url =
            obj?.serverRelativeUrl ||
            obj?.ServerRelativeUrl ||
            obj?.Url ||
            obj?.url ||
            obj?.siteUrl ||
            "";
          return this._safeText(url);
        } catch {
          // If it's not valid JSON, maybe it's already a URL.
        }
      }

      // If it's already a URL/relative URL, return as-is
      return trimmed;
    }

    // Sometimes it can be object already
    const anyObj = raw as any;
    return this._safeText(
      anyObj?.serverRelativeUrl ||
        anyObj?.ServerRelativeUrl ||
        anyObj?.Url ||
        anyObj?.url ||
        ""
    );
  }

  private async loadNews(): Promise<void> {
    const { sp, listTitle } = this.props;
    const top = this.props.top ?? 10;

    this.setState({ loading: true, error: null });

    try {
      // For modern news posts, PromotedState is commonly used.
      // If your tenant uses a different pattern, adjust this filter accordingly.
      const rows: any[] = await sp.web.lists
        .getByTitle(listTitle)
        .items
        .select(
          "Id",
          "Title",
          "Description",
          "FileRef",
          "PromotedState",
          "FirstPublishedDate",
          "BannerImageUrl"
        )
        .filter("PromotedState eq 2")
        .orderBy("FirstPublishedDate", false)
        .top(top)();

      const items: INewsItem[] = rows.map((r) => {
        const fileRef = this._safeText(r?.FileRef);
        const image = this._parseBannerImageUrl(r?.BannerImageUrl);

        return {
          id: Number(r?.Id),
          title: this._safeText(r?.Title),
          subtitle: "", // keep for your UI; set if you have a field you want to show here
          description: this._safeText(r?.Description),
          date: this._formatDate(r?.FirstPublishedDate),
          image: image || "", // you can set a fallback image below in render
          url: fileRef || "#"
        };
      });

      this.setState({ items, loading: false, error: null });
    } catch (e: any) {
      this.setState({
        items: [],
        loading: false,
        error: this._safeText(e?.message || e)
      });
      // optional console log
      // console.log("[News] Error:", e);
    }
  }

  public render(): React.ReactElement<INewsBoxProps> {
    const isAr = window.location.href.toLowerCase().includes("/ar/");
    const { items, loading, error } = this.state;

    const featuredNews = items.length > 0 ? items[0] : null;
    const newsList = items.length > 1 ? items.slice(1) : [];

    // Fallback image if BannerImageUrl is missing
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    // const fallbackImg = require("../../theme/images/newsSide.jpg");
    const fallbackImg = items[0].image;

    return (
      <>
        <div className="col-12 col-md-6 col-lg-5">
          <img className="newsBigImg" src={fallbackImg} alt="news" />
        </div>

        <div className="col-12 col-md-6 col-lg-7">
          <div className="component-header">
            <h2>{isAr ? "الأخبار والإعلانات" : "News & Announcements"}</h2>

            {/* IMPORTANT: Use <a> for external SharePoint pages (not react-router Link) */}
            <a
              href="https://v0tq5.sharepoint.com/sites/HubSite/_layouts/15/news.aspx"
              className="viewAllBtn"
              target="_blank"
              rel="noopener noreferrer"
            >
              {isAr ? "عرض الكل" : "View all"}
              <Icon iconName="ChevronRightMed" />
            </a>
          </div>

          <div className="News-home">
            {loading && <div>Loading...</div>}
            {!loading && error && <div>Error: {error}</div>}

            {!loading && !error && featuredNews && (
              <>
                {/* Featured Big News */}
                <div className="news-home-big">
                  <h5>{featuredNews.title}</h5>
                  {featuredNews.subtitle ? <h3>{featuredNews.subtitle}</h3> : null}

                  {/* If you don't need HTML, replace this with: <p>{featuredNews.description}</p> */}
                  <p dangerouslySetInnerHTML={{ __html: featuredNews.description }} />

                  <small>{featuredNews.date}</small>

                  {/* Make the featured block clickable (optional) */}
                  {/* <a href={featuredNews.url}>Open</a> */}
                </div>

                {/* News List */}
                <div className="news-list-home">
                  {newsList.map((item) => (
                    <div className="news-item-home" key={item.id}>
                      <img src={item.image || fallbackImg} alt="news" />

                      <div>
                        <h5>{item.title}</h5>

                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {item.subtitle || (isAr ? "اقرأ المزيد" : "Read more")}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!loading && !error && !featuredNews && (
              <div>{isAr ? "لا توجد أخبار." : "No news found."}</div>
            )}
          </div>
        </div>
      </>
    );
  }
}
