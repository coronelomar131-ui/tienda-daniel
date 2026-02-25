import React from 'react';
import { Instagram, MessageCircle } from 'lucide-react';
import { config } from '../config';

const Navbar = () => {
    return (
        <nav className="glass" style={styles.nav}>
            <div className="container" style={styles.container}>
                <div style={styles.logo}>
                    <h1 style={{ fontSize: '1.8rem', margin: 0 }}>
                        Prote <span className="text-gradient">Shop</span>
                    </h1>
                </div>

                <div style={styles.links}>
                    <a href="#catalog" style={styles.link}>Catálogo</a>
                    <div style={styles.social}>
                        <a href={config.instagramLink} target="_blank" rel="noreferrer" style={styles.iconLink}>
                            <Instagram size={24} />
                        </a>
                        <a href={`https://wa.me/${config.whatsappNumber}`} target="_blank" rel="noreferrer" style={styles.iconLink}>
                            <MessageCircle size={24} />
                        </a>
                    </div>
                </div>
            </div>
        </nav>
    );
};

const styles = {
    nav: {
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '1rem 0',
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderRadius: '0 0 16px 16px',
    },
    container: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    links: {
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
    },
    link: {
        color: 'var(--text-main)',
        textDecoration: 'none',
        fontWeight: 600,
        fontSize: '1.1rem',
        transition: 'color 0.3s',
    },
    social: {
        display: 'flex',
        gap: '1rem',
    },
    iconLink: {
        color: 'var(--text-main)',
        transition: 'all 0.3s ease',
    }
};

export default Navbar;
