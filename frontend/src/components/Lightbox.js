import React from 'react';

const Lightbox = ({ imageUrl, onClose }) => {
    return (
        <div className="lightbox-overlay" onClick={onClose}>
            <div className="lightbox-content">
                <img src={imageUrl} alt="Enlarged view" />
            </div>
        </div>
    );
};

export default Lightbox;