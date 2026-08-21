import React from 'react';

const Hero = () => {
    return (
        <section className="hero" id="top">
            <div className="eyebrow">Ropa deportiva · Edición de temporada</div>
            <h1>Rendimiento<br />con <em>actitud</em></h1>
            <p>
                Ropa deportiva pensada para moverse contigo: tejidos técnicos,
                cortes limpios y detalles que no gritan, pero se notan.
            </p>
            <div className="hero-cta">
                <a href="#coleccion" className="btn-primary">Ver colección</a>
                <a href="#nosotros" className="btn-ghost">Nuestra historia</a>
            </div>
            <div className="pulse-line">
                <svg viewBox="0 0 220 36" fill="none">
                    <path
                        className="pulse-path"
                        d="M0 18 L60 18 L72 4 L84 32 L96 10 L108 26 L120 18 L220 18"
                        stroke="#7A5E38" strokeWidth="1.4" fill="none"
                    />
                </svg>
            </div>
        </section>
    );
};

export default Hero;
