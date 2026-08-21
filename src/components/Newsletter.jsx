import React, { useState } from 'react';
import { config } from '../config';

const Newsletter = () => {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email.trim()) return;
        // El registro llega directo a tu WhatsApp para que tengas la lista de interesados.
        const message = `Hola, quiero enterarme de los nuevos drops de Prothe Shops. Mi correo es: ${email}`;
        window.open(`https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
        setSent(true);
    };

    return (
        <section className="news reveal">
            <h2>No te quedes sin par</h2>
            <p>Entérate primero de los drops, restocks y ediciones limitadas.</p>
            {sent ? (
                <div className="thanks">Listo — nos vemos en el próximo drop</div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Tu correo"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <button type="submit">Avísenme</button>
                </form>
            )}
        </section>
    );
};

export default Newsletter;
