import React from 'react';
import { CATEGORIES } from '../data/categories';

const Categories = ({ active, onSelect }) => {
    const handleClick = (cat) => {
        onSelect(active === cat ? null : cat);
        document.getElementById('coleccion')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="cats" id="categorias">
            <div className="wrap">
                {CATEGORIES.map((cat, i) => (
                    <button
                        key={cat}
                        className={`cat${active === cat ? ' active' : ''}`}
                        onClick={() => handleClick(cat)}
                    >
                        N°0{i + 1}<span>{cat}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Categories;
