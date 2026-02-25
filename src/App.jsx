import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import SneakerGrid from './components/SneakerGrid';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import { SneakerContext } from './context/SneakerContext';

function StoreFront() {
  const { sneakers } = useContext(SneakerContext);

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <section id="catalog" className="container" style={{ paddingTop: '4rem', paddingBottom: '6rem' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>
            Nuestro <span className="text-gradient">Catálogo</span>
          </h2>
          <SneakerGrid sneakers={sneakers} />
        </section>
      </main>
      <footer className="glass" style={{ padding: '2rem', textAlign: 'center', marginTop: 'auto' }}>
        <p style={{ color: 'var(--text-muted)' }}>&copy; 2026 Prote Shop. Todos los derechos reservados.</p>
      </footer>
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Background orbs for premium feel */}
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>

        <Routes>
          <Route path="/" element={<StoreFront />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
