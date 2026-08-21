import React from 'react';

const items = [
    '100% Originales',
    'Envíos a todo México',
    'Aparta por WhatsApp',
    'Nuevos drops cada semana',
];

const Marquee = () => (
    <div className="marquee">
        <div className="marquee-track">
            {[...items, ...items].map((text, i) => (
                <span key={i}>{text}</span>
            ))}
        </div>
    </div>
);

export default Marquee;
