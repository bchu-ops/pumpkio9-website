import React from 'react';
import '../../App.css';
import HeroSection from '../HeroSection';
import ProfileIntro from '../ProfileIntro';
import NotionCards from '../NotionCards';

function Home() {
  return (
	<>
	  <HeroSection />
	  <ProfileIntro />
	  <NotionCards />
	</>
  );
}


export default Home;
