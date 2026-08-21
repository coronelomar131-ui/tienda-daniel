import React from 'react';

const BrandFilter = ({ brands, active, onSelect }) => {
    const handleClick = (brand) => {
        onSelect(brand);
        document.getElementById('coleccion')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="brands">
            <div className="wrap">
                <div className="row">
                    <span className="row-label">Marca</span>
                    <button
                        className={`brand-chip${active === null ? ' active' : ''}`}
                        onClick={() => handleClick(null)}
                    >
                        Todas
                    </button>
                    {brands.map(brand => (
                        <button
                            key={brand}
                            className={`brand-chip${active === brand ? ' active' : ''}`}
                            onClick={() => handleClick(brand)}
                        >
                            {brand}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BrandFilter;
