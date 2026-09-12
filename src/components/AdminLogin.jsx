import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminIsClaimed, adminClaim, adminLogin, adminCaras, adminEntrar } from '../lib/shopApi';
import { guardarSesion } from '../lib/adminSession';
import { hayFaceId, hayAlgunaDadaDeAlta, entrarConFaceId } from '../lib/passkey';

// El simbolo de Face ID: el marco de la camara con una carita. Se dibuja aqui
// en vez de traer una libreria de iconos completa por un solo simbolo.
const HuellaIcono = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
        <path d="M9 10v1M15 10v1M9.5 15.5a3.5 3.5 0 0 0 5 0" />
    </svg>
);

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
    // El boton de Face ID solo sale si el aparato lo tiene Y si ya hay alguna
    // huella dada de alta. Ofrecerlo sin nada registrado seria mandar a la
    // gente a una pantalla que no puede terminar.
    const [conFaceId, setConFaceId] = useState(false);
    const [usandoFaceId, setUsandoFaceId] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        let vivo = true;
        Promise.all([hayFaceId(), hayAlgunaDadaDeAlta()])
            .then(([puede, hay]) => { if (vivo) setConFaceId(puede && hay); })
            .catch(() => { /* si falla, simplemente no se ofrece */ });
        return () => { vivo = false; };
    }, []);

    const entrarConCara = async () => {
        setError('');
        setUsandoFaceId(true);
        try {
            const token = await entrarConFaceId();
            if (!token) throw new Error('No se pudo abrir la sesión');
            guardarSesion(token);
            navigate('/admin/dashboard');
        } catch (err) {
            // El navegador manda el mismo NotAllowedError si la persona cancela
            // o si este aparato no tiene la huella dada de alta: a proposito, para
            // no soplarle a nadie si existe o no. Un aviso que sirva para los dos
            // casos es mejor que dejar la pantalla muda.
            const m = err?.name === 'NotAllowedError'
                ? 'Se canceló, o este aparato no está dado de alta. Entra con tu clave.'
                : (err?.message || 'No se pudo entrar');
            setError(m);
        } finally {
            setUsandoFaceId(false);
        }
    };

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
            // Lo que devuelven es el TOKEN de la sesion, o null si la clave
            // no es correcta. La contraseña escrita no se guarda en ningun lado.
            let token;
            if (claimed === false) {
                if (pass !== pass2) throw new Error('Las dos claves no son iguales');
                token = await adminClaim(pass);
            } else if (quien?.id) {
                // Alguien de la lista: se revisa contra SU clave.
                token = await adminEntrar(quien.id, pass);
                if (!token) throw new Error('Esa no es la clave de ' + quien.nombre);
            } else {
                // Sin id: es el dueño entrando por la salida de emergencia, y
                // esa va contra la clave maestra, no contra la de un empleado.
                token = await adminLogin(pass);
                if (!token) throw new Error('Clave incorrecta');
            }
            if (!token) throw new Error('No se pudo abrir la sesión');
            guardarSesion(token);
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

                {conFaceId && !primeraVez && (
                    <>
                        <button type="button" className="btn-cara" onClick={entrarConCara}
                                disabled={usandoFaceId}>
                            <HuellaIcono />
                            {usandoFaceId ? 'Esperando…' : 'Entrar con Face ID'}
                        </button>
                        <div className="o-bien"><span>o con tu clave</span></div>
                    </>
                )}

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
