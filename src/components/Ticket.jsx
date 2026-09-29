import React, { useState } from 'react';
import Impresora from './Impresora';
import Barras from './Barras';
import { pesos } from '../lib/descuento';
import { fechaCorta } from '../lib/ticket';

// EL TICKET DEL PEDIDO. Cuando el pedido ya quedó guardado, la tienda le
// imprime al cliente su ticket de apartado, como en una caja de verdad. Aquí
// vive lo que antes estaba repartido en varios recuadros: el folio, los
// pares, el total, el anticipo, a dónde transferir y el concepto. Todo en un
// solo papel, que es lo que el cliente va a querer guardar. La impresión la
// hace <Impresora>.

const Ticket = ({ folio, lineas, total, aPagar, esAnticipo, pct, cuenta, onCopiarClabe }) => {
    const [copiado, setCopiado] = useState(false);
    const codigo = String(folio).padStart(6, '0');

    const copiar = () => {
        onCopiarClabe?.();
        setCopiado(true);
        setTimeout(() => setCopiado(false), 1800);
    };

    return (
        <Impresora tituloListo="Tu ticket">
            <div className="ticket-marca" data-renglon>Prothe <em>Shop</em></div>
            <div className="ticket-fila ticket-meta" data-renglon>
                <span>Ticket de apartado</span><span>{fechaCorta()}</span>
            </div>
            <div className="ticket-folio" data-renglon>
                <span>Folio</span><strong>#{folio}</strong>
            </div>
            <div className="ticket-corte" data-renglon aria-hidden="true" />

            {lineas.map(item => (
                <div className="ticket-fila ticket-par" key={item.key} data-renglon>
                    <span className="ticket-cant">{item.qty}×</span>
                    <span className="ticket-nombre">
                        {item.name}
                        {item.size ? <small> T {item.size}</small> : null}
                    </span>
                    <span className="ticket-precio">{pesos(item.price * item.qty)}</span>
                </div>
            ))}

            <div className="ticket-corte" data-renglon aria-hidden="true" />
            {esAnticipo ? (
                <>
                    <div className="ticket-fila" data-renglon><span>Total del pedido</span><span>{pesos(total)}</span></div>
                    <div className="ticket-fila ticket-total" data-renglon="total">
                        <span>Anticipo {pct}%</span><strong>{pesos(aPagar)}</strong>
                    </div>
                    <div className="ticket-fila ticket-suave" data-renglon><span>Resto al recibir</span><span>{pesos(total - aPagar)}</span></div>
                </>
            ) : (
                <div className="ticket-fila ticket-total" data-renglon="total">
                    <span>Total</span><strong>{pesos(aPagar)}</strong>
                </div>
            )}

            <div className="ticket-corte" data-renglon aria-hidden="true" />
            {cuenta?.clabe ? (
                <>
                    <div className="ticket-titulo" data-renglon>Transfiere a</div>
                    {(cuenta.banco || cuenta.titular) && (
                        <div className="ticket-fila" data-renglon>
                            <span>{cuenta.banco}</span><span>{cuenta.titular}</span>
                        </div>
                    )}
                    <div className="ticket-fila ticket-clabe" data-renglon>
                        <span>CLABE {cuenta.clabe.replace(/(\d{4})(?=\d)/g, '$1 ')}</span>
                        <button type="button" onClick={copiar}>{copiado ? 'Copiada' : 'Copiar'}</button>
                    </div>
                    <div className="ticket-fila" data-renglon><span>Concepto</span><span>#{folio}</span></div>
                    <div className="ticket-nota" data-renglon>
                        Mándanos tu comprobante por WhatsApp con el folio.
                    </div>
                </>
            ) : (
                <div className="ticket-nota" data-renglon>
                    Escríbenos por WhatsApp con tu folio y te decimos cómo pagar.
                </div>
            )}

            <div className="ticket-corte" data-renglon aria-hidden="true" />
            <div className="ticket-codigo" data-renglon>
                <Barras codigo={codigo} />
                <span>{codigo}</span>
            </div>
            <div className="ticket-gracias" data-renglon>Gracias por tu pedido</div>
        </Impresora>
    );
};

export default Ticket;
