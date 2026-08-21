import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/shop-context';
import { Trash2, Plus } from 'lucide-react';
import SneakerArt from './SneakerArt';

const AdminDashboard = () => {
    const { products, addProduct, removeProduct } = useContext(ShopContext);
    const navigate = useNavigate();

    const [brand, setBrand] = useState('');
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [sizes, setSizes] = useState('');
    const [status, setStatus] = useState('');
    const [desc, setDesc] = useState('');
    const [mlLink, setMlLink] = useState('');
    const [imageBase64, setImageBase64] = useState('');

    const knownBrands = useMemo(
        () => [...new Set(products.map(p => p.brand).filter(Boolean))].sort(),
        [products]
    );

    // Proteger la ruta
    useEffect(() => {
        if (!localStorage.getItem('isAdmin')) {
            navigate('/admin');
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('isAdmin');
        navigate('/');
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImageBase64(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!brand.trim() || !name.trim() || !price) {
            alert('Marca, modelo y precio son requeridos.');
            return;
        }

        const parsedSizes = sizes
            .split(',')
            .map(s => Number(s.trim().replace(',', '.')))
            .filter(n => !Number.isNaN(n) && n > 0);

        addProduct({
            brand: brand.trim(),
            name: name.trim(),
            price: Number(price),
            sizes: parsedSizes,
            status,
            desc: desc.trim(),
            mlLink: mlLink.trim(),
            image: imageBase64, // vacío = se muestra el dibujo de tenis
        });

        setBrand('');
        setName('');
        setPrice('');
        setSizes('');
        setStatus('');
        setDesc('');
        setMlLink('');
        setImageBase64('');
        e.target.reset?.();
    };

    return (
        <div className="admin-page">
            <div className="wrap">
                <div className="admin-head">
                    <h2>Panel de control</h2>
                    <button onClick={handleLogout} className="btn-ghost">Salir</button>
                </div>

                <div className="admin-grid">
                    <div className="admin-card">
                        <h3><Plus size={16} style={{ verticalAlign: '-3px' }} /> Añadir par</h3>
                        <form onSubmit={handleSubmit} className="admin-form">
                            <input
                                type="text" placeholder="Marca (Nike, Jordan, Adidas...)"
                                value={brand} onChange={(e) => setBrand(e.target.value)}
                                list="marcas-existentes"
                            />
                            <datalist id="marcas-existentes">
                                {knownBrands.map(b => <option key={b} value={b} />)}
                            </datalist>

                            <input type="text" placeholder="Modelo (Air Max 90...)" value={name} onChange={(e) => setName(e.target.value)} />
                            <input type="number" placeholder="Precio (MXN)" value={price} onChange={(e) => setPrice(e.target.value)} min="0" />

                            <input
                                type="text" placeholder="Tallas MX: 25, 26, 27.5"
                                value={sizes} onChange={(e) => setSizes(e.target.value)}
                            />
                            <p className="hint">Sepáralas con comas. Déjalo vacío si no manejas tallas.</p>

                            <select value={status} onChange={(e) => setStatus(e.target.value)}>
                                <option value="">Sin etiqueta</option>
                                <option value="nuevo">Etiqueta: NUEVO</option>
                                <option value="agotado">Etiqueta: AGOTADO</option>
                            </select>

                            <textarea placeholder="Descripción corta" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
                            <input type="text" placeholder="Link de Mercado Libre (opcional)" value={mlLink} onChange={(e) => setMlLink(e.target.value)} />

                            <label>
                                Foto (opcional — sin foto se muestra un dibujo)
                                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ marginTop: '6px' }} />
                            </label>

                            <button type="submit" className="btn-primary">Guardar par</button>
                        </form>
                    </div>

                    <div>
                        <h3 className="display" style={{ fontSize: '18px', marginBottom: '18px' }}>
                            Catálogo ({products.length})
                        </h3>
                        <div className="admin-list">
                            {products.map(p => (
                                <div className="admin-item" key={p.id}>
                                    {p.image
                                        ? <img src={p.image} alt={p.name} />
                                        : <div className="thumb"><SneakerArt /></div>}
                                    <div className="info">
                                        <h4>{p.brand} {p.name}</h4>
                                        <span>
                                            ${Number(p.price).toLocaleString('es-MX')} MXN
                                            {p.sizes?.length ? ` · Tallas ${p.sizes.join(', ')}` : ' · Sin tallas'}
                                            {p.status ? ` · ${p.status.toUpperCase()}` : ''}
                                        </span>
                                    </div>
                                    <button className="del" onClick={() => removeProduct(p.id)} aria-label={`Borrar ${p.name}`}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
