import React, { useState } from 'react';
import { config } from '../config';

const Newsletter = () => {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email.trim()) return;
        // El registro llega directo a tu WhatsApp para que tengas la lista de interesados.
        const message = `Hola, quiero unirme a la lista de Prothe Shops. Mi correo es: ${email}`;
        window.open(`https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
        setSent(true);
    };

    return (
        <section className="news reveal">
            <h2>Únete a Prothe</h2>
            <p>Nuevos lanzamientos, ediciones limitadas y acceso anticipado.</p>
            {sent ? (
                <div className="thanks">Gracias — nos vemos en el próximo lanzamiento.</div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Tu correo"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <button type="submit">Suscribirme</button>
                </form>
            )}
        </section>
    );
};

export default Newsletter;
