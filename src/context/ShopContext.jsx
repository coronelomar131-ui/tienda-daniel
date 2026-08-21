import React, { useState, useEffect } from 'react';
import { products as defaultProducts } from '../data/products';
import { ShopContext } from './shop-context';

// Cada línea del carrito es un par producto+talla, para que 2 tallas del mismo
// modelo se cuenten por separado.
const lineKey = (id, size) => `${id}__${size ?? 'unica'}`;

export const ShopProvider = ({ children }) => {
    const [products, setProducts] = useState(() => {
        try {
            const saved = localStorage.getItem('protheShopProducts');
            if (saved) return JSON.parse(saved);
        } catch { /* localStorage no disponible */ }
        return defaultProducts;
    });

    const [cart, setCart] = useState(() => {
        try {
            const saved = localStorage.getItem('protheShopCart');
            if (saved) return JSON.parse(saved);
        } catch { /* localStorage no disponible */ }
        return [];
    });

    useEffect(() => {
        try {
            localStorage.setItem('protheShopProducts', JSON.stringify(products));
        } catch { /* localStorage no disponible */ }
    }, [products]);

    useEffect(() => {
        try {
            localStorage.setItem('protheShopCart', JSON.stringify(cart));
        } catch { /* localStorage no disponible */ }
    }, [cart]);

    // --- Catálogo (admin) ---
    const addProduct = (newProduct) => {
        setProducts([...products, { ...newProduct, id: Date.now() }]);
    };

    const removeProduct = (id) => {
        setProducts(products.filter(p => p.id !== id));
        setCart(prev => prev.filter(item => item.id !== id));
    };

    // --- Carrito ---
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
            products, addProduct, removeProduct,
            cart, addToCart, updateQty, clearCart, cartCount, cartTotal
        }}>
            {children}
        </ShopContext.Provider>
    );
};
