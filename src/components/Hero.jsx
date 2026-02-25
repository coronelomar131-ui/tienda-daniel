import React from 'react';

const Hero = () => {
    return (
        <section className="container" style={styles.hero}>
            <div style={styles.content}>
                <h1 style={styles.title}>
                    Eleva tu <br />
                    <span className="text-gradient">Estilo Urbano</span>
                </h1>
                <p style={styles.subtitle}>
                    Encuentra los tenis más exclusivos en Prote Shop.
                    Impacta cada paso con lo mejor del streetwear.
                </p>
                <div style={styles.actions}>
                    <a href="#catalog" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                        Ver Modelos
                    </a>
                </div>
            </div>
            <div style={styles.imageContainer} className="animate-float">
                <img
                    src="https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                    alt="Tenis Exclusivos"
                    style={styles.image}
                />
            </div>
        </section>
    );
};

const styles = {
    hero: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '80vh',
        paddingTop: '4rem',
        gap: '2rem',
        flexWrap: 'wrap',
    },
    content: {
        flex: '1 1 400px',
        zIndex: 10,
    },
    title: {
        fontSize: 'clamp(3rem, 5vw, 5rem)',
        lineHeight: 1.1,
        marginBottom: '1.5rem',
    },
    subtitle: {
        fontSize: '1.2rem',
        color: 'var(--text-muted)',
        marginBottom: '2rem',
        maxWidth: '500px',
        lineHeight: 1.6,
    },
    actions: {
        display: 'flex',
        gap: '1rem',
    },
    imageContainer: {
        flex: '1 1 400px',
        display: 'flex',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 10,
    },
    image: {
        width: '100%',
        maxWidth: '500px',
        transform: 'rotate(-15deg)',
        filter: 'drop-shadow(0 30px 40px rgba(255,51,102,0.4))',
    }
};

export default Hero;
