import React, { useRef, Suspense, lazy } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import PageRoutes from './components/blocks/PageRoutes.js';

const Home = lazy(() => import('./components/pages/Home'));
const Spotify = lazy(() => import('./components/pages/Spotify'));
const Interests = lazy(() => import('./components/pages/Interests'));
const Product1 = lazy(() => import('./components/pages/Product1'));
const Product2 = lazy(() => import('./components/pages/Product2'));
const Product3 = lazy(() => import('./components/pages/Product3'));
const Projects = lazy(() => import('./components/pages/Projects'));
const NotFound = lazy(() => import('./components/pages/NotFound'));


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
            <Suspense fallback={<h1>Loading...</h1>}>
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
            </Suspense>
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
