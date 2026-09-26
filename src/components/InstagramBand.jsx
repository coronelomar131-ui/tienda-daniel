import React from 'react';
import { config } from '../config';
import { igUsuario } from '../lib/instagram';
import InstagramIcon from './InstagramIcon';

// Franja de Instagram antes del pie de página. Va en azul para que no se
// pierda entre el aviso de novedades y el footer, que son claros.
const InstagramBand = () => {
    const usuario = igUsuario();
    if (!usuario) return null;

    return (
        <section className="ig-band" aria-labelledby="ig-band-titulo">
            <div className="wrap ig-band-wrap">
                <a href={config.instagramLink} target="_blank" rel="noreferrer"
                   className="ig-handle" id="ig-band-titulo">
                    <InstagramIcon size={34} />
                    <span>@{usuario}</span>
                </a>
                <div className="ig-band-copy">
                    <p>Ahí subimos cada par con fotos reales y lo que va llegando.</p>
                    <a href={config.instagramLink} target="_blank" rel="noreferrer"
                       className="ig-abrir">
                        Abrir Instagram
                    </a>
                </div>
            </div>
        </section>
    );
};

export default InstagramBand;
