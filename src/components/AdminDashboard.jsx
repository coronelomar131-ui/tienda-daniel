import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/shop-context';
import { Trash2, Plus } from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import GarmentArt from './GarmentArt';

const AdminDashboard = () => {
    const { products, addProduct, removeProduct } = useContext(ShopContext);
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [tag, setTag] = useState('');
    const [desc, setDesc] = useState('');
    const [mlLink, setMlLink] = useState('');
    const [imageBase64, setImageBase64] = useState('');

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
        if (!name || !price) {
            alert('Nombre y precio son requeridos.');
            return;
        }

        addProduct({
            name,
            price: Number(price),
            category,
            tag: tag || category,
            desc,
            mlLink,
            image: imageBase64, // vacío = se muestra el dibujo de la prenda
        });

        setName('');
        setPrice('');
        setTag('');
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
                        <h3><Plus size={16} style={{ verticalAlign: '-2px' }} /> Añadir producto</h3>
                        <form onSubmit={handleSubmit} className="admin-form">
                            <input type="text" placeholder="Nombre del modelo" value={name} onChange={(e) => setName(e.target.value)} />
                            <input type="number" placeholder="Precio (MXN)" value={price} onChange={(e) => setPrice(e.target.value)} min="0" />
                            <select value={category} onChange={(e) => setCategory(e.target.value)}>
                                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                            <input type="text" placeholder="Etiqueta (ej. Playera Técnica)" value={tag} onChange={(e) => setTag(e.target.value)} />
                            <textarea placeholder="Descripción corta" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
                            <input type="text" placeholder="Link de Mercado Libre (opcional)" value={mlLink} onChange={(e) => setMlLink(e.target.value)} />
                            <label>
                                Foto (opcional — sin foto se muestra un dibujo)
                                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ marginTop: '6px' }} />
                            </label>
                            <button type="submit" className="btn-primary">Guardar producto</button>
                        </form>
                    </div>

                    <div>
                        <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 400, fontSize: '19px', marginBottom: '20px' }}>
                            Catálogo ({products.length})
                        </h3>
                        <div className="admin-list">
                            {products.map(p => (
                                <div className="admin-item" key={p.id}>
                                    {p.image
                                        ? <img src={p.image} alt={p.name} />
                                        : <div className="thumb"><GarmentArt category={p.category} /></div>}
                                    <div className="info">
                                        <h4>{p.name}</h4>
                                        <span>{p.category} · ${Number(p.price).toLocaleString('es-MX')} MXN</span>
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
