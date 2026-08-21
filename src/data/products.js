// =========================================================================
// CATÁLOGO DE PRODUCTOS - PROTHE SHOPS
// =========================================================================
// Aquí puedes agregar, editar o borrar los productos que aparecen en tu página.
//
// INSTRUCCIONES PARA IMÁGENES:
// 1. Guarda la imagen en la carpeta `public/images` (ej. "playera.jpg")
// 2. En "image:", escribe el nombre de la foto de esta forma: "/images/playera.jpg"
// 3. Si dejas image vacío (""), se mostrará un dibujo de la prenda según su categoría.
//
// CATEGORÍAS DISPONIBLES: "Playeras", "Shorts", "Chamarras", "Sets"
//
// SI DEJAS mlLink VACÍO (""), se usará el link a tu eshop general de configuración.

export const products = [
    {
        id: 1,
        name: "Prothe Run Tee",
        tag: "Playera Técnica",
        category: "Playeras",
        price: 450,
        desc: "Tela ligera de secado rápido, corte relajado. Ideal para entrenar o para el día a día.",
        image: "",
        mlLink: "",
    },
    {
        id: 2,
        name: "Prothe Track Shorts",
        tag: "Shorts Técnicos",
        category: "Shorts",
        price: 380,
        desc: "Cintura elástica con cordón, bolsillos laterales, tejido transpirable.",
        image: "",
        mlLink: "",
    },
    {
        id: 3,
        name: "Prothe Windbreaker",
        tag: "Chamarra",
        category: "Chamarras",
        price: 780,
        desc: "Rompevientos ligero, resistente al agua, forro de malla interior.",
        image: "",
        mlLink: "",
    },
    {
        id: 4,
        name: "Prothe Night Tee",
        tag: "Playera Técnica",
        category: "Playeras",
        price: 460,
        desc: "Versión negra de la Run Tee, detalles reflectantes en costuras.",
        image: "",
        mlLink: "",
    },
    {
        id: 5,
        name: "Prothe Court Shorts",
        tag: "Shorts Técnicos",
        category: "Shorts",
        price: 360,
        desc: "Corte más corto, ideal para básquet o entrenamiento de alta intensidad.",
        image: "",
        mlLink: "",
    },
    {
        id: 6,
        name: "Prothe Duo Set",
        tag: "Set Completo",
        category: "Sets",
        price: 780,
        desc: "Playera + shorts a juego, empaque de regalo incluido.",
        image: "",
        mlLink: "",
    }
];
