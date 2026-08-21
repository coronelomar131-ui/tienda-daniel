import React from 'react';

const Hero = () => {
    return (
        <section className="hero" id="top">
            <div className="eyebrow">100% Originales · Envíos a todo México</div>
            <h1>Tenis que<br />nadie más <em>trae</em></h1>
            <p>
                Sneakers auténticos, ediciones limitadas y restocks.
                Escoge tu talla, apártalos por WhatsApp y te los mandamos a donde estés.
            </p>
            <div className="hero-cta">
                <a href="#coleccion" className="btn-primary">Ver catálogo</a>
                <a href="#nosotros" className="btn-ghost">Cómo apartar</a>
            </div>
            <div className="pulse-line">
                <svg viewBox="0 0 220 36" fill="none" aria-hidden="true">
                    <path
                        className="pulse-path"
                        d="M0 18 L60 18 L72 4 L84 32 L96 10 L108 26 L120 18 L220 18"
                        stroke="#C8FF00" strokeWidth="1.6" fill="none"
                    />
                </svg>
            </div>
        </section>
    );
};

export default Hero;
