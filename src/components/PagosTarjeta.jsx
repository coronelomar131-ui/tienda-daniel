import React, { useEffect, useState } from 'react';
import { pagosTarjetaListos } from '../lib/pagos';
import { SUPABASE_URL } from '../lib/supabase';

// La dirección a la que Mercado Pago avisa cuando alguien paga. Es la función
// aviso-pago de Supabase: se pega en el panel de Mercado Pago (Webhooks).
const URL_AVISO = `${SUPABASE_URL}/functions/v1/aviso-pago`;

// Dice si el cobro con tarjeta ya está encendido y, si no, qué falta. El
// servidor es quien sabe si ya tiene el token de Mercado Pago cargado: aquí
// sólo se le pregunta (la misma pregunta que le hace el carrito antes de
// enseñar "Pagar con tarjeta").
const PagosTarjeta = () => {
    const [lista, setLista] = useState(null);   // null = preguntando
    const [copiada, setCopiada] = useState(false);

    useEffect(() => {
        let vivo = true;
        pagosTarjetaListos().then(v => { if (vivo) setLista(v); });
        return () => { vivo = false; };
    }, []);

    const copiar = () => {
        navigator.clipboard?.writeText(URL_AVISO);
        setCopiada(true);
        setTimeout(() => setCopiada(false), 1800);
    };

    return (
        <details className={`admin-card plegable ficha-cara${lista ? ' lista' : ''}`} open={lista === false}>
            <summary>
                Cobro con tarjeta {lista === null ? '' : lista ? '· activado' : '· sin activar'}
            </summary>
            <div className="admin-form">
                {lista ? (
                    <p className="hint">
                        Tus clientes ya ven "Pagar con tarjeta". Cuando Mercado Pago aprueba un
                        pago, el pedido pasa solo a "Pagado" y la talla vendida sale de la tienda.
                    </p>
                ) : (
                    <>
                        <p className="hint">
                            Todavía no está encendido: falta el token de tu cuenta de Mercado Pago.
                            Mientras tanto la tienda sigue funcionando con transferencia y WhatsApp.
                        </p>
                        <ol className="pagos-pasos">
                            <li>En Mercado Pago Developers crea tu aplicación (Checkout Pro) y copia tu Access Token.</li>
                            <li>En Supabase, Edge Functions, Secrets, guárdalo con el nombre <b>MP_ACCESS_TOKEN</b>.</li>
                            <li>En tu aplicación de Mercado Pago, en Webhooks, pega la dirección de abajo y activa "Pagos". Su clave secreta va en Supabase como <b>MP_WEBHOOK_SECRET</b>.</li>
                        </ol>
                    </>
                )}
                <div className="pagos-aviso">
                    <span>Dirección para los avisos de pago (Webhooks)</span>
                    <code>{URL_AVISO}</code>
                    <button type="button" className="btn-ghost" onClick={copiar}>{copiada ? 'Copiada' : 'Copiar dirección'}</button>
                </div>
                <p className="hint">El token nunca se escribe en el código ni se manda por chat: sólo en los Secrets de Supabase.</p>
            </div>
        </details>
    );
};

export default PagosTarjeta;
