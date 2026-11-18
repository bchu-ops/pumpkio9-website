import React, { useRef } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { BrowserRouter as Router } from 'react-router-dom';
import './App.css';
import AppRoutes from './AppRoutes';
import LegacyPathRedirect from './components/blocks/LegacyPathRedirect';
import ScrollToTop from './components/blocks/ScrollToTop';

function App() {
  const topRef = useRef(null);
  const bottomRef = useRef(null);
  
  return (
    <>
      <Router basename="/pumpkio9-website">
        <ScrollToTop />
        <LegacyPathRedirect />
        <div className="app-container">
          <div ref={topRef} />
          <Navbar topRef={topRef} bottomRef={bottomRef}/>
          <div className="main-content">
            <AppRoutes />
            <div ref={bottomRef} />
          </div>
          <Footer />
        </div>
      </Router>
    </>
      
  );
}
export { publicFile } from '@products/shared/publicFile';
export default App;
