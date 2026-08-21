import React from 'react';

// Dibujo de tenis (perfil, corte bajo) usado cuando un producto no tiene foto.
const SneakerArt = () => (
    <svg className="art" viewBox="0 0 140 90" fill="none" aria-hidden="true">
        {/* upper: punta, lengüeta, collar y talón */}
        <path
            d="M12 62 C12 53 17 47 27 44 L52 38 L64 32 C68 29 72 29 76 32 L84 40
               C90 44 98 44 104 40 L110 31 C118 34 122 44 123 54 L124 62 Z"
            fill="#242424" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
        />
        {/* boca del collar */}
        <path d="M84 40 C90 44 98 44 104 40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        {/* panel lateral tipo swoosh */}
        <path d="M28 56 C44 53 62 47 78 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {/* agujetas */}
        <path
            d="M56 40 L64 36 M62 45 L70 41 M68 50 L76 46"
            stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"
        />
        {/* suela */}
        <path
            d="M9 62 L127 62 C130 62 132 64 132 67 L132 71 C132 75 129 77 125 77
               L16 77 C12 77 9 74 9 70 Z"
            fill="#2E2E2E" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
        />
        <path d="M9 69 L132 69" stroke="currentColor" strokeWidth="1.1" opacity="0.5" />
    </svg>
);

export default SneakerArt;
