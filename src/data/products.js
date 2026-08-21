// =========================================================================
// CATÁLOGO DE TENIS - PROTHE SHOPS
// =========================================================================
// Aquí puedes agregar, editar o borrar los tenis que aparecen en tu página.
// También puedes hacerlo sin tocar código desde el panel: /admin
//
// INSTRUCCIONES PARA IMÁGENES:
// 1. Guarda la foto en la carpeta `public/images` (ej. "jordan1.jpg")
// 2. En "image:", escribe: "/images/jordan1.jpg"
// 3. Si dejas image vacío (""), se muestra un dibujo de tenis.
//
// CAMPOS:
//   brand   → marca (Nike, Jordan, Adidas, New Balance...). Crea el filtro de arriba.
//   sizes   → tallas MX disponibles. Si lo dejas vacío [], no pide talla.
//   status  → "nuevo" (badge verde), "agotado" (badge rojo) o "" (sin badge)
//   mlLink  → link específico de Mercado Libre. Vacío = usa tu eshop general.

export const products = [
    {
        id: 1,
        brand: "Nike",
        name: "Air Max Nocturna",
        desc: "Silueta clásica en negro total, suela con cámara de aire visible.",
        price: 3500,
        sizes: [25, 25.5, 26, 27, 28],
        status: "nuevo",
        image: "",
        mlLink: "",
    },
    {
        id: 2,
        brand: "Nike",
        name: "Urban Force One",
        desc: "Piel blanca, corte bajo. El básico que combina con todo.",
        price: 2800,
        sizes: [25, 26, 26.5, 27, 28, 29],
        status: "",
        image: "",
        mlLink: "",
    },
    {
        id: 3,
        brand: "Adidas",
        name: "Neon Runner Pro",
        desc: "Tejido primeknit con detalles neón, ultraligeros para correr.",
        price: 4200,
        sizes: [26, 27, 28],
        status: "",
        image: "",
        mlLink: "",
    },
    {
        id: 4,
        brand: "Jordan",
        name: "Retro High OG",
        desc: "Bota alta en piel, colorway original. Pieza de colección.",
        price: 5600,
        sizes: [26, 27, 28, 29],
        status: "nuevo",
        image: "",
        mlLink: "",
    },
    {
        id: 5,
        brand: "New Balance",
        name: "Stealth 550",
        desc: "Gamuza gris con panel blanco, suela de goma antiderrapante.",
        price: 3900,
        sizes: [25.5, 26, 27],
        status: "",
        image: "",
        mlLink: "",
    },
    {
        id: 6,
        brand: "Adidas",
        name: "Velocity Zero",
        desc: "Edición limitada, ya no quedan pares. Pregunta por restock.",
        price: 4500,
        sizes: [],
        status: "agotado",
        image: "",
        mlLink: "",
    }
];
