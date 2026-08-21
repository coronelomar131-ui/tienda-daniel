import { supabase, mensajeDeError } from './supabase';

// La base guarda los campos con nombres tipo ml_link; la app los usa en camelCase.
const toApp = (row) => ({
    id: row.id,
    brand: row.brand,
    name: row.name,
    desc: row.description || '',
    price: Number(row.price),
    sizes: (row.sizes || []).map(Number),
    status: row.status || '',
    mlLink: row.ml_link || '',
    hasPhoto: !!row.has_photo,
});

// La lista NO trae las fotos: cada tarjeta pide la suya cuando aparece en
// pantalla, para que el catalogo abra rapido aunque haya muchos pares.
export async function fetchProducts() {
    const { data, error } = await conLimite(supabase
        .from('products')
        .select('id, brand, name, description, price, sizes, status, ml_link, has_photo')
        .order('created_at', { ascending: false }));
    if (error) throw new Error(mensajeDeError(error));
    return (data || []).map(toApp);
}

export async function fetchPhoto(productId) {
    const { data, error } = await conLimite(supabase
        .from('product_photos')
        .select('data')
        .eq('product_id', productId)
        .maybeSingle());
    if (error) throw error;
    return data?.data || null;
}

const LIMITE = 7000;

const conLimite = (promesa, ms = LIMITE) => Promise.race([
    promesa,
    new Promise((_, reject) =>
        setTimeout(() => reject(new Error('No hay conexión con la tienda')), ms)
    ),
]);

const rpc = async (fn, args) => {
    // Subir una foto tarda mas que una consulta normal, por eso el limite doble.
    const { data, error } = await conLimite(supabase.rpc(fn, args), LIMITE * 3);
    if (error) throw new Error(mensajeDeError(error));
    return data;
};

export const adminIsClaimed  = () => rpc('admin_is_claimed', {});
export const adminClaim      = (pass) => rpc('admin_claim', { new_pass: pass });
export const adminLogin      = (pass) => rpc('admin_login', { pass });
export const adminSetPassword = (oldPass, newPass) =>
    rpc('admin_set_password', { old_pass: oldPass, new_pass: newPass });

export const adminAddProduct = (pass, p) => rpc('admin_add_product', {
    pass,
    p_brand: p.brand,
    p_name: p.name,
    p_description: p.desc || '',
    p_price: p.price,
    p_sizes: p.sizes || [],
    p_status: p.status || '',
    p_ml_link: p.mlLink || '',
    p_photo: p.photo || '',
});

export const adminDeleteProduct = (pass, id) =>
    rpc('admin_delete_product', { pass, p_id: id });
