import React from 'react';

const items = ['Envíos a todo México', 'Nueva colección', 'Tejidos técnicos', 'Pedidos por WhatsApp'];

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
