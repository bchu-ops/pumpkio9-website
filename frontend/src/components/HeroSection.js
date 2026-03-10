import '../App.css'
import { Button } from './blocks/Button'
import './HeroSection.css'
import { useNavigate } from 'react-router-dom'
import { publicFile } from '../App';

function HeroSection() {
	const navigate = useNavigate();

  return (
	<div className='hero-container'>
	  <video src={publicFile("videos/video-4.mp4")} autoPlay loop muted title="Background video" />
	  <h1>Welcome :D</h1>
	  <p>Explore my portfolio and recent music</p>
	  <div className='hero-btns'>
		<Button
			className='btns'
			buttonStyle='btn--primary'
			buttonSize='btn--large'
			onClick={() => navigate('/Spotify')}
		>
		  Recent Songs <i className='far fa-play-circle' />
		</Button>
	  </div>
	</div>
  )
}

export default HeroSection
