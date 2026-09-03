// Achica y comprime la foto antes de guardarla: las fotos de celular pesan
// varios MB y asi bajan a ~150 KB sin que se note en pantalla.
// 1200px y calidad 0.82.
//
// Se habian bajado a 900/0.72 cuando las fotos vivian DENTRO de la base en
// texto base64: ahi cada kilobyte se pagaba caro porque se volvia a bajar
// completo en cada visita, sin poder guardarse en cache.
//
// Ya no es el caso: ahora van a la bodega de archivos, se sirven por la red de
// entrega y el navegador las guarda. Bajarle a la calidad dejo de tener
// sentido, y en unos tenis la calidad es la venta.
const MAX_LADO = 1200;
const CALIDAD = 0.82;

export function comprimirImagen(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('No se pudo leer la foto'));
        reader.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error('El archivo no es una imagen válida'));
            img.onload = () => {
                const escala = Math.min(1, MAX_LADO / Math.max(img.width, img.height));
                const w = Math.round(img.width * escala);
                const h = Math.round(img.height * escala);

                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                // Fondo blanco: los PNG transparentes se verian negros en JPEG.
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, w, h);
                ctx.drawImage(img, 0, 0, w, h);

                // Se devuelve el archivo, no texto base64: se sube a la
                // bodega tal cual y pesa 33% menos que su version en texto.
                canvas.toBlob(
                    (blob) => blob ? resolve(blob) : reject(new Error('No se pudo procesar la foto')),
                    'image/jpeg', CALIDAD
                );
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}
