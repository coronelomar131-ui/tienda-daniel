import React, { useContext, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShopContext } from '../context/shop-context';
import { estadoOrden } from '../lib/pagos';
import { waPlain } from '../lib/whatsapp';
import Navbar from './Navbar';
import TicketPago from './TicketPago';

// Pantalla a la que regresa el cliente después de pagar.
// El estado NO se cree por haber vuelto aquí: se lee de la base, y la base
// solo lo marca pagado cuando Mercado Pago lo confirma por su lado.
const PagoResultado = () => {
    const { id } = useParams();
    const { clearCart } = useContext(ShopContext);
    const [orden, setOrden] = useState(null);
    const [error, setError] = useState(null);
    const [intentos, setIntentos] = useState(0);

    useEffect(() => {
        let vivo = true;
        let temporizador;

        const revisar = async () => {
            try {
                const o = await estadoOrden(id);
                if (!vivo) return;
                setOrden(o);
                if (o?.estado === 'pagado') {
                    clearCart();
                    return;
                }
                // El aviso de Mercado Pago suele llegar en segundos; un pago en
                // OXXO o por transferencia puede tardar horas. Se revisa seguido
                // al principio y luego cada medio minuto, sin dejar de revisar:
                // la pantalla dice que se actualiza sola, y tiene que ser cierto.
                temporizador = setTimeout(() => setIntentos(n => n + 1), intentos < 10 ? 2000 : 30000);
            } catch (err) {
                if (vivo) setError(err.message);
            }
        };

        revisar();
        return () => { vivo = false; clearTimeout(temporizador); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, intentos]);

    const estado = orden?.estado;

    return (
        <>
            <Navbar onOpenCart={() => {}} />
            <div className="wrap">
                <div className="pago-resultado">
                    {error && <>
                        <h1>Algo salió mal</h1>
                        <p>{error}</p>
                    </>}

                    {!error && estado === 'pagado' && <>
                        <h1>¡Listo, pagado!</h1>
                        <TicketPago numero={orden.numero} monto={orden.monto_cobrado} />
                        <p className="pago-despues">
                            Guarda tu folio <strong>#{orden.numero}</strong>: con él te damos seguimiento.
                        </p>
                        <a href={waPlain()} target="_blank" rel="noreferrer" className="btn-primary">
                            Escribirnos por WhatsApp
                        </a>
                    </>}

                    {!error && estado === 'pendiente' && <>
                        <div className="pago-marca espera">•••</div>
                        <h1>Confirmando tu pago</h1>
                        <p>
                            Si pagaste en OXXO o por transferencia, puede tardar un rato en
                            reflejarse. Guarda tu número de pedido: <strong>#{orden?.numero}</strong>
                        </p>
                        <p className="pago-nota">Esta pantalla se actualiza sola.</p>
                    </>}

                    {!error && estado === 'rechazado' && <>
                        <div className="pago-marca falla">×</div>
                        <h1>No se pudo cobrar</h1>
                        <p>El pago fue rechazado. Puedes intentar con otra tarjeta o apartar por WhatsApp.</p>
                        <a href={waPlain()} target="_blank" rel="noreferrer" className="btn-primary">
                            Apartar por WhatsApp
                        </a>
                    </>}

                    {!error && !estado && <p>Buscando tu pedido…</p>}

                    <Link to="/" className="ml-link" style={{ marginTop: '22px' }}>Volver a la tienda</Link>
                </div>
            </div>
        </>
    );
};

export default PagoResultado;
