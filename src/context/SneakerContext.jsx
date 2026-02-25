import React, { createContext, useState, useEffect } from 'react';
import { sneakers as defaultSneakers } from '../data/sneakers';

export const SneakerContext = createContext();

export const SneakerProvider = ({ children }) => {
    const [sneakers, setSneakers] = useState(() => {
        // Intentar cargar desde LocalStorage primero
        const savedSneakers = localStorage.getItem('proteShopSneakers');
        if (savedSneakers) {
            return JSON.parse(savedSneakers);
        }
        // Si no hay nada guardado, usar la lista por defecto
        return defaultSneakers;
    });

    // Guardar en LocalStorage cada vez que cambien los tenis
    useEffect(() => {
        localStorage.setItem('proteShopSneakers', JSON.stringify(sneakers));
    }, [sneakers]);

    const addSneaker = (newSneaker) => {
        setSneakers([
            ...sneakers,
            { ...newSneaker, id: Date.now() } // Generar un ID único
        ]);
    };

    const removeSneaker = (id) => {
        setSneakers(sneakers.filter(s => s.id !== id));
    };

    return (
        <SneakerContext.Provider value={{ sneakers, addSneaker, removeSneaker }}>
            {children}
        </SneakerContext.Provider>
    );
};
