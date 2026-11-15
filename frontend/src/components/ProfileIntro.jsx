import React from 'react'
import './Cards.css'
import { publicFile } from '../App'

function ProfileIntro() {
  return (
    <div className='cards profile-intro'>
      <div className="flex flex-col md:flex-row md:items-center overflow-hidden max-w-screen">
        {/* Left - Profile Image */}
        <div className="cards-wrapper flex-shrink-0 w-full md:w-1/3 p-4 flex justify-center">
          <img
            src={publicFile("images/profile.jpg")}
            alt="Profile"
            className="w-full max-w-[350px] h-auto md:max-h-[420px] object-cover object-[center_70%] rounded-lg shadow-lg transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        </div>

        {/* Text Content */}
        <div className="cards-wrapper profile-intro-text">
          <h1 className="text-2xl md:text-3xl font-bold mb-3">
            Hey, I'm Brian! 😃
          </h1>
          <p className="text-lg md:text-xl text-gray-700 mb-2">
            I'm a <span className="font-semibold">(full-stack / ML)</span> Software Engineer!
            I'm passionate about exploring uncharted spaces to change the world through bold ideas and action. 😎
          </p>
          <p className="text-lg md:text-xl text-gray-700 mb-2">
            Currently a <span className="font-semibold">Forward Deployed AI Engineer at Scale AI</span>, building AI agents, evals, and MCP tooling for enterprise clients.
            M.S. in Chemical Engineering from UC San Diego with an <span className="font-semibold">FE Chemical! 🚀✨</span>
          </p>
          <p className="text-lg md:text-xl text-gray-700">
            Thanks for visiting, let's connect :D !
          </p>
        </div>
      </div>

    </div>
  )
}

export default ProfileIntro
