import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === '123') {
            localStorage.setItem('isAdmin', 'true');
            navigate('/admin/dashboard');
        } else {
            setError('Contraseña incorrecta');
        }
    };

    return (
        <div style={styles.container}>
            <form className="glass" onSubmit={handleLogin} style={styles.form}>
                <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Acceso Empleados</h2>

                {error && <p style={styles.error}>{error}</p>}

                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña"
                    style={styles.input}
                />

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                    Entrar
                </button>
            </form>
        </div>
    );
};

const styles = {
    container: {
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
    },
    form: {
        padding: '3rem',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '400px',
    },
    input: {
        width: '100%',
        padding: '1rem',
        borderRadius: '8px',
        border: '1px solid var(--glass-border)',
        background: 'rgba(255, 255, 255, 0.05)',
        color: 'var(--text-main)',
        fontSize: '1.1rem',
        marginBottom: '1rem',
    },
    error: {
        color: 'var(--primary-color)',
        marginBottom: '1rem',
        textAlign: 'center',
        fontSize: '0.9rem',
    }
};

export default AdminLogin;
