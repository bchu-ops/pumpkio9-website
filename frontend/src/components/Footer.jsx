import React from 'react'
import { Link } from 'react-router-dom';
import './Footer.css';
import { publicFile } from '../App';
import LazyVideo from './LazyVideo';

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
					<LazyVideo src={publicFile("funvids/fatnailong.mp4")} autoPlay muted loop playsInline />
				</div>
				<div className="video-box">
					<LazyVideo src={publicFile("funvids/pokednailong.mp4")} autoPlay muted loop playsInline />
				</div>
				<div className="video-box">
					<LazyVideo src={publicFile("funvids/sadnailong.mp4")} autoPlay muted loop playsInline />
				</div>
				<div className="video-box">
					<LazyVideo src={publicFile("videos/video-1.mp4")} autoPlay loop muted playsInline />
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
			>Notion</a>
			{/* Devpost hidden for now; uncomment to show again.
			<a
			target='_blank'
            rel='noopener noreferrer'
			href="https://devpost.com/brian-chu1030"
			>Devpost</a>
			*/}
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
						className='social-icon-link notion-icon'
						to='https://pumpkio9.notion.site/Brian-s-Portfolio-31f181ecd4f680f4b71df7b0d1d87d60?pvs=74'
						target='_blank'
						rel="noopener noreferrer"
						aria-label='Notion'
					>
						<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ display: 'block' }}>
							<path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
						</svg>
					</Link>
					{/* Devpost hidden for now; uncomment to show again.
					<Link
						className='social-icon-link devpost'
						to='https://devpost.com/brian-chu1030'
						target='_blank'
						rel="noopener noreferrer"
						aria-label='Devpost'
					>
						<i className='fa-regular fa-d' />
					</Link>
					*/}
				</div>
			</div>
		</section>
	</div>
  )
}

export default Footer
