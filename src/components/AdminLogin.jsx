import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminIsClaimed, adminClaim, adminLogin, adminCaras, adminEntrar } from '../lib/shopApi';
import { guardarSesion } from '../lib/adminSession';

// Iniciales para cuando alguien no subio foto: mejor eso que un hueco gris.
const iniciales = (nombre) => (nombre || '?')
    .trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase();

const AdminLogin = () => {
    const [claimed, setClaimed] = useState(null);   // null = todavia revisando
    const [caras, setCaras] = useState([]);
    const [quien, setQuien] = useState(null);       // la persona elegida
    const [pass, setPass] = useState('');
    const [pass2, setPass2] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [sinConexion, setSinConexion] = useState(false);
    const navigate = useNavigate();

    const revisar = () => {
        setError('');
        setSinConexion(false);
        setClaimed(null);
        Promise.all([adminIsClaimed(), adminCaras().catch(() => [])])
            .then(([listo, gente]) => { setClaimed(listo); setCaras(gente || []); })
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
            } else if (quien?.id) {
                // Alguien de la lista: se revisa contra SU clave.
                const ok = await adminEntrar(quien.id, pass);
                if (!ok) throw new Error('Esa no es la clave de ' + quien.nombre);
            } else {
                // Sin id: es el dueño entrando por la salida de emergencia, y
                // esa va contra la clave maestra, no contra la de un empleado.
                const ok = await adminLogin(pass);
                if (!ok) throw new Error('Clave incorrecta');
            }
            guardarSesion(pass);
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err?.message || 'No se pudo entrar');
        } finally {
            setBusy(false);
        }
    };

    const primeraVez = claimed === false;
    // Con gente dada de alta y sin nadie elegido todavia, se enseñan las caras.
    const eligiendo = !primeraVez && caras.length > 0 && !quien;

    return (
        <div className="login-page">
            <div className="login-fondo" aria-hidden="true" />

            <div className="login-card">
                <h2>Prothe <em>Shop</em></h2>
                <p>{primeraVez ? 'Crea tu clave' : eligiendo ? '¿Quién eres?' : 'Acceso empleados'}</p>

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
                ) : eligiendo ? (
                    <>
                    <div className="caras">
                        {caras.map(c => (
                            <button key={c.id} className="cara" onClick={() => { setQuien(c); setError(''); }}>
                                <span className="cara-foto">
                                    {c.foto
                                        ? <img src={c.foto} alt="" />
                                        : <span className="cara-iniciales">{iniciales(c.nombre)}</span>}
                                </span>
                                <span className="cara-nombre">{c.nombre}</span>
                            </button>
                        ))}
                    </div>
                    {/* Salida de emergencia. La clave de dueño sigue sirviendo,
                        pero sin una puerta en pantalla no habria como usarla: si
                        da de alta gente y se le olvida crearse a si mismo, se
                        queda fuera de su propia tienda. */}
                    <button type="button" className="link-btn login-otra"
                            onClick={() => setQuien({ id: null, nombre: 'el dueño' })}>
                        No estoy en la lista
                    </button>
                    </>
                ) : (
                    <form onSubmit={entrar}>
                        {quien && quien.id && (
                            <div className="cara-elegida">
                                <span className="cara-foto">
                                    {quien.foto
                                        ? <img src={quien.foto} alt="" />
                                        : <span className="cara-iniciales">{iniciales(quien.nombre)}</span>}
                                </span>
                                <strong>{quien.nombre}</strong>
                            </div>
                        )}

                        <input
                            type="password"
                            value={pass}
                            onChange={(e) => setPass(e.target.value)}
                            placeholder={primeraVez ? 'Tu clave nueva (mínimo 6)' : 'Tu clave'}
                            autoComplete={primeraVez ? 'new-password' : 'current-password'}
                            disabled={claimed === null || busy}
                            autoFocus={!!quien}
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

                        <button type="submit" className="btn-primary" style={{ width: '100%' }}
                                disabled={claimed === null || busy}>
                            {claimed === null ? 'Conectando…' : busy ? 'Un momento…' : (primeraVez ? 'Guardar clave' : 'Entrar')}
                        </button>

                        {quien && caras.length > 0 && (
                            <button type="button" className="link-btn login-volver"
                                    onClick={() => { setQuien(null); setPass(''); setError(''); }}>
                                ← No soy {quien.nombre}
                            </button>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
};

export default AdminLogin;
