import React from 'react'
import '../App.css'
import { Button } from './Button'
import './HeroSection.css'
import {useNavigate } from 'react-router-dom'

function HeroSection() {

	let navigate = useNavigate();
	const routeChange = (destination) => {
		let path = destination;
		navigate(path);
	};

  return (
	<div className='hero-container'>
	  <video src="/videos/video-4.mp4" autoPlay loop muted />
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
	</div>
  )
}

export default HeroSection
