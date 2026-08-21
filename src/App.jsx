import React, { useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Marquee from './components/Marquee';
import Categories from './components/Categories';
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
        }, { threshold: 0.15 });
        document.querySelectorAll('.reveal').forEach(el => io.observe(el));
        return () => io.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}

function StoreFront() {
    const { products } = useContext(ShopContext);
    const [category, setCategory] = useState(null);
    const [cartOpen, setCartOpen] = useState(false);

    const visible = category
        ? products.filter(p => p.category === category)
        : products;

    useScrollReveal([visible.length, category]);

    return (
        <>
            <Navbar onOpenCart={() => setCartOpen(true)} />
            <main>
                <Hero />
                <Marquee />
                <Categories active={category} onSelect={setCategory} />

                <section className="section" id="coleccion">
                    <div className="wrap">
                        <div className="section-head reveal">
                            <h2>{category ? category : 'Colección actual'}</h2>
                            <span>{visible.length} {visible.length === 1 ? 'pieza' : 'piezas'}</span>
                        </div>
                        <ProductGrid products={visible} />
                    </div>
                </section>

                <div className="quote reveal" id="nosotros">
                    <p>"La ropa deportiva no debería gritar. Debería moverse contigo y quedarse callada hasta que alguien pregunta de dónde es."</p>
                    <div className="attrib">— Prothe Shops</div>
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
