import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Schemes from './pages/Schemes';
import SchemeDetails from './pages/SchemeDetails';
import EligibilityChecker from './pages/EligibilityChecker';

export default function App() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/schemes" element={<Schemes />} />
          <Route path="/schemes/:id" element={<SchemeDetails />} />
          <Route path="/eligibility" element={<EligibilityChecker />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
