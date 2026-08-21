import React from 'react';
import ProductCard from './ProductCard';

const ProductGrid = ({ products }) => {
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
