import React from 'react'
import { Link } from 'react-router-dom';
import './Footer.css';
import { publicFile } from '../App';

function Footer() {
  return (
	<div className='footer-container'>
		<section className='footer-troll'>
			<p className='footer-troll-heading'>
			Hi there! You found the secret section!
			</p>
			<p className='footer-troll-text'>
			Check out these dope videos of one of my recent favorite cartoons and a stargazing video!
			</p>
			<div className="videos-container">
				<div className="video-box">
					<video src={publicFile("funvids/fatnailong.mp4")} autoPlay muted loop/>
				</div>
				<div className="video-box">
					<video src={publicFile("funvids/pokednailong.mp4")} autoPlay muted loop />
				</div>
				<div className="video-box">
					<video src={publicFile("funvids/sadnailong.mp4")} autoPlay muted loop />
				</div>
				<div className="video-box">
					<video src={publicFile("videos/video-1.mp4")} autoPlay loop muted />
				</div>
			</div>
		</section>

		<div className='footer-links'>
        <div className='footer-link-wrapper'>
          <div className='footer-link-items'>
            <h2>Social Media</h2>
            <a 
			target='_blank'
            rel='noopener noreferrer' 
			href="https://www.linkedin.com/in/brian-chu123/"
			>LinkedIn</a>
            <a 
			target='_blank'
            rel='noopener noreferrer' 
			href="https://github.com/bchu-ops"
			>Github</a><a 
			target='_blank'
            rel='noopener noreferrer' 
			href="mailto:brian.chu1030@gmail.com"
			>Gmail</a><a 
			target='_blank'
            rel='noopener noreferrer' 
			href="https://www.notion.so/31f181ecd4f680f4b71df7b0d1d87d60"
			>Notion</a><a
			target='_blank'
            rel='noopener noreferrer'
			href="https://devpost.com/brian-chu1030"
			>Devpost</a>
          </div>
          <div className='footer-link-items'>
            <h2>Resume</h2>
			<div className="inline-resume-link">
				<a
					href={publicFile('resume/Brian_Chu_Resume_ChemE.pdf')}
					target="_blank"
					rel="noopener noreferrer"
				>
					Chemical Engineering
				</a>

				<a
					href="https://drive.google.com/file/d/17y7opjqSFR-MGRQPJTZT45WsDDOCA6m2/view?usp=drive_link"
					target="_blank"
					rel="noopener noreferrer"
					aria-label="Chemical Engineering Google Drive"
					className='inline-icon'
				>
					<i className="fa-brands fa-google-drive" />
				</a>
			</div>
			<div className="inline-resume-link">
				<a 
				href={publicFile('/resume/Brian_Chu_Resume.pdf')}
				target='_blank'
				rel='noopener noreferrer'>
					Software Engineering
				</a>
				<a
					href='https://drive.google.com/file/d/1bFJjHJB2f5vD2WLjwflx9rQjTyEXVfpF/view?usp=drive_link'
					target='_blank'
					rel='noopener noreferrer'
					aria-label='Software Engineering Google Drive'
					className='inline-icon'
				>
				<i className='fa-brands fa-google-drive' />
				</a>
			</div>
          </div>
        </div>
		</div>



		<section className="social-media">
			<div className="social-media-wrap">
				<div className="footer-logo">
					<Link to="/" className="social-logo" style={{ display: 'flex', gap: '12px' }}>
						Brian <i
						className="fa-brands fa-spotify fa-beat"
						style={{ color: 'rgba(0, 217, 255, 0.8)', fontSize: 48 }}
						></i>
					</Link>
				</div>
				{/* <small className='website-rights'>Brian © 2023</small> */}
				<div className="social-icons">
					<Link
						className='social-icon-link LinkedIn'
						to='https://www.linkedin.com/in/brian-chu123/'
						target='_blank'
						rel="noopener noreferrer"
						aria-label='LinkedIn'
					>
						<i className='fab fa-linkedin' />
					</Link>
					<Link
						className='social-icon-link github'
						to='https://github.com/bchu-ops'
						target='_blank'
						rel="noopener noreferrer"
						aria-label='Github'
					>
						<i className='fab fa-github' />
					</Link>
					<Link
						className='social-icon-link email'
						to='mailto:brian.chu1030@gmail.com'
						target='_blank'
						rel="noopener noreferrer"
						aria-label='Email'
					>
						<i className="fa fa-envelope"/>
					</Link>
					<Link
						className='social-icon-link notion'
						to='https://pumpkio9.notion.site/Brian-s-Portfolio-31f181ecd4f680f4b71df7b0d1d87d60?pvs=74'
						target='_blank'
						rel="noopener noreferrer"
						aria-label='Notion'
					>
						<svg width="20" height="20" viewBox="0 0 100 100" fill="none" style={{ display: 'block' }}>
							<path d="M6.017 4.313l55.333 -4.087c6.797 -0.583 8.543 -0.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277 -1.553 6.807 -6.99 7.193L24.467 99.967c-4.08 0.193 -6.023 -0.39 -8.16 -3.113L3.3 79.94c-2.333 -3.113 -3.3 -5.443 -3.3 -8.167V11.113c0 -3.497 1.553 -6.413 6.017 -6.8z" fill="currentColor"/>
							<path d="M61.35 0.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.723 0.967 5.053 3.3 8.167l13.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l64.257 -3.89c5.433 -0.387 6.99 -2.917 6.99 -7.193V17.64c0 -2.21 -0.873 -2.847 -3.443 -4.733L75.99 0.607C72.17 -2.053 70.017 -1.423 61.35 0.227zM25.033 19.527c-5.35 0.39 -6.567 0.477 -9.617 -1.85l-7.39 -5.83c-0.78 -0.78 -0.39 -1.75 1.553 -1.947l51.447 -3.693c4.277 -0.383 6.413 1.17 8.16 2.527l8.537 6.223c0.39 0.197 1.36 1.36 0.193 1.36l-53.273 3.14 -0.003 0z" fill="currentColor"/>
							<path d="M25.033 19.527v0L71.64 16.387c0 0 0.78 0 0.193 1.36l0 0L25.033 19.527z" fill="currentColor"/>
							<path fillRule="evenodd" clipRule="evenodd" d="M25.033 19.527l-0.003 0.07v72.2c0 3.113 1.553 4.47 5.053 4.277l56.827 -3.307c3.497 -0.193 3.883 -2.333 3.883 -4.86V25.533c0 -2.527 -0.97 -3.887 -3.113 -3.693l-59.54 3.5c-2.33 0.193 -3.107 -1.167 -3.107 -3.5v-2.313zM71.64 32.14c0.39 1.75 0 3.5 -1.75 3.7l-2.723 0.583v50.633c-2.333 1.363 -4.47 2.14 -6.22 2.14 -2.917 0 -3.693 -0.78 -5.833 -3.503L36.82 58.067v25.443l5.833 1.36s0 3.5 -4.86 3.5l-13.397 0.78c-0.39 -0.78 0 -2.723 1.357 -3.11l3.497 -0.97V46.887l-4.857 -0.39c-0.39 -1.75 0.583 -4.277 3.3 -4.473l14.367 -0.967 19.8 30.327V47.273l-4.86 -0.583c-0.39 -2.143 1.163 -3.697 3.103 -3.89L71.64 32.14z" fill="white"/>
						</svg>
					</Link>
					<Link
						className='social-icon-link devpost'
						to='https://devpost.com/brian-chu1030'
						target='_blank'
						rel="noopener noreferrer"
						aria-label='Devpost'
					>
						<i className='fa-regular fa-d' />
					</Link>
				</div>
			</div>
		</section>
	</div>
  )
}

export default Footer
