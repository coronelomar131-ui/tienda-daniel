import React, { useCallback, useState, useContext, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Pencil, ChevronUp, ChevronDown, X, Package, Receipt, Store } from 'lucide-react';
import { ShopContext } from '../context/shop-context';
import {
    adminAddProduct, adminUpdateProduct, adminDeleteProduct,
    adminSetStatus, adminSetDestacado, adminMoveProduct, adminAddPhotos, adminDeletePhoto,
    adminCaras, adminCrearUsuario, adminQuitarUsuario,
    adminSetPassword, fetchPhotos,
} from '../lib/shopApi';
import { comprimirImagen } from '../lib/image';
import { subirVideo, LIMITE_MB } from '../lib/videoUpload';
import { fetchHeroVideo, adminSetHeroVideo, adminCerrarSesion,
         adminPasskeys, adminQuitarPasskey } from '../lib/shopApi';
import { hayFaceId, darDeAltaFaceId, precalentarAlta } from '../lib/passkey';
import { CaraIcono } from './AdminLogin';
import { adminOrdersResumen } from '../lib/pagos';
import { leerSesion, guardarSesion, cerrarSesion } from '../lib/adminSession';
import { esFallaDeRed } from '../lib/supabase';
import SneakerArt from './SneakerArt';
import PantallaCarga from './PantallaCarga';
import Pedidos from './Pedidos';
import { leerTallas, escribirTallas } from '../lib/tallas';
import { verDescuento, pesos, antesDesdePct, pctDesdeAntes } from '../lib/descuento';
import { CATEGORIAS } from '../lib/categorias';
import { comprimirAvatar } from '../lib/avatar';
import { subirFotos } from '../lib/fotoUpload';
import MiniFoto from './MiniFoto';

const VACIO = { brand: '', name: '', price: '', priceBefore: '', pct: '', categoria: 'calzado', sizes: '', status: '', desc: '', mlLink: '', videoUrl: '' };

