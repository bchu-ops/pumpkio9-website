import React, {useEffect, useState, useRef} from 'react'
import {Link, useNavigate} from 'react-router-dom'
import './Navbar.css'

function Navbar({ topRef, bottomRef }) {
	const [click, setClick] = useState(false);
	const [openDropdownIndex, setOpenDropdownIndex] = useState(null); // track which dropdown is open

	const handleClick = () => setClick(!click);
	const closeMobileMenu = () => setClick(false);
	const navbarRef = useRef(null); // detect clicks outside
	const navigate = useNavigate(); 

	// dual-behavior function for dropdown button
	const handleDropdownButtonClick = (index) => {
		if (openDropdownIndex === index) {
			// Dropdown is already open → navigate & close dropdown menu
			navigate('/Projects');
			setOpenDropdownIndex(null);
		} else {
			// Dropdown is closed → open it
			setOpenDropdownIndex(index);
		}
	};

	// Handle links that scroll to top or bottom
	const scrollToTop = () => {
		if (topRef && topRef.current) {
			topRef.current.scrollIntoView({ behavior: "smooth" });
		}
	};
	// Scroll to the footer's Social Media / Resume links on any page
	const scrollToFooterLinks = () => {
		const el = document.getElementById("footer-links");
		if (el) {
			el.scrollIntoView({ behavior: "smooth", block: "center" });
		} else if (bottomRef && bottomRef.current) {
			bottomRef.current.scrollIntoView({ behavior: "smooth" });
		}
	};

	// List of dropdown menus and their items
	const menuData = [
		{
			label: "Products",
			items: [
				{ name: "My Spotify", path: "/Spotify" },
				{ name: "Speed Demon", path: "/speed-demon" },
				{ name: "Process Lab", path: "/process-lab" }
			],
		}
	];


	useEffect(() => {
	const handleClickOutside = (event) => {
		if (navbarRef.current && !navbarRef.current.contains(event.target)) {
		setOpenDropdownIndex(null); // close any open dropdown
		}
	};

	document.addEventListener("mousedown", handleClickOutside);

	return () => {
		document.removeEventListener("mousedown", handleClickOutside);
	};
}, []);

  return (
	<>
	  <nav className="navbar" ref={navbarRef}>
		<div className="navbar-container">
			<Link to="/" className="navbar-logo" onClick=
			{closeMobileMenu}>
				<div style={{ display: 'flex', gap: '20px' }}>
				<i
				 className="fa-brands fa-spotify fa-beat"
				 aria-hidden="true"
				 style={{ color: 'rgba(0, 217, 255, 0.8)', fontSize: 48 }}
				></i>
				Brian Chu
				</div>
			</Link>
			<button
				type="button"
				className="menu-icon"
				aria-label="Toggle menu"
				aria-expanded={click}
				onClick={handleClick}
			>
				<i className={click ? 'fas fa-times' : 'fas fa-bars'} aria-hidden="true"></i>
			</button>
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
				{menuData.map((menuGroup, index) => (
					<li key={menuGroup.label} className="nav-item menu-item">
					<button
						className="nav-links dropdown-toggle"
						aria-haspopup="true"
						aria-expanded={openDropdownIndex === index}
						onClick={() => handleDropdownButtonClick(index)}
					>
						{menuGroup.label} ▾
					</button>
					{openDropdownIndex === index && (
						<ul className="dropdown">
						{menuGroup.items.map((item) => (
							<li key={item.path}>
							<Link
								to={item.path}
								className="dropdown-item"
								onClick={closeMobileMenu}
							>
								{item.name}
							</Link>
							</li>
						))}
						</ul>
					)}
					</li>
				))}
				<li className="nav-item">
					<a
						href="#footer-links"
						className="nav-links-outline"
						onClick={(e) => {
							e.preventDefault();
							closeMobileMenu();
							scrollToFooterLinks();
						}}
						>
						Links
					</a>
				</li>
			</ul>
		</div>
	  </nav>
	</>
  )
}

export default Navbar

