import React from 'react';

// Dibujos de prenda por categoría, usados cuando un producto no tiene foto.
const arts = {
    Playeras: (
        <svg className="art" viewBox="0 0 92 104" fill="none">
            <path d="M20 10 L36 4 L46 14 L56 4 L72 10 L78 26 L68 32 L68 96 L24 96 L24 32 L14 26 Z" fill="#E4DCCE" stroke="#211E19" strokeWidth="1" />
            <path d="M36 4 C36 4 40 14 46 14 C52 14 56 4 56 4" stroke="#211E19" strokeWidth="1" />
        </svg>
    ),
    Shorts: (
        <svg className="art" viewBox="0 0 92 104" fill="none">
            <path d="M24 14 L68 14 L72 40 L58 40 L58 96 L46 96 L46 50 L34 96 L22 96 L22 40 L20 40 Z" fill="#E4DCCE" stroke="#211E19" strokeWidth="1" />
        </svg>
    ),
    Chamarras: (
        <svg className="art" viewBox="0 0 92 104" fill="none">
            <path d="M18 10 L34 4 L46 12 L58 4 L74 10 L82 28 L70 34 L70 98 L22 98 L22 34 L10 28 Z" fill="#E4DCCE" stroke="#211E19" strokeWidth="1" />
            <line x1="46" y1="12" x2="46" y2="98" stroke="#211E19" strokeWidth="0.6" strokeDasharray="2 2" />
        </svg>
    ),
    Sets: (
        <svg className="art" viewBox="0 0 92 104" fill="none">
            <path d="M14 20 L36 12 L36 96 L14 96 Z" fill="#E4DCCE" stroke="#211E19" strokeWidth="1" />
            <path d="M56 12 L78 20 L78 96 L56 96 Z" fill="#E4DCCE" stroke="#211E19" strokeWidth="1" />
        </svg>
    ),
};

const GarmentArt = ({ category }) => arts[category] || arts.Playeras;

export default GarmentArt;