const AdminDashboard = () => {
    const { products, reload } = useContext(ShopContext);
    const navigate = useNavigate();
    const pass = leerSesion();

    const [form, setForm] = useState(VACIO);
    // Lo que se entendió del campo de tallas, para enseñárselo mientras escribe.
    // Gente que puede entrar al panel
    const [gente, setGente] = useState([]);
    const [nuevoNombre, setNuevoNombre] = useState('');
    const [nuevaClave, setNuevaClave] = useState('');
    const [nuevaFoto, setNuevaFoto] = useState('');

    const cargarGente = useCallback(() => {
        adminCaras().then(g => setGente(g || [])).catch(() => setGente([]));
    }, []);
    useEffect(() => { cargarGente(); }, [cargarGente]);

    const elegirFoto = async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        try { setNuevaFoto(await comprimirAvatar(f)); }
        catch (err) { setAviso({ tipo: 'error', texto: err.message }); }
    };

    const darDeAlta = (e) => {
        e.preventDefault();
        correr(async () => {
            await adminCrearUsuario(pass, nuevoNombre, nuevaFoto, nuevaClave);
            setNuevoNombre(''); setNuevaClave(''); setNuevaFoto('');
            cargarGente();
        }, 'Ya puede entrar.');
    };

    const quitarDelPanel = (u) => {
        if (!window.confirm(`¿Quitar a ${u.nombre} del panel? Ya no va a poder entrar.`)) return;
        correr(async () => { await adminQuitarUsuario(pass, u.id); cargarGente(); }, 'Quitado.');
    };

    const tallasLeidas = useMemo(() => leerTallas(form.sizes), [form.sizes]);
    // El descuento que va a ver el cliente, calculado igual que en la tienda.
    const ofertaPrevia = useMemo(
        () => verDescuento({ price: Number(form.price), priceBefore: Number(form.priceBefore) }),
        [form.price, form.priceBefore]
    );

    // Los dos campos de oferta estan ligados: escribes uno y el otro se llena.
    // Se guarda el precio anterior; el porcentaje es solo la forma comoda de
    // capturarlo.
    const escribirPct = (valor) => setForm(f => ({
        ...f,
        pct: valor,
        priceBefore: valor === '' ? '' : (antesDesdePct(f.price, valor) ?? ''),
    }));

    const escribirAntes = (valor) => setForm(f => ({
        ...f,
        priceBefore: valor,
        pct: valor === '' ? '' : (pctDesdeAntes(f.price, valor) ?? ''),
    }));

    // Si cambia el precio y ya habia un descuento puesto, se respeta el
    // PORCENTAJE y se recalcula el "antes". Al reves, poner un par en oferta
    // del 25% y bajarle el precio lo dejaria de pronto en 31% sin pedirlo.
    const escribirPrecio = (valor) => setForm(f => ({
        ...f,
        price: valor,
        priceBefore: f.pct === '' ? f.priceBefore : (antesDesdePct(valor, f.pct) ?? ''),
    }));
    const [editandoId, setEditandoId] = useState(null);   // null = alta nueva
    // Archivos comprimidos que esperan a subirse, con su vista previa local
    const [fotosNuevas, setFotosNuevas] = useState([]);   // [{blob, previa}]
    const [galeria, setGaleria] = useState([]);           // fotos ya guardadas del par en edicion

    const [aviso, setAviso] = useState(null);
    const [ocupado, setOcupado] = useState(false);

    // En celular el panel se parte en dos pestanas: lo que mas se usa a diario
    // es el catalogo, asi que esa abre primero.
    const [tab, setTab] = useState('catalogo');

    const [subiendoVideo, setSubiendoVideo] = useState('');
    const [heroVideo, setHeroVideo] = useState('');
    const [heroCargado, setHeroCargado] = useState(false);

    // Lo unico que de verdad urge saber al abrir: si hay dinero esperando.
    const [porCobrar, setPorCobrar] = useState(null);
    // Antes el panel se pintaba entero con solo tener algo escrito en la
    // memoria del navegador: metias cualquier texto a mano y salia. Los datos
    // no se veian (cada peticion revisa el token en el servidor), pero la
    // pantalla si, y eso es una puerta abierta esperando a que algun dia se le
    // cuelgue algo delicado. Esta misma llamada ya preguntaba al servidor;
    // ahora ademas decide si se pinta o no.
    const [sesion, setSesion] = useState('revisando');   // revisando | vale | sinred | no
    const [reintento, setReintento] = useState(0);
    const revisarSesion = useCallback(() => {
        setSesion('revisando');
        setReintento(n => n + 1);
    }, []);
    useEffect(() => {
        let vivo = true;
        if (!pass) { setSesion('no'); return; }
        adminOrdersResumen(pass)
            .then(r => { if (vivo) { setPorCobrar(r); setSesion('vale'); } })
            .catch((err) => {
                if (!vivo) return;
                // Sin internet no se echa a nadie: solo cuando el SERVIDOR dice
                // que el token no vale. Antes eso se decidia comparando el texto
                // en español del aviso, y un texto es para leerse, no para
                // decidir quien entra: el dia que se cambiara esa frase, la
                // puerta cambiaba de comportamiento sin que nadie se enterara.
                // Ahora el error trae la marca pegada desde que nace.
                //
                // Y sin señal ya no se pinta el panel entero —que de todos modos
                // saldria vacio, porque todo viene del servidor— sino un aviso
                // que dice que pasa y deja reintentar.
                setSesion(esFallaDeRed(err) ? 'sinred' : 'no');
            });
        return () => { vivo = false; };
    }, [pass, reintento]);

    useEffect(() => {
        if (sesion === 'no') { cerrarSesion(); navigate('/admin'); }
    }, [sesion, navigate]);

    // --- Face ID ---
    const [puedeFaceId, setPuedeFaceId] = useState(null);   // null = todavia no sabemos
    const [misFaceId, setMisFaceId] = useState([]);
    const [dandoAlta, setDandoAlta] = useState(false);
    // El aviso general se pinta hasta arriba del panel. Cuando estas abajo, en
    // la ficha, no lo ves nunca: le picas, falla, y parece que no paso nada.
    // Este se pinta junto al boton que acabas de tocar.
    const [avisoCara, setAvisoCara] = useState(null);

    const cargarFaceId = useCallback(() => {
        adminPasskeys(pass).then(l => setMisFaceId(l || [])).catch(() => setMisFaceId([]));
    }, [pass]);

    useEffect(() => {
        hayFaceId().then(setPuedeFaceId).catch(() => setPuedeFaceId(false));
    }, []);
    useEffect(() => { if (pass) cargarFaceId(); }, [pass, cargarFaceId]);

    // "12 sep", "hace 2 h", "ahorita". Lo suficiente para reconocer un aparato
    // en una lista de dos o tres, sin poner una fecha larga que nadie lee.
    const cuando = (iso) => {
        if (!iso) return null;
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return null;
        const min = Math.floor((Date.now() - d.getTime()) / 60000);
        if (min < 2) return 'ahorita';
        if (min < 60) return `hace ${min} min`;
        if (min < 1440) return `hace ${Math.floor(min / 60)} h`;
        if (min < 10080) return `hace ${Math.floor(min / 1440)} días`;
        return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    };

    const nombreDelAparato = () =>
        (/iPhone|iPad/.test(navigator.userAgent) ? 'Mi iPhone'
         : /Android/.test(navigator.userAgent) ? 'Mi celular'
         : 'Mi computadora');

    const altaFaceId = async () => {
        setAviso(null);
        setAvisoCara(null);
        setDandoAlta(true);
        try {
            await darDeAltaFaceId(pass, nombreDelAparato());
            cargarFaceId();
            setAviso({ tipo: 'ok', texto: 'Listo. La próxima vez entras con Face ID.' });
            setAvisoCara({ tipo: 'ok', texto: 'Listo. La próxima vez entras con Face ID.' });
        } catch (err) {
            const texto = err?.name === 'NotAllowedError'
                ? 'Se canceló, o el aparato no dejó. Vuelve a intentar.'
                : (err?.message || 'No se pudo dar de alta');
            setAviso({ tipo: 'error', texto });
            setAvisoCara({ tipo: 'error', texto });
        } finally {
            setDandoAlta(false);
            precalentarAlta(pass, nombreDelAparato());   // dejarlo listo por si repite
        }
    };

    const quitarFaceId = async (id) => {
        try {
            await adminQuitarPasskey(pass, id);
            cargarFaceId();
        } catch (err) {
            setAviso({ tipo: 'error', texto: err.message });
        }
    };

    const [claveActual, setClaveActual] = useState('');
    const [claveNueva, setClaveNueva] = useState('');

    const marcasConocidas = useMemo(
        () => [...new Set(products.map(p => p.brand).filter(Boolean))].sort(),
        [products]
    );
    const agotados = useMemo(
        () => products.filter(p => p.status === 'agotado').length,
        [products]
    );

    useEffect(() => { if (!pass) navigate('/admin'); }, [pass, navigate]);

    useEffect(() => {
        fetchHeroVideo()
            .then(setHeroVideo)
            .catch(() => { /* se queda vacio */ })
            .finally(() => setHeroCargado(true));
    }, []);

    // Sube el archivo y deja el enlace en el campo del video del par.
    const elegirVideo = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setAviso(null);
        try {
            const url = await subirVideo(pass, file, setSubiendoVideo);
            setForm(f => ({ ...f, videoUrl: url }));
            setAviso({ tipo: 'ok', texto: 'Video subido. Guarda el par para que quede.' });
        } catch (err) {
            setAviso({ tipo: 'error', texto: err.message });
        } finally {
            setSubiendoVideo('');
        }
    };

    const elegirVideoPortada = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setAviso(null);
        try {
            const url = await subirVideo(pass, file, setSubiendoVideo);
            await adminSetHeroVideo(pass, url);
            setHeroVideo(url);
            setAviso({ tipo: 'ok', texto: 'Listo, ya se ve en tu portada.' });
        } catch (err) {
            setAviso({ tipo: 'error', texto: err.message });
        } finally {
            setSubiendoVideo('');
        }
    };

    const quitarVideoPortada = async () => {
        await correr(async () => {
            await adminSetHeroVideo(pass, '');
            setHeroVideo('');
        }, 'Video de portada quitado.');
    };

    const set = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.value }));

    // Salir tira la sesion en el SERVIDOR, no solo la borra de este navegador:
    // si el token quedo copiado en otro lado, ahi tambien deja de servir. Si la
    // peticion falla igual se sale, que es lo que la persona pidio.
    const salir = () => {
        if (pass) adminCerrarSesion(pass).catch(() => { /* se sale igual */ });
        cerrarSesion();
        navigate('/');
    };

    const limpiar = () => {
        setForm(VACIO);
        setEditandoId(null);
        // Se sueltan las vistas previas: cada una reserva memoria hasta que se
        // le avisa al navegador que ya no se ocupa.
        setFotosNuevas(lista => { lista.forEach(f => URL.revokeObjectURL(f.previa)); return []; });
        setGaleria([]);
        setSubiendoVideo('');
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
            setFotosNuevas(prev => [...prev, ...comprimidas.map(blob => ({
                blob, previa: URL.createObjectURL(blob),
            }))]);
        } catch (err) {
            setAviso({ tipo: 'error', texto: err.message });
        }
        e.target.value = '';
    };

    const abrirEdicion = async (p) => {
        setForm({
            brand: p.brand, name: p.name, price: String(p.price),
            sizes: escribirTallas(p.sizes), status: p.status, priceBefore: p.priceBefore || '', pct: pctDesdeAntes(p.price, p.priceBefore) || '', categoria: p.categoria || 'calzado',
            desc: p.desc, mlLink: p.mlLink, videoUrl: p.videoUrl,
        });
        setEditandoId(p.id);
        setFotosNuevas([]);
        setGaleria([]);
        setTab('nuevo');
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
            priceBefore: form.priceBefore === '' ? null : Number(form.priceBefore),
            categoria: form.categoria || 'calzado',
            sizes: leerTallas(form.sizes),
            status: form.status,
            desc: form.desc,
            mlLink: form.mlLink,
            videoUrl: form.videoUrl,
        };

        if (editandoId) {
            await correr(async () => {
                await adminUpdateProduct(pass, editandoId, datos);
                if (fotosNuevas.length) {
                    const urls = await subirFotos(pass, fotosNuevas.map(f => f.blob), setSubiendoVideo);
                    await adminAddPhotos(pass, editandoId, urls);
                }
            }, 'Cambios guardados.');
        } else {
            await correr(async () => {
                const urls = await subirFotos(pass, fotosNuevas.map(f => f.blob), setSubiendoVideo);
                return adminAddProduct(pass, { ...datos, photos: urls });
            }, 'Listo, ya está en tu tienda.');
        }
        limpiar();
        setTab('catalogo');
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
            // Al cambiar la clave el servidor tira TODAS las sesiones de esa
            // persona (por si alguien le robo el token) y devuelve una nueva,
            // para que a quien la cambio no lo saque su propio cambio.
            const token = await adminSetPassword(claveActual, claveNueva);
            // El servidor devuelve null cuando la clave actual no es la buena.
            // Antes reventaba, pero así no podía anotar el intento fallido (el
            // error deshace todo lo de la misma llamada) y el freno por
            // intentos nunca entraba.
            if (!token) throw new Error('La clave actual no es correcta');
            guardarSesion(token);
            setClaveActual(''); setClaveNueva('');
            setAviso({ tipo: 'ok', texto: 'Clave cambiada.' });
        } catch (err) {
            setAviso({ tipo: 'error', texto: err.message });
        }
    };

    // Mientras el servidor confirma la sesion se enseña el esqueleto del panel,
    // no una pantalla negra. Si la sesion no vale, el efecto de arriba ya mando
    // a la pantalla de la clave, asi que aqui no se pinta nada.
    if (!pass) return null;
    if (sesion === 'revisando') return <PantallaCarga />;
    if (sesion === 'sinred') return <PantallaCarga sinRed onReintentar={revisarSesion} />;
    if (sesion !== 'vale') return null;

    const total = fotosNuevas.length + galeria.length;

    return (
        <div className="admin-page">
            <div className="wrap">
                <div className="admin-head">
                    <h2>Panel de control</h2>
                    <button onClick={salir} className="btn-ghost">Salir</button>
                </div>

                {subiendoVideo && (
                    <div className="admin-status ok" style={{ marginBottom: '20px' }}>
                        {subiendoVideo} No cierres esta pantalla.
                    </div>
                )}

                {aviso && !subiendoVideo && (
                    <div className={`admin-status ${aviso.tipo}`} style={{ marginBottom: '20px' }}>
                        {aviso.texto}
                    </div>
                )}

                {/* Barra flotante abajo: se alcanza con el pulgar. Arriba, en un
                    celular grande, había que estirar la mano para cambiar de
                    pantalla. La pestaña abierta se rellena y enseña su nombre;
                    las otras se quedan en puro icono, como en las apps. */}
                {/* Antes aqui iban dos tarjetas con "En el catálogo: 19" y "Con
                    oferta: 2". Eso ya lo sabes de memoria; era numero bonito, no
                    informacion. Esto dice lo unico que cambia de un dia a otro y
                    que si te hace levantarte a hacer algo. */}
                <button type="button"
                        className={`pendiente${porCobrar?.pendientes > 0 ? ' urge' : ''}`}
                        onClick={() => setTab('pedidos')}
                        aria-label="Ir a pedidos">
                    {porCobrar?.pendientes > 0 ? (
                        <>
                            <strong>
                                {porCobrar.pendientes === 1
                                    ? 'Un pedido espera confirmación'
                                    : `${porCobrar.pendientes} pedidos esperan confirmación`}
                            </strong>
                            <span>
                                {porCobrar.pendientes === 1
                                    ? 'Ábrelo para marcar si ya te pagó'
                                    : 'Ábrelos para marcar quién ya te pagó'}
                            </span>
                        </>
                    ) : (
                        <>
                            <strong>Nada pendiente por cobrar</strong>
                            <span>
                                {agotados > 0
                                    ? `${products.length} pares en la vitrina, ${agotados} agotados`
                                    : `${products.length} pares en la vitrina`}
                            </span>
                        </>
                    )}
                </button>

                {/* Dar de alta el Face ID se hace UNA vez. Tenerlo hasta el fondo
                    de la columna, debajo de todos los pares, era imposible de
                    encontrar en un celular. Aqui arriba se ve el primer dia y
                    se va solo en cuanto queda dado de alta. */}
                {puedeFaceId !== null && misFaceId.length === 0 && tab !== 'tienda' && (
                    <div className="aviso-cara">
                        <span className="cara-glifo marco-cara"><CaraIcono /></span>
                        <div className="aviso-cara-texto">
                            <strong>Entra con tu cara</strong>
                            <span>Se hace una sola vez y ya no tecleas la clave.</span>
                        </div>
                        <button type="button" onClick={altaFaceId} disabled={dandoAlta}>
                            {dandoAlta ? 'Mirándote' : 'Activar'}
                        </button>
                        {avisoCara && (
                            <p className={`recado-cara ${avisoCara.tipo}`}>{avisoCara.texto}</p>
                        )}
                    </div>
                )}

                <nav className="barra-admin" aria-label="Secciones del panel">
                    <button className={`pest ${tab === 'catalogo' ? 'on' : ''}`}
                            onClick={() => setTab('catalogo')} aria-current={tab === 'catalogo'}>
                        <Package size={19} />
                        <span>Catálogo</span>
                    </button>
                    <button className={`pest ${tab === 'nuevo' ? 'on' : ''}`}
                            onClick={() => setTab('nuevo')} aria-current={tab === 'nuevo'}>
                        <Plus size={19} />
                        <span>{editandoId ? 'Editando' : 'Añadir'}</span>
                    </button>
                    <button className={`pest ${tab === 'pedidos' ? 'on' : ''}`}
                            onClick={() => setTab('pedidos')} aria-current={tab === 'pedidos'}>
                        <Receipt size={19} />
                        <span>Pedidos</span>
                        {porCobrar?.pendientes > 0 && <i className="pinta" aria-hidden="true" />}
                    </button>
                    <button className={`pest ${tab === 'tienda' ? 'on' : ''}`}
                            onClick={() => setTab('tienda')} aria-current={tab === 'tienda'}>
                        <Store size={19} />
                        <span>Tienda</span>
                    </button>
                </nav>

                {tab === 'pedidos' && <Pedidos pass={pass} />}

                {/* CADA COSA EN SU SECCION. Estos cuatro bloques vivian tirados
                    al final de la columna del catalogo: para llegarles habia que
                    bajarse todos los pares publicados y adivinar en que pestaña
                    estaban. No es que estuvieran mal hechos, es que no estaban en
                    ningun lado. Ahora tienen su propia pantalla. */}
                {tab === 'tienda' && (
                    <section className="seccion" aria-label="Ajustes de la tienda">
                        <header className="seccion-cab">
                            <h3>Tu tienda</h3>
                            <p>Cómo entras, quién más puede entrar y qué se ve en la portada.</p>
                        </header>
                        <div className="seccion-bloques">
                        <details className={`admin-card plegable ficha-cara ${misFaceId.length ? 'lista' : ''}`} open={misFaceId.length === 0}
                             
                                 onToggle={(e) => {
                                     if (e.currentTarget.open) precalentarAlta(pass, nombreDelAparato());
                                 }}>
                            <summary>Entrar con Face ID ({misFaceId.length})</summary>
                            <div className="admin-form">
                                <p className="hint">
                                    La llave se queda dentro de tu teléfono y solo la abre tu
                                    cara. Aquí nada más vive la mitad pública, que no sirve para
                                    entrar: si alguien se robara la base, no encontraría con qué.
                                </p>
                                {misFaceId.map(k => (
                                    <div className="aparato" key={k.id}>
                                        <span className="aparato-marco marco-cara" />
                                        <span className="aparato-datos">
                                            <b>{k.nombre}</b>
                                            <small>
                                                {k.usado
                                                    ? `Se usó ${cuando(k.usado)}`
                                                    : 'Todavía no lo usas'}
                                                {cuando(k.creado) && ` · alta ${cuando(k.creado)}`}
                                            </small>
                                        </span>
                                        <button type="button" className="link-btn link-mal"
                                                onClick={() => quitarFaceId(k.id)}>Quitar</button>
                                    </div>
                                ))}
                                {puedeFaceId === false && (
                                    <p className="hint" style={{ color: 'var(--naranja, #E8863A)' }}>
                                        Este aparato dice que no tiene Face ID disponible para la web.
                                        Pasa cuando abres la página dentro de otra app (Instagram,
                                        TikTok, WhatsApp) o en una ventana privada. Ábrela en Safari
                                        directo y vuelve a entrar. Aun así puedes intentarlo:
                                    </p>
                                )}
                                <button type="button" className="btn-ghost" onClick={altaFaceId}
                                        disabled={dandoAlta}>
                                    {dandoAlta ? 'Mirándote…' : 'Dar de alta este aparato'}
                                </button>
                                {avisoCara && (
                                    <p className={`recado-cara ${avisoCara.tipo}`}>{avisoCara.texto}</p>
                                )}
                            </div>
                        </details>

                        <details className="admin-card plegable" >
                            <summary>Video de portada</summary>
                            <p className="hint" >
                                Se reproduce solo, en bucle y sin sonido, atrás del título de tu
                                tienda. Es lo que más la hace ver viva. Máximo {LIMITE_MB} MB.
                            </p>
                            {heroCargado && heroVideo ? (
                                <>
                                    <video className="hero-previo" src={heroVideo} muted loop playsInline autoPlay />
                                    <button type="button" className="btn-ghost" style={{ marginTop: '10px' }}
                                        onClick={quitarVideoPortada} disabled={ocupado}>
                                        Quitar video de portada
                                    </button>
                                </>
                            ) : (
                                <label>
                                    Subir video de portada
                                    <input type="file" accept="video/*" onChange={elegirVideoPortada}
                                        disabled={!!subiendoVideo} style={{ marginTop: '6px' }} />
                                </label>
                            )}
                        </details>

                        <details className="admin-card plegable" >
                            <summary>Quién puede entrar ({gente.length})</summary>

                            {gente.length > 0 && (
                                <div className="gente-lista">
                                    {gente.map(u => (
                                        <div className="gente-fila" key={u.id}>
                                            <span className="cara-foto">
                                                {u.foto ? <img src={u.foto} alt="" />
                                                        : <span className="cara-iniciales">{(u.nombre || '?')[0].toUpperCase()}</span>}
                                            </span>
                                            <strong>{u.nombre}</strong>
                                            <button className="del" onClick={() => quitarDelPanel(u)}
                                                    aria-label={`Quitar a ${u.nombre}`}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <form onSubmit={darDeAlta} className="admin-form" style={{ marginTop: '14px' }}>
                                <div className="alta-foto">
                                    <label className="cara-foto alta-foto-boton">
                                        {nuevaFoto ? <img src={nuevaFoto} alt="" />
                                                   : <span className="cara-iniciales">+</span>}
                                        <input type="file" accept="image/*" onChange={elegirFoto} hidden />
                                    </label>
                                    <p className="hint">Su foto (opcional). Sale en la pantalla de entrada.</p>
                                </div>
                                <input type="text" placeholder="Nombre" value={nuevoNombre}
                                    onChange={(e) => setNuevoNombre(e.target.value)} />
                                <input type="password" placeholder="Su clave (mínimo 6)" value={nuevaClave}
                                    onChange={(e) => setNuevaClave(e.target.value)} autoComplete="new-password" />
                                <button type="submit" className="btn-ghost" disabled={ocupado}>Dar de alta</button>
                                <p className="hint">
                                    Cada quien entra con su propia clave. La tuya de dueño sigue
                                    funcionando aunque quites a todos.
                                </p>
                            </form>
                        </details>
                        <details className="admin-card plegable" >
                            <summary>Cambiar mi clave</summary>
                            <form onSubmit={cambiarClave} className="admin-form">
                                <input type="password" placeholder="Clave actual" value={claveActual}
                                    onChange={(e) => setClaveActual(e.target.value)} autoComplete="current-password" />
                                <input type="password" placeholder="Clave nueva (mínimo 6)" value={claveNueva}
                                    onChange={(e) => setClaveNueva(e.target.value)} autoComplete="new-password" />
                                <button type="submit" className="btn-ghost">Cambiar clave</button>
                            </form>
                        </details>
                        </div>
                    </section>
                )}

                <div className={`admin-grid tab-${tab}`}
                     hidden={tab === 'pedidos' || tab === 'tienda'}>
                    <div className="col-form">
                        <div className="admin-card">
                            <header className="seccion-cab seccion-cab-forma">
                                <h3>{editandoId ? 'Editando par' : 'Añadir par'}</h3>
                                <p>{editandoId
                                    ? 'Los cambios se ven en la tienda en cuanto guardas.'
                                    : 'Marca, modelo y precio es lo mínimo. Lo demás lo puedes dejar en blanco.'}</p>
                            </header>

                            <form onSubmit={guardar} className="admin-form">

                                <fieldset className="grupo">
                                <legend>El par</legend>
                                <input type="text" placeholder="Marca (Nike, Jordan, Adidas...)"
                                    value={form.brand} onChange={set('brand')} list="marcas-existentes" />
                                <datalist id="marcas-existentes">
                                    {marcasConocidas.map(b => <option key={b} value={b} />)}
                                </datalist>

                                <input type="text" placeholder="Modelo (Air Max 90...)" value={form.name} onChange={set('name')} />
                                {/* La categoria dice QUE es el par, no cuanto cuesta: va con la
                                    marca y el modelo, no revuelta entre el precio y las tallas. */}
                                <select value={form.categoria} onChange={set('categoria')}>
                                    {CATEGORIAS.map(c => (
                                        <option key={c.llave} value={c.llave}>{c.texto}</option>
                                    ))}
                                </select>
                                <p className="hint">La banda de una categoría solo sale si tiene algo adentro.</p>
                                </fieldset>

                                <fieldset className="grupo">
                                <legend>Precio</legend>
                                <input type="number" placeholder="Precio (MXN)" value={form.price} onChange={(e) => escribirPrecio(e.target.value)} min="0" />

                                <div className="oferta-campos">
                                    <input type="number" placeholder="% de descuento"
                                        value={form.pct} onChange={(e) => escribirPct(e.target.value)}
                                        min="1" max="99" />
                                    <input type="number" placeholder="o precio antes"
                                        value={form.priceBefore} onChange={(e) => escribirAntes(e.target.value)}
                                        min="0" />
                                </div>
                                {/* Se le enseña el descuento ya calculado, para que no publique
                                    una oferta al reves sin darse cuenta. */}
                                {form.priceBefore === '' && form.pct === '' ? (
                                    <p className="hint">Llena cualquiera de los dos y el otro se calcula solo. Vacíos = sin oferta.</p>
                                ) : ofertaPrevia ? (
                                    <p className="hint hint-ok">Se verá {pesos(ofertaPrevia.ahora)} con {pesos(ofertaPrevia.antes)} tachado, y la etiqueta −{ofertaPrevia.pct}%</p>
                                ) : (
                                    <p className="hint hint-mal">Pon un porcentaje entre 1 y 99, o un precio anterior mayor al de ahora.</p>
                                )}

                                </fieldset>

                                <fieldset className="grupo">
                                <legend>Tallas y etiqueta</legend>
                                <input type="text" placeholder="Tallas MX: 25, 26, 27.5" value={form.sizes} onChange={set('sizes')} />
                                {/* Se le enseña lo que se entendio ANTES de guardar: antes un par
                                    se guardaba sin tallas y el dueño se enteraba hasta ver la tienda. */}
                                {form.sizes.trim() === '' ? (
                                    <p className="hint">Sepáralas como quieras: comas, espacios o diagonales. Vacío = sin tallas.</p>
                                ) : tallasLeidas.length ? (
                                    <p className="hint hint-ok">Se van a guardar {tallasLeidas.length} tallas: {escribirTallas(tallasLeidas)}</p>
                                ) : (
                                    <p className="hint hint-mal">No le entendí ninguna talla. Escribe números, por ejemplo: 25, 26, 27.5</p>
                                )}

                                <select value={form.status} onChange={set('status')}>
                                    <option value="">Sin etiqueta</option>
                                    <option value="nuevo">Etiqueta: NUEVO</option>
                                    <option value="agotado">Etiqueta: AGOTADO</option>
                                </select>

                                </fieldset>

                                <fieldset className="grupo">
                                <legend>Fotos, video y descripción</legend>
                                <textarea placeholder="Descripción corta" value={form.desc} onChange={set('desc')} rows={3} />
                                <input type="text" placeholder="Link de Mercado Libre (opcional)" value={form.mlLink} onChange={set('mlLink')} />

                                <label>
                                    Video del par
                                    <input type="file" accept="video/*" onChange={elegirVideo}
                                        disabled={!!subiendoVideo} style={{ marginTop: '6px' }} />
                                </label>
                                <p className="hint">
                                    Sube el archivo y se reproduce dentro de tu tienda, como las marcas
                                    grandes. Máximo {LIMITE_MB} MB.
                                </p>
                                <input type="text" placeholder="…o pega un link de TikTok, Instagram o YouTube"
                                    value={form.videoUrl} onChange={set('videoUrl')} />
                                {form.videoUrl && (
                                    <p className="hint">
                                        {form.videoUrl.includes('/videos/')
                                            ? '✓ Video propio: se reproduce dentro de la tienda.'
                                            : 'Link externo: saldrá un botón que lleva al post.'}
                                    </p>
                                )}

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
                                        {fotosNuevas.map((f, i) => (
                                            <div className="foto-chip nueva" key={`n${i}`}>
                                                <img src={f.previa} alt="" />
                                                <button type="button"
                                                    onClick={() => setFotosNuevas(lista => {
                                                        URL.revokeObjectURL(lista[i]?.previa);
                                                        return lista.filter((_, j) => j !== i);
                                                    })}
                                                    aria-label="Quitar foto">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                </fieldset>

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

                    </div>

                    <div className="col-lista">
                        <header className="seccion-cab">
                            <h3>Catálogo <em>{products.length}</em></h3>
                            <p>El de hasta arriba es el primero que ven tus clientes. Usa las flechas para acomodarlos.</p>
                        </header>

                        <div className="admin-list">
                            {products.map((p, i) => (
                                <div key={p.id}
                                     className={'admin-item'
                                        + (p.status === 'agotado' ? ' canto-agotado'
                                           : p.priceBefore ? ' canto-oferta'
                                           : p.destacado ? ' canto-destacado' : '')
                                        + (editandoId === p.id ? ' editando' : '')}>
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

                                    <MiniFoto par={p} />

                                    <div className="info">
                                        <h4>{p.brand} {p.name}</h4>
                                        <p className="precio-fila">
                                            <b>${p.price.toLocaleString('es-MX')}</b>
                                            {p.priceBefore && <s>${p.priceBefore.toLocaleString('es-MX')}</s>}
                                        </p>
                                        {p.sizes.length > 0 && (
                                            <p className="tallas-mini">
                                                {p.sizes.map(t => <span key={t}>{t}</span>)}
                                            </p>
                                        )}
                                        {/* Solo se avisa lo que le FALTA al par. Cuando todo
                                            esta bien no aparece nada: no hay que leer una
                                            linea de datos para enterarse de que no pasa nada. */}
                                        {(!p.sizes.length || !p.photoCount) && (
                                            <p className="le-falta">
                                                {!p.photoCount && 'Sin fotos'}
                                                {!p.photoCount && !p.sizes.length && ' y sin tallas'}
                                                {p.photoCount && !p.sizes.length ? 'Sin tallas' : ''}
                                            </p>
                                        )}
                                    </div>

                                    <div className="acciones">
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

                                    {/* Fija el par en "los que mas se venden". Sirve mientras no
                                        haya ventas con tarjeta: los pedidos por WhatsApp no pasan
                                        por la base y no se pueden contar solos. */}
                                    <label className={`switch switch-destacado${p.destacado ? ' on' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={!!p.destacado}
                                            disabled={ocupado}
                                            onChange={(e) => correr(() =>
                                                adminSetDestacado(pass, p.id, e.target.checked)
                                            )}
                                        />
                                        <span>Destacado</span>
                                    </label>

                                    <button className="del editar" onClick={() => abrirEdicion(p)} aria-label={`Editar ${p.name}`}>
                                        <Pencil size={16} />
                                    </button>
                                    <button className="del" onClick={() => borrar(p)} aria-label={`Borrar ${p.name}`}>
                                        <Trash2 size={16} />
                                    </button>
                                    </div>
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
