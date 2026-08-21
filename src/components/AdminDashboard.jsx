import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus } from 'lucide-react';
import { ShopContext } from '../context/shop-context';
import { adminAddProduct, adminDeleteProduct, adminSetPassword } from '../lib/shopApi';
import { comprimirImagen } from '../lib/image';
import SneakerArt from './SneakerArt';

const AdminDashboard = () => {
    const { products, reload } = useContext(ShopContext);
    const navigate = useNavigate();

    const pass = sessionStorage.getItem('protheAdminPass');

    const [brand, setBrand] = useState('');
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [sizes, setSizes] = useState('');
    const [status, setStatus] = useState('');
    const [desc, setDesc] = useState('');
    const [mlLink, setMlLink] = useState('');
    const [foto, setFoto] = useState('');
    const [fotoNombre, setFotoNombre] = useState('');

    const [aviso, setAviso] = useState(null); // { tipo: 'ok' | 'error', texto }
    const [guardando, setGuardando] = useState(false);

    const [claveActual, setClaveActual] = useState('');
    const [claveNueva, setClaveNueva] = useState('');

    const marcasConocidas = useMemo(
        () => [...new Set(products.map(p => p.brand).filter(Boolean))].sort(),
        [products]
    );

    useEffect(() => {
        if (!pass) navigate('/admin');
    }, [pass, navigate]);

    const salir = () => {
        sessionStorage.removeItem('protheAdminPass');
        navigate('/');
    };

    const subirFoto = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setAviso(null);
        try {
            const dataUrl = await comprimirImagen(file);
            setFoto(dataUrl);
            setFotoNombre(`${file.name} · ${Math.round(dataUrl.length / 1024)} KB`);
        } catch (err) {
            setAviso({ tipo: 'error', texto: err.message });
        }
    };

    const limpiar = () => {
        setBrand(''); setName(''); setPrice(''); setSizes('');
        setStatus(''); setDesc(''); setMlLink(''); setFoto(''); setFotoNombre('');
    };

    const guardar = async (e) => {
        e.preventDefault();
        if (!brand.trim() || !name.trim() || !price) {
            setAviso({ tipo: 'error', texto: 'Marca, modelo y precio son obligatorios.' });
            return;
        }

        const tallas = sizes
            .split(',')
            .map(s => Number(s.trim().replace(',', '.')))
            .filter(n => !Number.isNaN(n) && n > 0);

        setGuardando(true);
        setAviso(null);
        try {
            await adminAddProduct(pass, {
                brand: brand.trim(),
                name: name.trim(),
                price: Number(price),
                sizes: tallas,
                status,
                desc,
                mlLink,
                photo: foto,
            });
            limpiar();
            await reload();
            setAviso({ tipo: 'ok', texto: 'Listo, ya está en tu tienda.' });
        } catch (err) {
            setAviso({ tipo: 'error', texto: err.message });
        } finally {
            setGuardando(false);
        }
    };

    const borrar = async (producto) => {
        if (!window.confirm(`¿Borrar ${producto.brand} ${producto.name}?`)) return;
        setAviso(null);
        try {
            await adminDeleteProduct(pass, producto.id);
            await reload();
        } catch (err) {
            setAviso({ tipo: 'error', texto: err.message });
        }
    };

    const cambiarClave = async (e) => {
        e.preventDefault();
        setAviso(null);
        try {
            await adminSetPassword(claveActual, claveNueva);
            sessionStorage.setItem('protheAdminPass', claveNueva);
            setClaveActual(''); setClaveNueva('');
            setAviso({ tipo: 'ok', texto: 'Clave cambiada.' });
        } catch (err) {
            setAviso({ tipo: 'error', texto: err.message });
        }
    };

    if (!pass) return null;

    return (
        <div className="admin-page">
            <div className="wrap">
                <div className="admin-head">
                    <h2>Panel de control</h2>
                    <button onClick={salir} className="btn-ghost">Salir</button>
                </div>

                {aviso && (
                    <div className={`admin-status ${aviso.tipo}`} style={{ marginBottom: '20px' }}>
                        {aviso.texto}
                    </div>
                )}

                <div className="admin-grid">
                    <div>
                        <div className="admin-card">
                            <h3><Plus size={16} style={{ verticalAlign: '-3px' }} /> Añadir par</h3>
                            <form onSubmit={guardar} className="admin-form">
                                <input
                                    type="text" placeholder="Marca (Nike, Jordan, Adidas...)"
                                    value={brand} onChange={(e) => setBrand(e.target.value)}
                                    list="marcas-existentes"
                                />
                                <datalist id="marcas-existentes">
                                    {marcasConocidas.map(b => <option key={b} value={b} />)}
                                </datalist>

                                <input type="text" placeholder="Modelo (Air Max 90...)" value={name} onChange={(e) => setName(e.target.value)} />
                                <input type="number" placeholder="Precio (MXN)" value={price} onChange={(e) => setPrice(e.target.value)} min="0" />

                                <input type="text" placeholder="Tallas MX: 25, 26, 27.5" value={sizes} onChange={(e) => setSizes(e.target.value)} />
                                <p className="hint">Sepáralas con comas. Vacío = sin tallas.</p>

                                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                                    <option value="">Sin etiqueta</option>
                                    <option value="nuevo">Etiqueta: NUEVO</option>
                                    <option value="agotado">Etiqueta: AGOTADO</option>
                                </select>

                                <textarea placeholder="Descripción corta" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
                                <input type="text" placeholder="Link de Mercado Libre (opcional)" value={mlLink} onChange={(e) => setMlLink(e.target.value)} />

                                <label>
                                    Foto del par
                                    <input type="file" accept="image/*" onChange={subirFoto} style={{ marginTop: '6px' }} />
                                </label>
                                {fotoNombre && <p className="hint">Lista: {fotoNombre}</p>}

                                <button type="submit" className="btn-primary" disabled={guardando}>
                                    {guardando ? 'Subiendo…' : 'Publicar par'}
                                </button>
                            </form>
                        </div>

                        <div className="admin-card" style={{ marginTop: '18px' }}>
                            <h3>Cambiar mi clave</h3>
                            <form onSubmit={cambiarClave} className="admin-form">
                                <input type="password" placeholder="Clave actual" value={claveActual} onChange={(e) => setClaveActual(e.target.value)} autoComplete="current-password" />
                                <input type="password" placeholder="Clave nueva (mínimo 6)" value={claveNueva} onChange={(e) => setClaveNueva(e.target.value)} autoComplete="new-password" />
                                <button type="submit" className="btn-ghost">Cambiar clave</button>
                            </form>
                        </div>
                    </div>

                    <div>
                        <h3 className="admin-list-title">Catálogo ({products.length})</h3>
                        <div className="admin-list">
                            {products.map(p => (
                                <div className="admin-item" key={p.id}>
                                    <div className="thumb"><SneakerArt /></div>
                                    <div className="info">
                                        <h4>{p.brand} {p.name}</h4>
                                        <span>
                                            ${p.price.toLocaleString('es-MX')} MXN
                                            {p.sizes.length ? ` · Tallas ${p.sizes.join(', ')}` : ' · Sin tallas'}
                                            {p.status ? ` · ${p.status.toUpperCase()}` : ''}
                                            {p.hasPhoto ? ' · con foto' : ''}
                                        </span>
                                    </div>
                                    <button className="del" onClick={() => borrar(p)} aria-label={`Borrar ${p.name}`}>
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
