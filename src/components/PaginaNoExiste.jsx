import React from 'react';
import { Link } from 'react-router-dom';

// Cualquier direccion que la tienda no conoce cae aqui. Antes no habia ruta
// para ellas y la pagina se quedaba en blanco, sin forma de salir.
const PaginaNoExiste = () => (
    <main className="no-existe">
        <Link to="/" className="logo">Prothe <em>Shop</em></Link>
        <h1>Esta página no existe</h1>
        <p>Puede que el link esté incompleto o que el par ya no esté publicado.</p>
        <Link to="/" className="btn-primary">Ver el catálogo</Link>
    </main>
);

export default PaginaNoExiste;
