// import React, {useState, useEffect, useRef} from 'react'
import '../App.css'
import { Button } from './blocks/Button'
import './HeroSection.css'
import {useNavigate } from 'react-router-dom'
import { publicFile } from '../App';
import { useEffect, useState } from 'react';

const HERO_VIDEO = 'videos/video-4.mp4';

/**
 * The hero video's URL once it's worth loading: after the page has finished loading and
 * the browser is idle, so it never competes with the first paint. The poster image shows
 * until then. Skipped for reduced-motion and data-saver visitors (they keep the poster).
 */
function useDeferredHeroVideo() {
	const [src, setSrc] = useState(null);
	useEffect(() => {
		const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
		const saveData = navigator.connection?.saveData;
		if (reduceMotion || saveData) return undefined;
		let idleId;
		let timer;
		const start = () => {
			const load = () => setSrc(publicFile(HERO_VIDEO));
			if (window.requestIdleCallback) idleId = window.requestIdleCallback(load, { timeout: 2000 });
			else timer = setTimeout(load, 300);
		};
		if (document.readyState === 'complete') start();
		else window.addEventListener('load', start, { once: true });
		return () => {
			window.removeEventListener('load', start);
			if (idleId) window.cancelIdleCallback?.(idleId);
			clearTimeout(timer);
		};
	}, []);
	return src;
}

function HeroSection() {

	// const [showPopup, setShowPopup] = useState(false);
	// const [popupTriggeredAt, setPopupTriggeredAt] = useState(null); // stores scrollY when popup first appeared
	const navigate = useNavigate();
	const heroVideo = useDeferredHeroVideo();
	// const timerRef = useRef(null);


	const routeChange = (destination) => {
		let path = destination;
		navigate(path);
	};

	// // Open & Close properties for popup
	// const openPopup = (scrollY) => {
	// 	setShowPopup(true);
	// 	setPopupTriggeredAt(scrollY);
	// };
	// const closePopup = () => {
	// 	setShowPopup(false);
	// 	setPopupTriggeredAt(null); // reset so it can trigger again
	// 	clearTimeout(timerRef.current);
	// };

	// // add to only appear every 20s and make condition proper, when exceed top of screen
	// useEffect(() => {
	// 	const handleScroll = () => {
	// 		const scrollY = window.scrollY;

	// 		// Trigger popup once when scroll > 100px
	// 		if (scrollY > 0 && popupTriggeredAt === null) {
	// 			openPopup(scrollY);
	// 		}

	// 		// Hide popup if user scrolls 200px past trigger
	// 		if (popupTriggeredAt !== null && scrollY >= popupTriggeredAt + 1000) {
	// 			closePopup();
	// 		}
	// 	};


	// 	const handleKeyDown = (e) => {
	// 		if (e.key === 'Escape') {
	// 			closePopup();
	// 		}
	// 	};

	// 	window.addEventListener('scroll', handleScroll);
	// 	window.addEventListener('keydown', handleKeyDown);
	// 	return () => {
	// 		window.removeEventListener('scroll', handleScroll);
	// 		window.removeEventListener('keydown', handleKeyDown);
	// 		clearTimeout(timerRef.current);
	// 	};
	// }, [popupTriggeredAt]);

	// useEffect(() => {
	// 	if (showPopup) {
	// 		timerRef.current = setTimeout(() => {
	// 			closePopup();
	// 	}, 2000);

	// 	return () => clearTimeout(timerRef.current);
	// 	}
	// }, [showPopup]);

  return (
	<div className='hero-container'>
	  <video
		src={heroVideo ?? undefined}
		poster={publicFile("images/hero-poster.jpg")}
		autoPlay
		loop
		muted
		playsInline
		preload={heroVideo ? 'auto' : 'none'}
		aria-hidden='true'
	  />
	  <h1>Hi, I'm Brian :D</h1>
	  <p>Forward Deployed AI Engineer @ Scale AI</p>
	  <p className='hero-sub'>Building AI agents, evals &amp; MCP tooling 🛰️</p>
	  <div className='hero-btns'>
		<Button
			className='btns'
			buttonStyle='btn--primary'
			buttonSize='btn--large'
			onClick={() => window.open(publicFile('resume/Brian_Chu_Resume.pdf'), '_blank', 'noopener')}
		>
		  Resume <i className='far fa-file-alt' />
		</Button>
		{/* <Button 
			className='btns' 
			buttonStyle='btn--outline' 
			buttonSize='btn--large'
		>
		  Get Started
		</Button> */}
		<Button
			className='btns'
			buttonStyle='btn--outline'
			buttonSize='btn--large'
			onClick={() => routeChange('/Spotify')}
		>
		  Recent Songs <i className='far fa-play-circle' />
		</Button>
	  </div>
	  {/* {showPopup && (
        <div className="scroll-popup">
          Welcome! You scrolled 100px 👋
          <button onClick={() => setShowPopup(false)}>Close</button>
        </div>
      )} */}
	</div>
  )
}

export default HeroSection
