// =========================================================================
// CATÁLOGO DE TENIS
// =========================================================================
// Aquí puedes agregar, editar o borrar los tenis que aparecen en tu página.
// 
// INSTRUCCIONES PARA IMÁGENES:
// 1. Guarda la imagen en la carpeta `public/images` (ej. "jordan.jpg")
// 2. En "image:", escribe el nombre de la foto de esta forma: "/images/jordan.jpg"
// 
// SI DEJAS mlLink VACÍO (""), se usará el link a tu eshop general de configuración.

export const sneakers = [
    {
        id: 1,
        name: "Air Max Nocturna",
        price: 3500,
        // Usando una foto de ejemplo de internet.
        // Cámbiable por "/images/tu-foto.jpg" cuando subas tus fotos.
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        mlLink: "", // Dejar en blanco usará tu eShop general
    },
    {
        id: 2,
        name: "Urban Force One",
        price: 2800,
        image: "https://images.unsplash.com/photo-1514989940723-e8e51635b782?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        mlLink: "",
    },
    {
        id: 3,
        name: "Neon Runner Pro",
        price: 4200,
        image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        mlLink: "",
    },
    {
        id: 4,
        name: "Classic Retro High",
        price: 3100,
        image: "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        mlLink: "",
    },
    {
        id: 5,
        name: "Stealth X-1",
        price: 3900,
        image: "https://images.unsplash.com/photo-1551107696-a4b0a5f0f48c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        mlLink: "", // Puedes poner un link específico aquí si lo tienes: "https://articulo.mercadolibre..."
    },
    {
        id: 6,
        name: "Velocity Zero",
        price: 4500,
        image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        mlLink: "",
    }
];
