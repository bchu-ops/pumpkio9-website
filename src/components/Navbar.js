import React, {useEffect, useState} from 'react'
import {Link} from 'react-router-dom'
import './Navbar.css'

function Navbar({ topRef, bottomRef }) {
  const [click, setClick] = useState(false);
  const [button, setButton] = useState(true);

  const handleClick = () => setClick(!click);
  const closeMobileMenu = () => setClick(false);

  const scrollToTop = () => {
	if (topRef && topRef.current) {
    	topRef.current.scrollIntoView({ behavior: "smooth" });
	}
  };
  const scrollToBottom = () => {
	if (bottomRef && bottomRef.current) {
    	bottomRef.current.scrollIntoView({ behavior: "smooth" });
	}
  };
  
  const showButton = () => {
	if (window.innerWidth <= 960) {
		setButton(false);
	} else {
		setButton(true);
	}
	};

  useEffect(() => {
	showButton();
	window.addEventListener('resize', showButton);
	return () => window.removeEventListener('resize', showButton);
  }, []);

  return (
	<>
	  <nav className="navbar">
		<div className="navbar-container">
			<Link to="/" className="navbar-logo" onClick=
			{closeMobileMenu}>
				<div style={{ display: 'flex', gap: '20px' }}>
				<i
				 className="fa-brands fa-spotify fa-beat"
				 style={{ color: 'rgba(0, 217, 255, 0.8)', fontSize: 48 }}
				></i>
				Brian Chu
				</div>
			</Link>
			<div className="menu-icon" onClick={handleClick}>
				<i className={click ? 'fas fa-times' : 'fas fa-bars'}></i>
			</div>
			<ul className={click ? 'nav-menu active' : 'nav-menu'}>
				<li className="nav-item">
					<Link 
						to="/" 
						className="nav-links" 
						onClick={() => {
							closeMobileMenu();
							scrollToTop();
						}}
						>
						Home
					</Link>
				</li>
				<li className="nav-item">
					<Link 
						to="/Interests" 
						className="nav-links" 
						onClick={closeMobileMenu}
						>
						Interests
					</Link>
				</li>
				<li className="nav-item">
					<Link 
						to="/Spotify" 
						className="nav-links" 
						onClick={closeMobileMenu}
						>
						Spotify
					</Link>
				</li>
				<li className="nav-item">
					{<Link 
						className="nav-links-outline" 
						onClick={() => {
							closeMobileMenu();
							scrollToBottom();
						}}
						>
						Links
					</Link> || button}
				</li>
			</ul>
		</div>
	  </nav>
	</>
  )
}

export default Navbar



// '<>' are called fragments, they are used to group multiple elements without adding extra nodes to the DOM
// They are useful when you want to return multiple elements from a component without wrapping them in a single parent element
// In this case, we are using it to return an empty fragment, which means we are not rendering anything
// You can also use <React.Fragment> instead of <>, but the shorthand is more common and easier to read
// This component is currently empty, but you can add your navbar content here
// For example, you can add links, buttons, or any other elements you want to display
// You can also use CSS to style the navbar and make it look better
// This is a good place to start building your navbar component
// You can also import other components and use them here if needed
// Remember to export the component so you can use it in other parts of your application
// This is a functional component, which is a simpler way to create components in React
// Functional components are easier to read and understand, especially for simple components like this one
// You can also use hooks like useState or useEffect in functional components to manage state and side effects
// In this case, we are not using any hooks, but you can add them
// if you need to manage state or perform side effects in your navbar component
// This is a good starting point for your navbar component, and you can build upon it as your application grows
// You can also add prop types or TypeScript types to ensure the component receives the correct props
// If you want to add functionality like toggling a menu or handling clicks, you can do that here as well
// Overall, this is a simple and clean way to start building your navbar