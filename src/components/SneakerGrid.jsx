import React from 'react';
import SneakerCard from './SneakerCard';

const SneakerGrid = ({ sneakers }) => {
    return (
        <div style={styles.grid}>
            {sneakers.map(sneaker => (
                <SneakerCard key={sneaker.id} sneaker={sneaker} />
            ))}
        </div>
    );
};

const styles = {
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2.5rem',
        justifyContent: 'center',
    }
};

export default SneakerGrid;
