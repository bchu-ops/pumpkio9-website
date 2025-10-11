// import React, {useState, useEffect, useRef} from 'react'
import '../App.css'
import { Button } from './Button'
import './HeroSection.css'
import {useNavigate } from 'react-router-dom'
import { publicFile } from '../App';

function HeroSection() {

	// const [showPopup, setShowPopup] = useState(false);
	// const [popupTriggeredAt, setPopupTriggeredAt] = useState(null); // stores scrollY when popup first appeared
	const navigate = useNavigate();
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
	  <video src={publicFile("videos/video-4.mp4")} autoPlay loop muted />
	  <h1>Welcome :D</h1>
	  <p>Explore my portfolio and recent music</p>
	  <div className='hero-btns'>
		{/* <Button 
			className='btns' 
			buttonStyle='btn--outline' 
			buttonSize='btn--large'
		>
		  Get Started
		</Button> */}
		<Button 
			className='btns' 
			buttonStyle='btn--primary' 
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
