import { supabase, mensajeDeError } from './supabase';

// Manda el carrito a cobrar. Ojo con lo que NO viaja: los precios.
// Solo se manda qué par y qué talla; el servidor pone el precio desde la
// base para que nadie pueda cambiarlo desde su celular.
export async function crearPago({ cart, nombre, telefono, email, direccion, nota, anticipo }) {
    const { data, error } = await supabase.functions.invoke('crear-pago', {
        body: {
            items: cart.map(item => ({ id: item.id, size: item.size, qty: item.qty })),
            nombre, telefono, email, direccion, nota, anticipo,
            origen: window.location.origin,
        },
    });

    if (error) {
        let detalle = '';
        try { detalle = (await error.context?.json())?.error || ''; } catch { /* sin detalle */ }
        throw new Error(detalle || 'No se pudo iniciar el pago');
    }
    if (data?.error) throw new Error(data.error);
    if (!data?.pagar_en) throw new Error('Mercado Pago no devolvió la liga de pago');

    return data;
}

// ¿Ya se puede cobrar con tarjeta? Depende de que el token de Mercado Pago
// este cargado en el servidor, y eso el navegador no lo puede saber solo.
// Si se enseñara el boton sin token, el cliente se iria a una pantalla que
// truena justo cuando ya iba a pagar. Por eso se pregunta antes.
export async function pagosTarjetaListos() {
    try {
        const { data, error } = await supabase.functions.invoke('crear-pago', { body: { ping: true } });
        if (error) return false;
        return data?.listo === true;
    } catch {
        return false;
    }
}

export async function estadoOrden(id) {
    const { data, error } = await supabase.rpc('orden_estado', { p_id: id });
    if (error) throw new Error(mensajeDeError(error));
    return Array.isArray(data) ? data[0] : data;
}

export async function fetchAnticipo() {
    const { data } = await supabase.from('site_settings').select('anticipo_pct').maybeSingle();
    return Number(data?.anticipo_pct ?? 0);
}

export const adminOrders = async (pass, limite = 50) => {
    const { data, error } = await supabase.rpc('admin_orders', { pass, p_limite: limite });
    if (error) throw new Error(mensajeDeError(error));
    return data || [];
};

export const adminOrdersResumen = async (pass) => {
    const { data, error } = await supabase.rpc('admin_orders_resumen', { pass });
    if (error) throw new Error(mensajeDeError(error));
    return data || {};
};

export const adminSetAnticipo = async (pass, pct) => {
    const { error } = await supabase.rpc('admin_set_anticipo', { pass, p_pct: pct });
    if (error) throw new Error(mensajeDeError(error));
    return true;
};

// --- Pedido sin pago en linea ---
// Se guarda el pedido con folio y DESPUES se abre WhatsApp con ese folio.
// Antes el pedido solo existia en el chat: si el mensaje se perdia entre
// otras conversaciones, se perdia la venta.
export async function crearPedido({ cart, nombre, telefono, direccion, email, nota, anticipo }) {
    // Igual que en el cobro con tarjeta: solo viaja QUE par y QUE talla. El
    // precio y el porcentaje del anticipo los pone el servidor.
    const items = cart.map(i => ({ id: i.id, size: i.size, qty: i.qty }));
    const { data, error } = await supabase.rpc('crear_pedido', {
        p_items: items,
        p_nombre: nombre,
        p_telefono: telefono,
        p_direccion: direccion || null,
        p_email: email || null,
        p_nota: nota || null,
        p_anticipo: !!anticipo,
    });
    if (error) throw new Error(mensajeDeError(error));
    const fila = Array.isArray(data) ? data[0] : data;
    if (!fila) throw new Error('No se pudo guardar el pedido');
    return {
        folio: fila.folio,
        total: fila.total,
        aPagar: fila.a_pagar ?? fila.total,
        esAnticipo: !!fila.es_anticipo,
    };
}

export async function datosPago() {
    const { data, error } = await supabase.rpc('datos_pago');
    if (error) return null;
    return (Array.isArray(data) ? data[0] : data) || null;
}

export const adminEstadoPedido = (pass, id, estado) =>
    supabase.rpc('admin_estado_pedido', { pass, p_id: id, p_estado: estado })
        .then(({ error }) => { if (error) throw new Error(mensajeDeError(error)); return true; });

export const adminSetDatosPago = (pass, clabe, banco, titular) =>
    supabase.rpc('admin_set_datos_pago', { pass, p_clabe: clabe, p_banco: banco, p_titular: titular })
        .then(({ error }) => { if (error) throw new Error(mensajeDeError(error)); return true; });
