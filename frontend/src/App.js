import React, { useRef } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './components/pages/Home';
import Spotify from './components/pages/Spotify';
import Interests from './components/pages/Interests';
import Product1 from './components/pages/Project1';
import Product2 from './components/pages/Project2';
import Product3 from './components/pages/Project3';
import Projects from './components/pages/Projects';


function App() {
  const topRef = useRef(null);
  const bottomRef = useRef(null);

  return (
    <>
      <Router>
        <div className="app-container">
          <div ref={topRef} /> {/* Attach ref at the top */}
          <Navbar topRef={topRef} bottomRef={bottomRef}/>
          <div className="main-content">
            <Routes>
              <Route path='/' element={<Home />}/>
              <Route path='/Interests' element={<Interests />}/>
              <Route path='/Spotify' element={<Spotify />}/>
              <Route path="/Projects" element={<Projects />} />
              <Route path="/Project1" element={<Product1 />} />
              <Route path="/Project2" element={<Product2 />} />
              <Route path="/Project3" element={<Product3 />} />
            </Routes>
            <div ref={bottomRef} />
          </div>
          <Footer />
        </div>
      </Router>
    </>
      
  );
}

export default App;
