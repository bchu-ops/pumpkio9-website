import React from 'react'
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
	<div className='footer-container'>
		<section className='footer-troll'>
			<p className='footer-troll-heading'>
			Watchu lookin for
			</p>
			<p className='footer-troll-text'>
			yoyo
			<div className="videos-container">
				<div className="video-box">
					<video controls>
					<source src="/shortvids/fatnailong.mp4" type="video/mp4" />
					</video>
				</div>
				<div className="video-box">
					<video controls>
					<source src="/shortvids/pokednailong.mp4" type="video/mp4" />
					</video>
				</div>
				<div className="video-box">
					<video controls>
					<source src="shortvids/sadnailong.mp4" type="video/mp4" />
					</video>
				</div>
				<div className="video-box">
					<video src="videos/video-1.mp4" autoPlay loop muted />
				</div>
			</div>


			</p>
		</section>

		<div class='footer-links'>
        <div className='footer-link-wrapper'>
          <div class='footer-link-items'>
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
          <div class='footer-link-items'>
            <h2>Resume</h2>
            <a 
			href='/resume/Brian_Chu_Resume_ChemE.pdf'
			target='_blank'
			rel='noopener noreferrer'
			>Chemical Engineering</a>
            <a 
			href='/resume/Brian_Chu_Resume_SWE.pdf'
			target='_blank'
			rel='noopener noreferrer'
			>Software Engineering</a>
          </div>
        </div>
		</div>



		<section className="social-media">
			<div className="social-media-wrap">
				<div className="footer-logo">
					<Link className="social-logo" style={{ display: 'flex', gap: '12px' }}>
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
