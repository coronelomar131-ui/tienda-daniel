import React from 'react';

// Es una secuencia real de tres pasos, por eso va numerada.
const pasos = [
    {
        titulo: 'Escoge tu par',
        texto: 'Busca por marca, revisa que esté tu talla y agrégalo al carrito.',
    },
    {
        titulo: 'Apártalo',
        texto: 'Dale a apartar y se abre WhatsApp con tu pedido y tallas ya escritos.',
    },
    {
        titulo: 'Te llega',
        texto: 'Acordamos pago y envío por el chat. Mandamos a todo México.',
    },
];

const HowTo = () => (
    <section className="howto reveal" id="comoapartar">
        <div className="wrap">
            <h2>Cómo apartar</h2>
            <ol>
                {pasos.map(paso => (
                    <li key={paso.titulo}>
                        <h3>{paso.titulo}</h3>
                        <p>{paso.texto}</p>
                    </li>
                ))}
            </ol>
        </div>
    </section>
);

export default HowTo;
