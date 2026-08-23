import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Pencil, ChevronUp, ChevronDown, X, Image as ImageIcon } from 'lucide-react';
import { ShopContext } from '../context/shop-context';
import {
    adminAddProduct, adminUpdateProduct, adminDeleteProduct,
    adminSetStatus, adminMoveProduct, adminAddPhotos, adminDeletePhoto,
    adminSetPassword, fetchPhotos,
} from '../lib/shopApi';
import { comprimirImagen } from '../lib/image';
import { leerSesion, guardarSesion, cerrarSesion } from '../lib/adminSession';
import SneakerArt from './SneakerArt';

const VACIO = { brand: '', name: '', price: '', sizes: '', status: '', desc: '', mlLink: '', videoUrl: '' };

const AdminDashboard = () => {
    const { products, reload } = useContext(ShopContext);
    const navigate = useNavigate();
    const pass = leerSesion();

    const [form, setForm] = useState(VACIO);
    const [editandoId, setEditandoId] = useState(null);   // null = alta nueva
    const [fotosNuevas, setFotosNuevas] = useState([]);   // data URLs por subir
    const [galeria, setGaleria] = useState([]);           // fotos ya guardadas del par en edicion

    const [aviso, setAviso] = useState(null);
    const [ocupado, setOcupado] = useState(false);

    const [claveActual, setClaveActual] = useState('');
    const [claveNueva, setClaveNueva] = useState('');

    const marcasConocidas = useMemo(
        () => [...new Set(products.map(p => p.brand).filter(Boolean))].sort(),
        [products]
    );

    useEffect(() => { if (!pass) navigate('/admin'); }, [pass, navigate]);

    const set = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.value }));

    const salir = () => { cerrarSesion(); navigate('/'); };

    const limpiar = () => {
        setForm(VACIO);
        setEditandoId(null);
        setFotosNuevas([]);
        setGaleria([]);
    };

    const correr = async (accion, exito) => {
        setOcupado(true);
        setAviso(null);
        try {
            await accion();
            await reload();
            if (exito) setAviso({ tipo: 'ok', texto: exito });
        } catch (err) {
            setAviso({ tipo: 'error', texto: err.message });
        } finally {
            setOcupado(false);
        }
    };

    const elegirFotos = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setAviso(null);
        try {
            const comprimidas = await Promise.all(files.map(comprimirImagen));
            setFotosNuevas(prev => [...prev, ...comprimidas]);
        } catch (err) {
            setAviso({ tipo: 'error', texto: err.message });
        }
        e.target.value = '';
    };

    const abrirEdicion = async (p) => {
        setForm({
            brand: p.brand, name: p.name, price: String(p.price),
            sizes: (p.sizes || []).join(', '), status: p.status,
            desc: p.desc, mlLink: p.mlLink, videoUrl: p.videoUrl,
        });
        setEditandoId(p.id);
        setFotosNuevas([]);
        setGaleria([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (p.photoCount) {
            try { setGaleria(await fetchPhotos(p.id)); } catch { /* se muestra vacia */ }
        }
    };

    const guardar = async (e) => {
        e.preventDefault();
        if (!form.brand.trim() || !form.name.trim() || !form.price) {
            setAviso({ tipo: 'error', texto: 'Marca, modelo y precio son obligatorios.' });
            return;
        }

        const datos = {
            brand: form.brand.trim(),
            name: form.name.trim(),
            price: Number(form.price),
            sizes: form.sizes.split(',').map(s => Number(s.trim().replace(',', '.')))
                .filter(n => !Number.isNaN(n) && n > 0),
            status: form.status,
            desc: form.desc,
            mlLink: form.mlLink,
            videoUrl: form.videoUrl,
        };

        if (editandoId) {
            await correr(async () => {
                await adminUpdateProduct(pass, editandoId, datos);
                if (fotosNuevas.length) await adminAddPhotos(pass, editandoId, fotosNuevas);
            }, 'Cambios guardados.');
        } else {
            await correr(
                () => adminAddProduct(pass, { ...datos, photos: fotosNuevas }),
                'Listo, ya está en tu tienda.'
            );
        }
        limpiar();
    };

    const borrarFotoGuardada = async (fotoId) => {
        await correr(async () => {
            await adminDeletePhoto(pass, fotoId);
            setGaleria(g => g.filter(f => f.id !== fotoId));
        });
    };

    const borrar = (p) => {
        if (!window.confirm(`¿Borrar ${p.brand} ${p.name}?`)) return;
        correr(() => adminDeleteProduct(pass, p.id));
        if (editandoId === p.id) limpiar();
    };

    const cambiarClave = async (e) => {
        e.preventDefault();
        setAviso(null);
        try {
            await adminSetPassword(claveActual, claveNueva);
            guardarSesion(claveNueva);
            setClaveActual(''); setClaveNueva('');
            setAviso({ tipo: 'ok', texto: 'Clave cambiada.' });
        } catch (err) {
            setAviso({ tipo: 'error', texto: err.message });
        }
    };

    if (!pass) return null;

    const total = fotosNuevas.length + galeria.length;

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
                            <h3>
                                {editandoId
                                    ? <><Pencil size={16} style={{ verticalAlign: '-3px' }} /> Editando par</>
                                    : <><Plus size={16} style={{ verticalAlign: '-3px' }} /> Añadir par</>}
                            </h3>

                            <form onSubmit={guardar} className="admin-form">
                                <input type="text" placeholder="Marca (Nike, Jordan, Adidas...)"
                                    value={form.brand} onChange={set('brand')} list="marcas-existentes" />
                                <datalist id="marcas-existentes">
                                    {marcasConocidas.map(b => <option key={b} value={b} />)}
                                </datalist>

                                <input type="text" placeholder="Modelo (Air Max 90...)" value={form.name} onChange={set('name')} />
                                <input type="number" placeholder="Precio (MXN)" value={form.price} onChange={set('price')} min="0" />

                                <input type="text" placeholder="Tallas MX: 25, 26, 27.5" value={form.sizes} onChange={set('sizes')} />
                                <p className="hint">Sepáralas con comas. Vacío = sin tallas.</p>

                                <select value={form.status} onChange={set('status')}>
                                    <option value="">Sin etiqueta</option>
                                    <option value="nuevo">Etiqueta: NUEVO</option>
                                    <option value="agotado">Etiqueta: AGOTADO</option>
                                </select>

                                <textarea placeholder="Descripción corta" value={form.desc} onChange={set('desc')} rows={3} />
                                <input type="text" placeholder="Link de Mercado Libre (opcional)" value={form.mlLink} onChange={set('mlLink')} />

                                <input type="text" placeholder="Link del video (TikTok, Instagram o YouTube)"
                                    value={form.videoUrl} onChange={set('videoUrl')} />
                                <p className="hint">Pega el link de tu Reel o TikTok. Opcional.</p>

                                <label>
                                    Fotos del par {total > 0 && `(${total})`}
                                    <input type="file" accept="image/*" multiple onChange={elegirFotos} style={{ marginTop: '6px' }} />
                                </label>
                                <p className="hint">Puedes escoger varias de un jalón. La primera es la que sale en el catálogo.</p>

                                {(galeria.length > 0 || fotosNuevas.length > 0) && (
                                    <div className="fotos-tira">
                                        {galeria.map(f => (
                                            <div className="foto-chip" key={f.id}>
                                                <img src={f.data} alt="" />
                                                <button type="button" onClick={() => borrarFotoGuardada(f.id)} aria-label="Quitar foto">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        {fotosNuevas.map((d, i) => (
                                            <div className="foto-chip nueva" key={`n${i}`}>
                                                <img src={d} alt="" />
                                                <button type="button"
                                                    onClick={() => setFotosNuevas(f => f.filter((_, j) => j !== i))}
                                                    aria-label="Quitar foto">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button type="submit" className="btn-primary" disabled={ocupado}>
                                    {ocupado ? 'Guardando…' : editandoId ? 'Guardar cambios' : 'Publicar par'}
                                </button>

                                {editandoId && (
                                    <button type="button" className="btn-ghost" onClick={limpiar}>
                                        Cancelar
                                    </button>
                                )}
                            </form>
                        </div>

                        <div className="admin-card" style={{ marginTop: '18px' }}>
                            <h3>Cambiar mi clave</h3>
                            <form onSubmit={cambiarClave} className="admin-form">
                                <input type="password" placeholder="Clave actual" value={claveActual}
                                    onChange={(e) => setClaveActual(e.target.value)} autoComplete="current-password" />
                                <input type="password" placeholder="Clave nueva (mínimo 6)" value={claveNueva}
                                    onChange={(e) => setClaveNueva(e.target.value)} autoComplete="new-password" />
                                <button type="submit" className="btn-ghost">Cambiar clave</button>
                            </form>
                        </div>
                    </div>

                    <div>
                        <h3 className="admin-list-title">Catálogo ({products.length})</h3>
                        <p className="hint" style={{ marginBottom: '14px' }}>
                            El de hasta arriba es el primero que ven tus clientes. Usa las flechas para acomodarlos.
                        </p>

                        <div className="admin-list">
                            {products.map((p, i) => (
                                <div className={`admin-item${editandoId === p.id ? ' editando' : ''}`} key={p.id}>
                                    <div className="orden">
                                        <button onClick={() => correr(() => adminMoveProduct(pass, p.id, true))}
                                            disabled={i === 0 || ocupado} aria-label="Subir">
                                            <ChevronUp size={14} />
                                        </button>
                                        <button onClick={() => correr(() => adminMoveProduct(pass, p.id, false))}
                                            disabled={i === products.length - 1 || ocupado} aria-label="Bajar">
                                            <ChevronDown size={14} />
                                        </button>
                                    </div>

                                    <div className="thumb">
                                        {p.photoCount ? <ImageIcon size={18} /> : <SneakerArt />}
                                    </div>

                                    <div className="info">
                                        <h4>{p.brand} {p.name}</h4>
                                        <span>
                                            ${p.price.toLocaleString('es-MX')} MXN
                                            {p.sizes.length ? ` · Tallas ${p.sizes.join(', ')}` : ' · Sin tallas'}
                                            {p.photoCount ? ` · ${p.photoCount} foto${p.photoCount > 1 ? 's' : ''}` : ' · sin fotos'}
                                            {p.videoUrl ? ' · con video' : ''}
                                        </span>
                                    </div>

                                    <label className={`switch${p.status === 'agotado' ? ' on' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={p.status === 'agotado'}
                                            disabled={ocupado}
                                            onChange={(e) => correr(() =>
                                                adminSetStatus(pass, p.id, e.target.checked ? 'agotado' : '')
                                            )}
                                        />
                                        <span>Agotado</span>
                                    </label>

                                    <button className="del editar" onClick={() => abrirEdicion(p)} aria-label={`Editar ${p.name}`}>
                                        <Pencil size={16} />
                                    </button>
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
