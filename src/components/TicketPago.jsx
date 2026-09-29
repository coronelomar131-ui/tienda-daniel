import React from 'react';
import Impresora from './Impresora';
import Barras from './Barras';
import { pesos } from '../lib/descuento';
import { fechaCorta } from '../lib/ticket';

// EL TICKET DEL PAGO. Cuando Mercado Pago confirma el pago, la tienda imprime
// el comprobante y, ahora sí, hay de qué celebrar: sale el confeti. Sólo lleva
// lo que la tienda sabe del pago (folio, monto y estado), que es lo que
// entrega orden_estado sin exponer nada del cliente.

const TicketPago = ({ numero, monto }) => {
    const codigo = String(numero).padStart(6, '0');
    return (
        <Impresora confeti tituloListo="Pago recibido">
            <div className="ticket-marca" data-renglon>Prothe <em>Shop</em></div>
            <div className="ticket-fila ticket-meta" data-renglon>
                <span>Comprobante de pago</span><span>{fechaCorta()}</span>
            </div>
            <div className="ticket-folio" data-renglon>
                <span>Folio</span><strong>#{numero}</strong>
            </div>
            <div className="ticket-corte" data-renglon aria-hidden="true" />
            <div className="ticket-fila ticket-total" data-renglon="total">
                <span>Total pagado</span><strong>{pesos(monto)}</strong>
            </div>
            <div className="ticket-fila ticket-estado" data-renglon>
                <span>Estado</span><span className="ticket-sello">Pagado</span>
            </div>
            <div className="ticket-corte" data-renglon aria-hidden="true" />
            <div className="ticket-nota" data-renglon>
                Te escribimos por WhatsApp para acordar el envío.
            </div>
            <div className="ticket-codigo" data-renglon>
                <Barras codigo={codigo} />
                <span>{codigo}</span>
            </div>
            <div className="ticket-gracias" data-renglon>¡Gracias por tu compra!</div>
        </Impresora>
    );
};

export default TicketPago;
