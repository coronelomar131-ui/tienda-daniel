import React, { lazy, Suspense, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigationType, useParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MasVendidos from './components/MasVendidos';
import BrandFilter from './components/BrandFilter';
import ProductGrid from './components/ProductGrid';
import CartDrawer from './components/CartDrawer';
import HowTo from './components/HowTo';
import Newsletter from './components/Newsletter';
import InstagramBand from './components/InstagramBand';
import ProductPage from './components/ProductPage';
import PaginaNoExiste from './components/PaginaNoExiste';
// El panel se carga aparte, solo si alguien entra a /admin. Iba dentro del
// mismo archivo que la tienda, asi que TODOS los clientes se bajaban el
// panel completo (subida de fotos, videos, pedidos) sin poder usarlo nunca.
const AdminLogin = lazy(() => import('./components/AdminLogin'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const PagoResultado = lazy(() => import('./components/PagoResultado'));
const AvisoPrivacidad = lazy(() => import('./components/PaginasLegales').then(m => ({ default: m.AvisoPrivacidad })));
const Terminos = lazy(() => import('./components/PaginasLegales').then(m => ({ default: m.Terminos })));
import { ShopContext } from './context/shop-context';
import { config } from './config';
import { linkReal } from './lib/links';
import { waPlain } from './lib/whatsapp';
import { filtrar, tituloFiltro } from './lib/categorias';

// Lo que lleva .reveal entra con animación cuando se asoma en pantalla. Se
// vigila el documento entero: cualquier .reveal que aparezca después (los más
// vendidos llegan por su propia petición, el catálogo cambia con el filtro) se
// observa solo. Antes se observaba una sola vez al cargar el catálogo, y lo
// que llegaba después se quedaba invisible.
function useScrollReveal() {
    useEffect(() => {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('in');
                    io.unobserve(e.target);
                }
            });
        }, { threshold: 0.12 });
        const observar = (raiz) => {
            if (raiz.nodeType !== 1) return;
            if (raiz.classList.contains('reveal')) io.observe(raiz);
            raiz.querySelectorAll('.reveal').forEach(el => io.observe(el));
        };
        observar(document.body);
        const mo = new MutationObserver((cambios) => {
            for (const c of cambios) c.addedNodes.forEach(observar);
        });
        mo.observe(document.body, { childList: true, subtree: true });
        return () => { mo.disconnect(); io.disconnect(); };
    }, []);
}

// Al cambiar de página (portada → ficha → portada) el navegador no mueve el
// scroll solo: la ficha se abría a la altura donde ibas en el catálogo. Aquí
// se sube al inicio en cada navegación nueva; al ir "atrás" no se toca, para
// que el navegador regrese a donde estabas.
function ScrollAlCambiarRuta() {
    const { pathname, hash } = useLocation();
    const tipo = useNavigationType();
    useEffect(() => {
        if (tipo === 'POP') return;
        // con ancla también se sube primero: useBajarAlAncla baja luego al ancla
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [pathname, hash, tipo]);
    return null;
}

// La ficha se vuelve a montar de cero al cambiar de par: así la foto elegida y
// la talla no se quedan de un par al siguiente.
const FichaPorId = () => { const { id } = useParams(); return <ProductPage key={id} />; };

// Si la tienda se abre con un ancla (/#coleccion, como el link de la bio de
// Instagram), el navegador intenta bajar ANTES de que la pagina exista y se
// queda arriba. Se baja aqui, una sola vez, cuando el catalogo ya cargo y la
// pagina ya tiene su altura final.
function useBajarAlAncla(listo) {
    const hecho = useRef(false);
    useEffect(() => {
        if (!listo || hecho.current || !window.location.hash) return;
        hecho.current = true;
        let id = window.location.hash.slice(1);
        try { id = decodeURIComponent(id); } catch { /* se usa tal cual */ }
        requestAnimationFrame(() => {
            // Si mientras cargaba el cliente ya se movio por su cuenta, no se
            // le jala la pantalla.
            if (window.scrollY > 40) return;
            document.getElementById(id)?.scrollIntoView({ behavior: 'instant', block: 'start' });
        });
    }, [listo]);
}

function StoreFront() {
    const { products, loading, loadError, demo } = useContext(ShopContext);
    const [filtro, setFiltro] = useState({ tipo: 'todos', valor: null });
    const [cartOpen, setCartOpen] = useState(false);

    // Las marcas del filtro salen del propio catálogo, así que al agregar un
    // producto de una marca nueva en /admin, su filtro aparece solo.
    const brands = useMemo(
        () => [...new Set(products.map(p => p.brand).filter(Boolean))].sort(),
        [products]
    );

    const visible = filtrar(products, filtro);

    useScrollReveal();
    useBajarAlAncla(!loading);

    return (
        <>
            <Navbar onOpenCart={() => setCartOpen(true)} />
            <main>
                <Hero />
                <MasVendidos />
                {/* El filtro vive dentro del ancla para que al saltar al catálogo
                    se vea junto con los resultados y no quede tapado por el header. */}
                <div id="coleccion" className="catalog">
                    <BrandFilter brands={brands} active={filtro} onSelect={setFiltro} products={products} />

                    <section className="section">
                        <div className="wrap">
                            <div className="section-head reveal">
                                <h2>{tituloFiltro(filtro)}</h2>
                                <span>{visible.length} {visible.length === 1 ? 'modelo' : 'modelos'}</span>
                            </div>
                            {demo && (
                                <p className="demo-note">
                                    Vista de ejemplo: no hay conexión con la tienda, así que
                                    estos pares son de muestra y no están a la venta.
                                </p>
                            )}
                            <ProductGrid products={visible} loading={loading} loadError={demo ? null : loadError} />
                        </div>
                    </section>
                </div>

                <HowTo />

                <Newsletter />

                <InstagramBand />
            </main>

            <footer className="site-footer">
                <div className="wrap">
                    <div>© 2026 Prothe Shop</div>
                    <div className="flinks flinks-legal">
                        <Link to="/aviso-de-privacidad">Aviso de privacidad</Link>
                        <Link to="/terminos">Términos</Link>
                    </div>
                    <div className="flinks">
                        <a href={config.instagramLink} target="_blank" rel="noreferrer">Instagram</a>
                        {linkReal(config.tiktokLink) && (
                            <a href={config.tiktokLink} target="_blank" rel="noreferrer">TikTok</a>
                        )}
                        <a href={waPlain()} target="_blank" rel="noreferrer">WhatsApp</a>
                    </div>
                </div>
            </footer>

            <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
        </>
    );
}

function App() {
    return (
        <Router>
            <ScrollAlCambiarRuta />
            <Suspense fallback={<div className="cargando-ruta">Cargando…</div>}>
            <Routes>
                <Route path="/" element={<StoreFront />} />
                <Route path="/tenis/:id" element={<FichaPorId />} />
                <Route path="/pago/:id" element={<PagoResultado />} />
                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/aviso-de-privacidad" element={<AvisoPrivacidad />} />
                <Route path="/terminos" element={<Terminos />} />
                <Route path="*" element={<PaginaNoExiste />} />
            </Routes>
            </Suspense>
        </Router>
    );
}

export default App;
