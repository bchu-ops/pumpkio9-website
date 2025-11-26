import React from 'react'
import './Cards.css'
import CardItem from './blocks/CardItem'
import { publicFile } from '../App';

function Cards() {
  return (
	<div className='cards'>
	  <h1 className="text-2xl md:text-3xl font-bold mb-2">
		Hey, I'm Brian! 😃
	  </h1>
		<div className="flex flex-col md:flex-row overflow-hidden max-w-screen">
      
			{/* Left - Profile Image */}
			<div className="cards-wrapper flex-shrink-0 w-full md:w-1/3 p-4 flex justify-center">
				<img
					src={publicFile("images/profile.jpg")}
					alt="Profile"
					className="w-full max-w-[350px] h-auto object-cover rounded-lg shadow-lg transition-transform duration-300 hover:scale-105"
					shadow="1 20px 6px #242424"
				/>
			</div>

			{/* Text Content */}
			<div className="cards-wrapper">
				<p className="text-lg md:text-xl text-gray-700 mb-2">
					I’m a <span className="font-semibold">(full-stack / front-end)</span> Software Engineer!
					I’m passionate about exploring uncharted spaces to change the world through bold ideas and action. 😎
				</p>
				<p className="text-lg md:text-xl text-gray-700 mb-2">
					Recently completed Masters of Science in <span className="font-semibold">Chemical Engineering! 🚀✨</span>
				</p>
				<p className="text-lg md:text-xl text-gray-700">
					Thanks for visiting, let's connect :D !
				</p>
			</div>
		</div>








	  <div className='cards__container'>
		{/* EXPERIENCES */}
		<h1 className="text-2xl md:text-3xl font-bold mb-2">
		Experiences
	    </h1>
		<div className='cards__wrapper'>
			<ul className='cards__items'>
				<CardItem 
				src={publicFile("images/img-2.jpg")}
				text="Explore the hidden waterfall deep inside the Amazon Jungle"
				label="Adventure"
				path="/services"
				/>
				<CardItem 
				src={publicFile("images/img-9.jpg")}
				text="Explore the hidden waterfall deep inside the Amazon Jungle"
				label="Adventure"
				path="/services"
				/>
			</ul>
			<ul className='cards__items'>
				<CardItem 
				src={publicFile("images/img-2.jpg")}
				text="Explore the hidden waterfall deep inside the Amazon Jungle"
				label="Adventure"
				path="/services"
				/>
				<CardItem 
				src={publicFile("images/img-9.jpg")}
				text="Explore the hidden waterfall deep inside the Amazon Jungle"
				label="Adventure"
				path="/services"
				/>
				<CardItem 
				src={publicFile("images/img-3.jpg")}
				text="Explore the hidden waterfall deep inside the Amazon Jungle"
				label="Adventure"
				path="/services"
				/>
			</ul>
		</div>
		{/* Papers, Publications & Projects */}
		{/* still need path & page referenced with pdf viewer and paper/presentation linked */}
		<h1 className="text-2xl md:text-3xl font-bold mb-2">
		Papers, Publications & Projects
	    </h1>
		<div className='cards__wrapper'>
			<ul className='cards__items'>
				<CardItem 
				src={publicFile("images/covers/lpcvd.png")}
				text="Low Pressure Chemical Vapor Deposition (LPCVD) System"
				label="Paper & Presentation"
				path="/papers/lpcvd"
				/>
				<CardItem 
				src={publicFile("images/covers/heatexchanger.png")}
				text="Modeling Heat Transfer Correlations in Plate Heat Exchangers"
				label="Paper & Presentation"
				path="/services"
				/>
				<CardItem 
				src={publicFile("images/covers/reverseosmosis.png")}
				text="Determining the Effectiveness of a Membrane Separation Process Using Reverse Osmosis"
				label="Paper & Presentation"
				path="/services"
				/>
			</ul>
			<ul className='cards__items'>
				<CardItem 
				src={publicFile("images/covers/phcontrol.png")}
				text="Controller Tuning to Adjust the pH of a Solution in a Continuous Stirred Tank Reactor (CSTR)"
				label="Paper & Presentation"
				path="/services"
				/>
				<CardItem 
				src={publicFile("images/covers/liposome.png")}
				text="Ideal Number of Extrusions for Uniformity in Liposome Nanoparticle Synthesis"
				label="Paper & Presentation"
				path="/services"
				/>
				<CardItem 
				src={publicFile("images/covers/uvphoto.png")}
				text="Photocatalytic Degradation of Methylene Blue Dye by UV Light and TiO2 Catalyst"
				label="Paper & Presentation"
				path="/services"
				/>
			</ul>
		</div>
	  </div>
	</div>
  )
}

export default Cards
