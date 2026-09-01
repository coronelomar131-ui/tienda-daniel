import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/shop-context';
import { fetchProduct, fetchPhotos } from '../lib/shopApi';
import { waLink } from '../lib/whatsapp';
import { leerVideo } from '../lib/video';
import { config } from '../config';
import SneakerArt from './SneakerArt';
import Navbar from './Navbar';
import CartDrawer from './CartDrawer';
import { useRefrescarAlVolver } from '../lib/alVolver';

const WhatsAppIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l5.07-1.33A9.94 9.94 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
    </svg>
);

const ProductPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, products } = useContext(ShopContext);

    const [par, setPar] = useState(null);
    const [fotos, setFotos] = useState([]);
    const [activa, setActiva] = useState(0);
    const [talla, setTalla] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [cartOpen, setCartOpen] = useState(false);
    const [agregado, setAgregado] = useState(false);

    // Un token por carga: si el visitante cambia de par a media petición, la
    // respuesta vieja llega tarde y no debe pisar a la nueva.
    const vigente = useRef(0);

    const cargar = useCallback(async ({ mostrarCarga = true } = {}) => {
        const mio = ++vigente.current;
        if (mostrarCarga) setCargando(true);
        setError(null);
        try {
            const p = await fetchProduct(id);
            if (mio !== vigente.current) return;
            if (!p) { setError('Ese par ya no está en la tienda'); return; }
            setPar(p);
            if (p.photoCount) {
                const f = await fetchPhotos(id);
                if (mio === vigente.current) setFotos(f);
            }
        } catch (err) {
            // Sin conexion caemos al catalogo que ya tenga cargado la app.
            const local = products.find(p => String(p.id) === String(id));
            if (mio !== vigente.current) return;
            local ? setPar(local) : setError(err.message);
        } finally {
            if (mio === vigente.current) setCargando(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => { cargar(); }, [cargar]);

    // Al volver a la pestaña se pide de nuevo, sin pantalla de carga: si el
    // dueño acaba de editar las tallas desde el panel, aqui ya salen.
    const recargarCallado = useCallback(() => cargar({ mostrarCarga: false }), [cargar]);
    useRefrescarAlVolver(recargarCallado);

    if (cargando) {
        return (
            <>
                <Navbar onOpenCart={() => setCartOpen(true)} />
                <div className="wrap"><div className="empty-catalog">Cargando…</div></div>
            </>
        );
    }

    if (error || !par) {
        return (
            <>
                <Navbar onOpenCart={() => setCartOpen(true)} />
                <div className="wrap">
                    <div className="empty-catalog">
                        {error || 'Ese par ya no está'}
                        <span className="empty-note">
                            <Link to="/" className="ml-link" style={{ margin: '12px auto 0' }}>Volver al catálogo</Link>
                        </span>
                    </div>
                </div>
            </>
        );
    }

    const agotado = par.status === 'agotado';
    const tallas = par.sizes || [];
    const pideTalla = tallas.length > 0;
    const puedeAgregar = !agotado && (!pideTalla || talla !== null);
    const video = leerVideo(par.videoUrl);
    const mlLink = par.mlLink || config.mercadoLibreGeneralLink;

    const texto = agotado
        ? `Hola, ¿tendrán restock de los ${par.brand} ${par.name}?`
        : `Hola, me interesan los ${par.brand} ${par.name}${talla ? ` en talla ${talla}` : ''} ($${par.price} MXN). ¿Siguen disponibles?`;

    const agregar = () => {
        if (!puedeAgregar) return;
        addToCart(par, talla);
        setAgregado(true);
        setTimeout(() => setAgregado(false), 2200);
    };

    return (
        <>
            <Navbar onOpenCart={() => setCartOpen(true)} />

            <main className="ficha">
                <div className="wrap">
                    <button className="volver" onClick={() => navigate(-1)}>← Volver</button>

                    <div className="ficha-grid">
                        <div className="ficha-fotos">
                            <div className="ficha-principal">
                                {fotos.length > 0
                                    ? <img src={fotos[activa]?.data} alt={`${par.brand} ${par.name}`} />
                                    : <SneakerArt />}
                                <div className="badges">
                                    {par.status === 'nuevo' && <span className="badge badge-new">Nuevo</span>}
                                    {agotado && <span className="badge badge-out">Agotado</span>}
                                </div>
                            </div>

                            {fotos.length > 1 && (
                                <div className="ficha-mini">
                                    {fotos.map((f, i) => (
                                        <button
                                            key={f.id}
                                            className={`mini${i === activa ? ' activa' : ''}`}
                                            onClick={() => setActiva(i)}
                                            aria-label={`Foto ${i + 1}`}
                                        >
                                            <img src={f.data} alt="" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="ficha-datos">
                            <span className="tag">{par.brand}</span>
                            <h1>{par.name}</h1>
                            <div className="ficha-precio">
                                ${par.price.toLocaleString('es-MX')}<small>MXN</small>
                            </div>

                            {par.desc && <p className="ficha-desc">{par.desc}</p>}

                            {pideTalla && (
                                <div className="sizes">
                                    <span className="sizes-label">
                                        Talla MX {talla !== null && <>· <strong>{talla}</strong></>}
                                    </span>
                                    <div className="size-row">
                                        {tallas.map(t => (
                                            <button
                                                key={t}
                                                className={`size-chip${talla === t ? ' selected' : ''}`}
                                                onClick={() => setTalla(talla === t ? null : t)}
                                                disabled={agotado}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="ficha-acciones">
                                <button className="btn-primary" onClick={agregar} disabled={!puedeAgregar}>
                                    {agotado ? 'Agotado' : agregado ? '✓ Agregado' : (pideTalla && talla === null ? 'Elige tu talla' : 'Agregar al carrito')}
                                </button>
                                <a href={waLink(texto)} target="_blank" rel="noreferrer" className="btn-ghost">
                                    {agotado ? 'Pedir restock' : 'Apartar'} <WhatsAppIcon />
                                </a>
                            </div>

                            {video && (
                                <div className="ficha-video">
                                    {video.tipo === 'propio' ? (
                                        <video
                                            className="video-propio"
                                            src={video.url}
                                            controls
                                            playsInline
                                            preload="metadata"
                                        />
                                    ) : video.tipo === 'youtube' ? (
                                        <div className="video-marco">
                                            <iframe
                                                src={`https://www.youtube.com/embed/${video.id}`}
                                                title={`Video de ${par.name}`}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                    ) : (
                                        <a href={video.url} target="_blank" rel="noreferrer" className="video-enlace">
                                            <span className="video-play">▶</span>
                                            <span>
                                                <strong>Ver el video</strong>
                                                <small>en {video.sitio}</small>
                                            </span>
                                        </a>
                                    )}
                                </div>
                            )}

                            {mlLink && (
                                <a href={mlLink} target="_blank" rel="noreferrer" className="ml-link">
                                    Ver en Mercado Libre
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <div className="barra-compra">
                <div className="barra-precio">
                    <span>{pideTalla && talla !== null ? `Talla ${talla}` : par.brand}</span>
                    <strong>${par.price.toLocaleString('es-MX')}</strong>
                </div>
                <button className="barra-btn" onClick={agregar} disabled={!puedeAgregar}>
                    {agotado ? 'Agotado' : agregado ? '✓ Agregado' : (pideTalla && talla === null ? 'Elige tu talla' : 'Agregar')}
                </button>
                <a href={waLink(texto)} target="_blank" rel="noreferrer" className="barra-wa" aria-label="Apartar por WhatsApp">
                    <WhatsAppIcon />
                </a>
            </div>

            <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
        </>
    );
};

export default ProductPage;
