import * as React from "react";
import { useEffect, useState } from "react";
import { SPFI } from "@pnp/sp";
import "@pnp/sp/profiles";
import { Icon } from "@fluentui/react";

export interface ICurrentUserCardProps {
    sp: SPFI;
    webUrl: string;
}

interface IUserInfo {
    displayName: string;
    title: string;
    account: string;
    photoUrl: string;
}

const CurrentUserCard: React.FC<ICurrentUserCardProps> = ({ sp, webUrl }) => {

    const [user, setUser] = useState<IUserInfo | null>(null);

    const getProfileValue = (
        list: Array<{ Key: string; Value: string }>,
        key: string
    ) => {
        const hit = list.find((p) => p.Key === key);
        return hit ? hit.Value : "";
    };

    const loadUser = async () => {
        try {
            const props = await sp.profiles.myProperties();

            const displayName = props.DisplayName;
            const account = props.AccountName;

            const jobTitle = getProfileValue(props.UserProfileProperties, "SPS-JobTitle");
            const defaultPhoto = '../theme/images/default-user.jpg';
            const photoUrl = `${webUrl}/_layouts/15/userphoto.aspx?size=L&accountname=${encodeURIComponent(
                account
            )}`;

            setUser({
                displayName,
                title: jobTitle,
                account,
                photoUrl: photoUrl || defaultPhoto,
            });

        } catch (err) {
            console.error("Error loading user:", err);
        }
    };

    useEffect(() => {
        loadUser();
    }, []);

    if (!user) return <div>Loading...</div>;

    return (
        <div className="userCard">
            <div className="header">
                <div className="avatarCircle">
                    <img src={user.photoUrl} alt="User" />
                </div>

                <div className="textArea">
                    <div className="currentUsername">{user.displayName}</div>
                    <div className="title">{user.title}</div>
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
    );
};

export default CurrentUserCard;
