import React, { useRef, useState } from 'react';
import { waLink } from '../lib/whatsapp';

const Newsletter = () => {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const inputRef = useRef(null);

    // El registro llega a tu WhatsApp para que tengas la lista de interesados.
    const link = waLink(`Hola, quiero enterarme de lo que va llegando a Prothe Shop. Mi correo es: ${email}`);

    const handleClick = (e) => {
        if (!email.trim()) {
            e.preventDefault();
            inputRef.current?.focus();
            return;
        }
        // Se cambia el mensaje hasta después de que abrió WhatsApp.
        setTimeout(() => setSent(true), 400);
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
                        <div className="news-form">
                            <input
                                ref={inputRef}
                                type="email"
                                placeholder="Tu correo"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                aria-label="Tu correo"
                            />
                            <a
                                href={link}
                                target="_blank"
                                rel="noreferrer"
                                className="news-cta"
                                onClick={handleClick}
                            >
                                Anotarme
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default Newsletter;
