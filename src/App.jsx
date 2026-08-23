import React, { useContext, useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Marquee from './components/Marquee';
import BrandFilter from './components/BrandFilter';
import ProductGrid from './components/ProductGrid';
import CartDrawer from './components/CartDrawer';
import HowTo from './components/HowTo';
import Newsletter from './components/Newsletter';
import ProductPage from './components/ProductPage';
import PagoResultado from './components/PagoResultado';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import { ShopContext } from './context/shop-context';
import { config } from './config';
import { waPlain } from './lib/whatsapp';

function useScrollReveal(deps) {
    useEffect(() => {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('in');
                    io.unobserve(e.target);
                }
            });
        }, { threshold: 0.12 });
        document.querySelectorAll('.reveal').forEach(el => io.observe(el));
        return () => io.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}

function StoreFront() {
    const { products, loading, loadError, demo } = useContext(ShopContext);
    const [brand, setBrand] = useState(null);
    const [cartOpen, setCartOpen] = useState(false);

    // Las marcas del filtro salen del propio catálogo, así que al agregar un
    // producto de una marca nueva en /admin, su filtro aparece solo.
    const brands = useMemo(
        () => [...new Set(products.map(p => p.brand).filter(Boolean))].sort(),
        [products]
    );

    const visible = brand ? products.filter(p => p.brand === brand) : products;

    useScrollReveal([visible.length, brand, loading]);

    return (
        <>
            <Navbar onOpenCart={() => setCartOpen(true)} />
            <main>
                <Hero />
                <Marquee />
                {/* El filtro vive dentro del ancla para que al saltar al catálogo
                    se vea junto con los resultados y no quede tapado por el header. */}
                <div id="coleccion" className="catalog">
                    <BrandFilter brands={brands} active={brand} onSelect={setBrand} />

                    <section className="section">
                        <div className="wrap">
                            <div className="section-head reveal">
                                <h2>{brand || 'Lo que hay'}</h2>
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
            </main>

            <footer className="site-footer">
                <div className="wrap">
                    <div>© 2026 Prothe Shops</div>
                    <div className="flinks">
                        <a href={config.instagramLink} target="_blank" rel="noreferrer">Instagram</a>
                        <a href={config.tiktokLink} target="_blank" rel="noreferrer">TikTok</a>
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
            <Routes>
                <Route path="/" element={<StoreFront />} />
                <Route path="/tenis/:id" element={<ProductPage />} />
                <Route path="/pago/:id" element={<PagoResultado />} />
                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Routes>
        </Router>
    );
}

export default App;
