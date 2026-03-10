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
				href={publicFile('/resume/Brian_Chu_Resume_SWE.pdf')}
				target='_blank'
				rel='noopener noreferrer'>
					Software Engineering
				</a>
				<a
					href='https://drive.google.com/file/d/1G3uOWQ6U8UICHS_Ng2xGDAOmzK-TPLam/view?usp=drive_link'
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
