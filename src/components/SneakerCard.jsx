import React from 'react';
import { ShoppingCart, MessageCircle } from 'lucide-react';
import { config } from '../config';

const SneakerCard = ({ sneaker }) => {
    const whatsappNumber = config.whatsappNumber; // Leyendo desde configuración global
    const message = `Hola, me interesa apartar el modelo ${sneaker.name}`;
    const wpLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    // Usa el link específico del tenis si existe, sino usa el general de la configuración
    const mercadoLibreLink = sneaker.mlLink || config.mercadoLibreGeneralLink;

    return (
        <div className="glass sneaker-card" style={styles.card}>
            <div style={styles.imageContainer}>
                <img src={sneaker.image} alt={sneaker.name} style={styles.image} className="card-image" />
            </div>
            <div style={styles.content}>
                <h3 style={styles.title}>{sneaker.name}</h3>
                <p style={styles.price}>${sneaker.price.toLocaleString('es-MX')}</p>

                <div style={styles.actions}>
                    <a href={mercadoLibreLink} target="_blank" rel="noreferrer" className="btn btn-primary" style={styles.btnFull}>
                        <ShoppingCart size={18} />
                        Mercado Libre
                    </a>
                    <a href={wpLink} target="_blank" rel="noreferrer" className="btn btn-outline" style={styles.btnFull}>
                        <MessageCircle size={18} />
                        Apartar (WA)
                    </a>
                </div>
            </div>
            <style>{`
        .sneaker-card {
          border-radius: 16px;
          overflow: hidden;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .sneaker-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 30px 60px rgba(0,0,0,0.6);
        }
        .sneaker-card:hover .card-image {
          transform: scale(1.1) rotate(2deg);
        }
      `}</style>
        </div>
    );
};

const styles = {
    card: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
    },
    imageContainer: {
        height: '250px',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transition: 'transform 0.5s ease',
    },
    content: {
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
    },
    title: {
        fontSize: '1.5rem',
        marginBottom: '0.5rem',
    },
    price: {
        fontSize: '1.2rem',
        color: 'var(--secondary-color)',
        fontWeight: 'bold',
        marginBottom: '1.5rem',
    },
    actions: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.8rem',
        marginTop: 'auto',
    },
    btnFull: {
        width: '100%',
        padding: '0.8rem',
    }
};

export default SneakerCard;
