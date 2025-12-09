import * as React from 'react';
import { SPFI } from '@pnp/sp';
import '@pnp/sp/profiles';
import './CurrentUserCardWebPart.scss';
import { Icon } from '@fluentui/react';

export interface ICurrentUserCardProps {
    sp: SPFI;
    webUrl: string;
}

interface IUserProfile {
    displayName: string;
    jobTitle: string;
    photoUrl: string;
    email: string;
    accountName: string;
}

const CurrentUserCard: React.FC<ICurrentUserCardProps> = ({ sp, webUrl }) => {
    const [userProfile, setUserProfile] = React.useState<IUserProfile | null>(null);
    const [loading, setLoading] = React.useState<boolean>(true);

    React.useEffect(() => {
        loadCurrentUser();
    }, [sp, webUrl]);

    const getProfileProperty = (
        props: Array<{ Key: string; Value: string }>,
        key: string
    ): string | undefined => {
        const hit = props.find(p => p.Key === key);
        return hit ? hit.Value : undefined;
    };

    const loadCurrentUser = async (): Promise<void> => {
        try {
            const cleanWebUrl = webUrl.replace(/\/$/, '');
            const props = await sp.profiles.myProperties();

            const displayName = props.DisplayName;
            const email = props.Email;
            const account = props.AccountName;

            const jobTitle =
                getProfileProperty(props.UserProfileProperties, 'SPS-JobTitle') || '';

            const photoUrl = `${cleanWebUrl}/_layouts/15/userphoto.aspx?size=L&accountname=${encodeURIComponent(account)}`;

            setUserProfile({
                displayName,
                jobTitle,
                photoUrl,
                email,
                accountName: account
            });
            setLoading(false);
        } catch (error) {
            console.error('Error loading user profile:', error);
            setLoading(false);
        }
    };

    return (
        <div className="userCard">
            <div className="header">
                <div className="avatarCircle">
                    <img
                        id="cucUserPhoto"
                        src={userProfile?.photoUrl}
                        alt="User photo"
                    />
                </div>

                <div className="textArea">
                    <div className="currentUsername">{loading ? 'Loading...' : userProfile?.displayName || ''}</div>
                    <div className="title">{userProfile?.jobTitle || ''}</div>
                </div>
            </div>

            <div className="tiles">
                <a id="cucTileProfile" className="tilePurple" target="_blank" rel="noopener" href={`${webUrl.replace(/\/$/, '')}/_layouts/15/editprofile.aspx`}> 
                    <Icon iconName='TeamsLogo' />
                    <label>Profile</label>
                </a>
                <a id="cucTileEmail" className="tileGreen" href="https://outlook.office.com">
                    <Icon iconName='Mail' />
                    <label>Email</label>
                </a>
                <a id="cucTileOneDrive" className="tileOrange" target="_blank" rel="noopener" href="https://www.office.com/onedrive">
                    <Icon iconName='OneDriveLogo' />
                    <label>OneDrive</label>
                </a>
                <a id="cucTileTeams" className="tilePeach" target="_blank" rel="noopener" href="https://teams.microsoft.com/">
                    <Icon iconName='TeamsLogo' />
                    <label>Teams</label>
                </a>
                <a id="cucTileFav" className="tileFav" target="_blank" rel="noopener">
                    <Icon iconName='FavoriteStar' />
                    <label>Favorites</label>
                </a> 
                <a id="cucTileTasks" className="tileMint" target="_blank" rel="noopener" href="https://to-do.office.com/tasks">
                    <Icon iconName='BulletedList2' />
                    <label>My Tasks</label>
                </a>
            </div>
        </div>
    );
};

export default CurrentUserCard;