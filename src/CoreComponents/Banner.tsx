import * as React from 'react';

interface BannerProps {
    PageTitle?: string;
}
export const BannerComponent: React.FC<BannerProps> =
    (props) => {
        return (

            <div className='banner'>
                <div>
                    <h3 className='bannerTitle'>{props.PageTitle}</h3>
                </div>
            </div>
        );
    };
