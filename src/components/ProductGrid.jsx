import React from 'react';
import ProductCard from './ProductCard';

const ProductGrid = ({ products, loading, loadError }) => {
    if (loading) {
        return <div className="empty-catalog">Cargando el catálogo…</div>;
    }

    if (loadError) {
        return (
            <div className="empty-catalog">
                No se pudo cargar el catálogo
                <span className="empty-note">Revisa tu conexión y vuelve a entrar.</span>
            </div>
        );
    }

    if (products.length === 0) {
        return <div className="empty-catalog">No hay pares de esta marca por ahora</div>;
    }

    return (
        <div className="grid">
            {products.map(product => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
};

export default ProductGrid;
