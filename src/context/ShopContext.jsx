import React, { useState, useEffect } from 'react';
import { products as defaultProducts } from '../data/products';
import { ShopContext } from './shop-context';

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
    };

    // --- Carrito ---
    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id ? { ...item, qty: item.qty + 1 } : item
                );
            }
            return [...prev, { id: product.id, name: product.name, price: product.price, qty: 1 }];
        });
    };

    const updateQty = (id, delta) => {
        setCart(prev => prev
            .map(item => item.id === id ? { ...item, qty: item.qty + delta } : item)
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
