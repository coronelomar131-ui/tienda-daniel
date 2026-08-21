import React, { useState, useEffect, useCallback } from 'react';
import { ShopContext } from './shop-context';
import { fetchProducts } from '../lib/shopApi';
import { sampleProducts } from '../data/sampleProducts';

// Cada línea del carrito es un par producto+talla, para que 2 tallas del mismo
// modelo se cuenten por separado.
const lineKey = (id, size) => `${id}__${size ?? 'unica'}`;

export const ShopProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [demo, setDemo] = useState(false);

    const [cart, setCart] = useState(() => {
        try {
            const saved = localStorage.getItem('protheShopCart');
            if (saved) return JSON.parse(saved);
        } catch { /* localStorage no disponible */ }
        return [];
    });

    // El catálogo vive en la base, así que lo que subes desde /admin lo ven
    // todos tus clientes al instante.
    const reload = useCallback(async () => {
        setLoading(true);
        try {
            setProducts(await fetchProducts());
            setLoadError(null);
            setDemo(false);
        } catch (err) {
            // Sin conexión con la base mostramos el catálogo de muestra, pero
            // avisando en pantalla que no son pares reales.
            setProducts(sampleProducts);
            setDemo(true);
            setLoadError(err?.message || 'No se pudo cargar el catálogo');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { reload(); }, [reload]);

    // El carrito sí es de cada visitante, por eso se queda en su navegador.
    useEffect(() => {
        try {
            localStorage.setItem('protheShopCart', JSON.stringify(cart));
        } catch { /* localStorage no disponible */ }
    }, [cart]);

    const addToCart = (product, size) => {
        const key = lineKey(product.id, size);
        setCart(prev => {
            const existing = prev.find(item => item.key === key);
            if (existing) {
                return prev.map(item => item.key === key ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, {
                key,
                id: product.id,
                brand: product.brand,
                name: product.name,
                price: product.price,
                size: size ?? null,
                qty: 1,
            }];
        });
    };

    const updateQty = (key, delta) => {
        setCart(prev => prev
            .map(item => item.key === key ? { ...item, qty: item.qty + delta } : item)
            .filter(item => item.qty > 0)
        );
    };

    const clearCart = () => setCart([]);

    const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    return (
        <ShopContext.Provider value={{
            products, loading, loadError, demo, reload,
            cart, addToCart, updateQty, clearCart, cartCount, cartTotal
        }}>
            {children}
        </ShopContext.Provider>
    );
};
