import { supabase, mensajeDeError } from './supabase';

// La base guarda los campos con nombres tipo ml_link; la app los usa en camelCase.
const toApp = (row) => ({
    id: row.id,
    brand: row.brand,
    name: row.name,
    desc: row.description || '',
    price: Number(row.price),
    priceBefore: row.price_before == null ? null : Number(row.price_before),
    sizes: (row.sizes || []).map(Number),
    status: row.status || '',
    mlLink: row.ml_link || '',
    videoUrl: row.video_url || '',
    photoCount: row.photo_count || 0,
    sortOrder: row.sort_order || 0,
});

const LIMITE = 7000;

const conLimite = (promesa, ms = LIMITE) => Promise.race([
    promesa,
    new Promise((_, reject) =>
        setTimeout(() => reject(new Error('No hay conexión con la tienda')), ms)
    ),
]);

const CAMPOS = 'id, brand, name, description, price, price_before, sizes, status, ml_link, video_url, photo_count, sort_order';

// La lista NO trae las fotos: cada tarjeta pide las suyas cuando aparece en
// pantalla, para que el catalogo abra rapido aunque haya muchos pares.
export async function fetchProducts() {
    const { data, error } = await conLimite(supabase
        .from('products')
        .select(CAMPOS)
        .order('sort_order', { ascending: false }));
    if (error) throw new Error(mensajeDeError(error));
    return (data || []).map(toApp);
}

export async function fetchProduct(id) {
    const { data, error } = await conLimite(supabase
        .from('products')
        .select(CAMPOS)
        .eq('id', id)
        .maybeSingle());
    if (error) throw new Error(mensajeDeError(error));
    return data ? toApp(data) : null;
}

// Galeria de un par, en el orden en que el dueno la subio.
export async function fetchPhotos(productId) {
    const { data, error } = await conLimite(supabase
        .from('product_photos')
        .select('id, data, position')
        .eq('product_id', productId)
        .order('position', { ascending: true }));
    if (error) throw new Error(mensajeDeError(error));
    return data || [];
}

const rpc = async (fn, args, ms = LIMITE * 3) => {
    const { data, error } = await conLimite(supabase.rpc(fn, args), ms);
    if (error) throw new Error(mensajeDeError(error));
    return data;
};

export async function fetchHeroVideo() {
    const { data, error } = await conLimite(supabase
        .from('site_settings')
        .select('hero_video_url')
        .maybeSingle());
    if (error) throw new Error(mensajeDeError(error));
    return data?.hero_video_url || '';
}

export const adminSetHeroVideo = (pass, url) => rpc('admin_set_hero_video', { pass, p_url: url });

export const adminIsClaimed   = () => rpc('admin_is_claimed', {}, LIMITE);
export const adminClaim       = (pass) => rpc('admin_claim', { new_pass: pass });
export const adminLogin       = (pass) => rpc('admin_login', { pass });
export const adminSetPassword = (oldPass, newPass) =>
    rpc('admin_set_password', { old_pass: oldPass, new_pass: newPass });

const campos = (p) => ({
    p_brand: p.brand,
    p_name: p.name,
    p_description: p.desc || '',
    p_price: p.price,
    p_price_before: p.priceBefore || null,
    p_sizes: p.sizes || [],
    p_status: p.status || '',
    p_ml_link: p.mlLink || '',
    p_video_url: p.videoUrl || '',
});

// Subir fotos tarda mas, por eso el limite mas holgado.
const LIMITE_FOTOS = 45000;

export const adminAddProduct = (pass, p) =>
    rpc('admin_add_product', { pass, ...campos(p), p_photos: p.photos || [] }, LIMITE_FOTOS);

export const adminUpdateProduct = (pass, id, p) =>
    rpc('admin_update_product', { pass, p_id: id, ...campos(p) });

export const adminDeleteProduct = (pass, id) => rpc('admin_delete_product', { pass, p_id: id });
export const adminSetStatus     = (pass, id, status) => rpc('admin_set_status', { pass, p_id: id, p_status: status });
export const adminMoveProduct   = (pass, id, up) => rpc('admin_move_product', { pass, p_id: id, p_up: up });
export const adminAddPhotos     = (pass, id, photos) => rpc('admin_add_photos', { pass, p_id: id, p_photos: photos }, LIMITE_FOTOS);
export const adminDeletePhoto   = (pass, photoId) => rpc('admin_delete_photo', { pass, p_photo_id: photoId });
