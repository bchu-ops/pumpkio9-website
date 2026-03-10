import React, { useState } from 'react'
import './Cards.css'
import CardItem from './blocks/CardItem'
import { publicFile } from '../App';

function Cards() {
  const [viewMode, setViewMode] = useState('card');

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
					I’m a <span className="font-semibold">(full-stack / ML)</span> Software Engineer!
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
		<div className='cards__view-toggle'>
			<select
				value={viewMode}
				onChange={(e) => setViewMode(e.target.value)}
				className='cards__view-select'
			>
				<option value="card">Card View</option>
				<option value="list">List View</option>
			</select>
		</div>
		{/* EXPERIENCES */}
		<h1 className="text-2xl md:text-3xl font-bold mb-2">
		Experiences
	    </h1>
		<div className={`cards__wrapper ${viewMode === 'list' ? 'cards__wrapper--list' : ''}`}>
			<ul className={`cards__items ${viewMode === 'list' ? 'cards__items--list' : ''}`}>
				<CardItem
				src={publicFile("images/covers/machining.png")}
				text="AI Engineer"
				label="Stealth Startup"
				path="/services"
				viewMode={viewMode}
				/>
				<CardItem
				src={publicFile("images/covers/vulcan.png")}
				text="MLOps Engineer / SWE Intern"
				label="Vulcan Engineering Solutions"
				path="/services"
				viewMode={viewMode}
				/>
			</ul>
			<ul className={`cards__items ${viewMode === 'list' ? 'cards__items--list' : ''}`}>
				<CardItem
				src={publicFile("images/covers/ucsdjacobs.png")}
				text="Thermal Process Engineer"
				label="Jacobs School of Engineering, UCSD"
				path="/services"
				viewMode={viewMode}
				/>
				<CardItem
				src={publicFile("images/covers/ucsd.png")}
				text="Lab Member"
				label="Nanoengineering Dept, UCSD"
				path="/services"
				viewMode={viewMode}
				/>
				<CardItem
				src={publicFile("images/covers/ucsdspec.png")}
				text="Battery Engineering Technician"
				label="UC San Diego Summer Battery Camp"
				path="/services"
				viewMode={viewMode}
				/>
				<CardItem
				src={publicFile("images/covers/cnra.png")}
				text="Professional Referee"
				label="California North Referee Administration"
				path="/services"
				viewMode={viewMode}
				/>
			</ul>
		</div>
		{/* PROJECTS */}
		<h1 className="text-2xl md:text-3xl font-bold mb-2">
		Projects
		</h1>
		<div className={`cards__wrapper ${viewMode === 'list' ? 'cards__wrapper--list' : ''}`}>
			<ul className={`cards__items ${viewMode === 'list' ? 'cards__items--list' : ''}`}>
				<CardItem
				src={publicFile("images/covers/projects/f1.png")}
				text="F1 AI Racing — Real-time telemetry with LangChain, GraphRAG, and FSAE go-kart chassis design"
				label="Speed Demon"
				path="/services"
				viewMode={viewMode}
				/>
				<CardItem
				src={publicFile("images/covers/projects/kg.png")}
				text="Knowledge Graph Neural Network predicting combined drug effects with 82% accuracy using TensorFlow and Neo4j"
				label="NLP Drug-Drug Interactions"
				path="/services"
				viewMode={viewMode}
				/>
				<CardItem
				src={publicFile("icons/favicon.ico")}
				text="React-based interactive website with animated graphics, responsive design, and dynamic data-driven components"
				label="Personal Website"
				path="/services"
				viewMode={viewMode}
				/>
			</ul>
		</div>
		{/* Papers & Publications*/}
		{/* still need path & page referenced with pdf viewer and paper/presentation linked */}
		<h1 className="text-2xl md:text-3xl font-bold mb-2">
		Papers & Publications
	    </h1>
		<div className={`cards__wrapper ${viewMode === 'list' ? 'cards__wrapper--list' : ''}`}>
			<ul className={`cards__items ${viewMode === 'list' ? 'cards__items--list' : ''}`}>
				<CardItem
				src={publicFile("images/covers/lpcvd.png")}
				text="Low Pressure Chemical Vapor Deposition (LPCVD) System"
				label="Paper & Presentation"
				path="/papers/lpcvd"
				viewMode={viewMode}
				/>
				<CardItem
				src={publicFile("images/covers/heatexchanger.png")}
				text="Modeling Heat Transfer Correlations in Plate Heat Exchangers"
				label="Paper & Presentation"
				path="/services"
				viewMode={viewMode}
				/>
				<CardItem
				src={publicFile("images/covers/reverseosmosis.png")}
				text="Determining the Effectiveness of a Membrane Separation Process Using Reverse Osmosis"
				label="Paper & Presentation"
				path="/services"
				viewMode={viewMode}
				/>
			</ul>
			<ul className={`cards__items ${viewMode === 'list' ? 'cards__items--list' : ''}`}>
				<CardItem
				src={publicFile("images/covers/phcontrol.png")}
				text="Controller Tuning to Adjust the pH of a Solution in a Continuous Stirred Tank Reactor (CSTR)"
				label="Paper & Presentation"
				path="/services"
				viewMode={viewMode}
				/>
				<CardItem
				src={publicFile("images/covers/liposome.png")}
				text="Ideal Number of Extrusions for Uniformity in Liposome Nanoparticle Synthesis"
				label="Paper & Presentation"
				path="/services"
				viewMode={viewMode}
				/>
				<CardItem
				src={publicFile("images/covers/uvphoto.png")}
				text="Photocatalytic Degradation of Methylene Blue Dye by UV Light and TiO2 Catalyst"
				label="Paper & Presentation"
				path="/services"
				viewMode={viewMode}
				/>
			</ul>
		</div>
	  </div>
	</div>
  )
}

export default Cards
