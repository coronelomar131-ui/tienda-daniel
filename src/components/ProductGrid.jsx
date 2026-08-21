import React from 'react';
import ProductCard from './ProductCard';

const ProductGrid = ({ products }) => {
    if (products.length === 0) {
        return <div className="empty-catalog">No hay piezas en esta categoría por ahora.</div>;
    }

    return (
        <div className="grid">
            {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
            ))}
        </div>
    );
};

export default ProductGrid;
