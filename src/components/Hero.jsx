import React, { useEffect, useRef, useState } from 'react';
import SneakerArt from './SneakerArt';
import { fetchHeroVideo } from '../lib/shopApi';

const Hero = () => {
    const [video, setVideo] = useState('');
    const [listo, setListo] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        let vivo = true;
        fetchHeroVideo()
            .then(url => { if (vivo) setVideo(url); })
            .catch(() => { /* sin video, la portada se ve igual de bien */ });
        return () => { vivo = false; };
    }, []);

    // Si el usuario pidió menos animación, no le ponemos video en bucle.
    const quietud = typeof window !== 'undefined'
        && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const conVideo = !!video && !quietud;

    return (
      <div className={`hero-band${conVideo ? ' con-video' : ''}`} id="top">
        {conVideo && (
            <video
                ref={ref}
                className={`hero-video${listo ? ' visible' : ''}`}
                src={video}
                autoPlay muted loop playsInline preload="metadata"
                onCanPlay={() => setListo(true)}
                aria-hidden="true"
            />
        )}
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
            {!conVideo && (
                <div className="hero-art">
                    <SneakerArt />
                </div>
            )}
        </section>
      </div>
    );
};

export default Hero;
