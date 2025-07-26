import React, { useRef } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './components/pages/Home';
import Spotify from './components/pages/Spotify';
import Interests from './components/pages/Interests';


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
