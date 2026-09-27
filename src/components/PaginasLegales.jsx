import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { config } from '../config';

// Aviso de privacidad y términos. Los textos describen lo que la tienda hace de
// verdad (lib/pagos.js, CartDrawer, supabase/functions/crear-pago): si cambia
// como se cobra, se envía o qué datos se piden, hay que cambiarlos aquí también.
const ACTUALIZADO = '27 de septiembre de 2026';

function PaginaLegal({ titulo, children }) {
    useEffect(() => {
        const antes = document.title;
        document.title = `${titulo} · Prothe Shop`;
        window.scrollTo(0, 0);
        return () => { document.title = antes; };
    }, [titulo]);

    return (
        <main className="legal">
            <Link to="/" className="logo">Prothe <em>Shop</em></Link>
            <h1>{titulo}</h1>
            <p className="legal-fecha">Última actualización: {ACTUALIZADO}</p>
            {children}
            <p className="legal-volver"><Link to="/">Volver a la tienda</Link></p>
        </main>
    );
}

const Correo = () => <a href={`mailto:${config.correoContacto}`}>{config.correoContacto}</a>;

export function AvisoPrivacidad() {
    return (
        <PaginaLegal titulo="Aviso de privacidad">
            <h2>Quién es responsable de tus datos</h2>
            <p>
                {config.responsable}, quien opera la tienda en línea Prothe Shop, es responsable
                de los datos personales que nos das. Para cualquier asunto sobre tus datos
                escríbenos a <Correo />.
            </p>

            <h2>Qué datos te pedimos</h2>
            <p>Cuando apartas o compras un par:</p>
            <ul>
                <li>Tu nombre.</li>
                <li>Tu número de WhatsApp.</li>
                <li>Tu dirección de entrega.</li>
                <li>Tu correo, si decides darlo.</li>
                <li>Las notas que quieras dejarnos sobre tu pedido.</li>
            </ul>
            <p>
                Si te anotas para saber qué llega, nos mandas tu correo por WhatsApp.
                No te pedimos datos sensibles, como salud, religión u origen.
            </p>
            <p>
                Si pagas con tarjeta, los datos de tu tarjeta los captura directamente
                Mercado Pago en su propia página. Nosotros nunca los vemos ni los guardamos.
            </p>

            <h2>Para qué los usamos</h2>
            <p>Para lo que hace falta para venderte y entregarte tu par:</p>
            <ul>
                <li>Registrar tu pedido o tu apartado.</li>
                <li>Hablar contigo por WhatsApp sobre tu pedido, tu pago y tu envío.</li>
                <li>Cobrar y confirmar tu pago.</li>
                <li>Mandar tu paquete.</li>
                <li>Atender un cambio.</li>
            </ul>
            <p>
                Y, sólo si te anotas, para avisarte cuando lleguen pares nuevos o vuelva tu
                talla. Para dejar de recibir esos avisos escríbenos a <Correo /> o
                dínoslo por WhatsApp; eso no afecta tus pedidos.
            </p>

            <h2>Con quién los compartimos</h2>
            <p>Sólo con quienes nos ayudan a darte el servicio, y sólo lo que cada uno necesita:</p>
            <ul>
                <li><strong>Mercado Pago</strong>, si pagas con tarjeta: tu nombre y tu correo, para el cobro.</li>
                <li><strong>La paquetería</strong> que lleve tu pedido: tu nombre, teléfono y dirección.</li>
                <li><strong>Supabase</strong>, donde se guardan los pedidos de la tienda.</li>
                <li><strong>Vercel</strong>, donde está publicada la página.</li>
                <li><strong>WhatsApp</strong>, por donde platicamos contigo.</li>
            </ul>
            <p>No vendemos ni rentamos tus datos a nadie.</p>

            <h2>Cookies y estadísticas</h2>
            <p>
                Esta página no usa cookies. Tu carrito se guarda sólo en tu celular o
                computadora. Contamos las visitas con las estadísticas de Vercel, que no
                usan cookies ni guardan datos que te identifiquen.
            </p>

            <h2>Tus derechos</h2>
            <p>
                Puedes pedirnos en cualquier momento ver qué datos tenemos de ti,
                corregirlos, borrarlos, u oponerte a que los usemos para algo; también puedes
                retirar tu consentimiento. Escríbenos a <Correo /> con tu nombre, el
                número de WhatsApp con el que pediste y lo que necesitas. Te respondemos en
                un máximo de 20 días hábiles.
            </p>

            <h2>Cambios a este aviso</h2>
            <p>
                Si cambiamos este aviso, lo publicamos en esta misma página con la fecha de
                la última actualización arriba.
            </p>
        </PaginaLegal>
    );
}

export function Terminos() {
    const dias = config.diasParaCambio;
    return (
        <PaginaLegal titulo="Términos y condiciones">
            <p>
                Estos términos aplican a las compras y apartados en Prothe Shop, tienda
                operada por {config.responsable}. Al hacer un pedido los aceptas.
            </p>

            <h2>Los pares</h2>
            <p>
                Todos los pares que vendemos son originales. Los precios están en pesos
                mexicanos y son los que ves en la página al momento de pedir. La
                disponibilidad de cada talla se confirma al recibir tu pedido.
            </p>

            <h2>Cómo apartar y pagar</h2>
            <ul>
                <li>Pagas con las formas que aparecen al hacer tu pedido: tarjeta con Mercado Pago o transferencia.</li>
                <li>
                    Cuando la opción aparece en el carrito, puedes apartar pagando un anticipo.
                    El porcentaje es el que se muestra ahí, y el resto lo pagas al recibir.
                </li>
                <li>Cada pedido lleva un folio. Úsalo al escribirnos por WhatsApp.</li>
            </ul>

            <h2>Envíos</h2>
            <p>
                Enviamos a todo México. La paquetería y el costo del envío los acordamos
                contigo por WhatsApp antes de mandar tu pedido.
            </p>

            <h2>Cambios</h2>
            <p>Sí hacemos cambios de talla o de modelo. Para eso:</p>
            <ul>
                <li>Pídelo por WhatsApp dentro de los {dias} días siguientes a que recibas tu par.</li>
                <li>El par debe estar sin uso, con su caja y sus etiquetas.</li>
                <li>El cambio depende de que tengamos la talla o el modelo que quieres.</li>
                <li>Si el nuevo par cuesta más, pagas la diferencia.</li>
                <li>El envío del cambio lo pagas tú.</li>
            </ul>

            <h2>Devoluciones</h2>
            <p>
                No hacemos devoluciones de dinero por cambiar de opinión: en ese caso te
                ofrecemos un cambio.
            </p>
            <p>
                Si tu par llega con un defecto de fábrica o no es el que pediste, avísanos
                por WhatsApp en cuanto lo recibas. Te lo cambiamos por uno correcto, sin
                costo de envío para ti, o si ya no tenemos otro igual te regresamos tu
                dinero.
            </p>

            <h2>Contacto</h2>
            <p>
                Para cualquier duda sobre tu compra escríbenos por WhatsApp o a <Correo />.
            </p>
        </PaginaLegal>
    );
}
