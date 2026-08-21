import React, { useContext, useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Marquee from './components/Marquee';
import BrandFilter from './components/BrandFilter';
import ProductGrid from './components/ProductGrid';
import CartDrawer from './components/CartDrawer';
import Newsletter from './components/Newsletter';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import { ShopContext } from './context/shop-context';
import { config } from './config';

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
    const { products } = useContext(ShopContext);
    const [brand, setBrand] = useState(null);
    const [cartOpen, setCartOpen] = useState(false);

    // Las marcas del filtro salen del propio catálogo, así que al agregar un
    // producto de una marca nueva en /admin, su filtro aparece solo.
    const brands = useMemo(
        () => [...new Set(products.map(p => p.brand).filter(Boolean))].sort(),
        [products]
    );

    const visible = brand ? products.filter(p => p.brand === brand) : products;

    useScrollReveal([visible.length, brand]);

    return (
        <>
            <Navbar onOpenCart={() => setCartOpen(true)} />
            <main>
                <Hero />
                <Marquee />
                <BrandFilter brands={brands} active={brand} onSelect={setBrand} />

                <section className="section" id="coleccion">
                    <div className="wrap">
                        <div className="section-head reveal">
                            <h2>{brand || 'Todos los pares'}</h2>
                            <span>{visible.length} {visible.length === 1 ? 'modelo' : 'modelos'}</span>
                        </div>
                        <ProductGrid products={visible} />
                    </div>
                </section>

                <div className="quote reveal" id="nosotros">
                    <p>Escoge tu talla, dale a <em>apartar</em> y te contestamos por WhatsApp en minutos.</p>
                    <div className="attrib">— Así de fácil</div>
                </div>

                <Newsletter />
            </main>

            <footer className="site-footer">
                <div>© 2026 Prothe Shops</div>
                <div className="flinks">
                    <a href={config.instagramLink} target="_blank" rel="noreferrer">Instagram</a>
                    <a href={config.tiktokLink} target="_blank" rel="noreferrer">TikTok</a>
                    <a href={`https://wa.me/${config.whatsappNumber}`} target="_blank" rel="noreferrer">WhatsApp</a>
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
                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Routes>
        </Router>
    );
}

export default App;
