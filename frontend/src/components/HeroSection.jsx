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

	const navigate = useNavigate();
	const heroVideo = useDeferredHeroVideo();


	const routeChange = (destination) => {
		let path = destination;
		navigate(path);
	};

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
		<Button
			className='btns'
			buttonStyle='btn--outline'
			buttonSize='btn--large'
			onClick={() => routeChange('/spotify')}
		>
		  Recent Songs <i className='far fa-play-circle' />
		</Button>
	  </div>
	</div>
  )
}

export default HeroSection
