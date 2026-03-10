import React, {useEffect, useState, useRef} from 'react'
import {Link, useNavigate} from 'react-router-dom'
import './Navbar.css'

function Navbar({ topRef, bottomRef }) {
	const [click, setClick] = useState(false);
	const [openDropdownIndex, setOpenDropdownIndex] = useState(null);

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
	const scrollToBottom = () => {
		if (bottomRef && bottomRef.current) {
			bottomRef.current.scrollIntoView({ behavior: "smooth" });
		}
	};

	// List of dropdown menus and their items
	const menuData = [
		{
			label: "Products",
			items: [
				{ name: "Product 1", path: "/Product1" },
				{ name: "Product 2", path: "/Product2" },
				{ name: "Product 3", path: "/Product3" }
			],
		}
		/*,	// if want to add another dropdown menu, uncomment this
		{
			label: "Products",
			items: [
				{ name: "Product 1", path: "/Project1" },
				{ name: "Product 2", path: "/Project2" },
				{ name: "Product 3", path: "/Project3" }
			],
		}*/
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
				 to="/"
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
				{/* ===== INSERT DROPDOWNS HERE ===== */}
				{menuData.map((menuGroup, index) => (
					<li key={index} className="nav-item menu-item">
					<button
						className="nav-links dropdown-toggle"
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
					<Link
						className="nav-links-outline"
						onClick={() => {
							closeMobileMenu();
							scrollToBottom();
						}}
					>
						Links
					</Link>
				</li>
			</ul>
		</div>
	  </nav>
	</>
  )
}

export default Navbar