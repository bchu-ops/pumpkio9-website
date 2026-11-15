import './Header.css'

function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <h1>SpeedDemon</h1>
        </div>
        <nav className="nav">
          <a href="#" className="nav-link">Home</a>
          <a href="#" className="nav-link">Reports</a>
          <a href="#" className="nav-link">About</a>
        </nav>
      </div>
    </header>
  )
}

export default Header
