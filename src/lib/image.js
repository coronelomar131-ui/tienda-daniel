// Achica y comprime la foto antes de guardarla: las fotos de celular pesan
// varios MB y asi bajan a ~150 KB sin que se note en pantalla.
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

                resolve(canvas.toDataURL('image/jpeg', CALIDAD));
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}
