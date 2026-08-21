import React, { useState } from 'react';
import { config } from '../config';

const Newsletter = () => {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email.trim()) return;
        // El registro llega directo a tu WhatsApp para que tengas la lista de interesados.
        const message = `Hola, quiero enterarme de lo que va llegando a Prothe Shops. Mi correo es: ${email}`;
        window.open(`https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
        setSent(true);
    };

    return (
        <section className="news reveal">
            <div className="wrap">
                <div className="news-body">
                    <h2>Avísame qué llega</h2>
                    <p>
                        Te escribimos cuando entran pares nuevos o vuelve tu talla.
                        Sin spam, solo cuando hay algo bueno.
                    </p>
                    {sent ? (
                        <div className="thanks">Listo, quedas en la lista</div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <input
                                type="email"
                                placeholder="Tu correo"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <button type="submit">Anotarme</button>
                        </form>
                    )}
                </div>
            </div>
        </section>
    );
};

export default Newsletter;
