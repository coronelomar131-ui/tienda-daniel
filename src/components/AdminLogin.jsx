import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminIsClaimed, adminClaim, adminLogin } from '../lib/shopApi';
import { guardarSesion } from '../lib/adminSession';

const AdminLogin = () => {
    const [claimed, setClaimed] = useState(null); // null = todavía revisando
    const [pass, setPass] = useState('');
    const [pass2, setPass2] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const navigate = useNavigate();

    const [sinConexion, setSinConexion] = useState(false);

    const revisar = () => {
        setError('');
        setSinConexion(false);
        setClaimed(null);
        adminIsClaimed()
            .then(setClaimed)
            .catch((err) => {
                setError(err?.message || 'No hay conexión con la tienda');
                setSinConexion(true);
            });
    };

    useEffect(revisar, []);

    const entrar = async (e) => {
        e.preventDefault();
        setError('');
        setBusy(true);
        try {
            if (claimed === false) {
                if (pass !== pass2) throw new Error('Las dos claves no son iguales');
                await adminClaim(pass);
            } else {
                const ok = await adminLogin(pass);
                if (!ok) throw new Error('Clave incorrecta');
            }
            // La sesión dura una semana, para no pedir la clave a cada rato.
            guardarSesion(pass);
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err?.message || 'No se pudo entrar');
        } finally {
            setBusy(false);
        }
    };

    const primeraVez = claimed === false;

    return (
        <div className="login-page">
            <form className="login-card" onSubmit={entrar}>
                <h2>Prothe <em>Shops</em></h2>
                <p>{primeraVez ? 'Crea tu clave' : 'Acceso empleados'}</p>

                {primeraVez && (
                    <p className="login-note">
                        Es la primera vez que entras. La clave que escribas aquí
                        será la tuya: nadie más la conoce, ni queda escrita en el código.
                    </p>
                )}

                {error && <div className="login-error">{error}</div>}

                {sinConexion ? (
                    <button type="button" className="btn-primary" style={{ width: '100%' }} onClick={revisar}>
                        Reintentar
                    </button>
                ) : (
                  <>
                <input
                    type="password"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    placeholder={primeraVez ? 'Tu clave nueva (mínimo 6)' : 'Clave'}
                    autoComplete={primeraVez ? 'new-password' : 'current-password'}
                    disabled={claimed === null || busy}
                />

                {primeraVez && (
                    <input
                        type="password"
                        value={pass2}
                        onChange={(e) => setPass2(e.target.value)}
                        placeholder="Repite la clave"
                        autoComplete="new-password"
                        disabled={busy}
                    />
                )}

                <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: '100%' }}
                    disabled={claimed === null || busy}
                >
                    {claimed === null ? 'Conectando…' : busy ? 'Un momento…' : (primeraVez ? 'Guardar clave' : 'Entrar')}
                </button>
                  </>
                )}
            </form>
        </div>
    );
};

export default AdminLogin;
