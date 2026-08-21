import React from 'react';

const BrandFilter = ({ brands, active, onSelect }) => {
    const handleClick = (brand) => {
        onSelect(brand);
        document.getElementById('coleccion')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="brands" id="marcas">
            <div className="wrap">
                <div className="row">
                    <button
                        className={`brand-chip${active === null ? ' active' : ''}`}
                        onClick={() => handleClick(null)}
                    >
                        Todos
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
