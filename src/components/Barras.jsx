import React from 'react';
import { bitsDeBarras } from '../lib/ticket';

// El código de barras del ticket, con los dígitos del folio.
const Barras = ({ codigo }) => {
    const bits = bitsDeBarras(codigo);
    const rects = [];
    for (let i = 0; i < bits.length; i++) if (bits[i] === '1') rects.push(<rect key={i} x={i} y="0" width="1" height="1" />);
    return (
        <svg className="ticket-barras" viewBox={`0 0 ${bits.length} 1`} preserveAspectRatio="none" aria-hidden="true">
            {rects}
        </svg>
    );
};

export default Barras;
