import * as React from 'react';

export class FooterPageComponent extends React.Component<any, {}> {
    public render(): React.ReactElement<{}> {
        return (

            <div className="footer">
                <div className="containerSaa">
                    <div className="footer-content">
                        <p>Saa Portal Hub</p>
                        <div className="social-links">
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" title="Facebook">
                                <img src={require('../theme/images/faceBookIco.svg')} className='traingleBg' />
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" title="twitter">
                                <img src={require('../theme/images/twitterIco.svg')} className='traingleBg' />
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" title="instagram">
                                <img src={require('../theme/images/instagramIco.svg')} className='traingleBg' />
                            </a>
                            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" title="youtube">
                                <img src={require('../theme/images/youtubeIco.svg')} className='traingleBg' />
                            </a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" title="linkedin">
                                <img src={require('../theme/images/linkedIco.svg')} className='traingleBg' />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
