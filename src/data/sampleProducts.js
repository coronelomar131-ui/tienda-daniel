// Catálogo de muestra. SOLO se usa cuando la app no logra conectarse con la
// base de datos (por ejemplo dentro de un visor sin internet abierto). En ese
// caso la tienda avisa en pantalla que es una vista de ejemplo, para que nadie
// crea que son pares reales a la venta.
export const sampleProducts = [
    { id: 'demo-1', brand: 'Nike', name: 'Air Max Nocturna', desc: 'Silueta clásica en negro total, suela con cámara de aire visible.', price: 3500, sizes: [25, 25.5, 26, 27, 28], status: 'nuevo', mlLink: '', hasPhoto: false },
    { id: 'demo-2', brand: 'Nike', name: 'Urban Force One', desc: 'Piel blanca, corte bajo. El básico que combina con todo.', price: 2800, sizes: [25, 26, 26.5, 27, 28, 29], status: '', mlLink: '', hasPhoto: false },
    { id: 'demo-3', brand: 'Adidas', name: 'Neon Runner Pro', desc: 'Tejido primeknit con detalles neón, ultraligeros para correr.', price: 4200, sizes: [26, 27, 28], status: '', mlLink: '', hasPhoto: false },
    { id: 'demo-4', brand: 'Jordan', name: 'Retro High OG', desc: 'Bota alta en piel, colorway original. Pieza de colección.', price: 5600, sizes: [26, 27, 28, 29], status: 'nuevo', mlLink: '', hasPhoto: false },
    { id: 'demo-5', brand: 'New Balance', name: 'Stealth 550', desc: 'Gamuza gris con panel blanco, suela de goma antiderrapante.', price: 3900, sizes: [25.5, 26, 27], status: '', mlLink: '', hasPhoto: false },
    { id: 'demo-6', brand: 'Adidas', name: 'Velocity Zero', desc: 'Edición limitada, ya no quedan pares. Pregunta por restock.', price: 4500, sizes: [], status: 'agotado', mlLink: '', hasPhoto: false },
];
