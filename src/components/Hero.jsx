import React from 'react';
import SneakerArt from './SneakerArt';

const Hero = () => {
    return (
      <div className="hero-band" id="top">
        <section className="hero">
            <div className="hero-copy">
                <div className="eyebrow">Originales · Envíos a todo México</div>
                <h1>De la caja<br />a la <em>calle</em></h1>
                <p>
                    Pares originales, no réplicas. Escoges tu talla, apartas por
                    WhatsApp y te llega a donde estés.
                </p>
                <div className="hero-cta">
                    <a href="#coleccion" className="btn-primary">Ver los pares</a>
                    <a href="#comoapartar" className="btn-ghost">Cómo apartar</a>
                </div>
            </div>
            <div className="hero-art">
                <SneakerArt />
            </div>
        </section>
      </div>
    );
};

export default Hero;
