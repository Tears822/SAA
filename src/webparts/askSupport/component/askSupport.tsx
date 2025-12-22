import * as React from 'react';
import './AskSupportWebPart.scss';

export interface IAskSupportProps {
  askItUrl?: string;
  askAdminUrl?: string;
}

const AskSupport: React.FC<IAskSupportProps> = ({ askItUrl, askAdminUrl }) => {

const isAr = window.location.href.toLowerCase().includes("/ar/");

  const handleClick = (url?: string) => {
    if (url) {
      window.open(url, "_blank"); // open in new tab
    }
  };

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalUrl, setModalUrl] = React.useState<string | undefined>(undefined);
  const [modalTitle, setModalTitle] = React.useState<string>('');

  const openModal = (url?: string, title?: string) => {
    // if (!url) return;
    // setModalUrl(url);
    setModalTitle(title || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalUrl(undefined);
    setModalTitle('');
  };

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };

    if (isModalOpen) {
      document.addEventListener('keydown', onKeyDown);
      document.body.style.overflow = 'hidden'; // prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  return (
    <div className="fullWidthWrapper">
      <div className="bar">
        <button
          className="askSupporttile askIt"
          // onClick={() => handleClick(askItUrl)}
          onClick={() => openModal(askItUrl, isAr ? 'اسأل قسم تكنولوجيا المعلومات' : 'ASK IT')}
        >
          <span className="icon">
            <img
              src={require('../../../theme/images/askit.svg')}
              className="ggprofile-icon"
              alt="Ask IT"
            />
          </span>
          <span className="label">{isAr ? "اسأل قسم تكنولوجيا المعلومات" : "ASK IT"}</span>
        </button>

        <button
          className="askSupporttile askAdmin"
          onClick={() => handleClick(askAdminUrl)}
          // onClick={() => openModal(askAdminUrl, isAr ? 'اسأل الموارد البشرية' : 'ASK Admin')}
        >
          <span className="icon">
            <img
              src={require('../../../theme/images/askadmin.svg')}
              className="ggprofile-icon"
              alt="Ask Admin"
            />
          </span>
          <span className="label">{isAr ? "اسأل الموارد البشرية" : "ASK Admin"}</span>
        </button>
      </div>

      {isModalOpen && (
        <div
          className="askitModalOverlay"
          role="dialog"
          aria-modal="true"
          aria-label={modalTitle || 'Support'}
          onClick={closeModal}
        >
          <div className="askitModal" onClick={(e) => e.stopPropagation()}>
            <div className="askitModalHeader">
              <div className="askitModalTitle">{modalTitle}</div>

              <button className="askitModalClose" type="button" onClick={closeModal} aria-label="Close">
                ×
              </button>
            </div>

            <div className="askitModalBody">
              {modalUrl ? (
                <iframe
                  className="askitModalFrame"
                  src={modalUrl}
                  title={modalTitle || 'Support'}
                  frameBorder={0}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AskSupport;
