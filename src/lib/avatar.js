// La foto de perfil se ve a 88px como mucho, asi que se guarda a 240px y
// recortada en cuadro. Una foto de celular sin achicar pesa 3 MB y se
// bajaria completa cada vez que alguien abre la pantalla de entrada.
const LADO = 240;
const CALIDAD = 0.75;

export function comprimirAvatar(file) {
    return new Promise((listo, falla) => {
        const lector = new FileReader();
        lector.onerror = () => falla(new Error('No se pudo leer la foto'));
        lector.onload = () => {
            const img = new Image();
            img.onerror = () => falla(new Error('Esa foto no se pudo abrir'));
            img.onload = () => {
                // Recorte cuadrado desde el centro: la cara casi siempre va ahi.
                const lado = Math.min(img.width, img.height);
                const x = (img.width - lado) / 2;
                const y = (img.height - lado) / 2;

                const lienzo = document.createElement('canvas');
                lienzo.width = LADO;
                lienzo.height = LADO;
                lienzo.getContext('2d').drawImage(img, x, y, lado, lado, 0, 0, LADO, LADO);
                listo(lienzo.toDataURL('image/jpeg', CALIDAD));
            };
            img.src = lector.result;
        };
        lector.readAsDataURL(file);
    });
}
