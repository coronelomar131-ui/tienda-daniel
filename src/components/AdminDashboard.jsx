import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SneakerContext } from '../context/SneakerContext';
import { Trash2, Plus, Image as ImageIcon } from 'lucide-react';

const AdminDashboard = () => {
    const { sneakers, addSneaker, removeSneaker } = useContext(SneakerContext);
    const navigate = useNavigate();

    // State for new sneaker form
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [mlLink, setMlLink] = useState('');
    const [imageBase64, setImageBase64] = useState('');

    // Protect route
    useEffect(() => {
        const isAdmin = localStorage.getItem('isAdmin');
        if (!isAdmin) {
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
            reader.onloadend = () => {
                setImageBase64(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !price || !imageBase64) {
            alert('Nombre, precio e imagen son requeridos!');
            return;
        }

        addSneaker({
            name,
            price: Number(price),
            mlLink,
            image: imageBase64
        });

        // Reset form
        setName('');
        setPrice('');
        setMlLink('');
        setImageBase64('');
    };

    return (
        <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <h2>Panel de <span className="text-gradient">Control</span></h2>
                <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>Salir</button>
            </div>

            <div style={styles.grid}>
                {/* ADD SNEAKER FORM */}
                <div className="glass" style={styles.card}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={20} /> Añadir Tenis</h3>
                    <form onSubmit={handleSubmit} style={styles.formContainer}>
                        <input
                            type="text"
                            placeholder="Nombre del Modelo"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            style={styles.input}
                            required
                        />
                        <input
                            type="number"
                            placeholder="Precio (MXN)"
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                            style={styles.input}
                            required
                        />
                        <input
                            type="url"
                            placeholder="Enlace Mercado Libre (Opcional)"
                            value={mlLink}
                            onChange={e => setMlLink(e.target.value)}
                            style={styles.input}
                        />

                        <div style={styles.uploadBox}>
                            <label style={styles.uploadLabel}>
                                <ImageIcon size={24} style={{ marginBottom: '0.5rem' }} />
                                <span>Subir Foto del Tenis</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>
                        {imageBase64 && (
                            <img src={imageBase64} alt="Preview" style={styles.preview} />
                        )}

                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Guardar Tenis</button>
                    </form>
                </div>

                {/* CURRENT SNEAKERS LIST */}
                <div className="glass" style={styles.card}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Tenis Actuales ({sneakers.length})</h3>
                    <div style={styles.list}>
                        {sneakers.map(s => (
                            <div key={s.id} style={styles.listItem}>
                                <img src={s.image} alt={s.name} style={styles.listThumb} />
                                <div style={{ flexGrow: 1, marginLeft: '1rem' }}>
                                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>{s.name}</h4>
                                    <span style={{ color: 'var(--secondary-color)' }}>${s.price.toLocaleString('es-MX')}</span>
                                </div>
                                <button
                                    onClick={() => removeSneaker(s.id)}
                                    className="btn btn-outline"
                                    style={{ padding: '0.5rem', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
                                    title="Borrar Tenis"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                        {sneakers.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No hay tenis en el catálogo.</p>}
                    </div>
                </div>

            </div>
        </div>
    );
};

const styles = {
    grid: {
        display: 'grid',
        gridTemplateColumns: 'minmax(300px, 1fr) 2fr',
        gap: '2rem',
    },
    card: {
        padding: '2rem',
        borderRadius: '16px',
        height: 'fit-content',
    },
    formContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
    },
    input: {
        width: '100%',
        padding: '0.8rem 1rem',
        borderRadius: '8px',
        border: '1px solid var(--glass-border)',
        background: 'rgba(255, 255, 255, 0.05)',
        color: 'var(--text-main)',
        fontFamily: 'inherit',
    },
    uploadBox: {
        border: '2px dashed var(--glass-border)',
        borderRadius: '8px',
        padding: '2rem 1rem',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'border-color 0.3s',
    },
    uploadLabel: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: 'var(--text-muted)',
        cursor: 'pointer',
    },
    preview: {
        width: '100%',
        height: '150px',
        objectFit: 'cover',
        borderRadius: '8px',
        marginTop: '0.5rem',
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
    },
    listItem: {
        display: 'flex',
        alignItems: 'center',
        padding: '1rem',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '8px',
        border: '1px solid var(--glass-border)',
    },
    listThumb: {
        width: '60px',
        height: '60px',
        objectFit: 'cover',
        borderRadius: '6px',
    }
};

export default AdminDashboard;
