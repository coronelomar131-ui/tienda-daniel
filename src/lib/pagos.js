import { supabase, mensajeDeError } from './supabase';

// Manda el carrito a cobrar. Ojo con lo que NO viaja: los precios.
// Solo se manda qué par y qué talla; el servidor pone el precio desde la
// base para que nadie pueda cambiarlo desde su celular.
export async function crearPago({ cart, nombre, telefono, email, anticipo }) {
    const { data, error } = await supabase.functions.invoke('crear-pago', {
        body: {
            items: cart.map(item => ({ id: item.id, size: item.size, qty: item.qty })),
            nombre, telefono, email, anticipo,
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
