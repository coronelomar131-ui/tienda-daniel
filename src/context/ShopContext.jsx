import React, { useState, useEffect, useCallback } from 'react';
import { ShopContext } from './shop-context';
import { fetchProducts, olvidarFotos } from '../lib/shopApi';
import { sampleProducts } from '../data/sampleProducts';
import { useRefrescarAlVolver } from '../lib/alVolver';

// Cada línea del carrito es un par producto+talla, para que 2 tallas del mismo
// modelo se cuenten por separado.
const lineKey = (id, size) => `${id}__${size ?? 'unica'}`;

export const ShopProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [demo, setDemo] = useState(false);

    const leerGuardado = (llave) => {
        try {
            const saved = localStorage.getItem(llave);
            if (saved) return JSON.parse(saved);
        } catch { /* localStorage no disponible */ }
        return [];
    };

    const [cart, setCart] = useState(() => leerGuardado('protheShopCart'));
    // "Guardado para despues": vive en este navegador, igual que el carrito.
    // No es lista de deseos de cuenta, por eso no se promete que te siga.
    const [guardados, setGuardados] = useState(() => leerGuardado('protheGuardados'));

    // El catálogo vive en la base, así que lo que subes desde /admin lo ven
    // todos tus clientes al instante.
    const reload = useCallback(async () => {
        setLoading(true);
        olvidarFotos();   // si el dueño acaba de cambiar una foto, que se vea la nueva
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

    // Al regresar a la pestaña se vuelve a pedir el catalogo: si el dueño
    // acaba de subir un par desde el panel, aqui ya sale.
    useRefrescarAlVolver(reload);

    // El carrito sí es de cada visitante, por eso se queda en su navegador.
    useEffect(() => {
        try {
            localStorage.setItem('protheShopCart', JSON.stringify(cart));
        } catch { /* localStorage no disponible */ }
    }, [cart]);

    useEffect(() => {
        try {
            localStorage.setItem('protheGuardados', JSON.stringify(guardados));
        } catch { /* localStorage no disponible */ }
    }, [guardados]);

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

    const removeLine = (key) => setCart(prev => prev.filter(item => item.key !== key));

    // Cambiar de talla sin sacar y volver a meter el par. Si ya tenias esa
    // otra talla en el carrito, se juntan las cantidades en vez de dejar dos
    // renglones del mismo par y la misma talla.
    const changeSize = (key, nuevaTalla) => setCart(prev => {
        const linea = prev.find(item => item.key === key);
        if (!linea || linea.size === nuevaTalla) return prev;

        const nuevaKey = lineKey(linea.id, nuevaTalla);
        if (prev.some(item => item.key === nuevaKey)) {
            return prev
                .map(item => item.key === nuevaKey ? { ...item, qty: item.qty + linea.qty } : item)
                .filter(item => item.key !== key);
        }
        return prev.map(item =>
            item.key === key ? { ...item, key: nuevaKey, size: nuevaTalla } : item
        );
    });

    const guardarParaDespues = (key) => {
        const linea = cart.find(item => item.key === key);
        if (!linea) return;
        setGuardados(prev => prev.some(g => g.key === key) ? prev : [...prev, linea]);
        setCart(prev => prev.filter(item => item.key !== key));
    };

    const regresarAlCarrito = (key) => {
        const linea = guardados.find(item => item.key === key);
        if (!linea) return;
        setGuardados(prev => prev.filter(item => item.key !== key));
        setCart(prev => prev.some(c => c.key === key)
            ? prev.map(c => c.key === key ? { ...c, qty: c.qty + linea.qty } : c)
            : [...prev, linea]);
    };

    const borrarGuardado = (key) => setGuardados(prev => prev.filter(item => item.key !== key));

    const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    return (
        <ShopContext.Provider value={{
            products, loading, loadError, demo, reload,
            cart, addToCart, updateQty, clearCart, cartCount, cartTotal,
            removeLine, changeSize,
            guardados, guardarParaDespues, regresarAlCarrito, borrarGuardado
        }}>
            {children}
        </ShopContext.Provider>
    );
};
