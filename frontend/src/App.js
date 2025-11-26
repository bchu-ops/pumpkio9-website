import React, { useRef } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import PageRoutes from './components/blocks/PageRoutes.js';
import Home from './components/pages/Home';
import Spotify from './components/pages/Spotify';
import Interests from './components/pages/Interests';
import Product1 from './components/pages/Product1';
import Product2 from './components/pages/Product2';
import Product3 from './components/pages/Product3';
import Projects from './components/pages/Projects';
import NotFound from "./components/pages/NotFound";


function App() {
  const topRef = useRef(null);
  const bottomRef = useRef(null);
  
  return (
    <>
      <Router basename="/pumpkio9-website">
        <div className="app-container">
          <div ref={topRef} /> {/* Attach ref at the top */}
          <Navbar topRef={topRef} bottomRef={bottomRef}/>
          <div className="main-content">
            <Routes>
              <Route path='/' element={<Home />}/>
              <Route path='/Interests' element={<Interests />}/>
              <Route path='/Spotify' element={<Spotify />}/>
              <Route path="/Projects" element={<Projects />} />
              <Route path="/Product1" element={<Product1 />} />
              <Route path="/Product2" element={<Product2 />} />
              <Route path="/Product3" element={<Product3 />} />

              {/* Dynamic route for all types (papers, projects, tutorials, etc) */}
              <Route path="/:type/:id" element={<PageRoutes />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
            <div ref={bottomRef} />
          </div>
          <Footer />
        </div>
      </Router>
    </>
      
  );
}
// export const PUBLIC = process.env.PUBLIC_URL;
export const publicFile = (path) => `${process.env.PUBLIC_URL}/${path}`;
export default App;
