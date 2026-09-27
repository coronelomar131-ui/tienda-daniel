import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SneakerArt from './SneakerArt';
import ProductPhoto from './ProductPhoto';
import { ShopContext } from '../context/shop-context';
import { fetchHeroVideo } from '../lib/shopApi';

// Los pares que salen en la portada: los destacados primero, sólo los que
// tienen foto y no están agotados. Si no hay ninguno, queda el dibujo.
function paresDePortada(products) {
    const conFoto = products.filter(p => p.photoCount > 0 && p.status !== 'agotado');
    return [...conFoto.filter(p => p.destacado), ...conFoto.filter(p => !p.destacado)].slice(0, 3);
}

const Hero = () => {
    const [video, setVideo] = useState('');
    const [listo, setListo] = useState(false);
    const { products } = useContext(ShopContext);
    const pares = paresDePortada(products || []);
    const ref = useRef(null);

    useEffect(() => {
        let vivo = true;
        fetchHeroVideo()
            .then(url => { if (vivo) setVideo(url); })
            .catch(() => { /* sin video, la portada se ve igual de bien */ });
        return () => { vivo = false; };
    }, []);

    // iOS solo deja arrancar solo un video que ya esté mudo, y a veces no basta
    // el atributo: hay que ponerlo por propiedad y pedirle reproducir a mano.
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.muted = true;
        el.defaultMuted = true;
        el.play?.().catch(() => { /* si el sistema lo bloquea, se ve el primer cuadro */ });
    }, [video]);

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
            {!conVideo && pares.length > 0 && (
                // Los pares de verdad, abanicados como cajas recién abiertas.
                // Cada uno lleva a su ficha.
                <div className={`hero-pares hero-pares-${pares.length}`}>
                    {pares.map(par => (
                        <Link key={par.id} to={`/tenis/${par.id}`} className="hero-par">
                            <span className="hero-par-foto"><ProductPhoto product={par} completa /></span>
                            <span className="hero-par-dato">
                                <span className="hero-par-nombre">{par.name}</span>
                                <span className="hero-par-precio">${par.price.toLocaleString('es-MX')}</span>
                            </span>
                        </Link>
                    ))}
                </div>
            )}
            {!conVideo && pares.length === 0 && (
                <div className="hero-art">
                    <SneakerArt />
                </div>
            )}
        </section>
      </div>
    );
};

export default Hero;
